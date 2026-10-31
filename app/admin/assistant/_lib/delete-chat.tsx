'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { adminFetch, useInvalidateAdmin } from '../../_lib/api';
import { useToast } from '../../_ui/toast';
import { ASSISTANT_API } from './assistant';

/**
 * Deletes one chat with its messages after asking, from the list or the chat's own page. Feedback
 * sent from the chat stays and only loses its link. `onDeleted` runs after the API said yes, e.g.
 * to leave a page that no longer exists.
 */
export function DeleteChatButton({
  id,
  label,
  onDeleted,
  compact = false,
}: {
  id: string;
  /** What the dialog names: the first question, or the date. */
  label: string;
  onDeleted?: () => void;
  /** An icon alone, for a list row. */
  compact?: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminFetch(`${ASSISTANT_API}/conversations/${id}`, { method: 'DELETE' });
      // The list, the overview's counts and the chat itself all change.
      invalidate(['admin', 'raw']);
      toast.push({ title: 'Chat gelöscht', tone: 'success' });
      onDeleted?.();
    } catch (error) {
      toast.push({
        title: 'Nicht gelöscht',
        description: (error as Error).message,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() => setAsking(true)}
        aria-label="Chat löschen"
        title="Chat löschen"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        {!compact && <span>Löschen</span>}
      </Button>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        icon={Trash2}
        tone="destructive"
        title="Chat löschen?"
        description={`„${label}“ wird mit allen Nachrichten gelöscht. Feedback aus diesem Chat bleibt erhalten.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={() => void remove()}
      />
    </>
  );
}
