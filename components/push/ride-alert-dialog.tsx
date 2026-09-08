'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';
import { trackRideAlertRemoved, trackRideAlertSet } from '@/lib/analytics/umami';
import {
  fetchRideAlertsRemote,
  removeRideAlert,
  setRideAlert,
  type PushWriteError,
  type RideAlertRemote,
} from '@/lib/push/push-follows';
import {
  ThresholdMinutesInput,
  defaultThresholdFor,
  parseThresholdMinutes,
} from '@/components/push/threshold-minutes-input';
import { cn } from '@/lib/utils';

export interface RideAlertDialogAttraction {
  id: string;
  name: string;
  slug: string;
  /** Seeds the add-form's slider when this ride is selected — see `defaultThresholdFor`. */
  currentWaitTime?: number | null;
}

interface RideAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkName: string;
  /** Every ride in this park the "add" row may offer. */
  attractions: RideAlertDialogAttraction[];
}

/**
 * All of this park's wait-time alerts, and a form to add one — the central
 * entry point (`RideAlertsEntryButton`, in the park overview). A ride's own
 * card opens `RideAlertQuickDialog` instead, which needs no dropdown because
 * the ride is already fixed by which bell was clicked.
 *
 * Structure follows `PlannerFitAssistant`: `max-h-[92svh]` with the header
 * and footer `shrink-0` and only the middle scrolling, so a long list never
 * pushes the footer buttons off a phone screen — the outer dialog itself
 * never grows past the viewport.
 */
export function RideAlertDialog({
  open,
  onOpenChange,
  parkName,
  attractions,
}: RideAlertDialogProps) {
  const t = useTranslations('pushAlerts.rideDialog');
  const pushErrorMessage = usePushErrorMessage();
  // Three states, not two: a failed fetch must not render as "no alerts
  // for this park" — the add-form would then offer every ride again,
  // including ones this browser already watches.
  const [alerts, setAlerts] = useState<RideAlertRemote[] | 'loading' | 'error'>('loading');
  const [rawSelectedId, setRawSelectedId] = useState('');
  const [thresholdRaw, setThresholdRaw] = useState('');
  const threshold = parseThresholdMinutes(thresholdRaw);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<PushWriteError | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // A fresh open re-fetches from the server — this dialog is the "let me
    // see everything" surface, not a hot render path, so it always
    // reconciles rather than trusting the local mirror's snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts('loading');
    setAddError(null);
    void fetchRideAlertsRemote().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setAlerts('error');
        return;
      }
      const parkAttractionIds = new Set(attractions.map((a) => a.id));
      setAlerts(result.items.filter((alert) => parkAttractionIds.has(alert.attractionId)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const alertedIds = useMemo(
    () => new Set((Array.isArray(alerts) ? alerts : []).map((a) => a.attractionId)),
    [alerts]
  );
  const available = useMemo(
    () => attractions.filter((a) => !alertedIds.has(a.id)),
    [attractions, alertedIds]
  );

  // Derived, not synced via an effect: the select's value is whatever was
  // chosen if it is still available, otherwise the first option.
  const selectedId = useMemo(() => {
    if (rawSelectedId && available.some((a) => a.id === rawSelectedId)) return rawSelectedId;
    return available[0]?.id ?? '';
  }, [available, rawSelectedId]);

  // The slider itself CANNOT be derived the same way: it is also the
  // visitor's own input, so re-deriving it on every render would overwrite a
  // drag in progress. Reset it only when the selection actually changes —
  // including the two changes on a fresh open (the naive first attraction,
  // then the real one once `alerts` loads and narrows `available`).
  useEffect(() => {
    if (!selectedId) return;
    const attraction = attractions.find((a) => a.id === selectedId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThresholdRaw(String(defaultThresholdFor(attraction?.currentWaitTime)));
  }, [selectedId, attractions]);

  const handleAdd = async () => {
    const attraction = attractions.find((a) => a.id === selectedId);
    // Defensive, not the real gate — the button below is already disabled
    // while `threshold` is null, but a cleared field must never reach the
    // API as the `Number('') === 0` it would otherwise silently become.
    if (!attraction || threshold === null) return;
    setAdding(true);
    setAddError(null);
    const result = await setRideAlert(attraction.id, threshold);
    setAdding(false);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    // The server's own row, not a guess built from what this dropdown knew —
    // `outOfSeason`/`retired`/`parkId`/`parkSlug` are the API's, not ours.
    setAlerts((current) => [
      ...(Array.isArray(current) ? current : []).filter(
        (a) => a.attractionId !== attraction.id
      ),
      result.value,
    ]);
    // No manual reset here — the just-added ride drops out of `available`,
    // `selectedId` moves to whatever is next, and the effect above reseeds
    // the slider for it.
    trackRideAlertSet('central');
  };

  const handleRemove = async (attractionId: string) => {
    setRemovingId(attractionId);
    await removeRideAlert(attractionId);
    setAlerts((current) =>
      Array.isArray(current) ? current.filter((a) => a.attractionId !== attractionId) : current
    );
    setRemovingId(null);
    trackRideAlertRemoved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="shrink-0 border-b px-5 py-3 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-4 shrink-0" aria-hidden="true" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-snug">
            {t('subtitle', { park: parkName })}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            {alerts === 'loading' ? (
              <p className="text-muted-foreground text-xs">{t('loading')}</p>
            ) : alerts === 'error' ? (
              <p className="text-destructive text-xs leading-relaxed">{t('loadError')}</p>
            ) : alerts.length === 0 ? (
              <p className="text-muted-foreground text-xs leading-relaxed">{t('empty')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {alerts.map((alert) => (
                  <li
                    key={alert.attractionId}
                    className="border-border/60 flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{alert.attractionName}</p>
                        {/* Accepted at write time regardless (a visitor may alert on a
                            winter ride ahead of a trip) — surfaced here so a dormant
                            alert does not look identical to a live one. */}
                        {alert.outOfSeason && (
                          <Badge variant="secondary" className="shrink-0">
                            {t('outOfSeason')}
                          </Badge>
                        )}
                        {alert.retired && (
                          <Badge variant="secondary" className="shrink-0">
                            {t('retired')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t('thresholdLabel', { minutes: alert.thresholdMinutes })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(alert.attractionId)}
                      disabled={removingId === alert.attractionId}
                      aria-label={t('remove', { name: alert.attractionName })}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {available.length > 0 && (
              <div
                className={cn(
                  'flex flex-col gap-2',
                  alerts !== 'loading' && 'border-border/60 border-t pt-4'
                )}
              >
                <p className="text-xs font-medium">{t('addTitle')}</p>
                <select
                  value={selectedId}
                  onChange={(e) => setRawSelectedId(e.target.value)}
                  aria-label={t('selectRide')}
                  className="border-input h-9 min-w-0 rounded-md border bg-transparent px-3 text-sm shadow-xs max-sm:h-11"
                >
                  {available.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">{t('thresholdInput')}</span>
                  <ThresholdMinutesInput
                    value={thresholdRaw}
                    onChange={setThresholdRaw}
                    ariaLabel={t('thresholdInput')}
                    minutesLabel={t('minutes')}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={!selectedId || adding || threshold === null}
                  size="sm"
                  className="self-start"
                >
                  {adding ? t('adding') : t('add')}
                </Button>
                {addError && (
                  <p className="text-destructive text-xs leading-snug">
                    {pushErrorMessage(addError)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-3 sm:px-6">
          <Link href="/alerts" className="text-primary text-xs hover:underline">
            {t('viewAll')}
          </Link>
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
