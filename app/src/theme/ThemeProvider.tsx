import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, View } from 'react-native';
import { palettes, ThemeName } from './tokens';

const KEY = 'sbor.theme';

type ThemeContextValue = {
  mode: ThemeName;
  colors: (typeof palettes)[ThemeName];
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDomTheme(mode: ThemeName) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.style.colorScheme = mode;
  document.body.classList.toggle('dark', mode === 'dark');
}

function initialMode(): ThemeName {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

if (typeof document !== 'undefined') {
  applyDomTheme(initialMode());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeName>(initialMode);

  useEffect(() => {
    applyDomTheme(mode);
    AsyncStorage.setItem(KEY, mode).catch(() => undefined);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, mode);
    }
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: palettes[mode],
      toggle,
    }),
    [mode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className={`flex-1 bg-cream ${mode === 'dark' ? 'dark' : ''}`}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
