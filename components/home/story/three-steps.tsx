import { getTranslations } from 'next-intl/server';
import { CalendarRange, Check, Compass, Search, Sunrise } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
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
  children,
}: {
  step: number;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card/60 flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm backdrop-blur-md">
      <div className="p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-[10px] text-sm font-bold">
            {step}
          </span>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-5 text-sm leading-relaxed">{text}</p>
      </div>
      <div className="border-border bg-muted/25 mt-auto border-t p-4">{children}</div>
    </div>
  );
}

export async function ThreeSteps() {
  const t = await getTranslations('homeStory.steps');

  return (
    <section className="px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
          <ChapterHeading
            variant="tile"
            icon={Compass}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            id="so-funktionierts"
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {/* 1 — choose a park. The footer is a real route, not a mock field: a
              search box that cannot search is the one thing a first visitor
              will try first. */}
          <Reveal>
            <StepCard step={1} title={t('one.title')} text={t('one.text')}>
              <Link
                href="/search"
                prefetch={false}
                className="border-input bg-background hover:border-primary/40 flex h-10 items-center gap-2.5 rounded-xl border px-3 transition-colors"
              >
                <Search className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground truncate text-[13px]">
                  {t('one.placeholder')}
                </span>
              </Link>
              <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
                {t('one.hint')}
              </p>
            </StepCard>
          </Reveal>

          {/* 2 — check the day. */}
          <Reveal delay={80}>
            <StepCard step={2} title={t('two.title')} text={t('two.text')}>
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
            <StepCard step={3} title={t('three.title')} text={t('three.text')}>
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
