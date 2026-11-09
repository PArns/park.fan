'use client';

import type { ReactNode, Ref } from 'react';
import { useTranslations } from 'next-intl';

import { TapTooltip } from '@/components/common/tap-tooltip';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { cn } from '@/lib/utils';
import {
  CROWD_DOT_CLASS,
  CROWD_LEVEL_ORDER,
  CROWD_LEVEL_PERCENT_RANGE,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';

interface CrowdScaleTooltipProps {
  /** The level the wrapped badge shows; it is the row that gets highlighted. */
  level: ColoredCrowdLevel | null;
  title: ReactNode;
  /** One figure per tier. `null` is a tier nothing lands in, and is drawn as a dash. */
  rows: Record<ColoredCrowdLevel, ReactNode | null>;
  note: ReactNode;
  children: ReactNode;
  /** Mount already open — for a trigger that replaces a stand-in the pointer is already on. */
  defaultOpen?: boolean;
  triggerRef?: Ref<HTMLButtonElement>;
  /** The trigger sits inside a link; see `TapTooltip`. */
  insideLink?: boolean;
}

/**
 * The shell of every crowd-scale tooltip: a `TapTooltip` (so a tap opens it on a phone) around the
 * six-row list.
 *
 * The surface is `TooltipContent`'s glass; only the width and the padding are overridden,
 * because this content is a list and not the usual one-line tooltip.
 */
export function CrowdScaleTooltip({
  level,
  title,
  rows,
  note,
  children,
  defaultOpen = false,
  triggerRef,
  insideLink = false,
}: CrowdScaleTooltipProps) {
  // A narrow namespace, never the whole `parks`: this component is reachable from the
  // locale layout's import graph, so the namespace it names is the one every page of the
  // site then ships. See docs/rules/translations-are-routed-not-bundled.md.
  const tLevels = useTranslations('parks.crowdLevels');

  return (
    <TapTooltip
      defaultOpen={defaultOpen}
      triggerRef={triggerRef}
      insideLink={insideLink}
      content={
        <>
          <p className="text-[10px] font-semibold tracking-widest uppercase">{title}</p>
          <ul className="mt-2 space-y-px">
            {CROWD_LEVEL_ORDER.map((step) => {
              const isCurrent = step === level;

              return (
                <li
                  key={step}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px]',
                    isCurrent ? 'bg-foreground/10 font-bold' : 'text-muted-foreground'
                  )}
                >
                  <span
                    className={cn('h-2.5 w-2.5 shrink-0 rounded-full', CROWD_DOT_CLASS[step])}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{tLevels(step)}</span>
                  <span className="shrink-0 tabular-nums">{rows[step] ?? '–'}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground mt-2 text-[11px] leading-snug text-pretty">{note}</p>
        </>
      }
    >
      {children}
    </TapTooltip>
  );
}

interface CrowdLevelScaleTooltipProps {
  /** The level the wrapped badge shows; it is the row that gets highlighted. */
  level: ColoredCrowdLevel | null;
  children: ReactNode;
}

/**
 * The whole crowd scale behind one park-level badge: six rows, the current one marked.
 *
 * A word like „Hoch" only means something next to the words it is not, so the tooltip lists all
 * six tiers with the percentages the API rates them by (`CROWD_LEVEL_PERCENT_RANGE`), which also
 * says what the number is a percentage OF.
 *
 * A ride's badge is rated against the ride's own typical wait and gets minutes instead — see
 * `RideCrowdScaleTooltip`.
 */
export function CrowdLevelScaleTooltip({ level, children }: CrowdLevelScaleTooltipProps) {
  const t = useTranslations('parks.crowdScale');

  const rows = Object.fromEntries(
    CROWD_LEVEL_ORDER.map((step) => {
      const range = CROWD_LEVEL_PERCENT_RANGE[step];
      return [
        step,
        range.min === undefined
          ? t('upTo', { max: range.max })
          : range.max === undefined
            ? t('above', { min: range.min })
            : t('between', { min: range.min, max: range.max }),
      ];
    })
  ) as Record<ColoredCrowdLevel, string>;

  return (
    <CrowdScaleTooltip
      level={level}
      title={t('title')}
      rows={rows}
      note={
        <>
          {t('note')}{' '}
          <GlossaryTermLink termId="crowd-level" showTooltip={false} className="underline">
            {t('glossaryLink')}
          </GlossaryTermLink>
        </>
      }
    >
      {children}
    </CrowdScaleTooltip>
  );
}
