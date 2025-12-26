import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
    'amusement park',
    'roller coaster',
  ],
  authors: [{ name: 'Patrick Arns', url: 'https://arns.dev' }],
  creator: 'park.fan',
  metadataBase: new URL('https://park.fan'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://park.fan',
    siteName: 'park.fan',
    title: 'park.fan - Theme Park Wait Times & Predictions',
    description:
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'park.fan - Theme Park Wait Times & Predictions',
    description:
      'Real-time theme park wait times, crowd predictions, and schedules. Plan your perfect visit with ML-powered forecasts.',
  },
  robots: {
    index: true,
    follow: true,
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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
