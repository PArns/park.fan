import { getTranslations } from 'next-intl/server';
import { ArrowRight, Gauge, Sunrise, Timer } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { ChapterSplit } from './chapter-split';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import type { Locale } from '@/i18n/config';
import { getLeadPark } from './lead-park';

/**
 * Chapter: live wait times.
 *
 * The exhibit is the **real ranking** for the locale's lead park — the same
 * `ParkStatsSection` a park page renders, in the `flat` material a page with no
 * park photograph needs, and the same one the guide page mounts for the same
 * reason: a chapter whose whole claim is "this is running right now" cannot make
 * it with frozen numbers.
 *
 * It stays inside the API budget because `ParkStatsSection` owns its own
 * `useLoadLast` gate — it does not fetch until the page has gone idle — and
 * because only the attractions card is asked for. No sentence around it quotes a
 * figure the table renders, so the copy stays true whatever the park does today.
 */
export async function ChapterLiveWaits({ locale }: { locale: string }) {
  const [t, park] = await Promise.all([getTranslations('homeStory.live'), getLeadPark(locale)]);

  return (
    // `overflow-x-clip`, not `overflow-hidden`: the exhibit runs past the
    // container edge and an unclipped overhang gives the document a horizontal
    // scrollbar, while `hidden` would make this a scroll container.
    <section className="border-border bg-muted/30 overflow-x-clip border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={Gauge}
            kicker={t('kicker')}
            title={<GlossaryInject noUnderline>{t('title')}</GlossaryInject>}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="live-wartezeiten"
          />
        </Reveal>

        <ChapterSplit
          exhibitSide="end"
          exhibit={
            park && (
              <ParkStatsSection
                continent={park.continent}
                country={park.country}
                city={park.city}
                parkSlug={park.parkSlug}
                locale={locale}
                show={['attractions']}
                hideHeading
                flat
              />
            )
          }
        >
          <div className="space-y-5">
            <p className="text-muted-foreground leading-relaxed">
              <GlossaryInject>{t('body')}</GlossaryInject>
            </p>

            <div className="border-crowd-very-low/35 bg-crowd-very-low/8 rounded-2xl border p-5">
              <div className="text-crowd-very-low flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
                <Sunrise className="h-3.5 w-3.5" aria-hidden="true" />
                <GlossaryInject noUnderline>{t('ropeDropTitle')}</GlossaryInject>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{t('ropeDropText')}</p>
            </div>

            <div className="border-border bg-card/55 rounded-2xl border p-5">
              <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                {t('typicalTitle')}
              </div>
              <h3 className="mt-2.5 text-lg font-semibold">{t('ridesTitle')}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                <GlossaryInject>{t('ridesText')}</GlossaryInject>
              </p>
              {park && (
                <Link
                  href={park.href as '/'}
                  prefetch={false}
                  className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                >
                  {t('ridesLink')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>

            {/* The homepage states what a wait time means; the guide walks a
                reader through one on real cards. Deep link rather than a repeat
                of the lesson. */}
            <Link
              href={`/${HOWTO_SEGMENTS[locale as Locale]}` as '/'}
              prefetch={false}
              className="text-primary inline-flex items-center gap-1.5 font-semibold hover:underline"
            >
              {t('howtoLink')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </ChapterSplit>
      </div>
    </section>
  );
}
