'use client';

import { useState } from 'react';
import { ExternalLink, GitPullRequest, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveBarProps {
  onSave: () => Promise<{ ok: boolean; url?: string; message?: string }>;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * Sticky-bottom action bar: kicks off the "save to a branch + open PR" flow
 * and surfaces the resulting PR URL inline. Disabled with a clear reason when
 * required fields (title/slug/author/body) aren't filled yet.
 */
export function SaveBar({ onSave, disabled, disabledReason }: SaveBarProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url?: string; message?: string; ok: boolean } | null>(null);

  const handle = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await onSave();
      setResult(r);
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky bottom-4 z-10 mt-8">
      {/* Soft gradient glow behind the bar so it lifts off the page edge. */}
      <div
        aria-hidden
        className="from-primary/15 via-primary/5 to-primary/15 pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r opacity-80 blur-md"
      />
      <div className="border-border/70 bg-background/90 relative flex items-center justify-between gap-4 rounded-2xl border px-5 py-3 backdrop-blur-lg">
        <div className="min-w-0 flex-1 truncate text-sm">
          {result?.url ? (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              PR opened — open on GitHub
            </a>
          ) : result?.message ? (
            <span className={result.ok ? 'text-emerald-500' : 'text-red-400'}>
              {result.message}
            </span>
          ) : disabled ? (
            <span className="text-muted-foreground">
              {disabledReason ?? 'Fill the required fields to save.'}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Ready when you are — saving opens a draft PR against{' '}
              <code className="bg-muted/60 rounded px-1 py-0.5 font-mono text-xs">main</code>.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handle}
          disabled={loading || disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all',
            disabled
              ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
              : 'from-primary to-primary/80 text-primary-foreground bg-gradient-to-br shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.99]'
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitPullRequest className="h-4 w-4" />
          )}
          {loading ? 'Opening PR…' : 'Save & open PR'}
        </button>
      </div>
    </div>
  );
}
