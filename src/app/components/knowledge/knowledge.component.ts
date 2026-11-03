import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  KnowledgeCategory,
  KnowledgeExperience,
  KnowledgeGroup,
  KnowledgeProject,
} from 'src/app/interface/knowledge-data';
import { DataService } from 'src/app/services/data.service';
import {
  getKnowledgeZoomLevel,
  isKnowledgeMarkerLabelVisible,
  KnowledgeZoomLevel,
} from './knowledge-world.utils';
import { combineLatest, Subscription } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';

type KnowledgeSelectionType = 'category' | 'group' | 'experience';
type SectionTarget = 'presentation' | 'education' | 'knowledge';
type UniverseFocusMode =
  | 'system'
  | 'presentation'
  | 'education'
  | 'category'
  | 'group'
  | 'experience';

interface KnowledgeSelection {
  type: KnowledgeSelectionType;
  label: string;
  category: KnowledgeCategory;
  group?: KnowledgeGroup;
  experience?: KnowledgeExperience;
  position: THREE.Vector3;
  targetRoot?: THREE.Object3D;
}

interface OrbitalMarker {
  root: THREE.Group;
  hitTarget: THREE.Mesh;
  label?: THREE.Sprite;
  relatedObjects: THREE.Object3D[];
  selection: KnowledgeSelection;
  minimumLevel: KnowledgeSelectionType;
}

interface OrbitMotion {
  pivot: THREE.Group;
  speed: number;
  phase: number;
}

interface CategoryRoot {
  category: KnowledgeCategory;
  root: THREE.Object3D;
  orbit: THREE.Object3D;
  trail: THREE.Object3D;
  clusterOrbit: THREE.Object3D;
}

interface GroupRoot {
  category: KnowledgeCategory;
  group: KnowledgeGroup;
  root: THREE.Object3D;
  nodeOrbit: THREE.Object3D;
}

const NETWORK_COLORS = ['#ff3d62', '#57d6ff', '#ffc857', '#a879ff', '#55e6a5', '#ff8f5c'];
const PULSAR_VISIBLE_SECONDS = 8;
@Component({
  selector: 'app-knowledge',
  standalone: false,
  templateUrl: './knowledge.component.html',
  styleUrls: ['./knowledge.component.scss'],
})
export class KnowledgeComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() title = 'Knowledge';
  @Output() navigateSection = new EventEmitter<SectionTarget>();
  @ViewChild('atomCanvas', { static: true }) atomCanvas!: ElementRef<HTMLCanvasElement>;

  categories: KnowledgeCategory[] = [];
  selected: KnowledgeSelection | null = null;
  selectedSection: 'presentation' | 'education' | null = null;
  zoomLevel: KnowledgeZoomLevel = 'system';
  isPaused = false;
  focusMode: UniverseFocusMode = 'system';
  isTransitioning = false;

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly pointerDown = new THREE.Vector2();
  private readonly markers: OrbitalMarker[] = [];
  private readonly interactiveTargets: THREE.Object3D[] = [];
  private readonly orbitMotions: OrbitMotion[] = [];
  private readonly markerGlows: THREE.Sprite[] = [];
  private readonly sunFlares: THREE.Sprite[] = [];
  private readonly categoryPlanets: Array<{
    mesh: THREE.Mesh;
    speed: number;
    ring?: THREE.Group;
    ringSpeed?: number;
  }> = [];
  private readonly categoryRoots: CategoryRoot[] = [];
  private readonly groupRoots: GroupRoot[] = [];
  private renderer?: THREE.WebGLRenderer;
  private composer?: EffectComposer;
  private controls?: OrbitControls;
  private systemRoot?: THREE.Group;
  private core?: THREE.Object3D;
  private coreGlow?: THREE.Mesh;
  private corePulse?: THREE.Mesh;
  private pulsar?: THREE.Group;
  private presentationRoot?: THREE.Group;
  private educationOrbitRoot?: THREE.Group;
  private educationGlow?: THREE.Mesh;
  private knowledgeNetworkRoot?: THREE.Group;
  private readonly shootingStars: THREE.Group[] = [];
  private hoveredRoot?: THREE.Object3D;
  private resizeObserver?: ResizeObserver;
  private animationFrame = 0;
  private animationElapsed = 0;
  private systemViewElapsed = 0;
  // The easter egg is scheduled once per universe instance, never as a repeating orbit.
  private readonly pulsarDelaySeconds = 15 * 60 + Math.random() * 15 * 60;
  private lastFrameTime = 0;
  private disposed = false;
  private focusedCategory?: KnowledgeCategory;
  private focusedGroup?: KnowledgeGroup;
  private focusedExperience?: KnowledgeExperience;
  private focusedVisualRoot?: THREE.Object3D;
  private readonly focusedWorldPosition = new THREE.Vector3();
  private readonly hoverCallouts: THREE.Group[] = [];
  private hoverSuppressedUntil = 0;
  private transitionTimer?: ReturnType<typeof setTimeout>;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly dataService: DataService,
    private readonly zone: NgZone,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly language: LanguageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.dataService.getKnowledgeData(),
        this.language.language$,
      ]).subscribe(([categories]) => {
        this.categories = categories;
        this.selected = null;
        if (this.renderer) {
          this.buildAtomSystem();
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.initializeScene();
    if (this.categories.length) {
      this.buildAtomSystem();
    }
  }

  ngOnDestroy(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    this.resizeObserver?.disconnect();
    this.subscriptions.unsubscribe();
    this.controls?.dispose();
    const canvas = this.atomCanvas.nativeElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.clearSystem();
    this.renderer?.dispose();
    this.composer?.dispose();
  }

  resetSystem(): void {
    this.resetFocusScale();
    this.selected = null;
    this.focusedCategory = undefined;
    this.focusedGroup = undefined;
    this.focusedExperience = undefined;
    this.focusMode = 'system';
    this.selectedSection = null;
    this.isPaused = false;
    this.camera.position.set(0, 0.75, this.getDefaultCameraDistance());
    this.controls?.target.set(0, 0, 0);
    if (this.controls) {
      this.controls.autoRotate = true;
      this.controls.update();
    }
    this.updateZoomLevel(true);
  }

  closeDetail(): void {
    this.returnToPreviousFocus();
  }

  handleEscape(): boolean {
    if (this.isTransitioning) {
      return true;
    }
    if (this.focusMode !== 'system' || this.selected || this.selectedSection) {
      this.returnToPreviousFocus();
      return true;
    }
    return false;
  }

  categoryLabel(name: string): string {
    return this.language.category(name);
  }

  categoryDescription(category: KnowledgeCategory): string {
    return this.language.current === 'es'
      ? category.descriptionEs || category.description || this.language.translate('knowledge.fallback')
      : category.description || this.language.translate('knowledge.fallback');
  }

  groupLabel(group: KnowledgeGroup): string {
    return this.language.group(group.name);
  }

  experienceTime(time: string): string {
    return this.language.duration(time);
  }

  experienceDescription(experience: KnowledgeExperience): string | undefined {
    return this.language.current === 'es'
      ? experience.descriptionEs || experience.description
      : experience.description;
  }

  projectSummary(project: KnowledgeProject): string | undefined {
    return this.language.current === 'es' ? project.summaryEs || project.summary : project.summary;
  }

  selectionLabel(selection: KnowledgeSelection): string {
    if (selection.type === 'category') {
      return this.categoryLabel(selection.category.name);
    }
    if (selection.type === 'group' && selection.group) {
      return this.groupLabel(selection.group);
    }
    return selection.label;
  }

  highlightExperience(experience?: KnowledgeExperience): void {
    if (!experience) {
      this.setHoveredRoot(undefined);
      return;
    }
    const marker = this.markers.find(
      (candidate) => candidate.selection.experience === experience
    );
    this.setHoveredRoot(marker?.root);
  }

  highlightGroup(group?: KnowledgeGroup): void {
    if (!group) {
      this.setHoveredRoot(undefined);
      return;
    }
    const marker = this.markers.find(
      (candidate) => candidate.selection.type === 'group' &&
        candidate.selection.group === group
    );
    this.setHoveredRoot(marker?.root);
  }

  openGroup(category: KnowledgeCategory, group: KnowledgeGroup): void {
    const marker = this.markers.find(
      (candidate) => candidate.selection.type === 'group' &&
        candidate.selection.category === category &&
        candidate.selection.group === group
    );
    if (marker) {
      this.focusGroup(marker.selection);
    }
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.controls) {
      this.controls.autoRotate = !this.isPaused;
    }
  }

  private initializeScene(): void {
    const canvas = this.atomCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(1, 1), 0.72, 0.52, 0.92)
    );
    this.composer.addPass(new OutputPass());
    this.lastFrameTime = performance.now();

    this.scene.fog = new THREE.FogExp2(0x050308, 0.03);
    this.camera.position.set(0, 0.75, this.getDefaultCameraDistance());
    this.scene.add(this.camera);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const keyLight = new THREE.PointLight(0xffd6dc, 18, 18, 2);
    keyLight.position.set(2.8, 3.2, 4.5);
    this.scene.add(keyLight);
    const redLight = new THREE.PointLight(0xff153c, 24, 16, 2);
    redLight.position.set(-3, -1, 2);
    this.scene.add(redLight);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.minDistance = 1.55;
    this.controls.maxDistance = 16;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.26;
    this.controls.addEventListener('change', () => this.updateZoomLevel());

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.resizeRenderer();

    this.zone.runOutsideAngular(() => this.renderFrame());
  }

  private buildAtomSystem(): void {
    if (!this.renderer || !this.categories.length) {
      return;
    }

    this.clearSystem();
    this.systemViewElapsed = 0;
    this.hoverSuppressedUntil = performance.now() + 650;
    const root = new THREE.Group();
    root.rotation.set(-0.08, 0.18, 0);
    this.systemRoot = root;
    this.scene.add(root);

    this.addStarField(root);
    this.addPresentationCore(root);
    this.addEducationOrbit(root);
    this.addKnowledgeOrbits(root);
    this.addShootingStars();
    this.addPulsarEasterEgg();
    this.updateMarkerVisibility();
  }

  private addPresentationCore(root: THREE.Group): void {
    const coreRoot = new THREE.Group();
    this.presentationRoot = coreRoot;
    const nucleus = new THREE.Group();
    const sunTexture = this.createSunSurfaceTexture();
    nucleus.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.54, 64, 48),
      new THREE.MeshStandardMaterial({
        color: 0xffd24a,
        map: sunTexture,
        emissiveMap: sunTexture,
        emissive: 0xff6a00,
        emissiveIntensity: 1.45,
        roughness: 0.82,
        metalness: 0,
      })
    ));
    const flareTexture = this.createSunFlareTexture();
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2 + (index % 3) * 0.17;
      const flare = new THREE.Sprite(new THREE.SpriteMaterial({
        map: flareTexture,
        color: index % 2 ? 0xffa21f : 0xffcf4a,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        rotation: angle - Math.PI / 2,
      }));
      const width = 0.09 + (index % 4) * 0.018;
      const height = 0.2 + (index % 3) * 0.045;
      flare.position.set(Math.cos(angle) * 0.56, Math.sin(angle) * 0.56, -0.015);
      flare.scale.set(width, height, 1);
      flare.userData['baseWidth'] = width;
      flare.userData['baseHeight'] = height;
      flare.userData['baseOpacity'] = 0.48 + (index % 3) * 0.08;
      flare.userData['phase'] = index * 0.91;
      nucleus.add(flare);
      this.sunFlares.push(flare);
    }
    this.core = nucleus;
    coreRoot.add(nucleus);

    this.coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.66, 48, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xff9d16,
        emissive: 0xff4b00,
        emissiveIntensity: 0.72,
        transparent: true,
        opacity: 0.16,
        roughness: 0.14,
        clearcoat: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    coreRoot.add(this.coreGlow);

    this.corePulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 44, 28),
      new THREE.MeshBasicMaterial({
        color: 0xff9f1c,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      })
    );
    coreRoot.add(this.corePulse);

    const hitTarget = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 28, 20),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
    );
    hitTarget.userData['sectionTarget'] = 'presentation';
    hitTarget.userData['highlightRoot'] = coreRoot;
    hitTarget.userData['interactionPriority'] = 3;
    coreRoot.add(hitTarget);
    this.interactiveTargets.push(hitTarget);

    const callout = this.createHoverCallout(
      this.language.translate('universe.presentation'),
      '#ff6a85'
    );
    callout.userData['hoverOnly'] = true;
    callout.visible = false;
    this.hoverCallouts.push(callout);
    coreRoot.userData['hoverCallout'] = callout;
    coreRoot.add(callout);
    root.add(coreRoot);
  }

  private createSunSurfaceTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    const background = context.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, '#ffd45a');
    background.addColorStop(0.24, '#ff9f1a');
    background.addColorStop(0.5, '#ff5d00');
    background.addColorStop(0.74, '#ffb321');
    background.addColorStop(1, '#ffdf70');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < 180; index += 1) {
      const x = (index * 89.17) % canvas.width;
      const y = (index * 53.41) % canvas.height;
      const radius = 2 + (index % 9) * 1.35;
      const cell = context.createRadialGradient(x, y, 0, x, y, radius);
      cell.addColorStop(0, index % 3 ? 'rgba(255,247,174,.92)' : 'rgba(255,76,0,.72)');
      cell.addColorStop(1, 'rgba(255,130,0,0)');
      context.fillStyle = cell;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  private createSunFlareTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 192;
    const context = canvas.getContext('2d')!;
    const gradient = context.createLinearGradient(48, 182, 48, 4);
    gradient.addColorStop(0, 'rgba(255,245,178,0)');
    gradient.addColorStop(0.12, 'rgba(255,229,118,.9)');
    gradient.addColorStop(0.52, 'rgba(255,115,13,.7)');
    gradient.addColorStop(1, 'rgba(255,65,0,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(48, 188);
    context.bezierCurveTo(8, 138, 24, 48, 48, 4);
    context.bezierCurveTo(76, 55, 88, 139, 48, 188);
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private addEducationOrbit(root: THREE.Group): void {
    const orbitRoot = new THREE.Group();
    orbitRoot.rotation.set(1.08, 0.12, 0.34);
    this.educationOrbitRoot = orbitRoot;

    const beltRadius = 1.18;
    this.addAsteroidBelt(orbitRoot);
    [
      { radius: 1.02, tube: 0.004, opacity: 0.2 },
      { radius: 1.09, tube: 0.006, opacity: 0.34 },
      { radius: 1.16, tube: 0.0035, opacity: 0.24 },
      { radius: 1.24, tube: 0.005, opacity: 0.3 },
      { radius: 1.32, tube: 0.003, opacity: 0.18 },
    ].forEach((track) => {
      orbitRoot.add(new THREE.Mesh(
        new THREE.TorusGeometry(track.radius, track.tube, 6, 220),
        new THREE.MeshBasicMaterial({
          color: 0xe8fff9,
          transparent: true,
          opacity: track.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      ));
    });

    const hitTarget = new THREE.Mesh(
      new THREE.TorusGeometry(beltRadius, 0.17, 12, 180),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.001,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    hitTarget.userData['sectionTarget'] = 'education';
    hitTarget.userData['highlightRoot'] = orbitRoot;
    hitTarget.userData['interactionPriority'] = 1;
    orbitRoot.add(hitTarget);
    this.interactiveTargets.push(hitTarget);
    root.add(orbitRoot);

    const callout = this.createHoverCallout(
      this.language.translate('universe.educationOrbit'),
      '#9fffe8'
    );
    callout.position.set(beltRadius, 0, 0.05);
    callout.userData['hoverOnly'] = true;
    callout.visible = false;
    this.hoverCallouts.push(callout);
    orbitRoot.userData['hoverCallout'] = callout;
    orbitRoot.add(callout);
  }

  private addKnowledgeOrbits(root: THREE.Group): void {
    const networkRoot = new THREE.Group();
    this.knowledgeNetworkRoot = networkRoot;
    root.add(networkRoot);

    this.categories.forEach((category, categoryIndex) => {
      const color = NETWORK_COLORS[categoryIndex % NETWORK_COLORS.length];
      const categoryRadius = 2.05 + categoryIndex * 0.78;
      const categoryPhase = categoryIndex * 2.399963229728653;
      const orbitPlane = new THREE.Group();
      const atomAxes = [
        [0.82, 0.08, -0.36],
        [-0.72, 0.44, 0.62],
        [1.12, -0.5, 1.08],
      ];
      const [axisX, axisY, axisZ] = atomAxes[categoryIndex % atomAxes.length];
      orbitPlane.rotation.set(
        axisX + Math.floor(categoryIndex / atomAxes.length) * 0.18,
        axisY + categoryIndex * 0.07,
        axisZ + Math.floor(categoryIndex / atomAxes.length) * 0.22
      );
      const categoryOrbit = new THREE.Group();
      networkRoot.add(orbitPlane);

      const categoryPivot = new THREE.Group();
      const categoryAnchor = new THREE.Group();
      categoryAnchor.position.set(categoryRadius, 0, 0);
      categoryPivot.add(categoryAnchor);
      const categorySpeed =
        (categoryIndex % 2 === 0 ? 1 : -1) * (0.085 + categoryIndex * 0.008);
      const categoryTrail = this.createOrbitTrail(
        categoryRadius,
        color,
        1.08,
        categorySpeed
      );
      categoryPivot.add(categoryTrail);
      orbitPlane.add(categoryPivot);
      this.orbitMotions.push({
        pivot: categoryPivot,
        phase: categoryPhase,
        speed: categorySpeed,
      });

      const categorySelection: KnowledgeSelection = {
        type: 'category',
        label: this.categoryLabel(category.name),
        category,
        position: new THREE.Vector3(),
      };
      const categoryMarker = this.addMarker(
        categoryAnchor,
        categorySelection,
        new THREE.Vector3(),
        color,
        THREE.MathUtils.clamp(
          0.225 + category.knowledge.reduce(
            (total, group) => total + group.experience.length,
            0
          ) * 0.0095,
          0.27,
          0.41
        )
      );
      const categoryCallout = this.createHoverCallout(categorySelection.label, color);
      categoryCallout.userData['hoverOnly'] = true;
      categoryCallout.visible = false;
      this.hoverCallouts.push(categoryCallout);
      categoryMarker.root.userData['hoverCallout'] = categoryCallout;
      categoryMarker.root.add(categoryCallout);

      const groupOrbitPlane = new THREE.Group();
      categoryAnchor.add(groupOrbitPlane);
      this.categoryRoots.push({
        category,
        root: orbitPlane,
        orbit: categoryOrbit,
        trail: categoryTrail,
        clusterOrbit: groupOrbitPlane,
      });

      category.knowledge.forEach((group, groupIndex) => {
        const groupColor = this.getFamilyColor(color, groupIndex, -1);
        const groupRadius = 0.72 + groupIndex * 0.38;
        const groupPlane = new THREE.Group();
        groupPlane.rotation.set(
          0.42 + groupIndex * 0.54,
          0.2 + categoryIndex * 0.17 + groupIndex * 0.31,
          categoryIndex * 0.32 + groupIndex * 0.72
        );
        groupOrbitPlane.add(groupPlane);
        const groupPivot = new THREE.Group();
        const groupPhase = (groupIndex / Math.max(1, category.knowledge.length)) * Math.PI * 2;
        const groupAnchor = new THREE.Group();
        groupAnchor.position.set(groupRadius, 0, 0);
        groupPivot.add(groupAnchor);
        const groupSpeed = 0.42 + categoryIndex * 0.025;
        groupPivot.add(this.createOrbitTrail(groupRadius, groupColor, 0.54, groupSpeed));
        groupPlane.add(groupPivot);
        this.orbitMotions.push({
          pivot: groupPivot,
          phase: groupPhase,
          speed: groupSpeed,
        });

        const groupSelection: KnowledgeSelection = {
          type: 'group',
          label: this.groupLabel(group),
          category,
          group,
          position: new THREE.Vector3(),
        };
        this.addMarker(
          groupAnchor,
          groupSelection,
          new THREE.Vector3(),
          groupColor,
          0.072
        );

        const technologyOrbitPlane = new THREE.Group();
        groupAnchor.add(technologyOrbitPlane);
        this.groupRoots.push({
          category,
          group,
          root: groupPivot,
          nodeOrbit: technologyOrbitPlane,
        });

        group.experience.forEach((experience, experienceIndex) => {
          const nodeColor = this.getFamilyColor(color, groupIndex, experienceIndex);
          const technologyRadius = 0.28 + experienceIndex * 0.075;
          const experiencePlane = new THREE.Group();
          experiencePlane.rotation.set(
            0.38 + experienceIndex * 0.63,
            -0.24 + groupIndex * 0.19 + experienceIndex * 0.27,
            0.18 + experienceIndex * 0.81
          );
          technologyOrbitPlane.add(experiencePlane);
          const experiencePivot = new THREE.Group();
          const experiencePhase =
            (experienceIndex / Math.max(1, group.experience.length)) * Math.PI * 2;
          const experienceAnchor = new THREE.Group();
          experienceAnchor.position.set(technologyRadius, 0, 0);
          experiencePivot.add(experienceAnchor);
          const experienceSpeed = 0.82 + groupIndex * 0.055;
          experiencePivot.add(
            this.createOrbitTrail(technologyRadius, nodeColor, 0.38, experienceSpeed)
          );
          experiencePlane.add(experiencePivot);
          this.orbitMotions.push({
            pivot: experiencePivot,
            phase: experiencePhase,
            speed: experienceSpeed,
          });

          const experienceSelection: KnowledgeSelection = {
            type: 'experience',
            label: experience.title,
            category,
            group,
            experience,
            position: new THREE.Vector3(),
          };
          this.addMarker(
            experienceAnchor,
            experienceSelection,
            new THREE.Vector3(),
            nodeColor,
            0.032
          );
        });
      });
    });
  }

  private createOrbitTrail(
    radius: number,
    color: string,
    arcLength: number,
    speed: number
  ): THREE.Mesh {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const baseColor = new THREE.Color(color);
    const pointCount = 56;
    const ringSegments = 8;
    const maximumWidth = THREE.MathUtils.clamp(radius * 0.025, 0.008, 0.04);
    for (let index = 0; index < pointCount; index += 1) {
      const progress = index / (pointCount - 1);
      const angle = -Math.sign(speed || 1) * arcLength * (1 - progress);
      const width = maximumWidth * (0.12 + Math.pow(progress, 1.55) * 0.88);
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const intensity = Math.pow(progress, 2.15);
      for (let ringIndex = 0; ringIndex < ringSegments; ringIndex += 1) {
        const ringAngle = (ringIndex / ringSegments) * Math.PI * 2;
        const radialOffset = Math.cos(ringAngle) * width;
        const depthOffset = Math.sin(ringAngle) * width;
        positions.push(
          cosine * (radius + radialOffset),
          sine * (radius + radialOffset),
          depthOffset
        );
        colors.push(
          baseColor.r * intensity,
          baseColor.g * intensity,
          baseColor.b * intensity
        );
      }
      if (index < pointCount - 1) {
        const currentRing = index * ringSegments;
        const nextRing = (index + 1) * ringSegments;
        for (let ringIndex = 0; ringIndex < ringSegments; ringIndex += 1) {
          const nextIndex = (ringIndex + 1) % ringSegments;
          indices.push(
            currentRing + ringIndex,
            currentRing + nextIndex,
            nextRing + ringIndex,
            currentRing + nextIndex,
            nextRing + nextIndex,
            nextRing + ringIndex
          );
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    return new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.86,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
  }

  private getFamilyColor(baseColor: string, groupIndex: number, nodeIndex: number): string {
    const color = new THREE.Color(baseColor);
    const hueShift = ((groupIndex % 3) - 1) * 0.012;
    const saturationShift = nodeIndex < 0 ? -0.04 : -0.08 + (nodeIndex % 3) * 0.035;
    const lightnessShift = nodeIndex < 0
      ? 0.08 + (groupIndex % 2) * 0.05
      : 0.14 + (nodeIndex % 4) * 0.065;
    color.offsetHSL(hueShift, saturationShift, lightnessShift);
    return `#${color.getHexString()}`;
  }

  private addAsteroidBelt(orbitRoot: THREE.Group): void {
    const texture = this.createRoundParticleTexture();
    const layers = [
      { count: 760, size: 0.016, opacity: 0.72, spread: 0.34 },
      { count: 270, size: 0.04, opacity: 0.9, spread: 0.3 },
      { count: 70, size: 0.08, opacity: 1, spread: 0.25 },
    ];
    layers.forEach((layer) => {
      const positions: number[] = [];
      for (let index = 0; index < layer.count; index += 1) {
        const angle =
          (index / layer.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.085;
        const radius = 1.18 + (Math.random() - 0.5) * layer.spread;
        positions.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (Math.random() - 0.5) * 0.15
        );
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      orbitRoot.add(new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0xffffff,
          map: texture,
          alphaTest: 0.12,
          size: layer.size,
          transparent: true,
          opacity: layer.opacity,
          sizeAttenuation: true,
          depthWrite: false,
        })
      ));
    });
  }

  private createRoundParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 30);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.68, 'rgba(255,255,255,.96)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private addShootingStars(): void {
    // Environmental events are attached to the camera at background depth so rotating
    // the professional system never changes their path or brings them to the foreground.
    const definitions = [
      {
        kind: 'shooting-star',
        duration: 1.65,
        delay: this.randomBetween(6, 16),
        minimumInterval: 18,
        maximumInterval: 42,
      },
      {
        kind: 'asteroid',
        duration: 7.2,
        delay: this.randomBetween(16, 34),
        minimumInterval: 48,
        maximumInterval: 96,
      },
      {
        kind: 'comet',
        duration: 7.8,
        delay: this.randomBetween(28, 56),
        minimumInterval: 92,
        maximumInterval: 170,
      },
    ];
    definitions.forEach((definition) => {
      const star = new THREE.Group();
      const body = new THREE.Group();
      body.userData['eventBody'] = true;
      star.add(body);
      if (definition.kind === 'asteroid') {
        const asteroid = this.createAsteroidBody();
        asteroid.userData['spinningBody'] = true;
        body.add(asteroid);
      } else {
        const texture = this.createCelestialEventTexture(
          definition.kind as 'shooting-star' | 'comet'
        );
        const isComet = definition.kind === 'comet';
        const layers = isComet
          ? [
              { scale: 1, opacity: 0.9, phase: 0 },
              { scale: 0.78, opacity: 0.28, phase: 1.8 },
            ]
          : [{ scale: 1, opacity: 0.98, phase: 0 }];
        layers.forEach((layer, layerIndex) => {
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: layer.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }));
          const width = (isComet ? 3.25 : 0.72) * layer.scale;
          const height = (isComet ? 0.82 : 0.72) * layer.scale;
          sprite.scale.set(width, height, 1);
          sprite.position.y = layerIndex === 0 ? 0 : 0.025;
          sprite.userData['eventFlame'] = isComet;
          sprite.userData['baseWidth'] = width;
          sprite.userData['baseHeight'] = height;
          sprite.userData['baseOpacity'] = layer.opacity;
          sprite.userData['phase'] = layer.phase;
          body.add(sprite);
        });
        if (!isComet) {
          star.add(this.createShootingStarTrail());
        }
      }
      star.visible = false;
      star.userData['kind'] = definition.kind;
      star.userData['baseDuration'] = definition.duration;
      star.userData['duration'] = definition.duration;
      star.userData['nextStart'] = definition.delay;
      star.userData['minimumInterval'] = definition.minimumInterval;
      star.userData['maximumInterval'] = definition.maximumInterval;
      star.userData['active'] = false;
      this.camera.add(star);
      this.shootingStars.push(star);
    });
  }

  private randomBetween(minimum: number, maximum: number): number {
    return minimum + Math.random() * (maximum - minimum);
  }

  private prepareCelestialEvent(event: THREE.Group): void {
    const kind = event.userData['kind'] as 'shooting-star' | 'asteroid' | 'comet';
    // Every appearance gets a new off-screen diagonal path and a slightly different form.
    const fromLeft = Math.random() > 0.5;
    const startY = this.randomBetween(-3.35, 3.35);
    const verticalShift = this.randomBetween(0.7, 2.25) * (Math.random() > 0.5 ? 1 : -1);
    const endY = THREE.MathUtils.clamp(startY + verticalShift, -3.65, 3.65);
    event.userData['start'] = new THREE.Vector3(fromLeft ? -12.5 : 12.5, startY, -17.5);
    event.userData['end'] = new THREE.Vector3(fromLeft ? 12.5 : -12.5, endY, -17.5);
    event.userData['curve'] = this.randomBetween(-0.42, 0.42);
    event.userData['duration'] = (event.userData['baseDuration'] as number) *
      this.randomBetween(0.88, 1.14);
    event.userData['activeStart'] = this.systemViewElapsed;
    event.userData['active'] = true;
    const body = event.children.find((child) => child.userData['eventBody']) as THREE.Group;
    body.scale.set(1, 1, 1);
    if (kind === 'comet') {
      body.scale.x = fromLeft ? -1 : 1;
    } else if (kind === 'asteroid') {
      body.scale.set(
        this.randomBetween(0.48, 0.72),
        this.randomBetween(0.34, 0.62),
        this.randomBetween(0.42, 0.7)
      );
      body.rotation.set(
        this.randomBetween(0, Math.PI),
        this.randomBetween(0, Math.PI),
        this.randomBetween(0, Math.PI)
      );
    }
  }

  private createShootingStarTrail(): THREE.Points {
    const count = 58;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const brightness = Math.pow(1 - index / (count - 1), 1.35);
      colors[index * 3] = 0.42 * brightness;
      colors[index * 3 + 1] = 0.82 * brightness;
      colors[index * 3 + 2] = brightness;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const trail = new THREE.Points(geometry, new THREE.PointsMaterial({
      map: this.createRoundParticleTexture(),
      size: 0.075,
      transparent: true,
      opacity: 0.84,
      alphaTest: 0.025,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true,
    }));
    trail.userData['eventTrail'] = true;
    return trail;
  }

  private createCelestialEventTexture(kind: 'shooting-star' | 'comet'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = kind === 'comet' ? 768 : 256;
    canvas.height = kind === 'comet' ? 200 : 256;
    const context = canvas.getContext('2d')!;
    const isComet = kind === 'comet';
    if (!isComet) {
      const head = context.createRadialGradient(128, 128, 2, 128, 128, 124);
      head.addColorStop(0, 'rgba(255,255,255,1)');
      head.addColorStop(0.12, 'rgba(220,249,255,1)');
      head.addColorStop(0.32, 'rgba(82,200,255,.88)');
      head.addColorStop(0.68, 'rgba(21,107,218,.28)');
      head.addColorStop(1, 'rgba(0,25,90,0)');
      context.fillStyle = head;
      context.fillRect(0, 0, 256, 256);
    } else {
      const headX = 108;
      const centerY = 100;
      const tailStart = 742;
      const tail = context.createLinearGradient(tailStart, centerY, headX, centerY);
      tail.addColorStop(0, 'rgba(255,70,0,0)');
      tail.addColorStop(0.38, 'rgba(255,82,0,.08)');
      tail.addColorStop(0.7, 'rgba(255,128,10,.34)');
      tail.addColorStop(0.9, 'rgba(255,205,86,.78)');
      tail.addColorStop(1, 'rgba(255,250,225,1)');
      context.lineCap = 'round';
      for (let index = 0; index < 7; index += 1) {
        const offset = (index - 3) * 8;
        context.beginPath();
        context.moveTo(tailStart, centerY + offset * 1.25);
        context.bezierCurveTo(
          570,
          centerY + offset * 1.6,
          300,
          centerY + Math.sin(index * 1.7) * 15,
          headX,
          centerY + offset * 0.08
        );
        context.strokeStyle = tail;
        context.globalAlpha = 0.34 + (index % 3) * 0.16;
        context.lineWidth = 5 + (index % 3) * 3.5;
        context.shadowColor = '#ff7b16';
        context.shadowBlur = 13;
        context.stroke();
      }
      context.globalAlpha = 1;
      const head = context.createRadialGradient(headX, centerY, 1, headX, centerY, 47);
      head.addColorStop(0, '#ffffff');
      head.addColorStop(0.2, '#fff6c9');
      head.addColorStop(0.48, 'rgba(255,132,23,.92)');
      head.addColorStop(1, 'rgba(255,55,0,0)');
      context.fillStyle = head;
      context.beginPath();
      context.arc(headX, centerY, 49, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createAsteroidBody(): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(0.16, 2);
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const point = new THREE.Vector3();
    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index);
      const variation = 0.72 +
        Math.sin(point.x * 47 + point.y * 29) * 0.16 +
        Math.cos(point.z * 53 - point.x * 23) * 0.12;
      point.normalize().multiplyScalar(0.16 * variation);
      point.x *= 1.28;
      point.y *= 0.74;
      point.z *= 0.92;
      positions.setXYZ(index, point.x, point.y, point.z);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    const base = context.createLinearGradient(0, 0, 0, canvas.height);
    base.addColorStop(0, '#b9b3ad');
    base.addColorStop(0.5, '#746d68');
    base.addColorStop(1, '#393532');
    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let crater = 0; crater < 54; crater += 1) {
      const x = (crater * 83.17) % canvas.width;
      const y = (crater * 47.41) % canvas.height;
      const radius = 2 + (crater % 7) * 1.15;
      const spot = context.createRadialGradient(x, y, 0, x, y, radius);
      spot.addColorStop(0, 'rgba(25,22,21,.8)');
      spot.addColorStop(0.65, 'rgba(70,64,61,.42)');
      spot.addColorStop(1, 'rgba(220,213,205,.28)');
      context.fillStyle = spot;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.025,
      color: 0xffffff,
      emissive: 0x1b1715,
      emissiveIntensity: 0.16,
      roughness: 0.98,
      metalness: 0.02,
    }));
  }

  private addPulsarEasterEgg(): void {
    const pulsar = new THREE.Group();
    pulsar.position.set(-4.6, 2.85, -12);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.userData['pulsarRole'] = 'core';
    pulsar.add(glow);

    const aura = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.createPulsarGlowTexture(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    aura.scale.setScalar(0.18);
    aura.userData['pulsarRole'] = 'aura';
    pulsar.add(aura);

    [0, 1, 2, 3].forEach((index) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.47, 0.5, 128),
        new THREE.MeshBasicMaterial({
          color: index % 2 ? 0xa9dcff : 0xe1c5ff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      ring.scale.setScalar(0.05);
      ring.userData['pulsarRole'] = 'wave';
      ring.userData['waveIndex'] = index;
      pulsar.add(ring);
    });
    pulsar.visible = false;
    this.camera.add(pulsar);
    this.pulsar = pulsar;
  }

  private createPulsarGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    const glow = context.createRadialGradient(128, 128, 2, 128, 128, 126);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.08, 'rgba(218,245,255,.98)');
    glow.addColorStop(0.24, 'rgba(86,191,255,.72)');
    glow.addColorStop(0.52, 'rgba(121,99,255,.28)');
    glow.addColorStop(1, 'rgba(10,20,68,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private addMarker(
    root: THREE.Group,
    selection: KnowledgeSelection,
    position: THREE.Vector3,
    color: string,
    size: number
  ): OrbitalMarker {
    const markerRoot = new THREE.Group();
    markerRoot.position.copy(position);
    selection.targetRoot = markerRoot;

    const categoryIndex = Math.max(0, this.categories.indexOf(selection.category));
    const groupIndex = selection.group
      ? Math.max(0, selection.category.knowledge.indexOf(selection.group))
      : 0;
    const experienceIndex = selection.experience && selection.group
      ? Math.max(0, selection.group.experience.indexOf(selection.experience))
      : 0;
    const material = selection.type === 'category'
      ? this.createPlanetMaterial(color, categoryIndex)
      : this.createSatelliteMaterial(
        color,
        categoryIndex * 37 + groupIndex * 11 + experienceIndex,
        selection.type
      );
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(size, selection.type === 'category' ? 48 : 24, 24),
      material
    );
    if (selection.type === 'category') {
      marker.rotation.z = -0.18 + categoryIndex * 0.11;
      let planetRing: THREE.Group | undefined;
      if (categoryIndex === 2 || categoryIndex === 4) {
        planetRing = this.createPlanetRing(size, color, categoryIndex);
        markerRoot.add(planetRing);
      }
      this.categoryPlanets.push({
        mesh: marker,
        speed: 0.16 + (categoryIndex % 4) * 0.035,
        ring: planetRing,
        ringSpeed: 0.012 + categoryIndex * 0.002,
      });
      markerRoot.add(this.createAtmosphere(size, color));
    } else {
      marker.rotation.set(
        groupIndex * 0.21,
        experienceIndex * 0.18,
        -0.12 + categoryIndex * 0.06
      );
      this.categoryPlanets.push({
        mesh: marker,
        speed: selection.type === 'group'
          ? 0.28 + groupIndex * 0.025
          : 0.46 + (experienceIndex % 5) * 0.04,
      });
    }
    marker.userData['baseEmissiveIntensity'] = material.emissiveIntensity;
    markerRoot.userData['markerMesh'] = marker;
    markerRoot.add(marker);
    if (selection.type === 'experience') {
      const hotCore = new THREE.Mesh(
        new THREE.SphereGeometry(size * 0.54, 18, 14),
        new THREE.MeshBasicMaterial({
          color: 0xf7fdff,
          transparent: true,
          opacity: 0.96,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      markerRoot.add(hotCore);
      markerRoot.add(this.createTechnologyCorona(size, color));
    }

    const hitTarget = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.7, 18, 14),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
    );
    hitTarget.userData['selection'] = selection;
    hitTarget.userData['highlightRoot'] = markerRoot;
    hitTarget.userData['interactionPriority'] = 2;
    markerRoot.add(hitTarget);

    const glow = this.createFireGlowSprite(color, size, selection.type);
    markerRoot.add(glow);
    this.markerGlows.push(glow);

    const label = selection.type === 'experience'
      ? this.createLabelSprite(selection.label, '#ffffff', 0.12)
      : undefined;
    if (label) {
      label.position.set(0, -Math.max(0.085, size * 2.35), size * 0.3);
      label.renderOrder = 8;
      markerRoot.add(label);
    }
    root.add(markerRoot);

    const orbitalMarker: OrbitalMarker = {
      root: markerRoot,
      hitTarget,
      label,
      relatedObjects: [markerRoot],
      selection,
      minimumLevel: selection.type,
    };
    hitTarget.userData['orbitalMarker'] = orbitalMarker;
    this.markers.push(orbitalMarker);
    this.interactiveTargets.push(hitTarget);
    return orbitalMarker;
  }

  private createTechnologyCorona(size: number, color: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const context = canvas.getContext('2d')!;
    const tone = new THREE.Color(color);
    const red = Math.round(tone.r * 255);
    const green = Math.round(tone.g * 255);
    const blue = Math.round(tone.b * 255);
    const corona = context.createRadialGradient(80, 80, 1, 80, 80, 79);
    corona.addColorStop(0, 'rgba(255,255,255,1)');
    corona.addColorStop(0.1, 'rgba(220,247,255,.98)');
    corona.addColorStop(0.28, `rgba(${red},${green},${blue},.72)`);
    corona.addColorStop(0.58, `rgba(${red},${green},${blue},.24)`);
    corona.addColorStop(1, `rgba(${red},${green},${blue},0)`);
    context.fillStyle = corona;
    context.fillRect(0, 0, 160, 160);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.84,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }));
    sprite.scale.setScalar(size * 3.45);
    return sprite;
  }

  private createPlanetMaterial(color: string, categoryIndex: number): THREE.MeshPhysicalMaterial {
    const texture = this.createPlanetTexture(color, categoryIndex);
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: texture,
      bumpMap: texture,
      bumpScale: 0.018,
      emissive: new THREE.Color(color).multiplyScalar(0.22),
      emissiveIntensity: 0.18,
      metalness: 0.05,
      roughness: 0.62,
      clearcoat: 0.5,
      clearcoatRoughness: 0.34,
    });
  }

  private createSatelliteMaterial(
    color: string,
    seedIndex: number,
    type: KnowledgeSelectionType
  ): THREE.MeshPhysicalMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 80;
    const context = canvas.getContext('2d')!;
    const base = new THREE.Color(color);
    const dark = base.clone().offsetHSL(-0.015, 0.08, -0.2).getStyle();
    const light = base.clone().offsetHSL(0.025, -0.16, 0.24).getStyle();
    const background = context.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, dark);
    background.addColorStop(0.45, base.getStyle());
    background.addColorStop(0.72, light);
    background.addColorStop(1, dark);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    let seed = (seedIndex + 3) * 1597334677;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const patternCount = type === 'group' ? 11 : 7;
    for (let index = 0; index < patternCount; index += 1) {
      context.globalAlpha = 0.12 + random() * 0.24;
      context.fillStyle = index % 2 ? light : dark;
      context.beginPath();
      context.ellipse(
        random() * canvas.width,
        random() * canvas.height,
        5 + random() * 20,
        1.5 + random() * 6,
        random() * Math.PI,
        0,
        Math.PI * 2
      );
      context.fill();
    }
    context.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: texture,
      bumpMap: texture,
      bumpScale: type === 'group' ? 0.012 : 0.007,
      emissive: base.clone().multiplyScalar(0.2),
      emissiveIntensity: type === 'group' ? 0.28 : 0.2,
      metalness: 0.08,
      roughness: type === 'group' ? 0.48 : 0.56,
      clearcoat: 0.42,
      clearcoatRoughness: 0.36,
    });
  }

  private createPlanetTexture(color: string, categoryIndex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    const base = new THREE.Color(color);
    const dark = base.clone().offsetHSL(-0.02, 0.08, -0.2).getStyle();
    const middle = base.clone().offsetHSL(0.015, -0.05, -0.03).getStyle();
    const light = base.clone().offsetHSL(0.035, -0.12, 0.2).getStyle();
    let seed = (categoryIndex + 1) * 104729;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const background = context.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, dark);
    background.addColorStop(0.26, middle);
    background.addColorStop(0.52, light);
    background.addColorStop(0.74, middle);
    background.addColorStop(1, dark);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const bandCount = 12 + (categoryIndex % 3) * 3;
    for (let band = 0; band < bandCount; band += 1) {
      const centerY = ((band + 0.5) / bandCount) * canvas.height;
      const height = 5 + random() * 12;
      const amplitude = 2 + random() * 7;
      context.beginPath();
      for (let x = 0; x <= canvas.width; x += 8) {
        const y = centerY + Math.sin(x * (0.012 + random() * 0.008) + band) * amplitude;
        if (x === 0) {
          context.moveTo(x, y - height);
        } else {
          context.lineTo(x, y - height);
        }
      }
      for (let x = canvas.width; x >= 0; x -= 8) {
        const y = centerY + Math.sin(x * 0.015 + band) * amplitude;
        context.lineTo(x, y + height);
      }
      context.closePath();
      context.globalAlpha = 0.08 + random() * 0.16;
      context.fillStyle = band % 2 === 0 ? light : dark;
      context.fill();
    }

    const featureCount = 18 + categoryIndex * 3;
    for (let feature = 0; feature < featureCount; feature += 1) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const radiusX = 4 + random() * (categoryIndex % 2 === 0 ? 28 : 16);
      const radiusY = 2 + random() * 9;
      const spot = context.createRadialGradient(x, y, 0, x, y, radiusX);
      spot.addColorStop(0, feature % 3 === 0 ? light : dark);
      spot.addColorStop(1, 'rgba(0,0,0,0)');
      context.globalAlpha = 0.16 + random() * 0.28;
      context.fillStyle = spot;
      context.beginPath();
      context.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 0.12;
    for (let grain = 0; grain < 1200; grain += 1) {
      context.fillStyle = random() > 0.52 ? '#ffffff' : '#000000';
      const size = random() * 1.8;
      context.fillRect(random() * canvas.width, random() * canvas.height, size, size);
    }
    context.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  private createAtmosphere(size: number, color: string): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.1, 40, 24),
      new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(color) } },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vView = normalize(-viewPosition.xyz);
            gl_Position = projectionMatrix * viewPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
            gl_FragColor = vec4(glowColor, rim * 0.52);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      })
    );
  }

  private createPlanetRing(size: number, color: string, categoryIndex: number): THREE.Group {
    const ringSystem = new THREE.Group();
    const ringTexture = this.createPlanetRingTexture(color, categoryIndex);
    const bands = new THREE.Mesh(
      new THREE.RingGeometry(size * 1.27, size * 2.12, 192, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: ringTexture,
        alphaMap: ringTexture,
        transparent: true,
        opacity: 0.92,
        alphaTest: 0.055,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0.03,
        depthWrite: false,
      })
    );
    bands.renderOrder = 2;
    ringSystem.add(bands);

    const particleCount = categoryIndex === 2 ? 520 : 380;
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const base = new THREE.Color(color);
    let seed = (categoryIndex + 11) * 2654435761;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let index = 0; index < particleCount; index += 1) {
      const angle = random() * Math.PI * 2;
      const bandBias = random();
      const radius = size * (bandBias < 0.48
        ? 1.34 + random() * 0.23
        : bandBias < 0.82
          ? 1.66 + random() * 0.2
          : 1.93 + random() * 0.16);
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius;
      positions[index * 3 + 2] = (random() - 0.5) * size * 0.075;
      const tone = base.clone().offsetHSL(
        (random() - 0.5) * 0.045,
        -0.24 - random() * 0.2,
        0.12 + random() * 0.34
      );
      particleColors[index * 3] = tone.r;
      particleColors[index * 3 + 1] = tone.g;
      particleColors[index * 3 + 2] = tone.b;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        map: this.createRoundParticleTexture(),
        size: size * 0.035,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        alphaTest: 0.08,
        depthWrite: false,
      })
    );
    particles.renderOrder = 3;
    ringSystem.add(particles);
    ringSystem.rotation.set(1.04 + categoryIndex * 0.075, 0.28, 0.2);
    return ringSystem;
  }

  private createPlanetRingTexture(color: string, categoryIndex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d')!;
    const center = canvas.width / 2;
    const innerRadius = canvas.width * 0.3;
    const outerRadius = canvas.width * 0.49;
    const base = new THREE.Color(color);
    let seed = (categoryIndex + 7) * 2246822519;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    context.clearRect(0, 0, canvas.width, canvas.height);
    const bandCount = categoryIndex === 2 ? 34 : 26;
    for (let band = 0; band < bandCount; band += 1) {
      const progress = band / bandCount;
      const nextProgress = (band + 1) / bandCount;
      const start = innerRadius + (outerRadius - innerRadius) * progress;
      const width = Math.max(1.4, (outerRadius - innerRadius) * (nextProgress - progress) *
        (0.35 + random() * 0.72));
      const gap = progress > 0.48 && progress < 0.55;
      const tone = base.clone().offsetHSL(
        (random() - 0.5) * 0.055,
        -0.28 - random() * 0.28,
        0.02 + random() * 0.42
      );
      context.strokeStyle = tone.getStyle();
      context.globalAlpha = gap ? 0.035 : 0.24 + random() * 0.58;
      context.lineWidth = width;
      context.beginPath();
      context.arc(center, center, start + width * 0.5, 0, Math.PI * 2);
      context.stroke();
    }

    context.globalAlpha = 0.28;
    for (let grain = 0; grain < 4200; grain += 1) {
      const angle = random() * Math.PI * 2;
      const radius = innerRadius + random() * (outerRadius - innerRadius);
      const brightness = 0.45 + random() * 0.55;
      context.fillStyle = `rgba(255,255,255,${brightness})`;
      const diameter = 0.35 + random() * 1.25;
      context.beginPath();
      context.arc(
        center + Math.cos(angle) * radius,
        center + Math.sin(angle) * radius,
        diameter,
        0,
        Math.PI * 2
      );
      context.fill();
    }
    context.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  private createFireGlowSprite(
    color: string,
    size: number,
    type: KnowledgeSelectionType
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    const rgb = new THREE.Color(color);
    const red = Math.round(rgb.r * 255);
    const green = Math.round(rgb.g * 255);
    const blue = Math.round(rgb.b * 255);
    const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 63);
    gradient.addColorStop(0, 'rgba(255,255,255,.95)');
    gradient.addColorStop(0.12, `rgba(${red},${green},${blue},.88)`);
    gradient.addColorStop(0.34, `rgba(${red},${green},${blue},.48)`);
    gradient.addColorStop(0.64, `rgba(${red},${green},${blue},.16)`);
    gradient.addColorStop(1, `rgba(${red},${green},${blue},0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        color,
        transparent: true,
        opacity: type === 'category' ? 0.55 : type === 'group' ? 0.52 : 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const baseScale = size * (type === 'category' ? 2.65 : type === 'group' ? 2.5 : 2.3);
    glow.scale.setScalar(baseScale);
    glow.userData['baseScale'] = baseScale;
    glow.userData['baseOpacity'] = type === 'category' ? 0.55 : type === 'group' ? 0.52 : 0.46;
    glow.userData['phase'] = this.markerGlows.length * 0.73;
    return glow;
  }

  private addStarField(root: THREE.Group): void {
    const positions: number[] = [];
    for (let index = 0; index < 360; index += 1) {
      const radius = 3.4 + Math.random() * 4.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    root.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0xffd5dd,
          size: 0.018,
          transparent: true,
          opacity: 0.48,
          sizeAttenuation: true,
        })
      )
    );
  }

  private createLabelSprite(text: string, color: string, scale: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.height = 78;
    let context = canvas.getContext('2d')!;
    context.font = '750 34px Inter, Arial, sans-serif';
    canvas.width = Math.min(1024, Math.max(160, Math.ceil(context.measureText(text).width + 64)));
    context = canvas.getContext('2d')!;
    context.beginPath();
    context.roundRect(4, 7, canvas.width - 8, canvas.height - 14, 20);
    context.fillStyle = 'rgba(3, 3, 8, .78)';
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(255, 255, 255, .22)';
    context.stroke();
    context.font = '750 34px Inter, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = color;
    context.shadowBlur = 5;
    context.fillStyle = '#ffffff';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
    );
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(0.52 * aspect * scale, 0.52 * scale, 1);
    return sprite;
  }

  private createHoverCallout(text: string, accent: string): THREE.Group {
    const callout = new THREE.Group();
    const linePoints: THREE.Vector3[] = [];
    for (let index = 0; index < 27; index += 1) {
      const progress = index / 26;
      linePoints.push(new THREE.Vector3(0, 0.42 + progress * 1.05, 0.04));
    }
    for (let index = 1; index < 15; index += 1) {
      const progress = index / 14;
      linePoints.push(new THREE.Vector3(progress * 0.58, 1.47, 0.04));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePoints),
      new THREE.LineBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.88,
        depthTest: false,
        depthWrite: false,
      })
    );
    line.geometry.setDrawRange(0, 0);
    line.renderOrder = 12;
    callout.add(line);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.beginPath();
    context.roundRect(6, 6, 500, 116, 24);
    context.fillStyle = 'rgba(5, 3, 9, .76)';
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = accent;
    context.stroke();
    context.font = '800 42px Inter, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff7f8';
    context.fillText(text, 256, 65);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const tag = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
    );
    tag.position.set(1.22, 1.47, 0.04);
    tag.scale.set(1.24, 0.31, 1);
    tag.renderOrder = 13;
    (tag.material as THREE.SpriteMaterial).opacity = 0;
    callout.add(tag);
    callout.userData['progress'] = 0;
    callout.userData['line'] = line;
    callout.userData['linePointCount'] = linePoints.length;
    callout.userData['tag'] = tag;
    return callout;
  }

  private updateHoverCallouts(delta: number): void {
    this.hoverCallouts.forEach((callout) => {
      if (!callout.visible || !callout.parent) {
        return;
      }
      const parentInverse = callout.parent
        .getWorldQuaternion(new THREE.Quaternion())
        .invert();
      callout.quaternion.copy(parentInverse.multiply(this.camera.quaternion));
      const progress = Math.min(1, (callout.userData['progress'] as number) + delta * 2.8);
      callout.userData['progress'] = progress;
      const line = callout.userData['line'] as THREE.Line;
      const pointCount = callout.userData['linePointCount'] as number;
      line.geometry.setDrawRange(
        0,
        Math.max(1, Math.ceil(pointCount * Math.min(1, progress / 0.72)))
      );
      const tag = callout.userData['tag'] as THREE.Sprite;
      (tag.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.smoothstep(
        progress,
        0.66,
        1
      );
    });
  }

  private getCategoryPosition(index: number, count: number): THREE.Vector3 {
    const angle = (index / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
    const radius = index % 2 === 0 ? 1.72 : 2.14;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle * 2) * 0.46,
      Math.sin(angle) * radius * 0.64
    );
  }

  private getChildPosition(
    parent: THREE.Vector3,
    index: number,
    count: number,
    distance: number
  ): THREE.Vector3 {
    const direction = parent.clone().normalize();
    const reference = Math.abs(direction.y) < 0.88
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const tangent = new THREE.Vector3().crossVectors(direction, reference).normalize();
    const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize();
    const angle = (index / Math.max(1, count)) * Math.PI * 2;
    return parent
      .clone()
      .add(tangent.multiplyScalar(Math.cos(angle) * distance))
      .add(bitangent.multiplyScalar(Math.sin(angle) * distance));
  }

  goToSection(section: SectionTarget): void {
    this.navigateSection.emit(section);
  }

  returnToCategory(): void {
    if (!this.focusedCategory) {
      this.focusSystem();
      return;
    }
    const categoryMarker = this.markers.find(
      (marker) => marker.selection.type === 'category' &&
        marker.selection.category === this.focusedCategory
    );
    if (categoryMarker) {
      this.focusCategory(categoryMarker.selection);
    }
  }

  private focusSection(section: 'presentation' | 'education'): void {
    this.transitionFocus(() => {
      this.resetFocusScale();
      this.selected = null;
      this.selectedSection = section;
      this.focusMode = section;
      this.focusedCategory = undefined;
      this.focusedGroup = undefined;
      this.focusedExperience = undefined;
      this.updateMarkerVisibility();
      const targetRoot = section === 'presentation' ? this.presentationRoot : this.educationOrbitRoot;
      this.applyFocusScale(targetRoot, section === 'presentation' ? 4 : 2.9);
      const target = targetRoot?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();
      this.setCameraDistance(this.getDefaultCameraDistance(), target, 1);
    });
  }

  private focusCategory(selection: KnowledgeSelection): void {
    this.transitionFocus(() => {
      this.resetFocusScale();
      this.selected = selection;
      this.selectedSection = null;
      this.focusMode = 'category';
      this.focusedCategory = selection.category;
      this.focusedGroup = undefined;
      this.focusedExperience = undefined;
      this.updateMarkerVisibility();
      this.applyFocusScale(selection.targetRoot?.parent, 4.2);
      const target = selection.targetRoot?.getWorldPosition(new THREE.Vector3()) ?? selection.position;
      this.setCameraDistance(this.getDefaultCameraDistance(), target, 1);
    });
  }

  private focusGroup(selection: KnowledgeSelection): void {
    if (!selection.group) {
      return;
    }
    this.transitionFocus(() => {
      this.resetFocusScale();
      this.selected = selection;
      this.selectedSection = null;
      this.focusMode = 'group';
      this.focusedCategory = selection.category;
      this.focusedGroup = selection.group;
      this.focusedExperience = undefined;
      this.updateMarkerVisibility();
      this.applyFocusScale(selection.targetRoot?.parent, 7);
      const target = selection.targetRoot?.getWorldPosition(new THREE.Vector3()) ?? selection.position;
      this.setCameraDistance(this.getDefaultCameraDistance(), target, 1);
    });
  }

  private focusExperience(selection: KnowledgeSelection): void {
    if (!selection.experience) {
      return;
    }
    this.transitionFocus(() => {
      this.resetFocusScale();
      this.selected = selection;
      this.selectedSection = null;
      this.focusMode = 'experience';
      this.focusedCategory = selection.category;
      this.focusedGroup = selection.group;
      this.focusedExperience = selection.experience;
      this.updateMarkerVisibility();
      const focusRoot = selection.targetRoot?.parent ?? selection.targetRoot;
      this.applyFocusScale(focusRoot, 20);
      const target = focusRoot?.getWorldPosition(new THREE.Vector3()) ?? selection.position;
      this.setCameraDistance(this.getDefaultCameraDistance(), target, 1);
    });
  }

  private focusSystem(): void {
    this.transitionFocus(() => this.resetSystem());
  }

  private returnToPreviousFocus(): void {
    if (this.focusMode === 'experience' && this.focusedGroup) {
      const groupMarker = this.markers.find(
        (marker) => marker.selection.type === 'group' &&
          marker.selection.group === this.focusedGroup
      );
      if (groupMarker) {
        this.focusGroup(groupMarker.selection);
      }
      return;
    }
    if (this.focusMode === 'group') {
      this.returnToCategory();
      return;
    }
    this.focusSystem();
  }

  private transitionFocus(action: () => void): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    this.isTransitioning = true;
    this.changeDetector.markForCheck();
    this.transitionTimer = setTimeout(() => {
      try {
        action();
      } finally {
        this.isTransitioning = false;
        this.changeDetector.markForCheck();
      }
    }, 180);
  }

  private applyFocusScale(root: THREE.Object3D | null | undefined, scale: number): void {
    if (!root) {
      return;
    }
    this.setHoveredRoot(undefined);
    root.scale.setScalar(scale);
    this.focusedVisualRoot = root;
    root.getWorldPosition(this.focusedWorldPosition);
  }

  private resetFocusScale(): void {
    if (this.focusedVisualRoot) {
      this.focusedVisualRoot.scale.setScalar(1);
      this.focusedVisualRoot = undefined;
      this.focusedWorldPosition.set(0, 0, 0);
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.pointerDown.set(event.clientX, event.clientY);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (performance.now() < this.hoverSuppressedUntil) {
      this.setHoveredRoot(undefined);
      this.atomCanvas.nativeElement.style.cursor = 'grab';
      return;
    }
    const hit = this.getPointerHit(event);
    const highlightRoot = hit?.object.userData['highlightRoot'] as THREE.Object3D | undefined;
    const allowHover = this.focusMode === 'system' && !this.selected && !this.selectedSection;
    this.setHoveredRoot(allowHover ? highlightRoot : undefined);
    this.atomCanvas.nativeElement.style.cursor = hit ? 'pointer' : 'grab';
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const travel = this.pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    if (travel > 7) {
      return;
    }
    const hit = this.getPointerHit(event);
    const sectionTarget = hit?.object.userData['sectionTarget'] as SectionTarget | undefined;
    if (sectionTarget) {
      this.zone.run(() => this.focusSection(sectionTarget as 'presentation' | 'education'));
      return;
    }
    const orbitalMarker = hit?.object.userData['orbitalMarker'] as OrbitalMarker | undefined;
    if (orbitalMarker) {
      this.zone.run(() => {
        if (orbitalMarker.selection.type === 'category') {
          this.focusCategory(orbitalMarker.selection);
        } else if (orbitalMarker.selection.type === 'group') {
          this.focusGroup(orbitalMarker.selection);
        } else {
          this.focusExperience(orbitalMarker.selection);
        }
      });
    }
  };

  private readonly onPointerLeave = (): void => {
    this.setHoveredRoot(undefined);
    this.atomCanvas.nativeElement.style.cursor = 'grab';
  };

  private getPointerHit(event: MouseEvent): THREE.Intersection | undefined {
    if (!this.renderer) {
      return undefined;
    }
    const rect = this.atomCanvas.nativeElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const visibleTargets = this.interactiveTargets.filter((target) => {
      if (!target.visible || !target.parent?.visible) {
        return false;
      }
      if (target.userData['sectionTarget']) {
        return this.focusMode === 'system';
      }
      const marker = target.userData['orbitalMarker'] as OrbitalMarker | undefined;
      return !marker || this.isMarkerInteractive(marker);
    });
    return this.raycaster
      .intersectObjects(visibleTargets, false)
      .sort((left, right) => {
        const priorityDifference =
          (right.object.userData['interactionPriority'] ?? 0) -
          (left.object.userData['interactionPriority'] ?? 0);
        return priorityDifference || left.distance - right.distance;
      })[0];
  }

  private isMarkerInteractive(marker: OrbitalMarker): boolean {
    if (this.focusMode === 'system') {
      return marker.minimumLevel === 'category';
    }
    if (this.focusMode === 'category') {
      return marker.minimumLevel === 'group' &&
        marker.selection.category === this.focusedCategory;
    }
    if (this.focusMode === 'group') {
      return false;
    }
    return false;
  }

  private setHoveredRoot(root: THREE.Object3D | undefined): void {
    if (root === this.hoveredRoot) {
      return;
    }
    if (this.hoveredRoot) {
      this.hoveredRoot.scale.setScalar(1);
      const previousMarker = this.hoveredRoot.userData['markerMesh'] as THREE.Mesh | undefined;
      if (previousMarker?.material instanceof THREE.MeshStandardMaterial) {
        previousMarker.material.emissiveIntensity =
          previousMarker.userData['baseEmissiveIntensity'] as number;
      }
      const previousGlow = this.hoveredRoot.children.find(
        (child) => child instanceof THREE.Sprite && child.userData['baseOpacity'] !== undefined
      ) as THREE.Sprite | undefined;
      if (previousGlow) {
        previousGlow.userData['highlighted'] = false;
      }
      const previousCallout = this.hoveredRoot.userData['hoverCallout'] as THREE.Object3D | undefined;
      if (previousCallout) {
        previousCallout.visible = false;
        previousCallout.userData['progress'] = 0;
        const previousLine = previousCallout.userData['line'] as THREE.Line | undefined;
        previousLine?.geometry.setDrawRange(0, 0);
        const previousTag = previousCallout.userData['tag'] as THREE.Sprite | undefined;
        if (previousTag) {
          (previousTag.material as THREE.SpriteMaterial).opacity = 0;
        }
      }
    }
    this.hoveredRoot = root;
    if (this.hoveredRoot) {
      this.hoveredRoot.scale.setScalar(1.28);
      const nextMarker = this.hoveredRoot.userData['markerMesh'] as THREE.Mesh | undefined;
      if (nextMarker?.material instanceof THREE.MeshStandardMaterial) {
        nextMarker.material.emissiveIntensity = Math.min(
          1.1,
          (nextMarker.userData['baseEmissiveIntensity'] as number) * 2.4
        );
      }
      const nextGlow = this.hoveredRoot.children.find(
        (child) => child instanceof THREE.Sprite && child.userData['baseOpacity'] !== undefined
      ) as THREE.Sprite | undefined;
      if (nextGlow) {
        nextGlow.userData['highlighted'] = true;
      }
      const nextCallout = this.hoveredRoot.userData['hoverCallout'] as THREE.Object3D | undefined;
      if (nextCallout) {
        nextCallout.visible = true;
        nextCallout.userData['progress'] = 0;
      }
    }
  }

  private renderFrame(): void {
    if (this.disposed || !this.renderer) {
      return;
    }
    this.controls?.update();
    const frameTime = performance.now();
    const delta = Math.min((frameTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = frameTime;
    if (!this.isPaused) {
      this.animationElapsed += delta;
      if (this.focusMode === 'system') {
        this.systemViewElapsed += delta;
      }
    }
    const elapsed = this.animationElapsed;
    if (this.coreGlow) {
      this.coreGlow.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.045);
    }
    if (this.core) {
      this.core.rotation.y = elapsed * 0.34;
      this.core.rotation.x = elapsed * 0.13;
    }
    this.sunFlares.forEach((flare) => {
      const phase = flare.userData['phase'] as number;
      const baseWidth = flare.userData['baseWidth'] as number;
      const baseHeight = flare.userData['baseHeight'] as number;
      const wave = (Math.sin(elapsed * 2.8 + phase) + 1) * 0.5;
      flare.scale.set(
        baseWidth * (0.86 + wave * 0.34),
        baseHeight * (0.72 + wave * 0.72),
        1
      );
      (flare.material as THREE.SpriteMaterial).opacity =
        (flare.userData['baseOpacity'] as number) * (0.72 + wave * 0.34);
    });
    if (this.corePulse) {
      const pulseProgress = (elapsed % 6.8) / 6.8;
      const pulseVisible = elapsed >= 6.8 && pulseProgress < 0.2;
      this.corePulse.visible = pulseVisible &&
        (this.focusMode === 'system' || this.focusMode === 'presentation');
      if (pulseVisible) {
        const expansion = THREE.MathUtils.smoothstep(pulseProgress / 0.2, 0, 1);
        this.corePulse.scale.setScalar(1 + expansion * 2.15);
        (this.corePulse.material as THREE.MeshBasicMaterial).opacity =
          Math.pow(1 - expansion, 1.65) * 0.28;
      }
    }
    if (this.educationOrbitRoot) {
      this.educationOrbitRoot.rotation.z = 0.34 + elapsed * 0.12;
    }
    if (this.knowledgeNetworkRoot) {
      this.knowledgeNetworkRoot.rotation.y = elapsed * 0.022;
      this.knowledgeNetworkRoot.rotation.z = Math.sin(elapsed * 0.12) * 0.035;
    }
    this.orbitMotions.forEach((motion) => {
      motion.pivot.rotation.z = motion.phase + elapsed * motion.speed;
    });
    this.categoryPlanets.forEach((planet, index) => {
      planet.mesh.rotation.y = elapsed * planet.speed + index * 0.45;
      if (planet.ring && planet.ringSpeed) {
        planet.ring.rotation.z = 0.2 + elapsed * planet.ringSpeed;
      }
    });
    this.markerGlows.forEach((glow) => {
      const baseScale = glow.userData['baseScale'] as number;
      const phase = glow.userData['phase'] as number;
      const flicker = 1 + Math.sin(elapsed * 3.1 + phase) * 0.075 + Math.sin(elapsed * 7.4 + phase) * 0.025;
      glow.scale.setScalar(
        baseScale * flicker * (glow.userData['highlighted'] ? 1.75 : 1)
      );
      const material = glow.material as THREE.SpriteMaterial;
      material.opacity = Math.min(1, (glow.userData['baseOpacity'] as number) *
        (0.86 + (Math.sin(elapsed * 4.2 + phase) + 1) * 0.07) *
        (glow.userData['highlighted'] ? 2.35 : 1));
    });
    if (this.educationGlow) {
      const material = this.educationGlow.material as THREE.MeshBasicMaterial;
      material.opacity = 0.065 + (Math.sin(elapsed * 1.7) + 1) * 0.025;
    }
    this.shootingStars.forEach((star) => {
      if (this.focusMode !== 'system') {
        star.visible = false;
        return;
      }
      if (!star.userData['active'] &&
          this.systemViewElapsed >= (star.userData['nextStart'] as number)) {
        this.prepareCelestialEvent(star);
      }
      if (!star.userData['active']) {
        star.visible = false;
        return;
      }
      const duration = star.userData['duration'] as number;
      const localTime = this.systemViewElapsed - (star.userData['activeStart'] as number);
      const progress = localTime / duration;
      if (progress >= 1) {
        star.visible = false;
        star.userData['active'] = false;
        star.userData['nextStart'] = this.systemViewElapsed + this.randomBetween(
          star.userData['minimumInterval'] as number,
          star.userData['maximumInterval'] as number
        );
        return;
      }
      star.visible = true;
      const start = star.userData['start'] as THREE.Vector3;
      const end = star.userData['end'] as THREE.Vector3;
      const curve = star.userData['curve'] as number;
      const body = star.children.find((child) => child.userData['eventBody']) as THREE.Group;
      body.position.lerpVectors(start, end, progress);
      body.position.y += Math.sin(progress * Math.PI) * curve;
      const pathAngle = Math.atan2(end.y - start.y, end.x - start.x);
      const visualPathAngle = Math.atan2(end.y - start.y, Math.abs(end.x - start.x)) *
        (end.x > start.x ? 1 : -1);
      if (star.userData['kind'] !== 'asteroid') {
        body.rotation.z = pathAngle;
      }
      if (star.userData['kind'] === 'asteroid') {
        body.children.forEach((child) => {
          if (child.userData['spinningBody']) {
            child.rotation.x = elapsed * 1.35;
            child.rotation.y = elapsed * 1.82;
            child.rotation.z = elapsed * 0.74;
          }
        });
      }
      if (star.userData['kind'] === 'comet') {
        body.children.forEach((child) => {
          if (!child.userData['eventFlame']) {
            return;
          }
          const sprite = child as THREE.Sprite;
          const material = sprite.material as THREE.SpriteMaterial;
          const phase = child.userData['phase'] as number;
          sprite.position.y = Math.sin(elapsed * 7.4 + phase) * 0.018;
          material.rotation = visualPathAngle + Math.sin(elapsed * 3.2 + phase) * 0.008;
          material.opacity = child.userData['baseOpacity'] as number;
        });
      }
      star.children.forEach((child) => {
        if (!child.userData['eventTrail']) {
          return;
        }
        const trail = child as THREE.Points;
        const attribute = trail.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let index = 0; index < attribute.count; index += 1) {
          const lag = (index / Math.max(1, attribute.count - 1)) * 0.19;
          const trailProgress = Math.max(0, progress - lag);
          const point = new THREE.Vector3().lerpVectors(start, end, trailProgress);
          point.y += Math.sin(trailProgress * Math.PI) * curve;
          attribute.setXYZ(index, point.x, point.y, point.z + 0.015);
        }
        attribute.needsUpdate = true;
      });
    });
    if (this.pulsar) {
      this.pulsar.visible = this.focusMode === 'system' &&
        this.systemViewElapsed >= this.pulsarDelaySeconds &&
        this.systemViewElapsed < this.pulsarDelaySeconds + PULSAR_VISIBLE_SECONDS;
      if (this.pulsar.visible) {
        const pulsarTime = this.systemViewElapsed - this.pulsarDelaySeconds;
        this.pulsar.scale.setScalar(1);
        this.pulsar.children.forEach((child) => {
          const role = child.userData['pulsarRole'];
          const material = (child as THREE.Mesh).material as
            THREE.MeshBasicMaterial | THREE.SpriteMaterial;
          if (role === 'core') {
            let scale: number;
            let opacity: number;
            if (pulsarTime < 1.05) {
              const phase = pulsarTime / 1.05;
              scale = 0.18 + phase * 0.34;
              opacity = Math.pow(Math.sin(phase * Math.PI), 3) * 0.78;
            } else if (pulsarTime < 2.25) {
              const phase = (pulsarTime - 1.05) / 1.2;
              scale = 0.32 + phase * 0.7;
              opacity = Math.pow(Math.sin(phase * Math.PI), 2) * 0.96;
            } else {
              const phase = THREE.MathUtils.clamp((pulsarTime - 2.25) / 2.1, 0, 1);
              scale = 1.25 + phase * 0.9;
              opacity = (1 - phase) * 1;
            }
            child.scale.setScalar(scale);
            material.opacity = opacity;
          } else if (role === 'aura') {
            const flash = THREE.MathUtils.clamp((pulsarTime - 1.85) / 0.65, 0, 1);
            const fade = THREE.MathUtils.clamp((pulsarTime - 2.5) / 3.4, 0, 1);
            child.scale.setScalar(0.08 + flash * 0.58 + fade * 0.46);
            material.opacity = flash * (1 - fade) * 0.82;
          } else if (role === 'wave') {
            const waveIndex = child.userData['waveIndex'] as number;
            const waveStart = 2.35 + waveIndex * 0.48;
            const waveProgress = THREE.MathUtils.clamp((pulsarTime - waveStart) / 3.6, 0, 1);
            const active = pulsarTime >= waveStart && waveProgress < 1;
            child.scale.setScalar(0.04 + waveProgress * (1.22 + waveIndex * 0.12));
            material.opacity = active ? Math.pow(1 - waveProgress, 1.35) * 0.58 : 0;
          }
        });
      }
    }
    this.followFocusedVisual();
    this.updateHoverCallouts(delta);
    this.composer?.render(delta);
    this.animationFrame = requestAnimationFrame(() => this.renderFrame());
  }

  private followFocusedVisual(): void {
    if (!this.focusedVisualRoot || !this.controls) {
      return;
    }
    const nextPosition = this.focusedVisualRoot.getWorldPosition(new THREE.Vector3());
    const movement = nextPosition.sub(this.focusedWorldPosition);
    this.camera.position.add(movement);
    this.controls.target.add(movement);
    this.focusedWorldPosition.add(movement);
  }

  private updateZoomLevel(force = false): void {
    const nextLevel = getKnowledgeZoomLevel(this.getCameraDistance());
    if (force || nextLevel !== this.zoomLevel) {
      this.zone.run(() => {
        this.zoomLevel = nextLevel;
        this.updateMarkerVisibility();
        this.changeDetector.markForCheck();
      });
    }
  }

  private updateMarkerVisibility(): void {
    const knowledgeVisible = this.focusMode !== 'presentation' && this.focusMode !== 'education';
    if (this.presentationRoot) {
      const visible = this.focusMode === 'system' || this.focusMode === 'presentation';
      this.presentationRoot.traverse((object) => {
        object.visible = object.userData['hoverOnly']
          ? visible && this.hoveredRoot === this.presentationRoot
          : visible;
      });
    }
    if (this.educationOrbitRoot) {
      const visible = this.focusMode === 'system' || this.focusMode === 'education';
      this.educationOrbitRoot.traverse((object) => {
        object.visible = object.userData['hoverOnly']
          ? visible && this.focusMode === 'system' &&
            this.hoveredRoot === this.educationOrbitRoot
          : visible;
      });
    }
    this.categoryRoots.forEach(({ category, root, orbit, trail, clusterOrbit }) => {
      const selectedCategory = category === this.focusedCategory;
      root.visible = knowledgeVisible &&
        (this.focusMode === 'system' || selectedCategory);
      orbit.visible = this.focusMode === 'system';
      trail.visible = this.focusMode === 'system';
      clusterOrbit.visible = this.focusMode === 'system' ||
        ((this.focusMode === 'category' || this.focusMode === 'group' ||
          this.focusMode === 'experience') && selectedCategory);
    });
    this.groupRoots.forEach(({ category, group, root, nodeOrbit }) => {
      root.visible = this.focusMode === 'system' ||
        (this.focusMode === 'category' && category === this.focusedCategory) ||
        ((this.focusMode === 'group' || this.focusMode === 'experience') &&
          group === this.focusedGroup);
      nodeOrbit.visible = this.focusMode === 'system' ||
        (this.focusMode === 'category' && category === this.focusedCategory) ||
        ((this.focusMode === 'group' || this.focusMode === 'experience') &&
          group === this.focusedGroup);
    });
    this.markers.forEach((marker) => {
      const sameCategory = marker.selection.category === this.focusedCategory;
      const sameGroup = marker.selection.group === this.focusedGroup;
      let visible = this.focusMode === 'system';
      if (this.focusMode === 'category') {
        visible = sameCategory;
      } else if (this.focusMode === 'group') {
        visible = sameCategory && (
          (marker.minimumLevel === 'group' && sameGroup) ||
          (marker.minimumLevel === 'experience' && sameGroup)
        );
      } else if (this.focusMode === 'experience') {
        visible = marker.minimumLevel === 'experience' &&
          marker.selection.experience === this.focusedExperience;
      } else if (this.focusMode === 'presentation' || this.focusMode === 'education') {
        visible = false;
      }
      marker.relatedObjects.forEach((object) => {
        object.visible = visible;
      });
      const labelVisible = this.isMarkerLabelVisible(marker);
      if (marker.label) {
        marker.label.visible = visible && labelVisible;
      }
    });
  }

  private isMarkerLabelVisible(marker: OrbitalMarker): boolean {
    if (this.focusMode === 'category') {
      return marker.minimumLevel === 'category' || marker.minimumLevel === 'group';
    }
    if (this.focusMode === 'group') {
      return marker.minimumLevel === 'group' || marker.minimumLevel === 'experience';
    }
    if (this.focusMode === 'experience') {
      return marker.minimumLevel === 'experience' &&
        marker.selection.experience === this.focusedExperience;
    }
    return isKnowledgeMarkerLabelVisible(this.zoomLevel, marker.minimumLevel);
  }

  private setCameraDistance(
    distance: number,
    anchor?: THREE.Vector3,
    anchorWeight = 0
  ): void {
    const nextDistance = THREE.MathUtils.clamp(distance, 1.55, 18);
    const currentTarget = this.controls?.target.clone() ?? new THREE.Vector3();
    const nextTarget = anchor
      ? currentTarget.clone().lerp(anchor, THREE.MathUtils.clamp(anchorWeight, 0, 1))
      : currentTarget;
    const viewDirection = this.camera.position.clone().sub(currentTarget).normalize();
    this.camera.position.copy(nextTarget).addScaledVector(viewDirection, nextDistance);
    if (this.controls) {
      this.controls.target.copy(nextTarget);
      this.controls.update();
    }
    this.updateZoomLevel(true);
  }

  private getCameraDistance(): number {
    return this.controls
      ? this.camera.position.distanceTo(this.controls.target)
      : this.camera.position.length();
  }

  private resizeRenderer(): void {
    if (!this.renderer) {
      return;
    }
    const parent = this.atomCanvas.nativeElement.parentElement;
    const width = parent?.clientWidth || 1;
    const height = parent?.clientHeight || 1;
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private getDefaultCameraDistance(): number {
    return this.atomCanvas.nativeElement.clientWidth < 640 ? 16 : 14.4;
  }

  private clearSystem(): void {
    this.resetFocusScale();
    this.setHoveredRoot(undefined);
    if (this.systemRoot) {
      this.scene.remove(this.systemRoot);
      this.disposeObject(this.systemRoot);
    }
    this.shootingStars.forEach((event) => {
      this.camera.remove(event);
      this.disposeObject(event);
    });
    if (this.pulsar) {
      this.camera.remove(this.pulsar);
      this.disposeObject(this.pulsar);
    }
    this.systemRoot = undefined;
    this.core = undefined;
    this.coreGlow = undefined;
    this.corePulse = undefined;
    this.pulsar = undefined;
    this.educationOrbitRoot = undefined;
    this.educationGlow = undefined;
    this.knowledgeNetworkRoot = undefined;
    this.shootingStars.length = 0;
    this.systemViewElapsed = 0;
    this.markers.length = 0;
    this.interactiveTargets.length = 0;
    this.orbitMotions.length = 0;
    this.markerGlows.length = 0;
    this.sunFlares.length = 0;
    this.categoryPlanets.length = 0;
    this.categoryRoots.length = 0;
    this.groupRoots.length = 0;
    this.hoverCallouts.length = 0;
    this.focusedCategory = undefined;
    this.focusedGroup = undefined;
    this.focusedExperience = undefined;
    this.presentationRoot = undefined;
  }

  private disposeObject(root: THREE.Object3D): void {
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      materials.forEach((material) => {
        const materialWithMap = material as THREE.Material & { map?: THREE.Texture };
        materialWithMap.map?.dispose();
        material.dispose();
      });
    });
  }
}
