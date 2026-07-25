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
 * Day prices for paid skip-the-line products from the operating schedule
 * (`schedule[].purchases`) — today Disney's Lightning Lane single passes and
 * Multi/Premier Pass packages, incl. sold-out state. Parks without purchase
 * data (everything non-Disney right now) render nothing.
 *
 * "Today" is derived from the browser clock in the park timezone (same pattern
 * as <ParkHeaderStats>); before opening hours exist for today we fall forward
 * to the next schedule day that carries purchases.
 */
export function ParkPurchasesCard({ schedule, timezone, className }: ParkPurchasesCardProps) {
  const t = useTranslations('parks.purchases');
  const locale = useLocale();
  const browserNow = useBrowserNow(null);

  const entry = useMemo(() => {
    if (!browserNow || !schedule?.length) return null;
    const todayStr = browserNow.toLocaleDateString('en-CA', { timeZone: timezone });
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

  const todayStr = browserNow!.toLocaleDateString('en-CA', { timeZone: timezone });
  const isToday = entry.date === todayStr;
  const dateLabel = isToday
    ? null
    : new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date(`${entry.date}T12:00:00`));

  return (
    <GlassCard variant="medium" className={cn('border-primary/10', className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
                'flex items-center justify-between gap-3 py-1.5 text-sm',
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
                {soldOut && <Badge className="badge-muted">{t('soldOut')}</Badge>}
                {price && <span className="font-medium tabular-nums">{price}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
