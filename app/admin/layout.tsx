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
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} bg-background text-foreground min-h-screen font-sans antialiased`}
      >
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
