export type ThemeName = 'light' | 'dark';

export type Theme = {
  background: string;
  surface: string;
  text: string;
  subtext: string;
  border: string;
  accent: string;
};

const dark: Theme = {
  background: '#1E1E1E',
  surface: '#2C2C2C',
  text: '#FFFFFF',
  subtext: '#9CA3AF',
  border: '#333333',
  accent: '#F2935C',
};

const light: Theme = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#111827',
  subtext: '#4B5563',
  border: '#E5E7EB',
  accent: '#F2935C',
};

export const getTheme = (name: ThemeName): Theme => (name === 'light' ? light : dark);
