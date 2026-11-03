import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NavigationSection } from '../interface/navigation-config';
import { DataService } from '../services/data.service';
import { PortfolioNavigationService } from '../services/portfolio-navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('mainSwiper') mainSwiper?: ElementRef<SwiperHostElement>;

  sections: NavigationSection[] = [
    { id: 'presentation', label: 'Presentation', icon: 'person-circle-outline', enabled: true, order: 1 },
    { id: 'education', label: 'Education', icon: 'briefcase-outline', enabled: true, order: 2 },
    { id: 'knowledge', label: 'Knowledge', icon: 'map-outline', enabled: true, order: 3 },
  ];
  activeSectionIndex = 0;
  private readonly subscriptions = new Subscription();

  constructor(
    private dataService: DataService,
    private changeDetector: ChangeDetectorRef,
    private portfolioNavigation: PortfolioNavigationService
  ) {
    this.subscriptions.add(
      this.portfolioNavigation.sectionRequest$.subscribe((sectionId) => {
        this.goToSectionById(sectionId);
      })
    );
  }

  ngOnInit(): void {
    this.dataService.getNavigationConfig().subscribe({
      next: (config) => {
        this.sections = config.sections
          .filter((section) => section.enabled)
          .sort((left, right) => left.order - right.order);
        const initialIndex = this.sections.findIndex((section) => section.id === config.initialSection);
        this.activeSectionIndex = initialIndex >= 0 ? initialIndex : 0;
        this.changeDetector.detectChanges();
        queueMicrotask(() => this.goToSection(this.activeSectionIndex));
      },
      error: (error) => {
        console.error('Unable to load navigation configuration.', error);
      },
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  trackSection(_index: number, section: NavigationSection): string {
    return section.id;
  }

  goToSection(index: number): void {
    const safeIndex = Math.max(0, Math.min(index, this.sections.length - 1));
    this.activeSectionIndex = safeIndex;
    this.mainSwiper?.nativeElement.swiper?.slideTo(safeIndex);
  }

  goToSectionById(sectionId: NavigationSection['id']): void {
    const sectionIndex = this.sections.findIndex((section) => section.id === sectionId);
    if (sectionIndex >= 0) {
      this.goToSection(sectionIndex);
    }
  }

  handleSlideChange(event: Event): void {
    const swiperHost = event.target as SwiperHostElement;
    if (swiperHost !== this.mainSwiper?.nativeElement) {
      return;
    }
    this.activeSectionIndex = swiperHost.swiper?.activeIndex ?? 0;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || this.isEditableTarget(event.target)) {
      return;
    }

    let handled = true;
    switch (event.key) {
      case 'ArrowLeft':
        this.goToSection(this.activeSectionIndex - 1);
        break;
      case 'ArrowRight':
        this.goToSection(this.activeSectionIndex + 1);
        break;
      case 'ArrowUp':
        this.getActiveVerticalSwiper()?.swiper?.slidePrev();
        break;
      case 'ArrowDown':
        this.getActiveVerticalSwiper()?.swiper?.slideNext();
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  private getActiveVerticalSwiper(): SwiperHostElement | null {
    const mainSwiper = this.mainSwiper?.nativeElement;
    const sectionSlides = mainSwiper
      ? Array.from(mainSwiper.children).filter((child) => child.tagName === 'SWIPER-SLIDE')
      : [];
    const activeSlide = sectionSlides[this.activeSectionIndex];
    return activeSlide?.querySelector('swiper-container.vertical-cards') as SwiperHostElement | null;
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return Boolean(
      element?.isContentEditable ||
      element?.matches('input, textarea, select')
    );
  }
}

interface SwiperHostElement extends HTMLElement {
  swiper?: {
    activeIndex: number;
    slideTo(index: number): void;
    slideNext(): void;
    slidePrev(): void;
  };
}
