import type { Metadata, Viewport } from 'next';
import './globals.css';
import './globals.css';

const SITE_NAME = 'park.fan';
const SITE_URL = 'https://park.fan';

// Metadata is now handled in [locale]/layout.tsx for i18n support

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

// Root layout only exports metadata and fonts
// HTML/Body are rendered in [locale]/layout.tsx for proper lang attribute
export default function RootLayout({ children }: RootLayoutProps) {
  return children;
}
