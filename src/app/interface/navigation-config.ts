export interface NavigationSection {
  id: 'presentation' | 'education' | 'knowledge';
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface NavigationConfig {
  initialSection?: string;
  sections: NavigationSection[];
}
