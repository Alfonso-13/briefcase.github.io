
import { PersonalFiles } from './personal-files';
import { SocialMedia } from './social-media';

export interface PersonalData {
    name: string;
    title?: string;
    titleEs?: string;
    email?: string;
    socialMedia?: SocialMedia;
    personalFiles?: PersonalFiles;
}
