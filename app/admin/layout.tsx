import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '../globals.css';
import 'react-day-picker/style.css';
import { AdminShell } from './_components/admin-shell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Admin — park.fan',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} bg-background text-foreground min-h-screen font-sans antialiased`}
      >
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
