'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

interface Props {
  modelAge: { days: number; hours: number; minutes: number };
}

/** Returns the next 06:00 UTC timestamp (today if still in future, tomorrow otherwise). */
function getNextTrainingUTC(): number {
  const now = Date.now();
  const todayAt6 = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
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

export function MLTrainingCountdown({ modelAge }: Props) {
  const t = useTranslations('home');

  const [remaining, setRemaining] = useState<number | null>(null);
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = getNextTrainingUTC();
      setRemaining(next - Date.now());
      setLocalTime(new Date(next).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const digits = remaining !== null ? splitMs(remaining) : null;

  const scheduleText = localTime
    ? t('ai.dailyScheduleLocal', { time: localTime })
    : t('ai.dailySchedule');

  return (
    <Card className="col-span-2 py-0">
      <div className="px-4 pt-3 pb-3">
        <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm font-medium">
          <RefreshCw className="h-3.5 w-3.5" />
          {t('ai.nextRetraining')}
        </p>
        <div className="grid grid-cols-2 gap-4">
          {/* Model age */}
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

          {/* Countdown */}
          <div>
            <div className="text-muted-foreground mb-0.5 text-xs">{t('ai.nextTrainingIn')}</div>
            {digits ? (
              <div className="flex items-baseline tabular-nums">
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
