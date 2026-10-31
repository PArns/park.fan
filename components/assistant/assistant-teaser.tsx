'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  setTeasersShown,
  stopTeasers,
  teasersShown,
  TEASER_SCHEDULE_MS,
} from '@/lib/assistant/teaser-store';

const VISIBLE_MS = 7_000;
const TEASER_KEYS = ['teaser1', 'teaser2', 'teaser3', 'teaser4', 'teaser5', 'teaser6'] as const;

/**
 * A short line beside the closed Parky button ("Hey, ich bin Parky – klick mich an!"), at most
 * twice a session and never once Parky was opened or a line was closed. A press on the line opens
 * Parky. Loaded only when the button is drawn, so its strings stay out of the page's chrome.
 */
export function AssistantTeaser({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('assistant');
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    const lines = TEASER_KEYS.map((key) => t(key));
    let shown = teasersShown();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = () => {
      if (shown >= TEASER_SCHEDULE_MS.length) return;
      timers.push(
        setTimeout(() => {
          shown += 1;
          setTeasersShown(shown);
          setLine(lines[Math.floor(Math.random() * lines.length)]);
          timers.push(
            setTimeout(() => {
              setLine(null);
              schedule();
            }, VISIBLE_MS)
          );
        }, TEASER_SCHEDULE_MS[shown])
      );
    };
    schedule();
    return () => timers.forEach(clearTimeout);
  }, [t]);

  const dismiss = () => {
    stopTeasers();
    setLine(null);
  };

  return (
    <div
      aria-live="polite"
      className={cn(
        'fixed right-[5.25rem] bottom-[max(1.75rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-[45] max-w-[min(15rem,calc(100vw-7rem))] sm:right-[5.75rem]',
        'planner-wide:right-[calc(var(--planner-inset,0px)+5.25rem)]',
        'origin-bottom-right transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
        line
          ? 'translate-x-0 scale-100 opacity-100'
          : 'pointer-events-none translate-x-2 scale-95 opacity-0'
      )}
    >
      {line && (
        <div className="bg-background/90 border-border/60 relative flex items-start gap-1 rounded-2xl rounded-br-sm border py-2 pr-1.5 pl-3 text-sm shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              dismiss();
              onOpen();
            }}
            className="text-left font-medium"
          >
            {line}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('close')}
            className="text-muted-foreground hover:text-foreground -mt-0.5 shrink-0 rounded-full p-0.5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
