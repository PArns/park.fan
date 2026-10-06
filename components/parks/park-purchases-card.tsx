'use client';

import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/common/glass-card';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';
import type { ScheduleItem, SchedulePurchaseItem } from '@/lib/api/types';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { parkDayOf } from '@/lib/utils/park-day';

// The API may send placeholder prices (amount 0, formatted "Unknown") when the
// real fee isn't available — same rule as <QueueTypeBadge>.
function getFormattedPrice(item: SchedulePurchaseItem): string | null {
  if (!item.price) return null;
  const { amount, formatted } = item.price;
  if (!formatted || formatted.trim().toLowerCase() === 'unknown') return null;
  if (typeof amount === 'number' && amount <= 0) return null;
  return formatted;
}

interface ParkPurchasesCardProps {
  schedule: ScheduleItem[] | null | undefined;
  timezone: string;
  className?: string;
}

/**
 * Day prices for paid skip-the-line products from the operating schedule (`schedule[].purchases`):
 * Disney's Lightning Lane passes and packages, including the sold-out state. Parks without purchase
 * data render nothing. "Today" comes from the browser clock in the park's timezone; before today's
 * hours exist it falls forward to the next day that carries purchases.
 */
export function ParkPurchasesCard({ schedule, timezone, className }: ParkPurchasesCardProps) {
  const t = useTranslations('parks.purchases');
  const locale = useLocale();
  const browserNow = useBrowserNow();

  const entry = useMemo(() => {
    if (!browserNow || !schedule?.length) return null;
    const todayStr = parkDayOf(browserNow, timezone);
    return (
      schedule
        .filter((s) => s.date >= todayStr && (s.purchases?.length ?? 0) > 0)
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
    );
  }, [browserNow, schedule, timezone]);

  const items = useMemo(() => {
    if (!entry?.purchases) return [];
    // Packages (Multi/Premier Pass) first, then per-attraction passes A→Z.
    return [...entry.purchases].sort((a, b) => {
      const aPkg = a.type === 'PACKAGE' ? 0 : 1;
      const bPkg = b.type === 'PACKAGE' ? 0 : 1;
      return aPkg !== bPkg ? aPkg - bPkg : a.name.localeCompare(b.name);
    });
  }, [entry]);

  if (!entry || items.length === 0) return null;

  const todayStr = parkDayOf(browserNow!, timezone);
  const isToday = entry.date === todayStr;
  const dateLabel = isToday
    ? null
    : getDateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date(`${entry.date}T12:00:00`));

  // Tighter below `sm`: the card sits above „Heute im Park", and at its desktop padding it pushed
  // the first headliner row under the fold on a phone. The rows are not links, so they owe no
  // touch-target height.
  return (
    <GlassCard variant="medium" className={cn('border-primary/10 max-sm:p-3', className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2 max-sm:mb-1.5">
        <Zap className="text-primary h-4 w-4 shrink-0" />
        <GlossaryTermLink termId="lightning-lane" tooltipOnly>
          <h2 className="text-sm font-semibold">{t('title')}</h2>
        </GlossaryTermLink>
        {dateLabel && (
          <span className="text-muted-foreground text-xs">{t('forDate', { date: dateLabel })}</span>
        )}
      </div>
      <ul className="divide-border/60 divide-y">
        {items.map((item, i) => {
          const price = getFormattedPrice(item);
          const soldOut = item.available === false;
          return (
            <li
              key={item.id ?? `${item.name}-${i}`}
              className={cn(
                'flex items-center justify-between gap-3 py-1.5 text-sm max-sm:py-0.5',
                soldOut && 'opacity-60'
              )}
            >
              <span
                className={cn(
                  'min-w-0 truncate',
                  item.type === 'PACKAGE' ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {item.name}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {soldOut && <Badge className="badge-muted max-sm:py-0">{t('soldOut')}</Badge>}
                {price && <span className="font-medium tabular-nums">{price}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
