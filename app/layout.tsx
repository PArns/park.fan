import type { Metadata, Viewport } from 'next';
import './globals.css';

// Metadata is now handled in [locale]/layout.tsx for i18n support

// The whole icon set is generated from public/logo-small-dark.svg by
// `pnpm generate:icons` — never hand-exported. See scripts/generate-icons.mjs.
//
// `app/favicon.ico` is emitted by the file convention and is the file GOOGLE reads: it does not
// support SVG favicons, so the .ico is what decides what a search result shows. Only what the
// convention cannot express is declared below.
//
// This object lives HERE and nowhere else. Metadata fields do not merge across segments — the
// nearest segment that declares `icons` replaces the whole object — and `app/[locale]/layout.tsx`
// used to declare `icon: '/favicon.ico'`, which dropped the SVG favicon from every page on the
// site without so much as a warning.
export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // One value, not a pair keyed off the OS preference: the site's theme no longer follows the
  // OS at all (dark by default, light on request), so a `prefers-color-scheme` split would tint
  // the browser chrome by something that has nothing to do with what the page looks like.
  // This is `--background` in the dark theme, oklch(0.145 0 0).
  themeColor: '#0a0a0a',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

// Root layout only exports metadata and fonts
// HTML/Body are rendered in [locale]/layout.tsx for proper lang attribute
export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}
