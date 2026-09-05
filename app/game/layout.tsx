import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import '../globals.css';
import '@/lib/game/core/game.css';
import { resolveGameLocale } from '@/lib/game/i18n';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'park.fan Coaster',
  description:
    'Build and run your own theme park in the browser — coasters, pools, slides, and thousands of guests.',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
  viewportFit: 'cover',
};

/**
 * The game's own document. Outside `app/[locale]` for the same reasons `/admin` is
 * (docs/game/INTEGRATION.md §3): one canvas, one language table resolved here from the cookie or
 * `Accept-Language`, hardcoded dark, no site chrome.
 */
export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveGameLocale(
    cookieStore.get('NEXT_LOCALE')?.value ?? headerStore.get('accept-language')?.split(',')[0]
  );
  return (
    <html lang={locale} className="dark" data-game="" suppressHydrationWarning>
      <body className={`${geistSans.variable} bg-background text-foreground font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
