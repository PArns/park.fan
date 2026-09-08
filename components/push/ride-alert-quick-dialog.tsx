'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { removeRideAlert, setRideAlert } from '@/lib/push/push-follows';
import { getRideAlertLocal } from '@/lib/push/push-follows-store';

const DEFAULT_THRESHOLD_MIN = 20;
const MIN_THRESHOLD_MIN = 1;
const MAX_THRESHOLD_MIN = 240;

interface RideAlertQuickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attractionId: string;
  attractionName: string;
  parkName: string;
  /** Reported back once a save/remove succeeds, so the bell can update its own icon. */
  onSaved: (alerted: boolean) => void;
}

/**
 * A ride's OWN alert, opened from its card's bell — no ride picker, because
 * clicking a specific ride's bell already answered "which ride". The full
 * cross-ride list + add form lives in `RideAlertDialog` instead (the park
 * overview's central entry point); `attraction-card.tsx` has no access to
 * its park's sibling rides to build that dropdown, and this is the simpler
 * dialog anyway when the ride is already fixed.
 */
export function RideAlertQuickDialog({
  open,
  onOpenChange,
  attractionId,
  attractionName,
  parkName,
  onSaved,
}: RideAlertQuickDialogProps) {
  const t = useTranslations('pushAlerts.rideDialog');
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD_MIN);
  const [alerted, setAlerted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const existing = getRideAlertLocal(attractionId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerted(!!existing);
    setThreshold(existing?.thresholdMinutes ?? DEFAULT_THRESHOLD_MIN);
    setError(false);
  }, [open, attractionId]);

  const handleSave = async () => {
    setSaving(true);
    setError(false);
    const ok = await setRideAlert(attractionId, threshold);
    setSaving(false);
    if (!ok) {
      setError(true);
      return;
    }
    setAlerted(true);
    onSaved(true);
    onOpenChange(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await removeRideAlert(attractionId);
    setRemoving(false);
    setAlerted(false);
    onSaved(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <div className="shrink-0 border-b px-5 py-3 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-4 shrink-0" aria-hidden="true" />
            {attractionName}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-snug">
            {t('soloSubtitle', { park: parkName })}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-medium">
              {t('thresholdInput')}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={MIN_THRESHOLD_MIN}
                  max={MAX_THRESHOLD_MIN}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-20 max-sm:h-11"
                  autoFocus
                />
                <span className="text-muted-foreground font-normal">{t('minutes')}</span>
              </div>
            </label>
            {error && <p className="text-destructive text-xs">{t('error')}</p>}
          </div>
        </div>

        <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-3 sm:px-6">
          {alerted ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={removing || saving}
            >
              {t('removeShort')}
            </Button>
          ) : (
            <Link href="/alerts" className="text-primary text-xs hover:underline">
              {t('viewAll')}
            </Link>
          )}
          <Button type="button" size="sm" onClick={handleSave} disabled={saving || removing}>
            {saving ? t('adding') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
