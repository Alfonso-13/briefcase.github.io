import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PersonalData } from 'src/app/interface/personal-data';
import { Observable } from 'rxjs';
import { ThemeMode } from 'src/app/interface/theme-config';
import { ThemeService } from 'src/app/services/theme.service';
import { AppLanguage, LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() personalData?: PersonalData;
  @Output() openUniverse = new EventEmitter<void>();
  themeMode$: Observable<ThemeMode>;
  language$: Observable<AppLanguage>;
  contactMenuEvent?: Event;
  contactMenuOpen = false;

  constructor(
    private themeService: ThemeService,
    private languageService: LanguageService
  ) {
    this.themeMode$ = this.themeService.mode$;
    this.language$ = this.languageService.language$;
  }

  get avatarPath(): string {
    return this.personalData?.personalFiles?.avatarPath || 'assets/img/avatar.svg';
  }

  get professionalTitle(): string | undefined {
    return this.languageService.current === 'es'
      ? this.personalData?.titleEs || this.personalData?.title
      : this.personalData?.title;
  }

  get emailHref(): string | null {
    return this.personalData?.email ? `mailto:${this.personalData.email}` : null;
  }

  get linkedinUrl(): string | null {
    return this.personalData?.socialMedia?.urlLinkedin || null;
  }

  get githubUrl(): string | null {
    return this.personalData?.socialMedia?.urlGithub || null;
  }

  openContactMenu(ev: Event) {
    this.contactMenuEvent = ev;
    this.contactMenuOpen = true;
  }

  closeContactMenu(): void {
    this.contactMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleLanguage(): void {
    this.languageService.toggle();
  }
}
