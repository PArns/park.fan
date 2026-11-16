'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ASK_PATH, askParky } from '@/lib/assistant/ask';
import { useAssistantGateStatus } from '@/lib/assistant/use-assistant-gate';

/**
 * „Frag Parky“ under a still Parky in an empty state: opens the chat with `question`
 * (`askParky`, source `empty`). Only where Parky shows for this visitor; until the gate has
 * decided, and where he does not, the button keeps its line but stays hidden, so nothing moves.
 */
export function ParkyAskButton({ question }: { question: string }) {
  const t = useTranslations('parkyStill.empty');
  const on = useAssistantGateStatus() === 'on';
  return (
    <button
      type="button"
      onClick={() => askParky(question.replace(ASK_PATH, window.location.pathname), 'empty')}
      disabled={!on}
      aria-hidden={on ? undefined : true}
      className={cn(
        'text-primary hover:bg-primary/10 focus-visible:ring-primary mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none',
        !on && 'invisible'
      )}
    >
      <MessageCircle className="size-4" aria-hidden="true" />
      {t('ask')}
    </button>
  );
}
