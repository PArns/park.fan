import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isValidLocale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';
import { LoginPanel } from '@/components/account/login-panel';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'account' });
  // Not linked anywhere yet, and a sign-in is nothing a search engine should list.
  return { title: t('login.metaTitle'), robots: { index: false, follow: false } };
}

/**
 * The sign-in for visitor accounts. Both forms are behind Turnstile: the widget in the browser and
 * the check in `/api/admin/session` and `/api/account/register` before an address or password
 * reaches the API. Static; not linked from the site, not in the sitemap.
 */
export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'account' });

  return (
    <RouteMessages route="/login">
      <div className="container mx-auto px-4 pt-8 pb-16 sm:pt-12 sm:pb-24">
        <div className="mx-auto mb-10 max-w-md text-center">
          <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">
            {t('login.title')}
          </h1>
          <p className="text-muted-foreground leading-relaxed">{t('login.lead')}</p>
        </div>
        <LoginPanel />
      </div>
    </RouteMessages>
  );
}
