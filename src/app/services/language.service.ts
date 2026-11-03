import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'en' | 'es';

const TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  'nav.presentation': { en: 'Presentation', es: 'Presentación' },
  'nav.education': { en: 'Education', es: 'Educación' },
  'nav.knowledge': { en: 'Knowledge', es: 'Conocimientos' },
  'nav.sections': { en: 'Portfolio sections', es: 'Secciones del portafolio' },
  'nav.previous': { en: 'Previous section', es: 'Sección anterior' },
  'nav.next': { en: 'Next section', es: 'Sección siguiente' },
  'header.myUniverse': { en: 'My Universe', es: 'Mi Universo' },
  'header.openUniverse': { en: 'Open My Universe', es: 'Abrir Mi Universo' },
  'header.openContacts': { en: 'Open contact links', es: 'Abrir enlaces de contacto' },
  'header.email': { en: 'Email', es: 'Correo' },
  'header.sendEmail': { en: 'Send email', es: 'Enviar correo' },
  'header.openLinkedIn': { en: 'Open LinkedIn', es: 'Abrir LinkedIn' },
  'header.openGitHub': { en: 'Open GitHub', es: 'Abrir GitHub' },
  'header.lightTheme': { en: 'Switch to light theme', es: 'Cambiar a tema claro' },
  'header.darkTheme': { en: 'Switch to dark theme', es: 'Cambiar a tema oscuro' },
  'header.language': { en: 'Change language', es: 'Cambiar idioma' },
  'footer.identity': { en: 'Portfolio identity', es: 'Identidad del portafolio' },
  'footer.tagline': { en: 'Ideas · Systems · Experiences', es: 'Ideas · Sistemas · Experiencias' },
  'footer.designed': { en: 'DESIGNED & DEVELOPED BY', es: 'DISEÑADO Y DESARROLLADO POR' },
  'footer.github': { en: 'Portfolio author on GitHub', es: 'Autor del portafolio en GitHub' },
  'universe.network': { en: 'INTERACTIVE PORTFOLIO NETWORK', es: 'RED INTERACTIVA DEL PORTAFOLIO' },
  'universe.name': { en: 'My Universe', es: 'Mi Universo' },
  'universe.close': { en: 'Close My Universe', es: 'Cerrar Mi Universo' },
  'universe.kicker': { en: 'Professional orbital network', es: 'Red orbital profesional' },
  'universe.system': { en: 'System', es: 'Sistema' },
  'universe.orbit': { en: 'Orbit', es: 'Órbita' },
  'universe.cluster': { en: 'Cluster', es: 'Grupo' },
  'universe.node': { en: 'Node', es: 'Nodo' },
  'universe.category': { en: 'Category', es: 'Categoría' },
  'universe.group': { en: 'Cluster', es: 'Grupo' },
  'universe.experience': { en: 'Experience', es: 'Experiencia' },
  'universe.canvasAria': {
    en: 'Interactive 3D portfolio universe. Drag to rotate, zoom, or select an orbital node.',
    es: 'Universo 3D interactivo del portafolio. Arrastra para rotar, acerca o selecciona un nodo orbital.',
  },
  'universe.instruction.system': {
    en: 'Presentation is the core. Education is the orbit. Knowledge lives in the satellite network.',
    es: 'Presentación es el núcleo. Educación es la órbita. Los conocimientos viven en la red de satélites.',
  },
  'universe.instruction.orbit': {
    en: 'Select the Education belt or a Knowledge domain.',
    es: 'Selecciona el cinturón de Educación o un área de conocimiento.',
  },
  'universe.instruction.cluster': {
    en: 'Clusters organize stacks and areas of practice.',
    es: 'Los grupos organizan stacks y áreas de práctica.',
  },
  'universe.instruction.node': {
    en: 'Select a node to inspect experience, projects and repositories.',
    es: 'Selecciona un nodo para consultar experiencia, proyectos y repositorios.',
  },
  'universe.zoomIn': { en: 'Zoom in', es: 'Acercar' },
  'universe.zoomOut': { en: 'Zoom out', es: 'Alejar' },
  'universe.reset': { en: 'Reset', es: 'Restablecer' },
  'universe.resetView': { en: 'Reset universe view', es: 'Restablecer vista del universo' },
  'universe.pause': { en: 'Pause', es: 'Pausar' },
  'universe.resume': { en: 'Resume', es: 'Reanudar' },
  'universe.closeDetails': { en: 'Close details', es: 'Cerrar detalles' },
  'universe.highlights': { en: 'Highlights', es: 'Aspectos destacados' },
  'universe.projects': { en: 'Projects', es: 'Proyectos' },
  'universe.repositories': { en: 'Repositories', es: 'Repositorios' },
  'universe.explore.category': { en: 'Explore this category', es: 'Explorar esta categoría' },
  'universe.explore.group': { en: 'Explore this cluster', es: 'Explorar este grupo' },
  'universe.moreInfo': { en: 'More information', es: 'Más información' },
  'universe.backToCategory': { en: 'Back to category', es: 'Regresar a la categoría' },
  'universe.goToPresentation': { en: 'Go to Presentation', es: 'Ir a Presentación' },
  'universe.goToEducation': { en: 'Go to Education', es: 'Ir a Educación' },
  'universe.core': { en: 'Core', es: 'Núcleo' },
  'universe.belt': { en: 'Asteroid belt', es: 'Cinturón de asteroides' },
  'universe.summary.presentation': {
    en: 'This core represents the professional identity configured for the portfolio. Replace this starter summary with concise, verifiable experience and outcomes.',
    es: 'Este núcleo representa la identidad profesional configurada para el portafolio. Reemplaza este resumen inicial con experiencia y resultados breves y verificables.',
  },
  'universe.summary.education': {
    en: 'This belt represents formal education, certifications and continuous learning configured for the portfolio.',
    es: 'Este cinturón representa la formación académica, certificaciones y aprendizaje continuo configurados para el portafolio.',
  },
  'universe.drag': { en: 'Drag to rotate', es: 'Arrastra para rotar' },
  'universe.scroll': { en: 'Scroll or pinch to zoom', es: 'Usa scroll o pellizca para acercar' },
  'universe.select': { en: 'Select a sphere to explore', es: 'Selecciona una esfera para explorar' },
  'universe.hover': { en: 'Hover to illuminate', es: 'Pasa el cursor para iluminar' },
  'universe.presentation': { en: 'PRESENTATION', es: 'PRESENTACIÓN' },
  'universe.educationOrbit': { en: 'EDUCATION', es: 'EDUCACIÓN' },
  'knowledge.domain': { en: 'Knowledge domain', es: 'Área de conocimiento' },
  'knowledge.fallback': {
    en: 'Technologies, stacks and practical experience organized by area.',
    es: 'Tecnologías, stacks y experiencia práctica organizados por área.',
  },
  'knowledge.clusters': { en: 'clusters', es: 'grupos' },
  'knowledge.technologies': { en: 'technologies', es: 'tecnologías' },
  'knowledge.practices': { en: 'Practices', es: 'Prácticas' },
  'group.basics': { en: 'Basics', es: 'Fundamentos' },
  'group.frameworks': { en: 'Frameworks', es: 'Frameworks' },
  'group.styles': { en: 'Styles', es: 'Estilos' },
  'group.technology': { en: 'Technology', es: 'Tecnología' },
  'group.rdbms': { en: 'RDBMS', es: 'RDBMS' },
  'group.nosql': { en: 'NoSQL', es: 'NoSQL' },
  'group.infrastructure': { en: 'Infrastructure', es: 'Infraestructura' },
  'group.automation': { en: 'Automation', es: 'Automatización' },
  'group.code-quality': { en: 'Code Quality', es: 'Calidad de código' },
  'group.ai-assisted-development': {
    en: 'AI-assisted development',
    es: 'Desarrollo asistido por IA',
  },
  'group.virtualization': { en: 'Virtualization', es: 'Virtualización' },
  'group.android': { en: 'Android', es: 'Android' },
  'group.cross-platform': { en: 'Cross Platform', es: 'Multiplataforma' },
  'category.front-end': { en: 'Front-End', es: 'Front-End' },
  'category.back-end': { en: 'Back-End', es: 'Back-End' },
  'category.database': { en: 'Database', es: 'Bases de datos' },
  'category.dev-ops': { en: 'Dev Ops', es: 'Dev Ops' },
  'category.mobile': { en: 'Mobile', es: 'Móvil' },
  'category.methodology': { en: 'Methodology', es: 'Metodología' },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly cacheKey = 'briefcase-language';
  private readonly languageSubject = new BehaviorSubject<AppLanguage>(this.readCachedLanguage());
  readonly language$ = this.languageSubject.asObservable();

  constructor() {
    this.applyDocumentLanguage(this.current);
  }

  get current(): AppLanguage {
    return this.languageSubject.value;
  }

  toggle(): void {
    this.set(this.current === 'en' ? 'es' : 'en');
  }

  set(language: AppLanguage): void {
    this.languageSubject.next(language);
    this.applyDocumentLanguage(language);
    try {
      localStorage.setItem(this.cacheKey, language);
    } catch {
      // The interface still works when storage is unavailable.
    }
  }

  translate(key: string): string {
    return TRANSLATIONS[key]?.[this.current] ?? key;
  }

  category(name: string): string {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const key = `category.${slug}`;
    const translated = this.translate(key);
    return translated === key ? name : translated;
  }

  group(name?: string): string {
    if (!name?.trim()) {
      return this.translate('knowledge.practices');
    }
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const key = `group.${slug}`;
    const translated = this.translate(key);
    return translated === key ? name : translated;
  }

  duration(value: string): string {
    if (this.current === 'en') {
      return value;
    }
    return value
      .replace(/\bYEARS\b/gi, 'AÑOS')
      .replace(/\bYEAR\b/gi, 'AÑO')
      .replace(/\bMONTHS\b/gi, 'MESES')
      .replace(/\bMONTH\b/gi, 'MES')
      .replace(/\bSINCE\b/gi, 'DESDE');
  }

  private readCachedLanguage(): AppLanguage {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached === 'es' || cached === 'en' ? cached : 'en';
    } catch {
      return 'en';
    }
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    document.documentElement.lang = language;
  }
}
