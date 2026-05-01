/**
 * Design tokens extracted from the Apeks design archive.
 * These can be used to apply the branded dark/light theme.
 * 
 * Fonts: 'Newsreader' (serif, for headings/logo), 'Inter' (sans-serif, for body)
 */

export const DARK_THEME = {
  bg: '#070C18',
  surface1: '#0D1525',
  surface2: '#152035',
  surface3: '#1E2D4A',
  border: '#1E2D4A',
  hover: '#253558',
  text: '#F0EDE8',
  secondary: '#A8A5A0',
  muted: '#6A6860',
  gold: '#D9A441',
  goldHover: '#F4B860',
  goldDark: '#B8862A',
  goldBg: 'rgba(217,164,65,0.12)',
  cyan: '#4ECDD4',
  cyanHover: '#6EE8EE',
  cyanDark: '#2BA8AE',
  cyanBg: 'rgba(78,205,212,0.10)',
  purple: '#8B6DD4',
  purpleBg: 'rgba(139,109,212,0.12)',
  success: '#5BD68A',
  successBg: 'rgba(91,214,138,0.12)',
  error: '#FF7B6D',
  errorBg: 'rgba(255,123,109,0.12)',
  warning: '#FFB547',
  warningBg: 'rgba(255,181,71,0.1)',
  info: '#7AB6F5',
  infoBg: 'rgba(122,182,245,0.12)',
};

export const LIGHT_THEME = {
  bg: '#FAF8F4',
  surface1: '#F5F2ED',
  surface2: '#EAE5DC',
  surface3: '#D5CFC2',
  border: '#D5CFC2',
  hover: '#EAE5DC',
  text: '#26241F',
  secondary: '#5C5A52',
  muted: '#8E8B82',
  gold: '#C48A25',
  goldHover: '#D9A441',
  goldDark: '#A06E10',
  goldBg: '#FDF1DC',
  cyan: '#1A8F96',
  cyanHover: '#22B0B8',
  cyanDark: '#107078',
  cyanBg: '#E0F8F9',
  purple: '#6B4FB4',
  purpleBg: '#EEE9F8',
  success: '#2D8F4E',
  successBg: '#E8F5EC',
  error: '#C4392F',
  errorBg: '#FCEAE8',
  warning: '#B8770A',
  warningBg: '#FFF5E1',
  info: '#2563B0',
  infoBg: '#E6F0FB',
};

/**
 * Font configuration from the design archive.
 * Add these to your layout's <head> or import via next/font:
 * - Newsreader: serif font for logo and headings
 * - Inter: sans-serif font for body text and UI
 * 
 * Google Fonts URLs:
 * https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&display=swap
 * https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap
 */
export const FONTS = {
  heading: "'Newsreader', serif",
  body: "'Inter', sans-serif",
};

/**
 * Sidebar icon paths (SVG path data for 24x24 viewBox).
 * These match the design archive's icon set.
 */
export const ICONS = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  telescope: 'M3 18l4-8 4 4M11 14l3-6 3 3M14 11l4-8M19 3l2 1M12 22v-4M9 22h6',
  book: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  fileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  externalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  check: 'M20 6L9 17l-5-5',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  menu: 'M3 12h18M3 6h18M3 18h18',
};
