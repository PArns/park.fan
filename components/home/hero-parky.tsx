'use client';

import { useSyncExternalStore } from 'react';
import { ArrowRight } from 'lucide-react';
import { ParkyLogo } from '@/components/assistant/parky-logo';
import { assistantGate } from '@/lib/assistant/config';
import { openParky } from '@/lib/assistant/open';
import { cn } from '@/lib/utils';

/**
 * Parky beside the hero's headline, with a question it can answer as a speech bubble that opens
 * the chat. Only while Parky is switched on for everybody (`getForEveryone`), so the hero never
 * offers a chat the widget would refuse; nothing is drawn on the server and until the gate has
 * decided. The column it stands in is reserved by the hero's grid, so its arrival moves nothing,
 * and it fades in rather than cutting.
 */
export function HeroParky({
  prompt,
  action,
  className,
}: {
  /** A question Parky can answer, in the reader's language and about a park of their market. */
  prompt: string;
  /** The bubble's call to action. */
  action: string;
  className?: string;
}) {
  const shown = useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getForEveryone,
    assistantGate.getServerSnapshot
  );
  if (!shown) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 transition-opacity duration-500 starting:opacity-0',
        className
      )}
    >
      <button
        type="button"
        onClick={openParky}
        className="border-border/70 bg-card/90 text-foreground hover:border-primary/50 max-w-64 self-start rounded-2xl rounded-bl-sm border px-4 py-3 text-left text-[15px] leading-snug shadow-lg transition-colors"
      >
        {prompt}
        <span className="text-primary-ink mt-2 flex items-center gap-1.5 text-sm font-semibold">
          {action}
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </button>
      <ParkyLogo idle className="size-56 drop-shadow-[0_12px_28px_rgb(0_0_0/0.35)] xl:size-64" />
    </div>
  );
}
