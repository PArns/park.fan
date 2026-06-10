import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { GlassCard } from '@/components/common/glass-card';
import { Button } from '@/components/ui/button';

// Locale-scoped 404: renders inside the [locale] layout, so visitors keep the
// full site chrome (header, search, footer) and crawlers get internal links
// instead of a dead end. The response status is still 404 — the root
// app/not-found.tsx only covers paths outside any locale segment.
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <div className="container mx-auto flex justify-center px-4 py-24">
      <GlassCard variant="medium" className="max-w-lg p-10 text-center">
        <p className="text-primary text-7xl font-bold tracking-tight">404</p>
        <h1 className="mt-4 text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-3">{t('description')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">{t('goHome')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/parks">{t('browseParks')}</Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
