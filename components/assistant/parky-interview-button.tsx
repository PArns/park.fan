'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { assistantGate } from '@/lib/assistant/config';
import { openParky } from '@/lib/assistant/open';
import { startInterview, type InterviewStart } from '@/lib/assistant/interview';

/**
 * The planners' way into Parky's interview: a button that sets the interview on its first step and
 * opens the chat, which asks the first question once its session is ready. Drawn only where Parky
 * shows for this visitor (`assistantGate`), so it never opens a window that does not come.
 */
function ParkyInterviewStart({
  label,
  line,
  start,
  className,
}: {
  label: string;
  line: string;
  start: InterviewStart;
  className?: string;
}) {
  const status = useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getStatus,
    assistantGate.getServerStatus
  );
  if (status !== 'on') return null;
  return (
    <div
      data-parky-interview-start={start.kind}
      className={cn(
        'border-primary/30 bg-primary/5 flex flex-col gap-2 rounded-xl border p-3',
        className
      )}
    >
      <p className="text-muted-foreground text-xs">{line}</p>
      <Button
        type="button"
        onClick={() => {
          startInterview(start);
          openParky('interview');
        }}
        className="h-auto min-h-9 w-full whitespace-normal max-sm:h-auto max-sm:min-h-11"
      >
        <MessagesSquare aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}

/** The trip planner's „Plane mit Parky deine perfekte Reise", in its own words (`tripPlanner.parky`). */
export function ParkyTripInterviewButton({
  region,
  className,
}: {
  region: string;
  className?: string;
}) {
  const t = useTranslations('tripPlanner.parky');
  return (
    <ParkyInterviewStart
      label={t('button')}
      line={t('line')}
      start={{ kind: 'trip', region }}
      className={className}
    />
  );
}

/** The day planner's „Plane mit Parky deinen perfekten Parktag" (`planner.parky`), for its day. */
export function ParkyDayInterviewButton({
  park,
  date,
  className,
}: {
  park?: string;
  date?: string;
  className?: string;
}) {
  const t = useTranslations('planner.parky');
  return (
    <ParkyInterviewStart
      label={t('button')}
      line={t('line')}
      start={{ kind: 'day', ...(park && { park }), ...(date && { date }) }}
      className={className}
    />
  );
}
