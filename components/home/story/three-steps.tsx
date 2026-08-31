import { getTranslations } from 'next-intl/server';
import { CalendarRange, Check, Compass, Lightbulb, Sunrise } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { HeroInlineSearch } from '@/components/search/hero-inline-search';
import { CROWD_DOT_CLASS, CROWD_LEVEL_ORDER } from '@/lib/utils/crowd-level-styles';
import { cn } from '@/lib/utils';

/**
 * A month of crowd colours, as a shape rather than a claim.
 *
 * Deliberately NOT `ParkCalendarDay` with fixture days: this tile is 12 px
 * square inside a teaser card, so the real component's date, badge and border
 * would all have to be switched off to fit — at which point it is no longer the
 * real component, only its palette. The palette is the part that has to match,
 * and it does: the indices below read out of {@link CROWD_LEVEL_ORDER}, so a
 * retuned `--crowd-*` moves this illustration with every calendar on the site.
 *
 * It names no park and no date, which is what keeps it honest — the chapter
 * further down shows the calendar itself.
 */
const MONTH_SHAPE = [
  1, 0, 0, 1, 2, 5, 4, 0, 1, 0, 1, 3, 4, 3, 1, 0, 0, 1, 2, 5, 5, 2, 1, 0, 1, 2, 4, 4,
] as const;

/** The best day in the shape above, ringed the way the calendar rings its own pick. */
const MONTH_BEST_INDEX = 8;

/** A ride's day: quiet at opening, a midday peak, quiet again before closing. */
const DAY_SHAPE = [26, 34, 52, 70, 88, 100, 82, 58, 36, 22] as const;

function StepCard({
  step,
  title,
  text,
  tip,
  children,
}: {
  step: number;
  title: string;
  text: string;
  /** The thing a first visitor gets wrong at this step. */
  tip: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card/60 flex h-full flex-col rounded-2xl border shadow-sm backdrop-blur-md">
      <div className="p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-[10px] text-sm font-bold">
            {step}
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
        <div className="border-border/60 mt-4 mb-5 flex gap-2.5 rounded-xl border border-dashed p-3">
          <Lightbulb className="text-primary/70 mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground text-[12px] leading-relaxed">{tip}</p>
        </div>
      </div>
      <div className="border-border bg-muted/25 mt-auto rounded-b-2xl border-t p-4">{children}</div>
    </div>
  );
}

export async function ThreeSteps() {
  const t = await getTranslations('homeStory.steps');

  return (
    // `relative z-30` because step 1 opens a floating dropdown that reaches past
    // this section's lower edge. Every later chapter is an unpositioned sibling
    // and therefore paints ON TOP of it — the results ended up behind the next
    // chapter's heading. Below the header's z-50, which must stay above
    // everything.
    <section className="relative z-30 px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={Compass}
            kicker={t('kicker')}
            title={<GlossaryInject noUnderline>{t('title')}</GlossaryInject>}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="so-funktionierts"
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {/* 1 — choose a park. Literally the hero's field, not a lookalike: a
              search box that cannot search is the one thing a first visitor
              tries first, and a second implementation is a second thing that can
              stop working. `primary={false}` is what keeps the page-wide halves
              of it (type-to-open, the hero click metric) unique. */}
          {/* NOT wrapped in `Reveal`, and that is the whole point: `Reveal` keeps a
              `translate-y-0` on its wrapper for good, a transform makes that
              wrapper a BACKDROP ROOT, and `backdrop-filter` then samples only
              inside it. The search dropdown's glass had nothing to blur — the
              page behind read straight through it, at every fill value, which is
              why raising the opacity looked like the fix and was not. Same rule
              the header menu follows: never animate the glass or an ancestor of
              it. The entrance for this one card is the price.

              `relative z-10` stays for the other reason: the two cards after it
              are their own stacking contexts, so the `z-40` inside the dropdown
              cannot reach over them on its own. */}
          <div className="relative z-10">
            <StepCard
              step={1}
              title={t('one.title')}
              text={t('one.text')}
              tip={<GlossaryInject>{t('one.tip')}</GlossaryInject>}
            >
              <HeroInlineSearch
                placeholder={t('one.placeholder')}
                label={t('one.label')}
                primary={false}
              />
            </StepCard>
          </div>

          {/* 2 — check the day. */}
          <Reveal delay={80}>
            <StepCard
              step={2}
              title={t('two.title')}
              text={t('two.text')}
              tip={<GlossaryInject>{t('two.tip')}</GlossaryInject>}
            >
              <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
                {MONTH_SHAPE.map((level, i) => (
                  <span
                    key={i}
                    className={cn(
                      'box-border aspect-square rounded-md opacity-60',
                      CROWD_DOT_CLASS[CROWD_LEVEL_ORDER[level]],
                      i === MONTH_BEST_INDEX && 'ring-crowd-low opacity-100 ring-2'
                    )}
                  />
                ))}
              </div>
              <p className="text-muted-foreground mt-2.5 text-[11px] leading-relaxed">
                {t('two.caption')}
              </p>
              <p className="text-crowd-low mt-1.5 flex items-center gap-1.5 text-[11px]">
                <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                {t('two.legendLow')}
                <CalendarRange className="ml-auto h-3 w-3 shrink-0" aria-hidden="true" />
              </p>
            </StepCard>
          </Reveal>

          {/* 3 — plan the route. */}
          <Reveal delay={160}>
            <StepCard
              step={3}
              title={t('three.title')}
              text={t('three.text')}
              tip={<GlossaryInject>{t('three.tip')}</GlossaryInject>}
            >
              <div className="flex h-[74px] items-end gap-[3px]" aria-hidden="true">
                {DAY_SHAPE.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={cn(
                      'flex-1 rounded-t-[3px]',
                      CROWD_DOT_CLASS[CROWD_LEVEL_ORDER[Math.min(5, Math.floor((h - 1) / 17))]]
                    )}
                  />
                ))}
              </div>
              <p className="text-muted-foreground mt-2.5 text-[11px] leading-relaxed">
                {t('three.caption')}
              </p>
              <p className="text-crowd-very-low mt-1.5 flex items-center gap-1.5 text-[11px]">
                <Sunrise className="h-3 w-3 shrink-0" aria-hidden="true" />
                {t('three.best')}
              </p>
            </StepCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
