'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';

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

const FlipCard = ({ value, label }: { value: number; label: string }) => {
  const formattedValue = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-foreground/10 border-foreground/10 relative h-16 w-14 overflow-hidden rounded-lg border shadow-xl backdrop-blur-md md:h-24 md:w-20 lg:h-32 lg:w-28">
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={formattedValue}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="text-foreground text-3xl font-bold tabular-nums md:text-5xl lg:text-7xl"
            >
              {formattedValue}
            </motion.span>
          </AnimatePresence>
        </div>
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

export function FlipClock({ targetDate, labels }: FlipClockProps) {
  // `null` = not stamped yet → the skeleton shows (also covers SSR/hydration,
  // replacing the old separate `isClient` flag). The clock only ever swaps in
  // with real digits, so no 00 00 00 00 flash.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  // The flip animation (a framer-motion spring per second) is pure decoration —
  // only tick while the clock is on screen and the tab is visible.
  const { ref: containerRef, active } = useActiveOnScreen();

  // Compute + store the remaining time; returns true once the target has passed.
  // Preserves state identity when nothing changed (e.g. after expiry) — a fresh
  // object each second re-rendered four AnimatePresence trees forever.
  const applyTimeLeft = useCallback((target: Date) => {
    const diffInSeconds = Math.max(0, differenceInSeconds(target, new Date()));
    const days = Math.floor(diffInSeconds / (3600 * 24));
    const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = Math.floor(diffInSeconds % 60);
    setTimeLeft((prev) =>
      prev != null &&
      prev.days === days &&
      prev.hours === hours &&
      prev.minutes === minutes &&
      prev.seconds === seconds
        ? prev
        : { days, hours, minutes, seconds }
    );
    return diffInSeconds <= 0;
  }, []);

  // Initial stamp, deferred one task (no sync setState in the effect body) and
  // ungated — the digits must be real before the IntersectionObserver's first
  // callback flips `active`.
  useEffect(() => {
    const init = setTimeout(() => applyTimeLeft(new Date(targetDate)), 0);
    return () => clearTimeout(init);
  }, [targetDate, applyTimeLeft]);

  // Per-second ticking only while watchable; clears itself for good once
  // expired (the interval's own tick detects it).
  useEffect(() => {
    if (!active) return;
    const target = new Date(targetDate);
    const sync = setTimeout(() => applyTimeLeft(target), 0);
    const timer = setInterval(() => {
      if (applyTimeLeft(target)) clearInterval(timer);
    }, 1000);
    return () => {
      clearTimeout(sync);
      clearInterval(timer);
    };
  }, [targetDate, active, applyTimeLeft]);

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
              <div className="bg-foreground/10 border-foreground/10 relative h-16 w-14 overflow-hidden rounded-lg border shadow-xl backdrop-blur-md md:h-24 md:w-20 lg:h-32 lg:w-28" />
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
