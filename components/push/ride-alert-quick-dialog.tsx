'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { removeRideAlert, setRideAlert, type PushWriteError } from '@/lib/push/push-follows';
import { getRideAlertLocal } from '@/lib/push/push-follows-store';
import {
  DEFAULT_THRESHOLD_MIN,
  ThresholdMinutesInput,
  parseThresholdMinutes,
} from '@/components/push/threshold-minutes-input';

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
  const [thresholdRaw, setThresholdRaw] = useState(String(DEFAULT_THRESHOLD_MIN));
  const threshold = parseThresholdMinutes(thresholdRaw);
  const [alerted, setAlerted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<PushWriteError | null>(null);

  useEffect(() => {
    if (!open) return;
    const existing = getRideAlertLocal(attractionId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerted(!!existing);
    setThresholdRaw(String(existing?.thresholdMinutes ?? DEFAULT_THRESHOLD_MIN));
    setError(null);
  }, [open, attractionId]);

  const handleSave = async () => {
    // Defensive, not the real gate — the button below is already disabled
    // while `threshold` is null, but a cleared field must never reach the
    // API as the `Number('') === 0` it would otherwise silently become.
    if (threshold === null) return;
    setSaving(true);
    setError(null);
    const result = await setRideAlert(attractionId, threshold);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
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
                <ThresholdMinutesInput
                  value={thresholdRaw}
                  onChange={setThresholdRaw}
                  className="w-20 max-sm:h-11"
                  ariaLabel={t('thresholdInput')}
                  autoFocus
                />
                <span className="text-muted-foreground font-normal">{t('minutes')}</span>
              </div>
            </label>
            {error &&
              (error.reason === 'rate-limited' ? (
                <p className="text-destructive text-xs">
                  {t('errorRateLimited', { seconds: error.retryAfterSeconds })}
                </p>
              ) : (
                <p className="text-destructive text-xs">{t('error')}</p>
              ))}
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
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || removing || threshold === null}
          >
            {saving ? t('adding') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
