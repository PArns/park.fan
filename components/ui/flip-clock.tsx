'use client';

import { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    const target = new Date(targetDate);

    const calculateTimeLeft = () => {
      const now = new Date();
      const diffInSeconds = Math.max(0, differenceInSeconds(target, now));

      const days = Math.floor(diffInSeconds / (3600 * 24));
      const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = Math.floor(diffInSeconds % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isClient) {
    // Render a static skeleton to prevent layout shift
    return (
      <div className="flex items-start justify-center gap-1 md:gap-2">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-foreground/10 border-foreground/10 relative h-16 w-14 overflow-hidden rounded-lg border shadow-xl backdrop-blur-md md:h-24 md:w-20 lg:h-32 lg:w-28" />
          <span className="text-foreground/80 text-xs font-medium tracking-wider uppercase md:text-sm">
            {labels.days}
          </span>
        </div>
        <Separator />
        <div className="flex flex-col items-center gap-2">
          <div className="bg-foreground/10 border-foreground/10 relative h-16 w-14 overflow-hidden rounded-lg border shadow-xl backdrop-blur-md md:h-24 md:w-20 lg:h-32 lg:w-28" />
          <span className="text-foreground/80 text-xs font-medium tracking-wider uppercase md:text-sm">
            {labels.hours}
          </span>
        </div>
        <Separator />
        <div className="flex flex-col items-center gap-2">
          <div className="bg-foreground/10 border-foreground/10 relative h-16 w-14 overflow-hidden rounded-lg border shadow-xl backdrop-blur-md md:h-24 md:w-20 lg:h-32 lg:w-28" />
          <span className="text-foreground/80 text-xs font-medium tracking-wider uppercase md:text-sm">
            {labels.minutes}
          </span>
        </div>
        <Separator />
        <div className="flex flex-col items-center gap-2">
          <div className="bg-foreground/10 border-foreground/10 relative h-16 w-14 overflow-hidden rounded-lg border shadow-xl backdrop-blur-md md:h-24 md:w-20 lg:h-32 lg:w-28" />
          <span className="text-foreground/80 text-xs font-medium tracking-wider uppercase md:text-sm">
            {labels.seconds}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center gap-1 md:gap-2">
      <FlipCard value={timeLeft.days} label={labels.days} />
      <Separator />
      <FlipCard value={timeLeft.hours} label={labels.hours} />
      <Separator />
      <FlipCard value={timeLeft.minutes} label={labels.minutes} />
      <Separator />
      <FlipCard value={timeLeft.seconds} label={labels.seconds} />
    </div>
  );
}
