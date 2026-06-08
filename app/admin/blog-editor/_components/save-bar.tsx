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
    <div className="border-border/60 bg-background/80 sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md">
      <div className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
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
          <span className={result.ok ? 'text-emerald-500' : 'text-red-400'}>{result.message}</span>
        ) : disabled ? (
          (disabledReason ?? 'Fill the required fields to save.')
        ) : (
          'Ready when you are — saving opens a draft PR against main.'
        )}
      </div>
      <button
        type="button"
        onClick={handle}
        disabled={loading || disabled}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all',
          disabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
            : 'from-primary to-primary/80 text-primary-foreground bg-gradient-to-br hover:shadow-primary/30 hover:scale-[1.02]'
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
  );
}
