import { getTranslations } from 'next-intl/server';
import { ArrowRight, Database, Hourglass, Thermometer } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { RideDayCurveCard } from '@/components/parks/ride-day-curve-card';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { getLeadParks } from './lead-park';

/**
 * Chapter: when a ride is actually quiet.
 *
 * The exhibit is the day curve for the busiest ride in the locale's lead park:
 * the median of every measured day, the spread that median sits in, and the two
 * quiet windows marked on the plot. The chapter's claim is positional ("a
 * coaster has two good windows"), so the answer has to be a shape rather than a
 * number, and the windows are read off the same curve the reader is looking at.
 *
 * It reads `/stats/hourly`, a ~2 KB projection rather than the 425 KB park
 * payload, which is what lets a marketing surface mount it at all. Today's own
 * measured line is deliberately left out here: it lives on the attraction
 * payload, and 53 KB for one line on a homepage is not a trade worth making —
 * {@link RideDayCurveCard} takes it as a prop for the ride page, which already
 * holds it.
 */
export async function ChapterBestTime({ locale }: { locale: string }) {
  const [t, parks] = await Promise.all([
    getTranslations('homeStory.bestTime'),
    getLeadParks(locale),
  ]);

  return (
    <section className="px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={Hourglass}
            kicker={t('kicker')}
            title={<GlossaryInject noUnderline>{t('title')}</GlossaryInject>}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="beste-besuchszeit"
          />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          {parks.length > 0 && (
            <Reveal>
              {/* The whole featured list, in order: a park in its winter break
                  or having a maintenance day hands over to the next one rather
                  than leaving the chapter with an empty column. */}
              <RideDayCurveCard
                candidates={parks.map((p) => ({
                  continent: p.continent,
                  country: p.country,
                  city: p.city,
                  parkSlug: p.parkSlug,
                }))}
              />
            </Reveal>
          )}

          <Reveal delay={80}>
            <div className="space-y-4">
              {/* The two windows are drawn ON the chart; naming them again here
                  would be the same claim twice, so this card carries what the
                  chart cannot: where the curve comes from. */}
              <div className="border-border bg-card/55 rounded-2xl border p-5">
                <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
                  <Database className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('historyTitle')}
                </div>
                <p className="mt-3 text-sm leading-relaxed">
                  <GlossaryInject>{t('historyText')}</GlossaryInject>
                </p>
              </div>

              <div className="border-crowd-high/35 bg-crowd-high/8 rounded-2xl border p-5">
                <div className="text-crowd-high flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
                  <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('heatTitle')}
                </div>
                <p className="mt-2 text-sm leading-relaxed">
                  <GlossaryInject>{t('heatText')}</GlossaryInject>
                </p>
              </div>

              <Link
                href={`/${BEST_TIME_SEGMENTS[locale as Locale]}` as '/'}
                prefetch={false}
                className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                {t('hubLink')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
