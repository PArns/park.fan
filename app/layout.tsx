import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'park.fan - Theme Park Wait Times & Predictions',
    template: '%s | park.fan',
  },
  description:
    'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts.',
  keywords: [
    'theme park',
    'wait times',
    'queue times',
    'crowd predictions',
    'crowd calendar',
    'best time to visit',
    'amusement park',
    'roller coaster',
    'ride availability',
    'opening hours',
    'freizeitpark',
    'wartezeiten',
    'andrang',
    'prognose',
    'disney',
    'universal studios',
    'europa park',
    'phantasialand',
    'six flags',
    'cedar fair',
    'seaworld',
    'efteling',
  ],
  authors: [{ name: 'Patrick Arns', url: 'https://arns.dev' }],
  creator: 'park.fan',
  metadataBase: new URL('https://park.fan'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      de: '/de',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'de_DE',
    url: 'https://park.fan',
    siteName: 'park.fan',
    title: 'park.fan - Theme Park Wait Times & Predictions',
    description:
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts.',
    images: [
      {
        url: 'https://park.fan/og-image.png', // Ensure this image exists or use a dynamic one
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
    images: ['https://park.fan/og-image.png'],
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

import { OrganizationStructuredData } from '@/components/seo/structured-data';

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <OrganizationStructuredData />
        {children}
      </body>
    </html>
  );
}
