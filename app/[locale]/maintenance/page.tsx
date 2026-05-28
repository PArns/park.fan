import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { MaintenancePage } from '@/components/maintenance-page';

interface MaintenancePageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Maintenance page must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Maintenance({ params }: MaintenancePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MaintenancePage />;
}
