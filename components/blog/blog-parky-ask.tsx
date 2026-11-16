'use client';

import { MessageCircle } from 'lucide-react';
import { useAssistantGateStatus } from '@/lib/assistant/use-assistant-gate';
import { askParky } from '@/lib/assistant/ask';
import { useParkyElementSeen } from '@/lib/hooks/use-parky-element-seen';

const CALLOUT = { element: 'callout', kind: 'post' } as const;

/**
 * The "Parky says" card's button: hands Parky a question about his tip and opens the chat. Only
 * where Parky shows for this visitor; until the gate decides, and for a visitor it left out,
 * nothing, so the card reads as a plain tip.
 */
export function BlogParkyAsk({ label, question }: { label: string; question: string }) {
  const on = useAssistantGateStatus() === 'on';
  const seen = useParkyElementSeen(on ? CALLOUT : undefined);
  if (!on) return null;
  return (
    <button
      ref={seen}
      type="button"
      onClick={() => askParky(question, CALLOUT)}
      className="text-primary hover:bg-primary/10 focus-visible:ring-primary -my-1.5 inline-flex cursor-pointer items-center gap-1 rounded-full border border-current/30 px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <MessageCircle className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
