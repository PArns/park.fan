'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';
import { useSecondNow } from '@/lib/hooks/use-second-now';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

interface Props {
  modelAge: { days: number; hours: number; minutes: number };
}

/** Returns the next 06:00 UTC timestamp (today if still in future, tomorrow otherwise). */
function getNextTrainingUTC(now: number): number {
  const today = new Date(now);
  const todayAt6 = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    6,
    0,
    0,
    0
  );
  return todayAt6 > now ? todayAt6 : todayAt6 + 86_400_000;
}

function splitMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    h: String(Math.floor(total / 3600)).padStart(2, '0'),
    m: String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    s: String(total % 60).padStart(2, '0'),
  };
}

function NumUnit({ n, u }: { n: string; u: string }) {
  return (
    <>
      <span className="text-2xl font-bold">{n}</span>
      <span className="text-muted-foreground mr-1.5 ml-0.5 text-base font-light">{u}</span>
    </>
  );
}

/**
 * Card with the model's age and a live countdown to the next daily retraining at 06:00 UTC, shown
 * in the visitor's local time. Ticks only while the card is on screen.
 */
export function MLTrainingCountdown({ modelAge }: Props) {
  const t = useTranslations('home');

  // Only tick while the card is watchable: it sits below the fold. `null` renders the "—"
  // placeholder, which the server and the hydration render agree on.
  const { ref: cardRef, active } = useActiveOnScreen();
  const now = useSecondNow(active);
  const next = now === null ? null : getNextTrainingUTC(now);
  const digits = now === null || next === null ? null : splitMs(next - now);
  // Cached formatter: this runs every second, and the string only changes when `next` does.
  const localTime =
    next === null
      ? null
      : getDateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(next);

  const scheduleText = localTime
    ? t('ai.dailyScheduleLocal', { time: localTime })
    : t('ai.dailySchedule');

  return (
    <Card ref={cardRef} className="col-span-2 py-0">
      <div className="px-4 pt-3 pb-3">
        <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm font-medium">
          <RefreshCw className="h-3.5 w-3.5" />
          {t('ai.nextRetraining')}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-muted-foreground mb-0.5 text-xs">{t('ai.modelAgeTile')}</div>
            <div className="flex items-baseline tabular-nums">
              {modelAge.days > 0 ? (
                <>
                  <NumUnit n={String(modelAge.days)} u="d" />
                  <NumUnit n={String(modelAge.hours)} u="h" />
                </>
              ) : (
                <>
                  <NumUnit n={String(modelAge.hours)} u="h" />
                  <NumUnit n={String(modelAge.minutes).padStart(2, '0')} u="m" />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-0.5 text-xs">{t('ai.nextTrainingIn')}</div>
            {digits ? (
              // `contain: paint` on the one row that changes every second: the Card is glass, and
              // without containment each tick dirties its whole backdrop. Same fix as
              // `NowcastUpdateCountdown`.
              <div className="flex items-baseline tabular-nums [contain:paint]">
                <NumUnit n={digits.h} u="h" />
                <NumUnit n={digits.m} u="m" />
                <NumUnit n={digits.s} u="s" />
              </div>
            ) : (
              <div className="text-muted-foreground text-2xl font-bold">—</div>
            )}
            <p className="text-muted-foreground mt-0.5 text-xs">{scheduleText}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
