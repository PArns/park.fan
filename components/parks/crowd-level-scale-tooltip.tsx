'use client';

import { useRef, useState, type ReactNode, type Ref } from 'react';
import { useTranslations } from 'next-intl';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CROWD_DOT_CLASS,
  CROWD_LEVEL_ORDER,
  CROWD_LEVEL_PERCENT_RANGE,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';

/**
 * The trigger's box. Exported because the ride card's stand-in button has to be the same box, or
 * the badge would shift by a pixel the moment the real tooltip replaces it.
 *
 * `w-fit` because the trigger is a flex item wherever these badges sit: a flex child is blockified
 * and stretched to the line's cross size, and the button then measured 92 px around a 70 px badge
 * — 22 px of cursor-help over nothing, with the tooltip anchored to the middle of the empty box
 * instead of to the badge.
 */
export const CROWD_SCALE_TRIGGER_CLASS = cn(
  'focus-visible:ring-ring/60 inline-flex w-fit cursor-help rounded-full focus-visible:ring-2 focus-visible:outline-none',
  // The badge is 22 px high and opens its scale on a tap; on a ride card a miss by a few pixels
  // navigates to the ride instead.
  PHONE_HIT_AREA
);

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
  /**
   * The trigger sits inside a link, and a click on it must not follow that link.
   *
   * Every click is then swallowed: `preventDefault()` stops the anchor's navigation and
   * `stopPropagation()` keeps it from the `<Link>`'s own handler, the same pair `FavoriteStar`
   * uses on the same card.
   */
  insideLink?: boolean;
}

/**
 * The shell of every crowd-scale tooltip: the trigger, the tap handling and the six-row list.
 *
 * **Opened by tap, not only by hover.** Radix's tooltip is a pointer-and-keyboard widget by
 * design: `onPointerMove` returns early for `pointerType === 'touch'`, `onPointerDown`
 * arms a ref that suppresses the focus-open that a tap would otherwise produce, and
 * `onClick` closes. On a phone that adds up to a tooltip nothing can open. The open state
 * is therefore controlled here and a non-mouse pointer toggles it directly;
 * `preventDefault()` is what keeps Radix's own handler from running, since
 * `composeEventHandlers` skips the internal handler once the event is defaulted-prevented.
 * Closing again is handled for us: a second tap hits the same toggle, a tap elsewhere is a
 * dismissable-layer pointer-down-outside, and scrolling the trigger away closes too.
 *
 * The surface is `TooltipContent`'s — frosted `bg-background/80` under `backdrop-blur-md`,
 * the same glass the rest of the page floats on. Only the width and the padding are
 * overridden here, because this content is a list and not the usual one-line tooltip.
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
  const [open, setOpen] = useState(defaultOpen);
  // Which pointer opened it, remembered across the pointerdown → click pair.
  const tappedRef = useRef(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        ref={triggerRef}
        type="button"
        className={CROWD_SCALE_TRIGGER_CLASS}
        onPointerDown={(event) => {
          tappedRef.current = event.pointerType !== 'mouse';
          // Only the opening half is ours. Radix's own pointerdown handler still runs, and
          // it does two things we need: it closes an open tooltip (so the second tap
          // closes), and it sets the `isPointerDownRef` that stops the focus a tap leaves
          // behind from opening it straight back up. Suppressing that handler with
          // `preventDefault()` also suppressed that guard, and the focus reopened what the
          // tap had just closed.
          if (tappedRef.current && !open) setOpen(true);
        }}
        onFocus={(event) => {
          // That guard does not survive a tap in Chrome on Android. A touch fires pointerup
          // BEFORE the compatibility mousedown that moves the focus, and Radix clears
          // `isPointerDownRef` on pointerup — so the focus arrives unguarded and reopens what
          // the second tap had just closed. Measured 2026-09-22: pointerdown → pointerup →
          // mousedown → focusin → click. The tap flag is still set at that point (the click
          // clears it), so a focus under it is the tap's, and Radix's focus-open is skipped.
          if (tappedRef.current) event.preventDefault();
        }}
        onClick={(event) => {
          if (insideLink) {
            event.preventDefault();
            event.stopPropagation();
          }
          // Radix closes on click, which would undo the tap that just opened it. Only a tap
          // is swallowed, and the flag is cleared here rather than on the next pointerdown:
          // a keyboard Enter is a click with no pointer event before it, and it would
          // otherwise inherit the last tap and never reach Radix.
          if (!tappedRef.current) return;
          tappedRef.current = false;
          event.preventDefault();
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-60 max-w-[calc(100vw-2rem)] p-3">
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
      </TooltipContent>
    </Tooltip>
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
 * A badge answers "how busy" with a word, and a word is only worth something next to the
 * words it is not — „Hoch" means nothing until „Sehr hoch" and „Extrem" are on the page
 * too. So the tooltip lists all six tiers with the percentages the API rates them by
 * (`CROWD_LEVEL_PERCENT_RANGE`), which also answers the second half of the question: what
 * the number is a percentage OF.
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
    <CrowdScaleTooltip level={level} title={t('title')} rows={rows} note={t('note')}>
      {children}
    </CrowdScaleTooltip>
  );
}
