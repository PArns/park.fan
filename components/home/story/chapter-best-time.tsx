import { getTranslations } from 'next-intl/server';
import { ArrowRight, Database, Hourglass, Thermometer } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { MobileMore } from '@/components/common/mobile-more';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { BestTimeGrid } from './best-time-grid';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { getCurveCandidates } from './lead-park';
import { STORY_SECTION } from './section-chrome';

/**
 * Chapter: when a ride is actually quiet. The exhibit is the day curve of the busiest ride in the
 * locale's lead park, with its spread and the two quiet windows marked, because the claim ("a
 * coaster has two good windows") is a shape, not a number. It reads `/stats/day`, a small
 * projection rather than the park payload, which is what lets this page mount it.
 */
export async function ChapterBestTime({ locale }: { locale: string }) {
  const [t, tCommon, parks] = await Promise.all([
    getTranslations('homeStory.bestTime'),
    getTranslations('common'),
    getCurveCandidates(locale),
  ]);

  return (
    <section className={STORY_SECTION}>
      <div className="container mx-auto">
        {/* `containsGlass`: `variant="tile"` is TILE_GLASS, i.e. `backdrop-blur-2xl`. */}
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Hourglass}
            kicker={t('kicker')}
            title={<GlossaryInject noUnderline>{t('title')}</GlossaryInject>}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="beste-besuchszeit"
          />
        </Reveal>

        <BestTimeGrid
          candidates={parks.map((p) => ({
            continent: p.continent,
            country: p.country,
            city: p.city,
            parkSlug: p.parkSlug,
            name: p.name,
            countryCode: p.countryCode,
          }))}
        >
          <div className="space-y-4">
            {/* On a phone the curve is the chapter; where it comes from opens on request. */}
            <MobileMore label={tCommon('showMore')} className="space-y-4">
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
            </MobileMore>

            <Link
              href={`/${BEST_TIME_SEGMENTS[locale as Locale]}` as '/'}
              prefetch={false}
              className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {t('hubLink')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </BestTimeGrid>
      </div>
    </section>
  );
}
