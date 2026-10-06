'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

/** The day a bin was pressed for. */
export interface ClearDayTarget {
  parkSlug: string;
  date: string;
}

/** The question a planned day's bin asks before the day is deleted. */
export function ClearDayConfirm({
  pending,
  onDismiss,
  onConfirm,
}: {
  pending: ClearDayTarget | null;
  onDismiss: () => void;
  onConfirm: (parkSlug: string, date: string) => void;
}) {
  const t = useTranslations('planner');
  // Not `window.confirm`: an embedded view or a visitor who once ticked
  // "prevent this page from creating additional dialogs" gets `false` back
  // without seeing anything, and the bin then does nothing with no explanation.
  return (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      tone="destructive"
      icon={Trash2}
      title={t('clearDayTitle')}
      description={t('clearDayBody')}
      confirmLabel={t('clearDayAction')}
      cancelLabel={t('cancel')}
      onConfirm={() => {
        if (pending) onConfirm(pending.parkSlug, pending.date);
      }}
    />
  );
}
