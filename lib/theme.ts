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
  background: '#1A2744',
  surface: '#1B263B',
  text: '#FFFFFF',
  subtext: '#9CA3AF',
  border: '#0D1B2A',
  accent: '#F8B070',
};

const light: Theme = {
  // Light mode aligned with new design
  background: '#F8F8F8', // main screen color
  surface: '#FFFFFF',    // card color
  text: '#111827',
  subtext: '#2D4A66',
  border: '#FFFFFF',
  accent: '#F8B070',
};

export const getTheme = (name: ThemeName): Theme => (name === 'light' ? light : dark);
