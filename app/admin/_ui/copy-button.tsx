'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CopyState = 'idle' | 'copied' | 'failed';

const RESET_AFTER_MS = 2500;

/**
 * Copies `value` to the clipboard and says so for a moment. When the browser refuses (an
 * insecure context, a blocked permission) the button says that instead, so a secret shown once is
 * never left on screen believing it was copied.
 */
export function CopyButton({
  value,
  label = 'Kopieren',
  onCopied,
}: {
  value: string;
  label?: string;
  /** Runs after a successful copy. */
  onCopied?: () => void;
}) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function copy() {
    let next: CopyState = 'copied';
    try {
      await navigator.clipboard.writeText(value);
      onCopied?.();
    } catch {
      next = 'failed';
    }
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), RESET_AFTER_MS);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {state === 'copied' ? <Check className="text-emerald-400" /> : <Copy />}
      <span aria-live="polite">
        {state === 'copied' ? 'Kopiert' : state === 'failed' ? 'Bitte selbst kopieren' : label}
      </span>
    </Button>
  );
}
