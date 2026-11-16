'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ParkyStill } from '@/components/assistant/parky/parky-still';
import { ParkyStamp } from '@/components/assistant/parky/parky-stamp';
import { askParky } from '@/lib/assistant/ask';
import { useAssistantGateStatus } from '@/lib/assistant/use-assistant-gate';
import { useParkyDayTip } from '@/lib/hooks/use-parky-day-tip';
import type { PlannerGeo } from '@/lib/planner/types';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Parky's tip for the day open in the calendar's dialog: his sentence about it, written by the
 * API's model from the calendar around the day, and his verdict as a stamp. The whole card asks
 * him about the day (`askParky`, source `tip`), so the chat picks up where the tip stops. Only
 * where Parky shows for this visitor; nothing at all for a day he has nothing to say about.
 */
export function ParkCalendarParkyTip({
  geo,
  parkSlug,
  parkName,
  date,
  dateLabel,
  open,
  onAsk,
}: {
  geo: PlannerGeo;
  parkSlug: string;
  parkName: string;
  date: string;
  /** The day as the dialog's title writes it, for the question. */
  dateLabel: string;
  open: boolean;
  /** Closes the dialog: Parky ducks under a modal one, and the chat would open unseen. */
  onAsk: () => void;
}) {
  const t = useTranslations('parkyStill.tip');
  const locale = useLocale();
  const ground = useId();
  const gate = useAssistantGateStatus();
  const { data: tip, isPending } = useParkyDayTip({
    geo,
    parkSlug,
    date,
    locale,
    enabled: open && gate === 'on',
  });
  if (gate !== 'on') return null;
  if (isPending) return <Skeleton className="h-[76px] shrink-0 rounded-xl" />;
  if (!tip) return null;
  return (
    <button
      type="button"
      onClick={() => {
        onAsk();
        askParky(t('question', { park: parkName, day: dateLabel, tip: tip.text }), 'tip');
      }}
      className="group border-primary/30 from-primary/10 hover:border-primary/50 focus-visible:ring-ring flex shrink-0 items-start gap-3 rounded-xl border bg-linear-to-br to-[oklch(0.752_0.181_146.391)]/10 px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <ParkyStill ground={ground} className="mt-0.5 size-11 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-primary text-xs font-bold tracking-wider uppercase">
            {t('label')}
          </span>
          <ParkyStamp tone={tip.verdict} label={t(tip.verdict)} size="md" className="-mt-1" />
        </span>
        <span className="text-foreground/85 mt-1 block text-sm leading-snug">{tip.text}</span>
        <span className="text-primary mt-1 block text-xs font-medium group-hover:underline">
          {t('ask')}
        </span>
      </span>
    </button>
  );
}
