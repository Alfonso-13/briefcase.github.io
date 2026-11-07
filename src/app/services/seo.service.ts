import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoConfig } from '../interface/seo-config';

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  apply(config: SeoConfig): void {
    this.document.documentElement.lang = config.lang || 'en';
    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'keywords', content: config.keywords.join(', ') });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: config.canonicalUrl });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });

    if (config.image) {
      const imageUrl = this.resolveUrl(config.image, config.canonicalUrl);
      this.meta.updateTag({ property: 'og:image', content: imageUrl });
      this.meta.updateTag({ property: 'og:image:secure_url', content: imageUrl });
      this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    }

    if (config.imageAlt) {
      this.meta.updateTag({ property: 'og:image:alt', content: config.imageAlt });
      this.meta.updateTag({ name: 'twitter:image:alt', content: config.imageAlt });
    }

    if (config.imageType) {
      this.meta.updateTag({ property: 'og:image:type', content: config.imageType });
    }

    if (config.imageWidth) {
      this.meta.updateTag({ property: 'og:image:width', content: String(config.imageWidth) });
    }

    if (config.imageHeight) {
      this.meta.updateTag({ property: 'og:image:height', content: String(config.imageHeight) });
    }

    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = config.canonicalUrl;
  }

  private resolveUrl(value: string, canonicalUrl: string): string {
    try {
      return new URL(value, canonicalUrl || this.document.baseURI).href;
    } catch {
      return value;
    }
  }
}
