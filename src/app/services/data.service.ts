import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PresentationData } from '../interface/presentation-data';
import { SiteConfig } from '../interface/site-config';
import { NavigationConfig } from '../interface/navigation-config';
import { ThemeConfig } from '../interface/theme-config';
import { SeoConfig } from '../interface/seo-config';
import { KnowledgeCategory } from '../interface/knowledge-data';
import { EducationData } from '../interface/education-data';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor( private http: HttpClient, ) { }

  getSiteConfig() {
    return this.http.get<SiteConfig>('assets/config/site.json');
  }

  getPresentationData() {
    return this.http.get<PresentationData[]>('assets/config/sections/presentation.json');
  }

  getEducationData() {
    return this.http.get<EducationData[]>('assets/config/sections/education.json');
  }

  getKnowledgeData() {
    return this.http.get<KnowledgeCategory[]>('assets/config/sections/knowledge.json');
  }

  getNavigationConfig() {
    return this.http.get<NavigationConfig>('assets/config/navigation.json');
  }

  getThemeConfig() {
    return this.http.get<ThemeConfig>('assets/config/theme.json');
  }

  getSeoConfig() {
    return this.http.get<SeoConfig>('assets/config/seo.json');
  }
}
