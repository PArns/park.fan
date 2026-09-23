import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Share2 } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';
import { PlannerSharedPlan } from '@/components/planner/planner-shared-plan';

/**
 * Where a shared-plan link lands (`lib/planner/trip-share.ts`).
 *
 * The page itself is the same for every link. The trip id is in the fragment,
 * which the server never sees, so everything that depends on it happens in
 * `PlannerSharedPlan` in the browser, and this route can be static.
 *
 * `noindex`, no canonical, no sitemap entry and no localized segment: the same
 * choices `/favorites` makes, for the same reason. Without the fragment the
 * page is an error message.
 */
interface SharedPlanPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: SharedPlanPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'planner.shared' });
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function SharedPlanPage({ params }: SharedPlanPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('planner.shared');

  return (
    <RouteMessages route="/trip-planner/shared">
      <div className="px-4 pt-8 pb-12">
        <div className="container mx-auto max-w-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Share2 className="text-primary size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
            </div>
          </div>
          <PlannerSharedPlan />
        </div>
      </div>
    </RouteMessages>
  );
}
