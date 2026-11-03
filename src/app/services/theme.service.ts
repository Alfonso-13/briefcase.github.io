import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ThemeConfig, ThemeMode, ThemePalette } from '../interface/theme-config';
import { DataService } from './data.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode$: Observable<ThemeMode>;

  private config: ThemeConfig;
  private readonly modeSubject = new BehaviorSubject<ThemeMode>('light');

  constructor(
    private dataService: DataService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.mode$ = this.modeSubject.asObservable();
  }

  initialize(): Observable<ThemeConfig> {
    return this.dataService.getThemeConfig().pipe(
      tap((config) => {
        this.config = config;
        const cachedMode = this.readCachedMode(config.cacheKey);
        this.apply(cachedMode || config.defaultMode, false);
      })
    );
  }

  toggle(): void {
    this.apply(this.modeSubject.value === 'light' ? 'dark' : 'light');
  }

  private apply(mode: ThemeMode, persist = true): void {
    if (!this.config) {
      return;
    }

    const palette = this.config[mode];
    const root = this.document.documentElement;

    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
    this.setPalette(root, palette);
    this.modeSubject.next(mode);

    if (persist) {
      try {
        localStorage.setItem(this.config.cacheKey, mode);
      } catch {
        // The selected theme still works when storage is unavailable.
      }
    }
  }

  private setPalette(root: HTMLElement, palette: ThemePalette): void {
    root.style.setProperty('--app-background', palette.background);
    root.style.setProperty('--app-surface', palette.surface);
    root.style.setProperty('--app-surface-alt', palette.surfaceAlt);
    root.style.setProperty('--app-header', palette.header);
    root.style.setProperty('--app-footer', palette.footer);
    root.style.setProperty('--app-text', palette.text);
    root.style.setProperty('--app-muted', palette.muted);
    root.style.setProperty('--app-border', palette.border);
    root.style.setProperty('--app-accent', palette.accent);
    root.style.setProperty('--app-accent-strong', palette.accentStrong);
    root.style.setProperty('--app-accent-soft', palette.accentSoft);
  }

  private readCachedMode(cacheKey: string): ThemeMode | null {
    try {
      const value = localStorage.getItem(cacheKey);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }
}
