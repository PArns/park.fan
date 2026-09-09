import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Bell } from 'lucide-react';
import { SITE_URL } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';
import { PageContainer } from '@/components/common/page-container';
import { AlertsOverview } from '@/components/push/alerts-overview';

interface AlertsPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AlertsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'pushAlerts.overview' });
  return {
    title: t('title'),
    // This browser's own alerts — nothing here is the same page twice.
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/${locale}/alerts` },
  };
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);
  const t = await getTranslations('pushAlerts.overview');

  return (
    <RouteMessages route="/alerts">
      <PageContainer className="max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
            <Bell className="text-primary size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>
        <AlertsOverview />
      </PageContainer>
    </RouteMessages>
  );
}
