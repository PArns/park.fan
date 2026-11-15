'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MessagesSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParkyLogo } from '@/components/assistant/parky/parky-logo';
import { PARKY_BUBBLE, ParkyBubbleTail } from '@/components/assistant/parky-speech-bubble';
import { assistantGate } from '@/lib/assistant/config';
import { openParky } from '@/lib/assistant/open';
import { interviewCore, startInterview, type InterviewStart } from '@/lib/assistant/interview';

/**
 * The planners' way into Parky's interview, as his own offer: Parky beside a speech bubble with his
 * name and his line, under it the questions the chat starts with (the interview's core steps,
 * numbered as the chat's bar counts them), and the one button, which sets the interview on its
 * first step and opens the chat; the chat asks the first question once its session is ready.
 * `showSteps` false leaves the questions out where the line names them. Drawn only where Parky
 * shows for this visitor (`assistantGate`), so it never opens a window that does not come.
 */
export function ParkyInterviewStart({
  label,
  line,
  start,
  showSteps = true,
  className,
}: {
  label: string;
  line: string;
  start: InterviewStart;
  /** Whether the interview's questions show under the line; false where the line names them. */
  showSteps?: boolean;
  className?: string;
}) {
  const t = useTranslations('assistant.interview.start');
  const steps = useTranslations('assistant.interview.steps');
  const status = useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getStatus,
    assistantGate.getServerStatus
  );
  if (status !== 'on') return null;
  return (
    // Laid out by its own width, not the window's: the day planner's side panel is narrow on the
    // widest screen. Side by side from 36rem, where the longest label (Italian, French) still
    // leaves the bubble a column of its own; stacked below that, the button as wide as the card.
    // On a wide page the card itself stops at 56rem: a full-width tint around a centred row read
    // as an empty band with the offer lost in its middle.
    <div data-parky-interview-start={start.kind} className={cn('@container', className)}>
      <div className="border-primary/30 bg-primary/5 mx-auto max-w-4xl rounded-xl border p-3 @xl:px-6 @xl:py-4">
        <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 @xl:gap-4">
            <ParkyLogo className="size-14 shrink-0 drop-shadow-sm @xl:size-20" idle calm framed />
            <div className="relative min-w-0 flex-1">
              <div className={cn(PARKY_BUBBLE, 'px-3 py-2 @xl:px-4 @xl:py-2.5')}>
                <p className="text-primary-ink text-xs font-semibold">{t('name')}</p>
                <p className="text-foreground/90 text-sm text-pretty @xl:text-base">{line}</p>
                {showSteps && (
                  <ol className="mt-2 flex flex-wrap gap-1.5">
                    {interviewCore(start.kind).map((step, index) => (
                      <li key={step}>
                        <Badge variant="outline" className="border-primary/30 gap-1.5 pl-1">
                          <span
                            aria-hidden="true"
                            className="bg-primary text-primary-foreground grid size-4 place-items-center rounded-full text-[10px] tabular-nums"
                          >
                            {index + 1}
                          </span>
                          {steps(step)}
                        </Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <ParkyBubbleTail side="left" />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              startInterview(start);
              openParky('interview');
            }}
            className="h-auto min-h-9 w-full text-balance whitespace-normal max-sm:min-h-11 @xl:w-auto @xl:max-w-[40%] @xl:shrink-0"
          >
            <MessagesSquare aria-hidden="true" />
            {label}
          </Button>
        </div>
      </div>
    </div>
  );
}
