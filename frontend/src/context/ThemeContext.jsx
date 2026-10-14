import { createContext, useContext, useEffect, useState } from 'react';
import {
  applyTheme,
  isThemeStorageEvent,
  readThemePreference,
  saveThemePreference,
} from '../utils/theme.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readThemePreference);

  useEffect(() => {
    applyTheme(preference);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => applyTheme(preference);
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, [preference]);

  useEffect(() => {
    const onStorage = (event) => {
      if (isThemeStorageEvent(event)) setPreference(readThemePreference());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function changeTheme(next) {
    applyTheme(next);
    setPreference(next);
    saveThemePreference(next);
  }

  return (
    <ThemeContext.Provider value={{ preference, changeTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
