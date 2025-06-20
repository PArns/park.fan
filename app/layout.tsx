import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { Navbar } from '../components/layout/navbar';
import { Footer } from '../components/layout/footer';
import { ThemeProvider } from '../providers/theme-provider';

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
    default: 'Park.Fan Dashboard - Live Theme Park Statistics & Analytics',
    template: '%s | Park.Fan Dashboard',
  },
  description:
    'Real-time theme park statistics, wait times, and analytics from around the world. Live data from parks across all continents including Disney, Universal, Six Flags and more.',
  applicationName: 'Park.Fan Dashboard',
  authors: [{ name: 'Patrick Arns', url: 'https://arns.dev' }],
  creator: 'Patrick Arns',
  publisher: 'Patrick Arns',
  metadataBase: new URL('https://park.fan'),
  alternates: {
    canonical: '/',
  },
  keywords: [
    'theme parks',
    'amusement parks',
    'wait times',
    'park statistics',
    'ride analytics',
    'Disney parks',
    'Universal Studios',
    'Six Flags',
    'park dashboard',
    'live data',
    'park operations',
    'visitor analytics',
    'roller coasters',
    'theme park insights',
    'park capacity',
    'crowd levels',
  ],
  category: 'Entertainment',
  classification: 'Theme Park Analytics',
  other: {
    copyright: '© Patrick Arns - https://arns.dev',
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
  openGraph: {
    type: 'website',
    url: 'https://park.fan',
    title: 'Park.Fan Dashboard - Live Theme Park Statistics',
    description:
      'Real-time theme park statistics, wait times, and analytics from around the world. Track park operations, crowd levels, and ride data.',
    siteName: 'Park.Fan Dashboard',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Park.Fan Dashboard - Theme Park Analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@parkfan',
    creator: '@patrickarnsdotdev',
    title: 'Park.Fan Dashboard - Live Theme Park Statistics',
    description:
      'Real-time theme park statistics, wait times, and analytics from around the world.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'verification-token-here',
    yandex: 'verification-token-here',
    yahoo: 'verification-token-here',
  },
  appleWebApp: {
    capable: true,
    title: 'Park.Fan Dashboard',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
