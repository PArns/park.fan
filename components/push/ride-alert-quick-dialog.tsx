'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlannerPanelPhoto } from '@/components/planner/planner-panel-photo';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';
import { PushDialogHero } from '@/components/push/push-dialog-hero';
import { trackRideAlertRemoved, trackRideAlertSet } from '@/lib/analytics/umami';
import { removeRideAlert, setRideAlert, type PushWriteError } from '@/lib/push/push-follows';
import { getRideAlertLocal } from '@/lib/push/push-follows-store';
import {
  ThresholdMinutesInput,
  defaultThresholdFor,
  maxThresholdFor,
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
  const pushErrorMessage = usePushErrorMessage();
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
      {/* `isolate`, never `relative`. What the photo below needs is a STACKING
          CONTEXT — its layer is `-z-10`, and without one the negative index
          keeps going and the picture disappears behind the dialog's own
          `bg-background`, which is the trap `PlannerPanelPhoto` documents for
          `SheetContent`. `relative` supplies one too, and costs the dialog its
          position: the base `DialogContent` is `fixed top-1/2 left-1/2`, and
          `cn()` merges the two as one conflict group, so the override won and
          took `fixed` with it. The dialog then laid out in normal document
          flow — measured at y=6907 on a park page, i.e. six screens below the
          fold — while the overlay still covered the window. Pressing a ride's
          bell blurred the page and showed nothing, with no error anywhere, and
          a test that asserts the dialog EXISTS passes the whole time. */}
      <DialogContent
        showCloseButton={false}
        className="isolate flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <PlannerPanelPhoto src={backgroundImage} position={objectPosition} />
        <PushDialogHero
          icon={Bell}
          title={attractionName}
          description={t('soloSubtitle', { park: parkName })}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">{t('thresholdInput')}</span>
              <ThresholdMinutesInput
                value={thresholdRaw}
                onChange={setThresholdRaw}
                ariaLabel={t('thresholdInput')}
                minutesLabel={t('minutes')}
                max={maxThresholdFor(currentWaitTime)}
              />
            </div>
            <p className="text-muted-foreground text-[11px] leading-snug">{t('todayOnly')}</p>
            {error && (
              <p className="text-destructive text-xs leading-snug">{pushErrorMessage(error)}</p>
            )}
          </div>
        </div>

        {/* The link is not one of the actions and never gives way to one: it
            used to be the `alerted` branch's else, so the way to "meine
            Alarme" disappeared for exactly the person who has some. Same
            split as the show dialog — navigation on the left, this ride's
            own actions on the right. */}
        <div className="border-border/60 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t px-5 py-3 sm:px-6">
          <Link href="/alerts" className="text-primary text-xs whitespace-nowrap hover:underline">
            {t('viewAll')}
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {alerted && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={removing || saving}
              >
                {t('removeShort')}
              </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
