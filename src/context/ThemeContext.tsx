import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Theme, ThemeColors, ThemeId, THEMES } from '../constants/colors';
export type FontSizeId = 'small' | 'default' | 'large';

export const FONT_SIZES: { id: FontSizeId; label: string; scale: number }[] = [
  { id: 'small', label: 'Small', scale: 0.9 },
  { id: 'default', label: 'Default', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.15 },
];

// turns a normal font size into the chosen size, e.g. fs(20) is 23 on Large
export type FontScaler = (size: number) => number;

type ThemeState = {
  theme: Theme;
  colors: ThemeColors;
  setThemeId: (id: ThemeId) => void;
  fontSizeId: FontSizeId;
  setFontSizeId: (id: FontSizeId) => void;
  fs: FontScaler;
};

const ThemeContext = createContext<ThemeState | null>(null);

// wraps the whole app, like ProfileProvider
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('classic');
  const [fontSizeId, setFontSizeId] = useState<FontSizeId>('default');

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const scale = FONT_SIZES.find((f) => f.id === fontSizeId)?.scale ?? 1;
  const fs = useCallback((size: number) => Math.round(size * scale), [scale]);

  const value = useMemo(
    () => ({ theme, colors: theme.colors, setThemeId, fontSizeId, setFontSizeId, fs }),
    [theme, fontSizeId, fs]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// any screen calls useTheme() to read the current colors and font size
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

// builds a screen's styles from the current theme, and rebuilds them
// only when the theme or font size changes
export function useThemedStyles<T>(makeStyles: (colors: ThemeColors, fs: FontScaler) => T): T {
  const { colors, fs } = useTheme();
  return useMemo(() => makeStyles(colors, fs), [makeStyles, colors, fs]);
}
