'use client';

import { useState } from 'react';
import { Ban, Check, Undo2, X } from 'lucide-react';
import { adminFetch, useInvalidateAdmin } from '../../_lib/api';
import { useCan } from '../../_app/session';
import { useToast } from '../../_ui/toast';

/** The address that blocks and releases an event name, under the admin proxy. */
const blockedPath = (name: string) =>
  `/api/admin/analytics/blocked-events/${encodeURIComponent(name)}`;

/**
 * Blocks an event name, or releases one that is blocked: a blocked name is not recorded any more and
 * stays in the list, flagged, so it can be released again. The API wants an editor or above, so the
 * button is not there for anybody else. Blocking asks once, inline, because a counter that has
 * stopped is easy to miss; releasing does not. The toast that follows carries the way back.
 */
export function BlockEventButton({ name, blocked }: { name: string; blocked: boolean }) {
  const allowed = useCan('editor');
  const invalidate = useInvalidateAdmin();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!allowed) return null;

  const apply = async (block: boolean) => {
    setBusy(true);
    setAsking(false);
    try {
      await adminFetch(blockedPath(name), { method: block ? 'PUT' : 'DELETE' });
      invalidate(['admin', 'raw']);
      toast.push({
        title: block ? 'Ereignis gesperrt' : 'Ereignis freigegeben',
        description: block ? `${name} wird nicht mehr gezählt.` : `${name} wird wieder gezählt.`,
        tone: 'success',
        action: { label: block ? 'Freigeben' : 'Sperren', onClick: () => apply(!block) },
      });
    } catch (error) {
      toast.push({
        title: 'Das hat nicht geklappt',
        description: error instanceof Error ? error.message : 'Anfrage fehlgeschlagen',
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  if (blocked) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void apply(false)}
        className="border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 max-sm:min-h-9"
      >
        <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
        Freigeben
      </button>
    );
  }

  if (asking) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground hidden lg:inline">Nicht mehr zählen?</span>
        <button
          type="button"
          onClick={() => void apply(true)}
          className="border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-colors max-sm:min-h-9"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Sperren
        </button>
        <button
          type="button"
          onClick={() => setAsking(false)}
          aria-label="Abbrechen"
          className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg max-sm:h-9 max-sm:w-9"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => setAsking(true)}
      className="border-border/60 text-muted-foreground hover:border-destructive/50 hover:text-destructive inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 max-sm:min-h-9"
    >
      <Ban className="h-3.5 w-3.5" aria-hidden="true" />
      Sperren
    </button>
  );
}
