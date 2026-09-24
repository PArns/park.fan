'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, Check, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { PlannerRideThumb } from '@/components/planner/planner-ride-thumb';
import { usePushErrorMessage } from '@/components/push/use-push-error-message';
import { PushDialogHero } from '@/components/push/push-dialog-hero';
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
  maxThresholdFor,
  parseThresholdMinutes,
} from '@/components/push/threshold-minutes-input';
import {
  filterRideAlertPickerRows,
  resolveRideAlertSelection,
  rideAlertPickerRows,
} from '@/lib/push/ride-alert-picker';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { cn } from '@/lib/utils';

export interface RideAlertDialogAttraction {
  id: string;
  name: string;
  slug: string;
  /** Seeds the add-form's slider when this ride is selected — see `defaultThresholdFor`. */
  currentWaitTime?: number | null;
  /** The ride's photo for its row in the picker — the same fields `PlannerRideThumb` reads. */
  backgroundImage?: string | null;
  backgroundPosition?: string;
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
  const locale = useLocale();
  const pushErrorMessage = usePushErrorMessage();
  // Three states, not two: a failed fetch must not render as "no alerts
  // for this park" — the add-form would then offer every ride again,
  // including ones this browser already watches.
  const [alerts, setAlerts] = useState<RideAlertRemote[] | 'loading' | 'error'>('loading');
  const [rawSelectedId, setRawSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [thresholdRaw, setThresholdRaw] = useState('');
  const threshold = parseThresholdMinutes(thresholdRaw);
  const [adding, setAdding] = useState(false);
  /**
   * The rides currently being removed — a set, not one key, and their failures keyed the same
   * way. Both for the reason `usePushFollowRemoval` documents for the other two surfaces: as a
   * single slot, pressing X on a second ride re-enabled the first row's button mid-flight and
   * erased the "still armed" line belonging to a ride that really is still armed. This list is
   * every alert in the park, so two presses in a row is the ordinary case rather than the odd one.
   *
   * They are the dialog's own state instead of that hook because this surface holds its own
   * `alerts` list rather than the shared query cache — it filters the server's answer down to
   * this park, which is what the add-form's dropdown reads.
   */
  const [removingIds, setRemovingIds] = useState<readonly string[]>([]);
  const [addError, setAddError] = useState<PushWriteError | null>(null);
  /** Beside `addError`, which is about the form: these are about rows. */
  const [removeErrors, setRemoveErrors] = useState<Readonly<Record<string, PushWriteError>>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // A fresh open re-fetches from the server — this dialog is the "let me
    // see everything" surface, not a hot render path, so it always
    // reconciles rather than trusting the local mirror's snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts('loading');
    setAddError(null);
    setRemoveErrors({});
    setQuery('');
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
  const rows = useMemo(
    () => rideAlertPickerRows(attractions, alertedIds, locale),
    [attractions, alertedIds, locale]
  );
  const visibleRows = useMemo(() => filterRideAlertPickerRows(rows, query), [rows, query]);

  // Derived, not synced via an effect: the visitor's pick while it is still on
  // offer, otherwise the first ride that can take an alert at all. Resolved
  // against every row, not the filtered ones, so typing in the search field
  // never changes which ride the slider below belongs to.
  const selectedId = useMemo(
    () => resolveRideAlertSelection(rows, rawSelectedId),
    [rows, rawSelectedId]
  );

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
      ...(Array.isArray(current) ? current : []).filter((a) => a.attractionId !== attraction.id),
      result.value,
    ]);
    // No manual reset here — the just-added ride drops out of `rows`,
    // `selectedId` moves to whatever is next, and the effect above reseeds
    // the slider for it.
    trackRideAlertSet('central');
  };

  const handleRemove = async (attractionId: string) => {
    setRemovingIds((current) =>
      current.includes(attractionId) ? current : [...current, attractionId]
    );
    setRemoveErrors((current) => {
      if (!(attractionId in current)) return current;
      const { [attractionId]: _gone, ...rest } = current;
      return rest;
    });
    const result = await removeRideAlert(attractionId);
    setRemovingIds((current) => current.filter((id) => id !== attractionId));
    // The row leaves this list only where the server said it left the database. Dropping it on
    // a 500 would put the ride back in the add-form's dropdown while its alert is still armed,
    // so the next press would try to set an alert this browser already has.
    if (!result.ok) {
      setRemoveErrors((current) => ({ ...current, [attractionId]: result.error }));
      return;
    }
    setAlerts((current) =>
      Array.isArray(current) ? current.filter((a) => a.attractionId !== attractionId) : current
    );
    trackRideAlertRemoved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // Radix focuses the first tabbable child on open, which is now the ride
        // search whenever this park has no alerts yet. On a touch screen that
        // raises the keyboard over half the dialog before anybody asked to type,
        // so there the focus stays on the dialog itself (Radix's own fallback
        // when the default is prevented). A keyboard user still lands in the field.
        onOpenAutoFocus={(event) => {
          if (window.matchMedia?.('(pointer: coarse)').matches) event.preventDefault();
        }}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <PushDialogHero
          icon={Bell}
          title={t('title')}
          description={t('subtitle', { park: parkName })}
        />

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
                      {/* Beside the alert it is about — this list can be a dozen rides long, and
                          a sentence under the whole list would name none of them. `role="alert"`
                          because it appears in response to a press and nothing moves the focus
                          to it. */}
                      {removeErrors[alert.attractionId] && (
                        <p role="alert" className="text-destructive mt-1 text-xs leading-snug">
                          {pushErrorMessage(removeErrors[alert.attractionId])}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(alert.attractionId)}
                      disabled={removingIds.includes(alert.attractionId)}
                      aria-label={t('remove', { name: alert.attractionName })}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {rows.length > 0 && (
              <div
                className={cn(
                  'flex flex-col gap-2',
                  alerts !== 'loading' && 'border-border/60 border-t pt-4'
                )}
              >
                <p className="text-xs font-medium">{t('addTitle')}</p>
                {/* The list filters itself (`shouldFilter={false}`): cmdk's own
                    matcher scores fuzzy subsequences, so "tar" would also find
                    rides that merely contain a t, an a and an r in that order. */}
                <Command
                  shouldFilter={false}
                  label={t('selectRide')}
                  className="border-input border bg-transparent **:data-[slot=command-input-wrapper]:h-11 **:data-[slot=command-input-wrapper]:gap-2 **:data-[slot=command-input-wrapper]:px-3 sm:**:data-[slot=command-input-wrapper]:h-10 [&_[data-slot=command-input-wrapper]_svg]:size-4"
                >
                  <CommandInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t('searchRide')}
                    className="h-11 py-0 sm:h-10"
                  />
                  <CommandList className="max-h-44 sm:max-h-56">
                    <CommandEmpty className="text-muted-foreground px-3 py-4 text-center text-xs">
                      {t('noRideFound')}
                    </CommandEmpty>
                    {visibleRows.map(({ attraction, selectable }) => {
                      const wait =
                        attraction.currentWaitTime == null
                          ? null
                          : roundWaitTo5(attraction.currentWaitTime);
                      const picked = attraction.id === selectedId;
                      return (
                        <CommandItem
                          key={attraction.id}
                          value={attraction.id}
                          disabled={!selectable}
                          onSelect={() => setRawSelectedId(attraction.id)}
                          aria-current={picked ? 'true' : undefined}
                          className={cn('m-1 gap-2.5 rounded-md', picked && 'bg-primary/10')}
                        >
                          <PlannerRideThumb
                            src={attraction.backgroundImage}
                            position={attraction.backgroundPosition}
                            size={8}
                          />
                          <span className="min-w-0 flex-1 truncate">{attraction.name}</span>
                          {!selectable ? (
                            <span className="text-muted-foreground shrink-0 text-xs">
                              {t('noQueueNow')}
                            </span>
                          ) : wait !== null ? (
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}>
                                {wait}
                              </span>
                              <span className="text-muted-foreground ml-1 text-xs font-normal">
                                {t('minutes')}
                              </span>
                            </span>
                          ) : null}
                          {picked && <Check className="text-primary size-4" aria-hidden="true" />}
                        </CommandItem>
                      );
                    })}
                  </CommandList>
                </Command>
                {/* No slider while no ride is picked — which happens only when
                    every ride left in the list is too short a queue for an alert.
                    A track drawn for nothing would read as a choice. */}
                {selectedId && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">{t('thresholdInput')}</span>
                    <ThresholdMinutesInput
                      value={thresholdRaw}
                      onChange={setThresholdRaw}
                      ariaLabel={t('thresholdInput')}
                      minutesLabel={t('minutes')}
                      // The cap follows the picker: each ride in the list carries
                      // its own reading, so switching from a 20-minute ride to a
                      // 120-minute one re-opens the top of the track.
                      max={maxThresholdFor(
                        attractions.find((a) => a.id === selectedId)?.currentWaitTime
                      )}
                    />
                  </div>
                )}
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

        <div className="border-border/60 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t px-5 py-3 sm:px-6">
          <Link href="/alerts" className="text-primary text-xs whitespace-nowrap hover:underline">
            {t('viewAll')}
          </Link>
          <Button
            className="ml-auto shrink-0"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
