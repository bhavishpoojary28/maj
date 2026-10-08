import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemePalette = 'classic' | 'sophia';

type ThemeContextValue = {
  theme: ThemeMode;
  mode: ThemeMode;
  palette: ThemePalette;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (localStorage.getItem('railqr-theme-v2') !== 'set') {
      localStorage.setItem('railqr-theme', 'light');
      localStorage.setItem('railqr-theme-v2', 'set');
      return 'light';
    }
    const stored = localStorage.getItem('railqr-theme') as ThemeMode | null;
    return stored || 'light';
  });

  const [palette, setPalette] = useState<ThemePalette>(() => {
    if (localStorage.getItem('railqr-palette-v2') !== 'set') {
      localStorage.setItem('railqr-palette', 'sophia');
      localStorage.setItem('railqr-palette-v2', 'set');
      return 'sophia';
    }
    const stored = localStorage.getItem('railqr-palette') as ThemePalette | null;
    return stored || 'sophia';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('railqr-theme', mode);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-classic', 'theme-sophia');
    root.classList.add(`theme-${palette}`);
    localStorage.setItem('railqr-palette', palette);
  }, [palette]);

  const toggleTheme = () => setMode((p) => (p === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider
      value={{
        theme: mode,
        mode,
        palette,
        toggleTheme,
        setMode,
        setPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
