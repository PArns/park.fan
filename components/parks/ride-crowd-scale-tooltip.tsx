'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useTranslations } from 'next-intl';

import { CROWD_LEVEL_ORDER, type ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { rideCrowdMinuteRanges } from '@/lib/utils/ride-crowd-scale';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { CROWD_SCALE_TRIGGER_CLASS, CrowdScaleTooltip } from './crowd-level-scale-tooltip';

interface RideCrowdScaleTooltipProps {
  /** The level the wrapped badge shows; it is the row that gets highlighted. */
  level: ColoredCrowdLevel | null;
  /** The ride's own typical wait the API rated `level` against (`ParkAttraction.baseline`). */
  baseline: number | null | undefined;
  children: ReactNode;
}

/**
 * The crowd scale behind a ride card's badge, in THIS ride's minutes.
 *
 * The park badge's tooltip can print percentages because every park is rated on the same scale.
 * A ride is not: its badge is its current wait against its own typical wait, so „Hoch" is 20
 * minutes on Mission: SPACE and 55 on Remy's. The rows here are therefore the waits that put this
 * ride in each tier (`rideCrowdMinuteRanges`), and without a baseline there is no tooltip at all
 * — the badge stays, unexplained, rather than explained with somebody else's numbers.
 *
 * **Radix mounts on first contact, not on hydration.** This sits on every ride card, and a park
 * page renders a hundred of them; `FavoriteStar` and the headliner crown use native `title` on
 * the same card for that reason. Until someone reaches for it the trigger is a plain button of
 * the same box, and three things swap the real tooltip in:
 *
 * * a mouse entering it, which mounts the tooltip already open;
 * * a tap, handled in the click — the stand-in swallows it and mounts the tooltip open. Not on
 *   pointerdown or pointerenter: swapping the element between pointerdown and click leaves the
 *   click without its target, and the browser hands it to the nearest common ancestor, which is
 *   the card's link;
 * * keyboard focus, after which the real trigger takes the focus back. A tap focuses the button
 *   too on some browsers, so `:focus-visible` decides whether a focus is the keyboard's.
 */
export function RideCrowdScaleTooltip({ level, baseline, children }: RideCrowdScaleTooltipProps) {
  const [armed, setArmed] = useState<null | 'open' | 'focus'>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (armed === 'focus') triggerRef.current?.focus();
  }, [armed]);

  const ranges = rideCrowdMinuteRanges(baseline);
  if (!ranges || typeof baseline !== 'number') return <>{children}</>;

  if (!armed) {
    return (
      <button
        type="button"
        className={CROWD_SCALE_TRIGGER_CLASS}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setArmed('open');
        }}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) setArmed('focus');
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setArmed('open');
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <RideCrowdScaleContent
      level={level}
      baseline={baseline}
      ranges={ranges}
      defaultOpen={armed === 'open'}
      triggerRef={triggerRef}
    >
      {children}
    </RideCrowdScaleContent>
  );
}

function RideCrowdScaleContent({
  level,
  baseline,
  ranges,
  defaultOpen,
  triggerRef,
  children,
}: {
  level: ColoredCrowdLevel | null;
  baseline: number;
  ranges: NonNullable<ReturnType<typeof rideCrowdMinuteRanges>>;
  defaultOpen: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  const t = useTranslations('parks.rideCrowdScale');

  const rows = Object.fromEntries(
    CROWD_LEVEL_ORDER.map((step) => {
      const range = ranges[step];
      return [
        step,
        range === null
          ? null
          : step === 'very_low' && range.max !== range.min
            ? t('upTo', { max: range.max ?? range.min })
            : range.max === undefined
              ? t('from', { min: range.min })
              : range.max === range.min
                ? t('exactly', { min: range.min })
                : t('between', { min: range.min, max: range.max }),
      ];
    })
  ) as Record<ColoredCrowdLevel, string | null>;

  return (
    <CrowdScaleTooltip
      level={level}
      title={t('title')}
      rows={rows}
      note={t('note', { baseline: roundWaitTo5(baseline) })}
      defaultOpen={defaultOpen}
      triggerRef={triggerRef}
      insideLink
    >
      {children}
    </CrowdScaleTooltip>
  );
}
