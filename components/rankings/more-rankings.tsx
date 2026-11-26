import { getTranslations } from 'next-intl/server';
import { Globe2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { rankingHubPath, rankingPath } from '@/lib/rankings/segments';
import { translateCountry } from '@/lib/i18n/helpers';
import type { RankedCountry } from '@/lib/api/rankings';

const CHIP =
  'bg-card/60 hover:border-primary/40 inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors';

/**
 * The ranking page's way on: the hub, the other countries ranked for the same year and this
 * country's other years. Each list renders only with something in it, and every link is a page
 * that exists, since the lists come from the requests the pages themselves answer with.
 */
export async function MoreRankings({
  locale,
  continent,
  country,
  year,
  countries,
  years,
}: {
  locale: string;
  continent: string;
  country: string;
  year: number;
  /** Every country ranked for `year`; this one is left out here. */
  countries: RankedCountry[];
  /** This country's other ranked years. */
  years: number[];
}) {
  const t = await getTranslations('rankings');
  const tGeo = await getTranslations('geo');
  const others = countries.filter((c) => !(c.continent === continent && c.country === country));
  const countryName = translateCountry(tGeo, country, locale);
  return (
    <section className="mt-10">
      <ChapterHeading icon={Globe2} title={t('moreTitle')} className="mb-3" />
      <div className="space-y-4">
        {others.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-2 text-sm font-medium">
              {t('moreCountries', { year: String(year) })}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {others.map((c) => (
                <li key={`${c.continent}/${c.country}`}>
                  <Link
                    href={rankingPath(locale, c.continent, c.country, year)}
                    prefetch={false}
                    className={CHIP}
                  >
                    {translateCountry(tGeo, c.country, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {years.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-2 text-sm font-medium">
              {t('moreYears', { country: countryName })}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {years.map((y) => (
                <li key={y}>
                  <Link
                    href={rankingPath(locale, continent, country, y)}
                    prefetch={false}
                    className={CHIP}
                  >
                    {y}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p>
          <Link
            href={rankingHubPath(locale)}
            prefetch={false}
            className="text-primary text-sm font-medium hover:underline"
          >
            {t('hubLink')}
          </Link>
        </p>
      </div>
    </section>
  );
}
