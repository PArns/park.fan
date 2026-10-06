import { getTranslations } from 'next-intl/server';
import { CalendarRange, Check, Compass, Lightbulb, Sunrise } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { MobileMore } from '@/components/common/mobile-more';
import { HeroInlineSearch } from '@/components/search/hero-inline-search';
import { CROWD_DOT_CLASS, CROWD_LEVEL_ORDER } from '@/lib/utils/crowd-level-styles';
import { cn } from '@/lib/utils';
import { STORY_SECTION } from './section-chrome';

/**
 * A month of crowd colours, as a shape rather than a claim. Not `ParkCalendarDay` with fixture
 * days: at 12 px square nothing but its palette would survive, and the indices read out of
 * {@link CROWD_LEVEL_ORDER}, so a retuned `--crowd-*` moves this too. It names no park and no
 * date.
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
    // No `backdrop-blur` on this card: it would be a backdrop root for step 1's search dropdown,
    // whose glass would then sample only the card. The card sits on a flat background anyway (see
    // `PANEL_FLAT` in glass-card.tsx).
    <div className="border-border bg-card/60 flex h-full flex-col rounded-2xl border shadow-sm">
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

/**
 * Homepage chapter that walks through a park day in three cards: pick a park (with a live park
 * search), check the day on a crowd-colour month, plan the route on a ride's day curve.
 */
export async function ThreeSteps() {
  const [t, tCommon] = await Promise.all([
    getTranslations('homeStory.steps'),
    getTranslations('common'),
  ]);

  return (
    // `relative z-30` because step 1 opens a floating dropdown that reaches past
    // this section's lower edge. Every later chapter is an unpositioned sibling
    // and therefore paints ON TOP of it — the results ended up behind the next
    // chapter's heading. Below the header's z-50, which must stay above
    // everything.
    <section className={`relative z-30 ${STORY_SECTION}`}>
      <div className="container mx-auto">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Compass}
            kicker={t('kicker')}
            title={<GlossaryInject noUnderline>{t('title')}</GlossaryInject>}
            hint={<GlossaryInject>{t('lead')}</GlossaryInject>}
            id="so-funktionierts"
          />
        </Reveal>

        {/* The columns ask the page's width, like the MobileMore inside: with the trip planner
            open a wide window can leave the page under 768 px, and a window-based
            `md:grid-cols-3` then drew step 1 beside two empty columns. */}
        <div className="grid gap-5 @min-[768px]/page:grid-cols-3">
          {/* 1, choose a park: the hero's own field, not a lookalike, since a search box that
              cannot search is what a first visitor tries first; `primary={false}` keeps its
              page-wide halves unique. Not wrapped in `Reveal`, whose lasting transform would make a
              backdrop root and leave the dropdown's glass nothing to blur. `relative z-10` lets
              the dropdown's `z-40` reach over the next two cards. */}
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

          {/* On a phone steps 2 and 3 open on request; `contents` keeps them items of this grid
              from 768 px up. */}
          <MobileMore label={tCommon('showMore')} contents>
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
          </MobileMore>
        </div>
      </div>
    </section>
  );
}
