import { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeConfig, ThemeContextType } from '../types/theme.types';

const defaultTheme: ThemeConfig = {
  mode: 'normal',
  spacingBase: 0.25,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeProvider(): ThemeContextType {
  // Load initial theme from localStorage (synchronous to avoid re-render flash)
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }

    try {
      const saved = localStorage.getItem('tower-tracking-theme');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
    return defaultTheme;
  });

  const setTheme = (updates: Partial<ThemeConfig>): void => {
    setThemeState(prev => ({ ...prev, ...updates }));
  };

  const toggleCondensed = (): void => {
    setTheme({ mode: theme.mode === 'normal' ? 'condensed' : 'normal' });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Save theme to localStorage
    try {
      localStorage.setItem('tower-tracking-theme', JSON.stringify(theme));
    } catch {
      // Ignore localStorage errors
    }

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme.mode);
    document.documentElement.style.setProperty('--spacing-base', `${theme.spacingBase}rem`);

    // For condensed mode, apply the scale factor
    if (theme.mode === 'condensed') {
      const scale = 0.6;
      document.documentElement.style.setProperty('--spacing-scale', scale.toString());
    } else {
      document.documentElement.style.setProperty('--spacing-scale', '1');
    }
  }, [theme]);

  return { theme, setTheme, toggleCondensed };
}

export { ThemeContext };