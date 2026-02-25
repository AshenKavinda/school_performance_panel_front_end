import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'spp-theme';

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      // Default: respect OS preference
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  // Sync the `dark` class on <html> and persist preference
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // localStorage unavailable
    }
  }, [dark]);

  const toggleTheme = useCallback(() => setDark((prev) => !prev), []);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeContext;
