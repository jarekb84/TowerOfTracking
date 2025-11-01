import { ReactNode } from 'react';
import { ThemeContext, useThemeProvider } from './use-theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeContextValue = useThemeProvider();

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
}