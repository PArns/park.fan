import type { Metadata, Viewport } from 'next';
import './globals.css';

// Metadata is now handled in [locale]/layout.tsx for i18n support

// app/favicon.ico and app/icon.svg are served automatically via the file
// convention; only the Apple touch icon (iOS ignores SVG) needs an explicit
// 180×180 PNG.
export const metadata: Metadata = {
  icons: {
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
