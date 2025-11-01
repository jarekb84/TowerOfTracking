export type ThemeMode = 'normal' | 'condensed';

export interface ThemeConfig {
  mode: ThemeMode;
  spacingBase: number; // Base spacing in rem
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleCondensed: () => void;
}