import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { isValidLocale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';
import { Link } from '@/i18n/navigation';
import { DeveloperDashboard } from '@/components/developers/developer-dashboard';
import { DEVELOPERS_PATH } from '@/lib/developers/paths';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'developers.dashboard' });
  // One account's own keys: nothing a search engine should list.
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

/**
 * The developer dashboard: an account's keys, their use, pickup, rotation and revocation, and its
 * key requests. The page is static; everything account-bound is fetched in the browser through
 * the session proxy, so no answer of one account ever sits in a shared cache.
 */
export default async function DeveloperDashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'developers.dashboard' });

  return (
    <RouteMessages route="/developers/dashboard">
      <div className="container mx-auto px-4 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <Link
          href={DEVELOPERS_PATH}
          prefetch={false}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('backToPortal')}
        </Link>
        <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl leading-relaxed">{t('lead')}</p>
        <DeveloperDashboard />
      </div>
    </RouteMessages>
  );
}
