'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarClock, CalendarPlus, MessagesSquare } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button, buttonLinkProps } from '@/components/ui/button';
import { ParkyLogo } from '@/components/assistant/parky/parky-logo';
import { PARKY_BUBBLE, ParkyBubbleTail } from '@/components/assistant/parky-speech-bubble';
import { DrawnDayStrip, PlanDayStrip, STRIP_INK } from '@/components/planner/day-strip';
import { openInterview } from '@/lib/assistant/interview';
import type { ParkyCue } from '@/lib/assistant/parky/acts';
import { useAssistantGateStatus } from '@/lib/assistant/use-assistant-gate';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';
import { useMounted } from '@/lib/hooks/use-mounted';
import { formatPlanDay, usePlanSummary } from '@/lib/planner/plan-summary';
import { PLANNER_START_ID } from '@/lib/planner/segments';
import { plannerUi } from '@/lib/planner/ui-store';
import { cn } from '@/lib/utils';

/** Parky's clipboard act, played once when the board reaches the middle of the screen. */
const PARKY_PLANS: ParkyCue = { act: 'plan', id: 1 };

/** The legend's swatches, in the strip's own inks, beside their words. */
const LEGEND = [
  { level: 'low', key: 'waitShort' },
  { level: 'moderate', key: 'waitMedium' },
  { level: 'high', key: 'waitLong' },
] as const;

/**
 * The homepage's day planner as Parky's own board: Parky beside his speech bubble, a day on the
 * planner's strip, and the two ways in, planning with him in the chat or alone in the planner.
 * Once the board reaches the middle of the screen Parky takes out his clipboard and ticks it off
 * while the drawn day fills in block by block (`data-strip-fill`, the rules in `globals.css`).
 *
 * With a plan in this browser (after hydration) the board shows its next day instead, Parky names
 * it, and „Meinen Plan öffnen" takes the place of „Tag planen"; the rows keep their height, so the
 * swap moves nothing. Parky's button opens his interview where he shows for this visitor and
 * otherwise leads to his page, the same link either way (`ParkyAskLink`'s rule). His idle life runs
 * only while the board is near the screen.
 */
export function HomeDayPlannerBoard({ plannerHref }: { plannerHref: string }) {
  const t = useTranslations('home.dayPlanner');
  const tNav = useTranslations('navigation');
  const tParky = useTranslations('assistant.interview.start');
  const locale = useLocale();
  const plan = usePlanSummary();
  const gate = useAssistantGateStatus();
  const mounted = useMounted();
  const near = useActiveOnScreen();
  const centre = useActiveOnScreen('-35% 0px -35% 0px');
  const [seen, setSeen] = useState(false);
  if (centre.active && !seen) setSeen(true);

  const { ref: nearRef } = near;
  const { ref: centreRef } = centre;
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      nearRef(element);
      centreRef(element);
    },
    [nearRef, centreRef]
  );
  // Before hydration the day stands finished, so the server's HTML and a page without JavaScript
  // show it whole; from then on it waits for the board to be seen.
  const fill = !mounted ? undefined : seen ? 'play' : 'wait';

  return (
    <div
      ref={ref}
      data-strip-fill={fill}
      className="border-primary/30 bg-primary/5 @container rounded-2xl border p-4 @lg:p-6"
    >
      <div className="flex items-center gap-3 @lg:gap-5">
        <ParkyLogo
          className="size-20 shrink-0 drop-shadow-sm @lg:size-28"
          idle={near.active}
          calm
          framed
          cue={seen ? PARKY_PLANS : null}
        />
        <div className="relative min-w-0 flex-1">
          <div className={cn(PARKY_BUBBLE, 'px-3 py-2 @lg:px-4 @lg:py-3')}>
            <p className="text-primary-ink text-xs font-semibold">{tParky('name')}</p>
            <p className="text-foreground/90 text-sm text-pretty @lg:text-base">
              {plan
                ? t('lineYours', { park: plan.park, date: formatPlanDay(plan.date, locale) })
                : t('line')}
            </p>
          </div>
          <ParkyBubbleTail side="left" />
        </div>
      </div>

      <div className="bg-card border-border/60 mt-4 rounded-xl border px-4 pt-3 pb-4 shadow-sm @lg:mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-foreground min-w-0 truncate text-sm font-semibold">
            {plan
              ? tNav('yourPlanAt', { park: plan.park, date: formatPlanDay(plan.date, locale) })
              : t('drawnTitle')}
          </p>
          {plan && plan.days > 1 && (
            <span className="text-muted-foreground shrink-0 text-xs">
              {tNav('plannedDays', { count: plan.days })}
            </span>
          )}
        </div>
        {plan ? (
          <PlanDayStrip plan={plan} locale={locale} enabled={near.active} size="lg" />
        ) : (
          <>
            <p className="text-muted-foreground flex min-h-4 flex-wrap items-center gap-x-3 text-xs">
              <span>{t('waitLabel')}</span>
              {LEGEND.map(({ level, key }) => (
                <span key={level} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn('size-2.5 rounded-[3px] border-l-2', STRIP_INK[level])}
                  />
                  {t(key)}
                </span>
              ))}
            </p>
            <DrawnDayStrip locale={locale} size="lg" />
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 @md:flex-row @md:flex-wrap @lg:mt-5">
        <Link
          href="/parky"
          prefetch={false}
          onClick={
            gate === 'on'
              ? (event) => {
                  event.preventDefault();
                  openInterview({ kind: 'day' });
                }
              : undefined
          }
          {...buttonLinkProps({ withIcon: true, className: 'shadow-md' })}
        >
          <MessagesSquare aria-hidden="true" />
          {t('chat')}
        </Link>
        {plan ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => plannerUi.requestOpen('home-plan')}
          >
            <CalendarClock aria-hidden="true" />
            {tNav('openMyPlan')}
          </Button>
        ) : (
          <Link
            href={`${plannerHref}#${PLANNER_START_ID}` as '/'}
            prefetch={false}
            {...buttonLinkProps({ variant: 'outline', withIcon: true })}
          >
            <CalendarPlus aria-hidden="true" />
            {tNav('planDay')}
          </Link>
        )}
      </div>
    </div>
  );
}
