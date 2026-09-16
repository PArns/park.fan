import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '../globals.css';
import 'react-day-picker/style.css';
import { AdminProviders } from './_app/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Admin — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The admin's own document.
 *
 * Deliberately outside `app/[locale]`: it is not localized, and putting it
 * there would drag in the routed-messages machinery — a `<RouteMessages>`
 * wrapper per route, an entry in the generated namespace map, and
 * `pnpm check:client-messages` failing whenever that map goes stale — for a
 * surface that three people use in one language.
 *
 * Dark is hardcoded rather than themed. The admin is a tool, it is used in the
 * same conditions every time, and a theme toggle here would be one more thing
 * to keep working for no benefit anybody has asked for.
 *
 * `color-scheme: dark` says that to the browser, and the class alone does not:
 * `.dark` repaints our own surfaces and leaves every control the UA draws for
 * itself in the light style. What somebody hit is the calendar glyph of
 * `<input type="date">` — dark ink on the `bg-background/60` field. Measured on
 * `/admin/retirement`: `color-scheme` computed `normal` before, `dark` after,
 * the field's box unchanged at 332×44 (390 px) and 477×36 (1280 px). The other
 * five date inputs (`season-editor` ×2, `curated-fields`, `attraction-status`)
 * are the same `TextInput` in the same document, and the same declaration
 * reaches the rest of the UA-drawn set in here: six native `<select>` elements
 * and the six `NumberInput` call sites with their spinner.
 *
 * On this element rather than on `.dark` in `globals.css`, because the public
 * site's dark mode also carries native checkboxes, range sliders and a
 * `<select>`, and changing how those are drawn is a different ticket. The
 * admin's document is unconditionally dark, so here the declaration is simply
 * true.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark [color-scheme:dark]" data-admin="" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} bg-background text-foreground relative min-h-screen font-sans antialiased`}
      >
        {/* Something for the panels to sit on.
            Every surface in here is a near-black card on a near-black page, and
            at that distance the cards stop reading as cards — the dashboard was
            a flat sheet with hairlines drawn on it. One wide, very faint wash
            of the brand colour from the top gives the column a light source, so
            a `bg-card/60` panel has something to be lighter *than*. Fixed, so
            it does not travel with a scrolling table. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(90rem_40rem_at_50%_-12rem,var(--color-primary)_0%,transparent_60%)] opacity-[0.11]"
        />
        <div className="relative">
          <AdminProviders>{children}</AdminProviders>
        </div>
      </body>
    </html>
  );
}
