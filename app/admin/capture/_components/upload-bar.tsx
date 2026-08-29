'use client';

import { CloudUpload, ExternalLink, GitPullRequest, Loader2 } from 'lucide-react';

import type { ActiveUpload } from '../_lib/types';

/**
 * What has happened to the photographs so far, pinned to the bottom of the screen.
 *
 * It is the only place the pull request is reachable from, and that is deliberate:
 * the merge is done on GitHub, from the phone, at the end of a session, and a link
 * that scrolls away with the list is a link nobody finds when they want it.
 *
 * The queue count is the part that matters. A photograph that failed to upload has
 * to be visibly somewhere, or the only honest reading of a silent screen is that
 * the picture is gone.
 */
export function UploadBar({
  active,
  queued,
  draining,
  pullRequest,
  onDrain,
}: {
  active: ActiveUpload[];
  queued: number;
  draining: boolean;
  pullRequest: string | null;
  onDrain: () => void;
}) {
  const inFlight = active.filter(
    (entry) => entry.state.kind === 'reading' || entry.state.kind === 'uploading'
  ).length;
  const done = active.filter((entry) => entry.state.kind === 'done').length;

  if (!inFlight && !done && !queued && !pullRequest) return null;

  return (
    <div className="border-border/60 bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl">
      {/* The safe-area inset keeps the row clear of the iPhone's home indicator,
          which otherwise sits exactly on top of the pull-request link. */}
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="text-muted-foreground min-w-0 flex-1 text-xs">
          {inFlight > 0 && (
            <span className="text-primary flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {inFlight} unterwegs
            </span>
          )}
          {inFlight === 0 && done > 0 && <span>{done} hochgeladen</span>}
          {queued > 0 && (
            <span className="mt-0.5 flex items-center gap-1.5 text-amber-400">
              <CloudUpload className="h-3.5 w-3.5" />
              {queued} {queued === 1 ? 'wartet' : 'warten'} auf Netz
            </span>
          )}
        </div>

        {queued > 0 && (
          <button
            type="button"
            onClick={onDrain}
            disabled={draining}
            className="border-border/70 bg-muted/40 min-h-11 shrink-0 rounded-xl border px-3 text-xs font-medium disabled:opacity-50"
          >
            {draining ? 'Sendet…' : 'Jetzt senden'}
          </button>
        )}

        {pullRequest && (
          <a
            href={pullRequest}
            target="_blank"
            rel="noreferrer"
            className="border-primary/40 bg-primary/15 text-primary flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium"
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            Pull Request
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        )}
      </div>
    </div>
  );
}
