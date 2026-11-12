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
  const [hasExplicitChoice, setHasExplicitChoice] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme');
      return stored === 'light' || stored === 'dark';
    } catch {
      return false;
    }
  });

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
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

  // Follow live system changes only if the user has NOT stored an explicit choice
  useEffect(() => {
    if (hasExplicitChoice || typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleChange);
      }
    };
  }, [hasExplicitChoice]);

  // Apply theme class to documentElement, update meta theme-color, and persist explicit choices
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

      // Update meta theme-color tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#0D0D0D' : '#F2F4EF');
      }

      // If user made an explicit choice, store it
      if (hasExplicitChoice) {
        localStorage.setItem('theme', theme);
      }
    } catch (e) {
      console.warn('Theme save error:', e);
    }
  }, [theme, hasExplicitChoice]);

  useEffect(() => {
    try {
      localStorage.setItem('ecoMode', String(isEcoMode));
    } catch (e) {}
  }, [isEcoMode]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        console.warn('Theme save error:', e);
      }
      return next;
    });
    setHasExplicitChoice(true);
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
