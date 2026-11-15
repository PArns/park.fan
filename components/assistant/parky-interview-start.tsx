'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
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
 * numbered as the chat's bar counts them), and a button that sets the interview on its first step
 * and opens the chat, which asks the first question once its session is ready. Drawn only where
 * Parky shows for this visitor (`assistantGate`), so it never opens a window that does not come.
 * An `action` (the hub's „Reise planen“) stands before the chat's button, which then takes the
 * outline look, and the questions are left out, since the line is the page's; with an action the
 * card is drawn where Parky is off too, without the chat's button.
 */
export function ParkyInterviewStart({
  label,
  line,
  start,
  action,
  className,
}: {
  label: string;
  line: string;
  start: InterviewStart;
  /** The page's own way in beside the chat, drawn first. */
  action?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('assistant.interview.start');
  const steps = useTranslations('assistant.interview.steps');
  const status = useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getStatus,
    assistantGate.getServerStatus
  );
  if (status !== 'on' && !action) return null;
  const chat = status === 'on';
  return (
    // Laid out by its own width, not the window's: the day planner's side panel is narrow on the
    // widest screen. Side by side from 36rem, where the longest label (Italian, French) still
    // leaves the bubble a column of its own; stacked below that, the button as wide as the card.
    // On a wide page the row keeps to the middle rather than pushing the button to the far edge.
    <div data-parky-interview-start={start.kind} className={cn('@container', className)}>
      <div className="border-primary/30 bg-primary/5 rounded-xl border p-3 @xl:px-6 @xl:py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 @xl:flex-row @xl:items-center @xl:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 @xl:gap-4">
            <ParkyLogo className="size-14 shrink-0 drop-shadow-sm @xl:size-20" idle calm framed />
            <div className="relative min-w-0 flex-1">
              <div className={cn(PARKY_BUBBLE, 'px-3 py-2 @xl:px-4 @xl:py-2.5')}>
                <p className="text-primary-ink text-xs font-semibold">{t('name')}</p>
                <p className="text-foreground/90 text-sm text-pretty @xl:text-base">{line}</p>
                {chat && !action && (
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
          {action}
          {chat && (
            <Button
              type="button"
              variant={action ? 'outline' : 'default'}
              onClick={() => {
                startInterview(start);
                openParky('interview');
              }}
              className="h-auto min-h-9 w-full text-balance whitespace-normal max-sm:min-h-11 @xl:w-auto @xl:max-w-[40%] @xl:shrink-0"
            >
              <MessagesSquare aria-hidden="true" />
              {label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
