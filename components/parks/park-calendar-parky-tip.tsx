'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ParkyStill } from '@/components/assistant/parky/parky-still';
import { ParkyLogo } from '@/components/assistant/parky/parky-logo';
import { ParkyStamp } from '@/components/assistant/parky/parky-stamp';
import { askParky } from '@/lib/assistant/ask';
import { useParkyElementSeen } from '@/lib/hooks/use-parky-element-seen';
import { useAssistantGateStatus } from '@/lib/assistant/use-assistant-gate';
import { useParkyDayTip } from '@/lib/hooks/use-parky-day-tip';
import { tipAgreesWithLevel, tipVerdictFor } from '@/lib/assistant/parky-tip';
import type { CrowdLevel } from '@/lib/api/types';
import type { PlannerGeo } from '@/lib/planner/types';
import { cn } from '@/lib/utils';

/** The card both states share, so Parky reading up on the day turns into his tip in one frame. */
const TIP_CARD =
  'border-primary/30 from-primary/10 flex shrink-0 items-start gap-3 rounded-xl border bg-linear-to-br to-[oklch(0.752_0.181_146.391)]/10 px-3 py-2.5 text-left';
const TIP_LABEL = 'text-primary block text-xs font-bold tracking-wider uppercase';

/**
 * Parky's tip for the day open in the calendar's dialog: his sentence about it, written by the
 * API's model from the calendar around the day, and his verdict as a stamp. The whole card asks
 * him about the day (`askParky`, element `tip` with the verdict as its kind), so the chat picks up where the tip stops. Only
 * where Parky shows for this visitor; nothing at all for a day he has nothing to say about, or
 * when his verdict disagrees with the crowd level the dialog shows (`tipAgreesWithLevel`). While
 * the model writes, the card shows him reading up on the day (`ParkyLogo`'s `looking` mood): the
 * sentence takes a few seconds on a day nobody asked about yet.
 */
export function ParkCalendarParkyTip({
  geo,
  parkSlug,
  parkName,
  date,
  dateLabel,
  crowdLevel,
  open,
  onAsk,
}: {
  geo: PlannerGeo;
  parkSlug: string;
  parkName: string;
  date: string;
  /** The day as the dialog's title writes it, for the question. */
  dateLabel: string;
  /**
   * The level the dialog's crowd panel shows for the day, which the tip may not contradict; null
   * where no panel shows one (the UI showcase).
   */
  crowdLevel: CrowdLevel | 'closed' | null;
  open: boolean;
  /** Closes the dialog: Parky ducks under a modal one, and the chat would open unseen. */
  onAsk?: () => void;
}) {
  const t = useTranslations('parkyStill.tip');
  const locale = useLocale();
  const ground = useId();
  const gate = useAssistantGateStatus();
  // A day the API writes no tip for (closed, unrated) asks nothing and shows nothing, not even
  // Parky reading up on it.
  const rated = crowdLevel === null || tipVerdictFor(crowdLevel) !== null;
  const { data, isLoading } = useParkyDayTip({
    geo,
    parkSlug,
    date,
    locale,
    enabled: open && gate === 'on' && rated,
  });
  const tip = data && tipAgreesWithLevel(data.verdict, crowdLevel) ? data : null;
  const seen = useParkyElementSeen(
    gate === 'on' && tip ? { element: 'tip', kind: tip.verdict } : undefined
  );
  if (gate !== 'on' || !rated) return null;
  if (isLoading) {
    return (
      <div role="status" aria-busy="true" className={TIP_CARD}>
        <ParkyLogo mood="looking" framed className="mt-0.5 size-11 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className={TIP_LABEL}>{t('label')}</span>
          <span className="text-muted-foreground mt-1 block text-sm leading-snug">
            {t('looking')}
          </span>
        </span>
      </div>
    );
  }
  if (!tip) return null;
  return (
    <button
      ref={seen}
      type="button"
      onClick={() => {
        onAsk?.();
        askParky(t('question', { park: parkName, day: dateLabel, tip: tip.text }), {
          element: 'tip',
          kind: tip.verdict,
        });
      }}
      className={cn(
        TIP_CARD,
        'group hover:border-primary/50 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none'
      )}
    >
      <ParkyStill ground={ground} className="mt-0.5 size-11 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className={TIP_LABEL}>{t('label')}</span>
        <span className="text-foreground/85 mt-1 block text-sm leading-snug">{tip.text}</span>
        {/* The stamp at the foot, where Parky looking over it has the gap above to himself
            instead of covering the text or the dialog's band. */}
        <span className="mt-11 flex items-end justify-between gap-3">
          <span className="text-primary text-xs font-medium group-hover:underline">{t('ask')}</span>
          <ParkyStamp tone={tip.verdict} label={t(tip.verdict)} size="md" className="mr-1" />
        </span>
      </span>
    </button>
  );
}
