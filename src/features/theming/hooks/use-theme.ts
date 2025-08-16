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
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);
  const [isClient, setIsClient] = useState(false);

  // Initialize client state and load saved theme
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem('tower-tracking-theme');
      if (saved) {
        setThemeState(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setTheme = (updates: Partial<ThemeConfig>): void => {
    setThemeState(prev => ({ ...prev, ...updates }));
  };

  const toggleCondensed = (): void => {
    setTheme({ mode: theme.mode === 'normal' ? 'condensed' : 'normal' });
  };

  useEffect(() => {
    if (!isClient) return;
    
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
  }, [theme, isClient]);

  return { theme, setTheme, toggleCondensed };
}

export { ThemeContext };