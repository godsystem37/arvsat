export type ThemeName = 'light' | 'dark';

export const palettes: Record<
  ThemeName,
  {
    cream: string;
    paper: string;
    ink: string;
    forest: string;
    clay: string;
    muted: string;
    line: string;
    danger: string;
    forestSoft: string;
    claySoft: string;
    dangerSoft: string;
    creamSoft: string;
  }
> = {
  light: {
    cream: '#F6F1E8',
    paper: '#FFFBF5',
    ink: '#1C1915',
    forest: '#2F5D50',
    clay: '#C45C26',
    muted: '#6B6459',
    line: '#E4D9C8',
    danger: '#A33B2B',
    forestSoft: '#DCEBE4',
    claySoft: '#F6E1D6',
    dangerSoft: '#FFF6F1',
    creamSoft: '#EEE4D2',
  },
  dark: {
    cream: '#141210',
    paper: '#1F1C19',
    ink: '#F3EEE6',
    forest: '#6FA894',
    clay: '#E08A52',
    muted: '#A59C90',
    line: '#3C362F',
    danger: '#E07A6C',
    forestSoft: '#243832',
    claySoft: '#3A2A22',
    dangerSoft: '#3A2420',
    creamSoft: '#2A2622',
  },
};
