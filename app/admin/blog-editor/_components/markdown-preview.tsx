'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Read-only `.md` source view that lives side by side with the editor. */
export function MarkdownPreview({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-border/60 bg-background/40 sticky top-4 flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border backdrop-blur-sm">
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2.5">
        <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          .md source
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            copied
              ? 'bg-emerald-500/15 text-emerald-500'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-foreground/90 flex-1 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
        {value || (
          <span className="text-muted-foreground/50">
            # Untitled{'\n\n'}Start writing to the left.
          </span>
        )}
      </pre>
    </div>
  );
}
