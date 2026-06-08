import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '../../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dev — Blog editor isolated test',
  robots: { index: false, follow: false },
};

/**
 * No-auth dev layout for iterating on the editor UI in isolation. Keeps the
 * same dark theme + Geist font as the admin shell so styling tests transfer
 * faithfully.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} bg-background text-foreground min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
