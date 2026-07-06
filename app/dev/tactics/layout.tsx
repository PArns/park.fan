import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import '../../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Queue Tactics — dev prototype',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // pinch-zoom fights the drag & drop board
  themeColor: '#101b33',
};

/**
 * No-auth dev layout for the Queue Tactics auto-battler prototype — an
 * in-queue time-killer mini game. Fullscreen, dark shell, no site chrome.
 */
export default function TacticsDevLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} overflow-hidden font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
