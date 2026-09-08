'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlannerPanelPhoto } from '@/components/planner/planner-panel-photo';
import { trackRideAlertRemoved, trackRideAlertSet } from '@/lib/analytics/umami';
import { removeRideAlert, setRideAlert, type PushWriteError } from '@/lib/push/push-follows';
import { getRideAlertLocal } from '@/lib/push/push-follows-store';
import {
  ThresholdMinutesInput,
  defaultThresholdFor,
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
  /** The card's own photo, if it has one — same picture, same crop, no second fetch. */
  backgroundImage?: string | null;
  objectPosition?: string;
  /** The card's own current reading, if any — seeds a new alert's slider ten minutes under it. */
  currentWaitTime?: number | null;
}

/**
 * A ride's OWN alert, opened from its card's bell — no ride picker, because
 * clicking a specific ride's bell already answered "which ride". The full
 * cross-ride list + add form lives in `RideAlertDialog` instead (the park
 * overview's central entry point); `attraction-card.tsx` has no access to
 * its park's sibling rides to build that dropdown, and this is the simpler
 * dialog anyway when the ride is already fixed.
 *
 * Carries the same photo the card itself was drawn with — `PlannerPanelPhoto`
 * is the trip planner's own "ride/park picture behind a reading surface"
 * component, reused rather than redrawn (see that file for the contrast
 * budget and why the wash is heaviest at the head and foot). A card with no
 * photo of its own falls back to the same watermark ground the planner shows
 * for the 95%+ of parks the media database has no picture for.
 */
export function RideAlertQuickDialog({
  open,
  onOpenChange,
  attractionId,
  attractionName,
  parkName,
  onSaved,
  backgroundImage,
  objectPosition,
  currentWaitTime,
}: RideAlertQuickDialogProps) {
  const t = useTranslations('pushAlerts.rideDialog');
  const [thresholdRaw, setThresholdRaw] = useState(() =>
    String(defaultThresholdFor(currentWaitTime))
  );
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
    setThresholdRaw(String(existing?.thresholdMinutes ?? defaultThresholdFor(currentWaitTime)));
    setError(null);
    // `currentWaitTime` deliberately excluded — it re-renders every live poll while
    // the dialog may already be open, and a slider jumping under someone's thumb
    // because the queue just ticked is worse than seeding it once per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    trackRideAlertSet('card');
  };

  const handleRemove = async () => {
    setRemoving(true);
    await removeRideAlert(attractionId);
    setRemoving(false);
    setAlerted(false);
    onSaved(false);
    onOpenChange(false);
    trackRideAlertRemoved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <PlannerPanelPhoto src={backgroundImage} position={objectPosition} />
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">{t('thresholdInput')}</span>
              <ThresholdMinutesInput
                value={thresholdRaw}
                onChange={setThresholdRaw}
                ariaLabel={t('thresholdInput')}
                minutesLabel={t('minutes')}
              />
            </div>
            <p className="text-muted-foreground text-[11px] leading-snug">{t('todayOnly')}</p>
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
