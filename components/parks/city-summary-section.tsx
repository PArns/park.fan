import { getTranslations } from 'next-intl/server';

interface CitySummarySectionProps {
  cityName: string;
  parkNames: string[];
  locale: string;
}

export async function CitySummarySection({ cityName, parkNames, locale }: CitySummarySectionProps) {
  const t = await getTranslations('explore.citySummary');
  // `Intl.ListFormat` joins with the locale's own conjunction („und", „en", „y").
  const parks = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
    parkNames
  );

  return (
    <section aria-label={cityName} className="mb-8">
      {/* Intro text — indexable SEO content, same role as CountrySummarySection's */}
      <p className="text-muted-foreground text-sm">
        {t('intro', { city: cityName, parkCount: parkNames.length, parks })}
      </p>
    </section>
  );
}
