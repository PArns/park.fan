'use client';

import { Fragment, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { useSecondNow } from '@/lib/hooks/use-second-now';
import { cn } from '@/lib/utils';

interface FlipClockProps {
  targetDate: string;
  labels: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** The glass tile, at least two digits wide; a three-digit day count widens it. */
const TILE =
  'bg-foreground/10 border-foreground/10 relative flex h-16 min-w-14 items-center justify-center overflow-hidden rounded-lg border shadow-xl backdrop-blur-md md:h-24 md:min-w-20 lg:h-32 lg:min-w-28';
const DIGIT_TEXT = 'text-3xl font-bold tabular-nums md:text-5xl lg:text-7xl';
const DIGITS = `text-foreground absolute inset-0 flex items-center justify-center ${DIGIT_TEXT}`;

function splitSeconds(seconds: number): TimeLeft {
  const total = Math.max(0, seconds);
  return {
    days: Math.floor(total / (3600 * 24)),
    hours: Math.floor((total % (3600 * 24)) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: Math.floor(total % 60),
  };
}

const FlipCard = ({ value, label }: { value: number; label: string }) => {
  const shown = value.toString().padStart(2, '0');
  // The value that just left stays mounted for the length of its exit animation.
  const [current, setCurrent] = useState(shown);
  const [leaving, setLeaving] = useState<string | null>(null);
  if (shown !== current) {
    setLeaving(current);
    setCurrent(shown);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* No `contain: paint` on this element: the tile is both animated and blurred, and on the
        blurred element itself it makes a backdrop root in Chromium and can drop the blur.
        `overflow-hidden` already clips the flip. */}
      <div className={TILE}>
        {/* Invisible and in flow: the digits are absolutely placed for the flip, so this is what
          gives the tile its width when the value has more digits than the minimum allows. */}
        <span aria-hidden className={cn('invisible px-2', DIGIT_TEXT)}>
          {current}
        </span>
        {leaving !== null && (
          <span
            key={`out-${leaving}`}
            aria-hidden
            onAnimationEnd={() => setLeaving(null)}
            className={cn(
              DIGITS,
              'animate-[flip-digit-out_400ms_cubic-bezier(0.22,1,0.36,1)_forwards]',
              'motion-reduce:animate-[flip-digit-fade-out_200ms_ease-out_forwards]'
            )}
          >
            {leaving}
          </span>
        )}
        <span
          key={current}
          className={cn(
            DIGITS,
            'animate-[flip-digit-in_400ms_cubic-bezier(0.22,1,0.36,1)]',
            'motion-reduce:animate-[flip-digit-fade-in_200ms_ease-out]'
          )}
        >
          {current}
        </span>
      </div>
      <span className="text-foreground/80 text-xs font-medium tracking-wider uppercase md:text-sm">
        {label}
      </span>
    </div>
  );
};

const Separator = () => (
  <div className="flex h-16 flex-col justify-center gap-2 px-1 md:h-24 md:gap-4 md:px-2 lg:h-32">
    <div className="bg-foreground/40 h-1.5 w-1.5 rounded-full md:h-2 md:w-2" />
    <div className="bg-foreground/40 h-1.5 w-1.5 rounded-full md:h-2 md:w-2" />
  </div>
);

/**
 * Countdown to `targetDate` in days, hours, minutes and seconds, each digit pair a glass tile that
 * flips with CSS keyframes (`flip-digit-*` in globals.css). Ticks only while on screen; used by the
 * homepage announcement.
 */
export function FlipClock({ targetDate, labels }: FlipClockProps) {
  // The flip animation is pure decoration — only tick while the clock is on screen and the tab is
  // visible.
  const { ref: containerRef, active } = useActiveOnScreen();
  const target = Date.parse(targetDate);

  // The last reading is kept so the digits hold still while the clock is paused or expired, and
  // so expiry ends the subscription instead of falling back to the stale mount reading.
  const [lastNow, setLastNow] = useState<number | null>(null);
  const expired = lastNow !== null && lastNow >= target;
  const liveNow = useSecondNow(active && !expired);
  // Read in the first mounted render, not gated on `active`: the digits must be real before the
  // IntersectionObserver's first callback.
  const mountNow = useBrowserNow();
  const now = liveNow ?? lastNow ?? mountNow?.getTime() ?? null;
  if (now !== null && now !== lastNow) setLastNow(now);

  // `null` until read, so SSR and hydration show the skeleton and the clock never flashes
  // 00 00 00 00.
  const timeLeft = now === null ? null : splitSeconds(differenceInSeconds(target, now));

  // One shared wrapper for skeleton and live clock, so the IntersectionObserver
  // keeps watching the same element across the skeleton→clock swap.
  return (
    <div ref={containerRef} className="flex items-start justify-center gap-1 md:gap-2">
      {timeLeft ? (
        <>
          <FlipCard value={timeLeft.days} label={labels.days} />
          <Separator />
          <FlipCard value={timeLeft.hours} label={labels.hours} />
          <Separator />
          <FlipCard value={timeLeft.minutes} label={labels.minutes} />
          <Separator />
          <FlipCard value={timeLeft.seconds} label={labels.seconds} />
        </>
      ) : (
        // Static skeleton to prevent layout shift before hydration settles
        ([labels.days, labels.hours, labels.minutes, labels.seconds] as const).map((label, i) => (
          <Fragment key={i}>
            {i > 0 && <Separator />}
            <div className="flex flex-col items-center gap-2">
              <div className={TILE} />
              <span className="text-foreground/80 text-xs font-medium tracking-wider uppercase md:text-sm">
                {label}
              </span>
            </div>
          </Fragment>
        ))
      )}
    </div>
  );
}
