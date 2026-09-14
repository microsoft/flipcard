/**
 * Design tokens that mirror the CSS custom properties shipped in
 * `styles/*.css`. Use these for CSS-in-JS, gallery pages, or design-tool
 * exports.
 */

export const lightTokens = {
  bg: '#fafbfc',
  surface: '#ffffff',
  text: '#111827',
  textDim: '#6b7280',
  border: '#e5e7eb',
  accent: '#2563eb',
  radius: '12px',
  shadow: '0 1px 2px rgb(0 0 0 / 0.06), 0 4px 12px rgb(0 0 0 / 0.04)',
  backBg: '#f3f4f6',
  backText: '#111827',
  backBorder: '#d1d5db',
} as const;

export const darkTokens = {
  bg: '#0b0d10',
  surface: '#15181d',
  text: '#e5e7eb',
  textDim: '#9ca3af',
  border: '#2a2f37',
  accent: '#60a5fa',
  radius: '12px',
  shadow: '0 1px 2px rgb(0 0 0 / 0.4), 0 4px 12px rgb(0 0 0 / 0.3)',
  backBg: '#0f1115',
  backText: '#e5e7eb',
  backBorder: '#2a2f37',
} as const;

export const midnightSapphireTokens = {
  bg: '#060a18',
  surface: '#0c1430',
  text: '#e6ebff',
  textDim: '#c8a96a',
  border: '#1b2552',
  accent: '#4f8cff',
  radius: '14px',
  shadow:
    '0 1px 2px rgb(0 0 0 / 0.55), 0 8px 28px rgb(8 18 64 / 0.55), 0 0 0 1px rgb(79 140 255 / 0.08) inset',
  backBg: '#091126',
  backText: '#f4e9c8',
  backBorder: '#2a3a78',
} as const;

export type FlipCardTokens = typeof lightTokens;
