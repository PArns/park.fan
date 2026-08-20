'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * What a crash in the admin looks like.
 *
 * There was no boundary here, so any render error blanked the whole route:
 * a season dialog handed an invalid date to the day picker, a payload came
 * back one shape short of what a page indexed into, and the screen went white
 * with the unsaved work in it. A tool used to edit two hundred parks should
 * fail like a tool — say what happened, keep the way out visible, and let the
 * person retry the one page rather than the session.
 *
 * `reset()` re-renders the segment, which is enough for a transient payload;
 * the link is for when it is not.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Nothing collects these yet. The console is where the person who hit it
    // will look, and the digest is what ties it to a server log line.
    console.error('[admin]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="border-destructive/30 bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-2xl border">
        <AlertTriangle className="h-6 w-6" />
      </span>

      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Diese Seite ist abgestürzt</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Der Rest des Admin läuft weiter. Wenn es nach dem Neuladen wieder passiert, ist es kein
          Ausrutscher, sondern ein Fehler.
        </p>
        {error.message && (
          <p className="text-muted-foreground bg-muted/40 mt-3 rounded-lg px-3 py-2 text-left font-mono text-xs break-words">
            {error.message}
            {error.digest && <span className="opacity-60"> · {error.digest}</span>}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Noch einmal
        </button>
        <Link
          href="/admin"
          className="border-border/60 hover:border-primary/50 rounded-lg border px-3 py-2 text-sm transition-colors"
        >
          Zur Übersicht
        </Link>
      </div>
    </div>
  );
}
