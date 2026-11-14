'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Replies the visitor can tap under Parky's newest answer, as the model wrote them
 * (`suggest_replies`). Each is a button that sends its text as the visitor's message; they sit on
 * the visitor's side of the chat, where the reply will appear. A group with a label, so a screen
 * reader hears what they are; the chat's live region reads them once, when they arrive.
 */
export function AssistantReplies({
  replies,
  disabled,
  onPick,
}: {
  replies: readonly string[];
  /** While Parky answers, a press would be lost. */
  disabled: boolean;
  /** The reply, and its place among the chips, 1 the first. */
  onPick: (reply: string, position: number) => void;
}) {
  const t = useTranslations('assistant');
  return (
    <div
      role="group"
      aria-label={t('repliesLabel')}
      data-assistant-replies=""
      className="flex flex-wrap justify-end gap-2"
    >
      {replies.map((reply, index) => (
        <Button
          key={reply}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onPick(reply, index + 1)}
          className={cn(
            'border-primary/40 text-primary hover:bg-primary/10 hover:text-primary h-auto min-h-8 rounded-full whitespace-normal',
            'max-sm:h-auto max-sm:min-h-11'
          )}
        >
          {reply}
        </Button>
      ))}
    </div>
  );
}
