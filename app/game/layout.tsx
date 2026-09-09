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
  /**
   * Not indexed while the game is a draft, and the reason is what the game's own scoreboard says
   * about it rather than caution in general.
   *
   * `docs/game/STATUS.json` records, at the time of writing, that no guest can ride a coaster
   * (`track` claims the `coaster` kind, `guests` builds ride venues only from `ride`), that the
   * demo park's reserved coaster plot is 58 x 48 m against a smallest bundled layout of 212.6 m,
   * and that two of twenty-four modules have passed their gate. A search result promising "build
   * and run your own theme park" against that is a result nobody clicks twice, and this site's own
   * rules elsewhere are explicit that the strongest page must not carry a sentence it cannot keep.
   *
   * The header link stays: this is reachable and meant to be tried. What it must not do yet is
   * invite a stranger through a search engine. Flip both flags together — this line and
   * `app/sitemap.ts`, which does not list `/game` either — when the final gate in
   * `docs/game/FINAL_GATE.md` has actually been run.
   */
  robots: { index: false, follow: true },
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
