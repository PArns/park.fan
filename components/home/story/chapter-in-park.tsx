import { getTranslations } from 'next-intl/server';
import { MapPinned, Navigation, Star } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GlossaryInject } from '@/components/glossary/glossary-inject';

/**
 * Chapter: the two things that matter once you are through the gate.
 *
 * The star is the site's real favourite mark — amber, filled, the same glyph
 * `FavoriteStar` renders on every park, ride, show and restaurant. It is drawn
 * here rather than mounted because a live `FavoriteStar` is a control: putting
 * one in an explanatory paragraph would offer a reader something to click that
 * favourites nothing.
 */
export async function ChapterInPark() {
  const t = await getTranslations('homeStory.inPark');

  return (
    <section className="px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={MapPinned}
            kicker={t('kicker')}
            title={t('title')}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="im-park"
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="border-border bg-card/55 h-full rounded-2xl border p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <Star className="size-5 fill-amber-400 text-amber-500" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{t('favTitle')}</h3>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{t('favHint')}</p>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                <GlossaryInject>{t('favText')}</GlossaryInject>
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="border-border bg-card/55 h-full rounded-2xl border p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                  <Navigation className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold">{t('mapTitle')}</h3>
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                <GlossaryInject>{t('mapText')}</GlossaryInject>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
