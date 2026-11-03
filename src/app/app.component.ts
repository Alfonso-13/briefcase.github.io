import { Component, HostListener, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { DataService } from './services/data.service';
import { forkJoin } from 'rxjs';
import { SiteConfig } from './interface/site-config';
import { ThemeService } from './services/theme.service';
import { SeoService } from './services/seo.service';
import { PortfolioNavigationService } from './services/portfolio-navigation.service';
import { KnowledgeComponent } from './components/knowledge/knowledge.component';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  @ViewChild(KnowledgeComponent) universeView?: KnowledgeComponent;

  siteConfig: SiteConfig;
  universeOpen = false;

  constructor(
    private platform: Platform,
    private dataService: DataService,
    private themeService: ThemeService,
    private seoService: SeoService,
    private portfolioNavigation: PortfolioNavigationService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then(() => {
      forkJoin({
        site: this.dataService.getSiteConfig(),
        theme: this.themeService.initialize(),
        seo: this.dataService.getSeoConfig(),
      }).subscribe(({ site, seo }) => {
        this.siteConfig = site;
        this.seoService.apply(seo);
      });
    });
  }

  showUniverse(): void {
    this.universeOpen = true;
  }

  closeUniverse(): void {
    this.universeOpen = false;
  }

  navigateFromUniverse(sectionId: 'presentation' | 'education' | 'knowledge'): void {
    this.universeOpen = false;
    queueMicrotask(() => this.portfolioNavigation.navigateTo(sectionId));
  }

  @HostListener('window:keydown.escape')
  closeUniverseWithEscape(): void {
    if (this.universeOpen) {
      if (this.universeView?.handleEscape()) {
        return;
      }
      this.closeUniverse();
    }
  }
}
