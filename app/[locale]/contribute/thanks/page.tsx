import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Home, PartyPopper, Send } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SITE_URL } from '@/i18n/config';
import { routing } from '@/i18n/routing';

interface ThanksPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ count?: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ThanksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contribute.success' });
  return {
    title: t('title'),
    // A confirmation page should never be indexed.
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/${locale}/contribute/thanks` },
  };
}

export default async function ContributeThanksPage({ params, searchParams }: ThanksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contribute.success');

  const parsed = Number((await searchParams).count);
  const count = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <PartyPopper className="size-10" />
      </div>
      <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
      <p className="text-muted-foreground mt-4 max-w-md text-base">{t('message', { count })}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/contribute"
          className="text-primary-foreground bg-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Send className="size-4" />
          {t('again')}
        </Link>
        <Link
          href="/"
          className="border-border hover:bg-accent inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors"
        >
          <Home className="size-4" />
          {t('home')}
        </Link>
      </div>
    </div>
  );
}
