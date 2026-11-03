import { PersonalData } from './personal-data';

export interface SiteConfig extends PersonalData {
  footer?: {
    label: string;
    url: string;
  };
}
