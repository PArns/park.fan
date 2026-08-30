import { getTranslations } from 'next-intl/server';
import { CalendarRange, Drama, FerrisWheel, Utensils } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';

/**
 * Chapter: a park day is not only roller coasters.
 *
 * The four counters are the **real** platform counts (`/v1/analytics/realtime`),
 * not typed-in figures — the same fetch `GlobalStatsSection` makes further down
 * the page, deduped by Next's fetch cache, so the chapter costs no request. When
 * that fetch fails the counter row drops out and the chapter still reads: the
 * prose above it names no number, which is also why it stays true on the day a
 * park adds thirty restaurants.
 */
export async function ChapterShowsRestaurants() {
  const [t, stats] = await Promise.all([
    getTranslations('homeStory.shows'),
    catchNonFatal(getGlobalStats()),
  ]);

  const counters = stats
    ? [
        { icon: FerrisWheel, value: stats.counts.attractions, label: t('statAttractions') },
        { icon: Drama, value: stats.counts.shows, label: t('statShows') },
        { icon: Utensils, value: stats.counts.restaurants, label: t('statRestaurants') },
        { icon: CalendarRange, value: 365, label: t('statCalendar') },
      ]
    : [];

  return (
    <section className="border-border bg-muted/30 border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={FerrisWheel}
            kicker={t('kicker')}
            title={t('title')}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="shows-restaurants"
          />
        </Reveal>

        {counters.length > 0 && (
          <Reveal>
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {counters.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="border-border bg-card/60 flex items-center gap-3 rounded-2xl border p-4"
                >
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xl font-bold tabular-nums">{value.toLocaleString()}</div>
                    <div className="text-muted-foreground truncate text-xs">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal delay={80}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="border-border bg-card/55 rounded-2xl border p-5 sm:p-6">
              <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
                <Drama className="h-3.5 w-3.5" aria-hidden="true" />
                {t('showsTitle')}
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{t('showsHint')}</p>
            </div>
            <div className="border-border bg-card/55 rounded-2xl border p-5 sm:p-6">
              <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
                <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
                {t('restaurantsTitle')}
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {t('restaurantsHint')}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="text-muted-foreground mt-6 max-w-3xl leading-relaxed">
            <GlossaryInject>{t('body')}</GlossaryInject>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
