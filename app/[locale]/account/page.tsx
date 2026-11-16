import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isValidLocale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';
import { AccountPanel } from '@/components/account/account-panel';

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AccountPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'account' });
  // One visitor's own account, and not linked anywhere yet: nothing a search engine should list.
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

/**
 * A visitor's account: sign in or register, then what follows the visitor across devices. Static;
 * everything account-bound is fetched in the browser through the session proxy. Not linked from
 * the site and not in the sitemap until the feature is announced.
 */
export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'account' });

  return (
    <RouteMessages route="/account">
      <div className="container mx-auto px-4 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">{t('title')}</h1>
          <p className="text-muted-foreground leading-relaxed">{t('lead')}</p>
        </div>
        <AccountPanel />
      </div>
    </RouteMessages>
  );
}
