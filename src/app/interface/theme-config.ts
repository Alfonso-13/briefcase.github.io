export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  background: string;
  surface: string;
  surfaceAlt: string;
  header: string;
  footer: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
}

export interface ThemeConfig {
  cacheKey: string;
  defaultMode: ThemeMode;
  effects?: {
    sparkles?: boolean;
  };
  light: ThemePalette;
  dark: ThemePalette;
}
