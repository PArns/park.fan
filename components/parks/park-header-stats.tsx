'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { getCalendarWindow } from '@/lib/hooks/use-calendar-window';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import { ParkStatusBadge } from './park-status-badge';
import { CrowdLevelBadge } from './crowd-level-badge';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface ParkHeaderStatsProps {
  initialData: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/** Small uppercase caption above each panel. */
function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.08em] uppercase">
      {children}
    </span>
  );
}

/** A framed glass mini-panel grouping the badges of one column. */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'border-border/60 bg-background/50 flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * At-a-glance header strip that contrasts the park's **current** state (live status +
 * crowd, from the 5-min poll) with the **AI forecast for today** (from the best-days
 * calendar). This is park.fan's differentiator — "jetzt vs. Prognose" in one glance.
 *
 * Current data renders instantly from the server `initialData` and refreshes live; the
 * forecast column is gated by `useLoadLast` (the calendar loads LAST, after live/weather —
 * see the park-page loading-priority requirement) and shows a subtle placeholder until then.
 * It shares the calendar query key with ParkBestDaysSection, so no extra request is made.
 */
export function ParkHeaderStats({
  initialData,
  continent,
  country,
  city,
  parkSlug,
}: ParkHeaderStatsProps) {
  const t = useTranslations('parks');

  const { data: live } = useLiveParkData({ continent, country, city, parkSlug, initialData });
  const park = live ?? initialData;
  const status = park.status;
  // Mirror park-status.tsx: crowd/wait live in currentLoad (live) or analytics.statistics.
  const currentCrowd = park.analytics?.statistics?.crowdLevel ?? park.currentLoad?.crowdLevel ?? null;
  const avgWait =
    park.analytics?.statistics?.avgWaitTime ?? park.currentLoad?.currentWaitTime ?? 0;
  const showCrowd = status === 'OPERATING' || status === 'UNKNOWN';

  const { from, to } = getCalendarWindow(useBrowserNow(null));
  // Shares the exact query key of ParkBestDaysSection ({continent…, from, to} — both derive
  // from useBrowserNow(null), so the window is identical), so React Query serves BOTH from one
  // cached request; no extra network call, and it stays gated by useLoadLast (loads last).
  const { data: calendar } = useParkBestDaysCalendar({
    continent,
    country,
    city,
    parkSlug,
    from,
    to,
  });
  // Memoized so the 90-day scan doesn't re-run on unrelated re-renders (e.g. the 5-min live poll).
  const predictedToday = useMemo(
    () => calendar?.days.find((d) => d.isToday)?.crowdLevel ?? null,
    [calendar]
  );

  return (
    <div className="mt-4 flex flex-wrap items-stretch gap-2.5">
      {/* Now — live status + current crowd + avg wait */}
      <div className="flex flex-col gap-1">
        <Caption>{t('now')}</Caption>
        <Panel>
          {status && <ParkStatusBadge status={status} />}
          {showCrowd && currentCrowd && <CrowdLevelBadge level={currentCrowd} />}
          {avgWait > 0 && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
              <Clock className="h-3 w-3" aria-hidden="true" />Ø&nbsp;{avgWait}&nbsp;min
            </span>
          )}
        </Panel>
      </div>

      {/* Forecast for today — the AI crowd prediction */}
      <div className="flex flex-col gap-1">
        <Caption>{t('forecastToday')}</Caption>
        <Panel className="border-primary/25 bg-primary/[0.06]">
          {predictedToday ? (
            <CrowdLevelBadge level={predictedToday} />
          ) : (
            <span className="bg-muted-foreground/20 h-4 w-20 animate-pulse rounded-full" />
          )}
        </Panel>
      </div>
    </div>
  );
}
