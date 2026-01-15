import type { Metadata, Viewport } from 'next';
import './globals.css';
import { generateAlternateLanguages, locales } from '@/i18n/config';

const SITE_NAME = 'park.fan';
const SITE_URL = 'https://park.fan';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | park.fan',
    default: 'park.fan - Theme Park Wait Times & Predictions',
  },
  description:
    'Real-time wait times and AI-powered crowd predictions for theme parks worldwide. Plan your perfect visit with live data and navigation.',
  keywords:
    'theme park, wait times, queue times, crowd predictions, Disney, Universal, Europa-Park',
  alternates: {
    canonical: SITE_URL,
    languages: {
      ...generateAlternateLanguages((locale) => `/${locale}`),
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: 'en_US',
    // Generate alternate locale tags for all supported languages
    alternateLocale: locales.filter((l) => l !== 'en').map((l) => `${l}_${l.toUpperCase()}`),
    title: 'park.fan - Theme Park Wait Times & Predictions',
    description:
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts.',
    images: [
      {
        url: `${SITE_URL}/api/og/en/og.png`,
        width: 1200,
        height: 630,
        alt: 'park.fan - Theme Park Wait Times',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'park.fan - Theme Park Wait Times & Predictions',
    description:
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts.',
    images: [`${SITE_URL}/api/og/en/og.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

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
