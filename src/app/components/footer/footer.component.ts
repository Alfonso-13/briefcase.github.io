import { Component, Input } from '@angular/core';
import { SiteConfig } from 'src/app/interface/site-config';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @Input() siteConfig?: SiteConfig;

  get githubUrl(): string {
    return this.siteConfig?.footer?.url || '#';
  }

  get authorLabel(): string {
    return this.siteConfig?.footer?.label || 'PORTFOLIO AUTHOR';
  }
}
