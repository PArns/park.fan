'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  INTERVIEW_REFINE,
  interviewCore,
  interviewStore,
  type AssistantInterview,
  interviewEnded,
} from '@/lib/assistant/interview';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';

/**
 * Parky's interview while it runs, over the chat: which interview, where it stands (a dot per core
 * step, then "your plan stands" once the refinements are on offer) and a button to stop. Stopping
 * keeps every answer, which is in the planners already; "Done" once the plan stands.
 */
export function AssistantInterviewBar() {
  const t = useTranslations('assistant.interview');
  const interview = useSyncExternalStore(
    interviewStore.subscribe,
    interviewStore.getSnapshot,
    interviewStore.getServerSnapshot
  );
  if (!interview) return null;
  const core = interviewCore(interview.kind);
  const refining = interview.step === INTERVIEW_REFINE;
  const answered = new Set([...interview.answered, ...interview.skipped]);
  const at = core.indexOf(interview.step);

  const end = (current: AssistantInterview) => {
    interviewStore.set(null);
    trackSiteEvent(
      'assistant_interview_ended',
      interviewEnded(current, refining ? 'done' : 'left')
    );
  };

  return (
    <div
      data-assistant-interview={interview.kind}
      className={cn(
        'flex touch-none items-center gap-3 border-b px-3 py-1.5 text-xs',
        refining
          ? 'border-status-operating/25 bg-status-operating/10'
          : 'border-primary/25 bg-primary/5'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-tight font-semibold">
          {t(interview.kind === 'trip' ? 'titleTrip' : 'titleDay')}
        </p>
        <p className="text-muted-foreground leading-tight" aria-live="polite">
          {refining || at === -1
            ? t('planStands')
            : t('step', { n: at + 1, total: core.length, name: t(`steps.${interview.step}`) })}
        </p>
      </div>
      <ol className="flex items-center gap-1" aria-hidden="true">
        {core.map((step, index) => (
          <li
            key={step}
            className={cn(
              'size-1.5 rounded-full',
              refining || answered.has(step)
                ? 'bg-primary'
                : index === at
                  ? 'ring-primary ring-2 ring-inset'
                  : 'bg-muted-foreground/35'
            )}
          />
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => end(interview)}
        className="h-7 rounded-full px-3 text-xs"
      >
        {t(refining ? 'done' : 'end')}
      </Button>
    </div>
  );
}
