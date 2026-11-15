// Colour palettes for light and dark mode (mirrors the web app's accent blue).
const LIGHT = {
  dark: false,
  bg: '#f4f6fa',
  surface: '#ffffff',
  fg: '#14213d',
  muted: '#5b6b85',
  line: '#dfe5ee',
  accent: '#0a64d8',
  accentFg: '#ffffff',
  header: '#0a64d8',
  headerFg: '#ffffff',
  danger: '#c0392b',
  ok: '#1f7a4a',
  warn: '#c25a14',
};

const DARK = {
  dark: true,
  bg: '#0f1419',
  surface: '#18202a',
  fg: '#e7ecf2',
  muted: '#7d8895',
  line: '#2a3440',
  accent: '#4d9bff',
  accentFg: '#0f1419',
  header: '#16202c',
  headerFg: '#e7ecf2',
  danger: '#ff6b5b',
  ok: '#2dd4a0',
  warn: '#ffb020',
};

// theme: 'light' | 'dark' | 'system'
export function palette(theme, systemScheme = 'light') {
  const mode = theme === 'system' ? systemScheme : theme;
  return mode === 'dark' ? DARK : LIGHT;
}
