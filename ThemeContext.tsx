import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isEcoMode: boolean;
  toggleEcoMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isEcoMode: false,
  toggleEcoMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [isEcoMode, setIsEcoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ecoMode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Theme save error:', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('ecoMode', String(isEcoMode));
    } catch (e) {}
  }, [isEcoMode]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleEcoMode = () => {
    setIsEcoMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isEcoMode, toggleEcoMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
