import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '../globals.css';
import 'react-day-picker/style.css';
import { AdminProviders } from './_app/providers';
import { ScrollLockGutter } from '@/components/layout/scroll-lock-gutter';

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
 * The admin's own document, outside `app/[locale]` because it is not localized and needs none of
 * the routed-messages machinery. Hardcoded dark, with `color-scheme: dark` on this element so the
 * controls the browser draws itself (date pickers, selects, spinners) are dark too; the public
 * site's `.dark` is left alone.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark [color-scheme:dark]" data-admin="" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} bg-background text-foreground relative min-h-screen font-sans antialiased`}
      >
        {/* A faint, fixed wash of the brand colour from the top, so the near-black cards have
            something to be lighter than. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(90rem_40rem_at_50%_-12rem,var(--color-primary)_0%,transparent_60%)] opacity-[0.11]"
        />
        <div className="relative">
          <AdminProviders>{children}</AdminProviders>
        </div>
        <ScrollLockGutter />
      </body>
    </html>
  );
}
