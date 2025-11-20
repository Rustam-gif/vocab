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
  accent: '#F8B070',
};

const light: Theme = {
  // Light mode aligned with new design
  background: '#F8F8F8', // main screen color
  surface: '#FFFFFF',    // card color
  text: '#111827',
  subtext: '#4B5563',
  border: '#FFFFFF',
  accent: '#F8B070',
};

export const getTheme = (name: ThemeName): Theme => (name === 'light' ? light : dark);
