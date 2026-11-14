'use client';

import { useSyncExternalStore } from 'react';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParkyLogo } from '@/components/assistant/parky/parky-logo';
import { assistantGate } from '@/lib/assistant/config';
import { openParky } from '@/lib/assistant/open';
import { startInterview, type InterviewStart } from '@/lib/assistant/interview';

/**
 * The planners' way into Parky's interview: Parky's face beside a line on what the chat does, and a
 * button that sets the interview on its first step and opens the chat, which asks the first question
 * once its session is ready. The face is the launcher's, calm, so the card reads as Parky's offer
 * rather than one more form row. Drawn only where Parky shows for this visitor (`assistantGate`),
 * so it never opens a window that does not come.
 */
export function ParkyInterviewStart({
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
    // Laid out by its own width, not the window's: the day planner's side panel is narrow on the
    // widest screen. Side by side from 36rem, where the longest label (Italian, French) still
    // leaves the line a column of its own; stacked below that, the button as wide as the card.
    <div data-parky-interview-start={start.kind} className={cn('@container', className)}>
      <div className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-xl border p-3 @xl:flex-row @xl:items-center @xl:gap-4 @xl:p-4">
        <div className="flex items-center gap-3 @xl:min-w-0 @xl:flex-1">
          <ParkyLogo className="size-12 shrink-0 drop-shadow-sm @xl:size-14" idle calm />
          <p className="text-foreground/85 text-sm text-pretty @xl:text-base">{line}</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            startInterview(start);
            openParky('interview');
          }}
          className="h-auto min-h-9 w-full text-balance whitespace-normal max-sm:min-h-11 @xl:w-auto @xl:max-w-[60%] @xl:shrink-0"
        >
          <MessagesSquare aria-hidden="true" />
          {label}
        </Button>
      </div>
    </div>
  );
}
