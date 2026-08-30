import { getTranslations } from 'next-intl/server';
import { RollerCoaster } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { hasCoasterElement } from '@/lib/three/coaster/elements';
import type { Locale } from '@/i18n/config';
import { CoasterFigurePicker, type PickableFigure } from './coaster-figure-picker';

/** How many figures the picker offers. Six fills the rail beside the player without scrolling. */
const FIGURE_COUNT = 6;

/**
 * Chapter: the dictionary, and the track figures you can fly.
 *
 * The six figures are **derived**, not listed: any glossary term carrying a
 * `player` whose element the registry actually knows is eligible, in dictionary
 * order. A hand-written list would be a second opinion about which terms have a
 * player, and it would go stale silently the first time one was renamed — the
 * failure the ride↔glossary docs warn about, since this app is the only place a
 * term id is defined.
 *
 * Names, definitions and hrefs are the glossary's own, so the chapter is
 * localized wherever the dictionary is.
 */
export async function ChapterDictionary({ locale }: { locale: Locale }) {
  const [t, tGlossary, terms] = await Promise.all([
    getTranslations('homeStory.dictionary'),
    getTranslations('glossary'),
    getGlossaryTerms(locale),
  ]);

  const segment = GLOSSARY_SEGMENTS[locale];
  const figures: PickableFigure[] = terms
    .filter((term) => term.player && hasCoasterElement(term.player.element))
    .slice(0, FIGURE_COUNT)
    .map((term) => ({
      id: term.id,
      element: term.player!.element,
      name: term.name,
      shortDefinition: term.shortDefinition,
      href: `/${segment}/${term.slug}`,
    }));

  if (figures.length === 0) return null;

  const labels = {
    play: tGlossary('player.play'),
    pause: tGlossary('player.pause'),
    replay: tGlossary('player.replay'),
    view: tGlossary('player.view'),
    viewFront: tGlossary('player.viewFront'),
    viewFollow: tGlossary('player.viewFollow'),
    viewOnboard: tGlossary('player.viewOnboard'),
    loading: tGlossary('player.loading'),
    keys: tGlossary.raw('player.keys') as Record<string, string>,
  };

  return (
    <section className="border-border bg-muted/30 border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={RollerCoaster}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            id="woerterbuch"
          />
        </Reveal>

        <Reveal>
          <CoasterFigurePicker
            figures={figures}
            labels={labels}
            pickerTitle={t('pickerTitle')}
            ctaLabel={t('cta')}
            ctaHref={`/${segment}`}
          />
        </Reveal>
      </div>
    </section>
  );
}
