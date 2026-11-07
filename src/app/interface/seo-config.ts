export interface SeoConfig {
  lang: string;
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  image?: string;
  imageAlt?: string;
  imageType?: string;
  imageWidth?: number;
  imageHeight?: number;
}
