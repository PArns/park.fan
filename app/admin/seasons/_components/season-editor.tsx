'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  CalendarDays,
  CalendarRange,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Ticket,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SEASON_STATUS_TONE } from '@/components/parks/season-headline';
import { SeasonKindIcon } from '@/components/parks/season-kind-icon';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import { formatAgo } from '../../_lib/format';
import {
  SEASON_KIND_LABELS,
  SEASON_KIND_OPTIONS,
  SEASON_LIMITS,
  SEASON_STATUS_LABELS,
  SEASON_STATUS_OPTIONS,
  datesOutsideRange,
  formatSeasonRange,
  fromDateTimeInput,
  isRealDay,
  parseSeasonDates,
  rangeDays,
  seasonBody,
  seasonDraft,
  seasonPatch,
  seasonProblems,
  toDateTimeInput,
  uniqueDays,
  weekdayDates,
  type SeasonDraft,
} from '../../_lib/seasons';
import type {
  AdminAttractionListItem,
  ParkSeason,
  ParkSeasonKind,
  ParkSeasonStatus,
} from '../../_lib/types';
import { parkCatalogOptions, useParkCatalog } from '../../_lib/use-park-catalog';
import {
  Field,
  MultiSearchSelect,
  SearchSelect,
  Select,
  Switch,
  TextArea,
  TextInput,
  ToggleChips,
  UrlInput,
  useFieldId,
} from '../../_ui/controls';
import { DayCalendar } from '../../_ui/day-calendar';
import { Chip, EmptyState, SCROLLING_DIALOG, Tile } from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';

/**
 * Seasons as they are shaped: a range for the outer bounds, plus optional picked days, because an
 * event like Fright Nights runs on weekends inside its range, not every day. The row, the park's
 * list and the form are shared by the park's „Saisons“ tab and `/admin/seasons`.
 */

function seasonTitle(season: Pick<ParkSeason, 'name' | 'kind'>): string {
  return season.name || SEASON_KIND_LABELS[season.kind] || season.kind;
}

/**
 * One season as a list shows it: name, status, range, hours, price, rides and source, with the
 * button that opens the form. `showPark` leads with the park's name and links to it, for the list
 * across every park.
 */
export function SeasonRow({
  season,
  showPark = false,
  canEdit,
  onOpen,
}: {
  season: ParkSeason;
  showPark?: boolean;
  canEdit: boolean;
  onOpen: () => void;
}) {
  const title = seasonTitle(season);
  const iconButton = 'text-muted-foreground hover:text-foreground rounded p-1.5 max-sm:p-3';

  return (
    <li className="border-border/60 bg-card/40 flex items-start gap-3 rounded-lg border p-3">
      <span className="bg-muted/50 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        <SeasonKindIcon kind={season.kind} className="size-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={onOpen}
            className="hover:text-primary min-w-0 text-left text-sm font-medium"
          >
            {showPark ? (season.park?.name ?? 'Unbekannter Park') : title}
          </button>
          {showPark && <span className="text-muted-foreground min-w-0 text-xs">{title}</span>}
          <Chip className={SEASON_STATUS_TONE[season.status]}>
            {SEASON_STATUS_LABELS[season.status] ?? season.status}
          </Chip>
          {season.separateTicket && (
            <Chip>
              <Ticket className="h-3 w-3" aria-hidden /> Extra-Ticket
            </Chip>
          )}
          {season.dates && season.dates.length > 0 && (
            <Chip>
              <CalendarDays className="h-3 w-3" aria-hidden /> {season.dates.length} Termine
            </Chip>
          )}
        </div>

        <p className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          <span>{formatSeasonRange(season.startDate, season.endDate)}</span>
          {(season.opensAt || season.closesAt) && (
            <span>
              {season.opensAt ?? '?'}–{season.closesAt ?? '?'} Uhr
            </span>
          )}
          {season.priceFrom && (
            <span>
              ab {season.priceFrom} {season.priceCurrency ?? ''}
            </span>
          )}
          {season.attractionIds && season.attractionIds.length > 0 && (
            <span>
              {season.attractionIds.length === 1
                ? '1 Fahrgeschäft'
                : `${season.attractionIds.length} Fahrgeschäfte`}
            </span>
          )}
          {season.confirmedAt && <span>geprüft {formatAgo(season.confirmedAt)}</span>}
        </p>

        {season.note && (
          <p className="text-muted-foreground line-clamp-2 text-xs italic">{season.note}</p>
        )}

        {season.sourceUrl ? (
          <a
            href={season.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary block truncate text-xs hover:underline"
          >
            {season.sourceUrl}
          </a>
        ) : (
          // An unconfirmed season with no source is the one a reader cannot act on: it says a park
          // will do something, on whose authority nobody recorded.
          season.status !== 'expected' && (
            <p className="flex items-center gap-1 text-xs text-amber-400">
              <TriangleAlert className="h-3 w-3" aria-hidden /> Ohne Quelle
            </p>
          )
        )}
      </div>

      <div className="-my-1 -mr-1 flex shrink-0">
        {showPark && (
          <Link
            href={`/admin/parks/${season.parkId}?tab=seasons`}
            aria-label={`${season.park?.name ?? 'Park'} öffnen`}
            title="Park öffnen"
            className={iconButton}
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${title} ${canEdit ? 'bearbeiten' : 'ansehen'}`}
          className={iconButton}
        >
          {canEdit ? (
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>
    </li>
  );
}

/** A park's seasons, newest first, each opening the form; editors also get „Saison anlegen“. */
export function SeasonList({
  parkId,
  parkName,
  seasons,
  canEdit,
}: {
  parkId: string;
  parkName: string;
  seasons: ParkSeason[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<ParkSeason | 'new' | null>(null);

  const sorted = useMemo(
    () => [...seasons].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [seasons]
  );

  return (
    <div className="space-y-3">
      {canEdit && (
        <Button size="sm" variant="outline" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Saison anlegen
        </Button>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Noch keine Saison hinterlegt"
          description="Halloween, Winterschließung, ein Wartungsfenster: alles, was der Park an bestimmten Tagen anders macht."
        />
      ) : (
        <ul className="space-y-2">
          {sorted.map((season) => (
            <SeasonRow
              key={season.id}
              season={season}
              canEdit={canEdit}
              onOpen={() => setEditing(season)}
            />
          ))}
        </ul>
      )}

      {editing && (
        <SeasonEditor
          season={editing === 'new' ? null : editing}
          parkId={parkId}
          parkName={parkName}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/** Monday first, as the day picker draws the week; values are `getUTCDay()` numbers. */
const WEEKDAYS = [
  { value: '1', label: 'Mo' },
  { value: '2', label: 'Di' },
  { value: '3', label: 'Mi' },
  { value: '4', label: 'Do' },
  { value: '5', label: 'Fr' },
  { value: '6', label: 'Sa' },
  { value: '0', label: 'So' },
];

/** The buttons that replace the picked days at once; weekdays are `getUTCDay()` numbers. */
const QUICK_PICKS: ReadonlyArray<{ label: string; all?: boolean; weekdays?: number[] }> = [
  { label: 'Alle', all: true },
  { label: 'Keine' },
  { label: 'Wochenenden', weekdays: [6, 0] },
  { label: 'Fr–So', weekdays: [5, 6, 0] },
];

/**
 * The form of one season, or of a new one: every field the API takes, its checks run while typing,
 * and the API's own refusal shown above the buttons. A new season without `parkId` asks for its
 * park first. Read-only below `editor`.
 */
export function SeasonEditor({
  season,
  parkId,
  parkName,
  canEdit,
  onClose,
}: {
  /** Null for a new season. */
  season: ParkSeason | null;
  /** The park a new season belongs to; null lets the form ask. */
  parkId: string | null;
  parkName?: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [park, setPark] = useState<string | null>(season?.parkId ?? parkId);
  const [initial] = useState(() => seasonDraft(season, format(new Date(), 'yyyy-MM-dd')));
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // A second submit can arrive before the first one's re-render disables the button.
  const submitting = useRef(false);
  const ids = {
    park: useFieldId('season-park'),
    kind: useFieldId('season-kind'),
    name: useFieldId('season-name'),
    status: useFieldId('season-status'),
    start: useFieldId('season-start'),
    end: useFieldId('season-end'),
    opensAt: useFieldId('season-opens'),
    closesAt: useFieldId('season-closes'),
    price: useFieldId('season-price'),
    currency: useFieldId('season-currency'),
    rides: useFieldId('season-rides'),
    url: useFieldId('season-url'),
    sourceUrl: useFieldId('season-source'),
    confirmedAt: useFieldId('season-confirmed'),
    note: useFieldId('season-note'),
  };

  const update = (change: (current: SeasonDraft) => SeasonDraft) => {
    setDraft(change);
    setError(null);
  };
  const set = <K extends keyof SeasonDraft>(key: K, value: SeasonDraft[K]) =>
    update((current) => ({ ...current, [key]: value }));

  const choosePark = !season && parkId === null;
  const parks = useParkCatalog(choosePark);
  // With retired rides too, so a season that names one still shows its name.
  const rides = useAdminQuery<{ attractions: AdminAttractionListItem[] }>(
    adminKeys.parkAttractions(park ?? '', { params: 'includeRetired=true' }),
    park ? `/api/admin/content/parks/${park}/attractions?includeRetired=true` : null
  );
  const rideOptions = (rides.data?.attractions ?? []).map((ride) => ({
    value: ride.id,
    label: ride.name,
    hint: ride.retiredAt ? 'stillgelegt' : (ride.land ?? undefined),
  }));

  const problems = useMemo(() => seasonProblems(draft), [draft]);
  const body = useMemo(() => seasonBody(draft), [draft]);
  const patch = useMemo(() => (season ? seasonPatch(season, draft) : null), [season, draft]);
  const initialKey = useMemo(() => JSON.stringify(seasonBody(initial)), [initial]);
  const dirty = patch ? Object.keys(patch).length > 0 : JSON.stringify(body) !== initialKey;
  const valid = Object.keys(problems).length === 0 && park !== null;
  const canSave = canEdit && !busy && valid && (dirty || !season);

  const parkLabel =
    season?.park?.name ??
    parkName ??
    parks.data?.parks.find((entry) => entry.id === park)?.name ??
    null;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !canSave || !park) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      if (season) {
        await adminFetch(`/api/admin/content/seasons/${season.id}`, {
          method: 'PATCH',
          body: patch ?? {},
        });
      } else {
        await adminFetch(`/api/admin/content/parks/${park}/seasons`, { method: 'POST', body });
      }
      invalidate(adminKeys.park(park), adminKeys.seasons(), adminKeys.parks(), adminKeys.history());
      toast.push({ title: season ? 'Saison gespeichert' : 'Saison angelegt', tone: 'success' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function remove() {
    if (!season || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/content/seasons/${season.id}`, { method: 'DELETE' });
      invalidate(
        adminKeys.park(season.parkId),
        adminKeys.seasons(),
        adminKeys.parks(),
        adminKeys.history()
      );
      toast.push({ title: 'Saison gelöscht', tone: 'success' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
      setConfirmingDelete(false);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // Unsaved edits are not thrown away by a stray tap beside the dialog or an Escape: only
  // „Verwerfen“ and the close button leave them.
  const keep = dirty || busy;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent
        // The scroll padding is the sticky footer's height, so a focused field is scrolled above it.
        className={`${SCROLLING_DIALOG} scroll-pb-40 gap-0 p-0 sm:max-w-3xl sm:scroll-pb-28`}
        onInteractOutside={(event) => keep && event.preventDefault()}
        onEscapeKeyDown={(event) => keep && event.preventDefault()}
      >
        <form onSubmit={(event) => void save(event)} className="grid grid-cols-1">
          <DialogHeader className="px-4 pt-5 pr-12 pb-4 text-left sm:px-6">
            <DialogTitle className="leading-snug">
              {season ? seasonTitle(season) : 'Neue Saison'}
            </DialogTitle>
            <DialogDescription>
              {[parkLabel, season ? `geändert ${formatAgo(season.updatedAt)}` : null]
                .filter(Boolean)
                .join(' · ') ||
                'Der Zeitraum sind die äußeren Grenzen, die Termine darin sind optional.'}
            </DialogDescription>
            {!canEdit && (
              <p className="text-muted-foreground text-xs">
                Nur zum Lesen: Saisons ändert die Redaktion.
              </p>
            )}
          </DialogHeader>

          <fieldset
            disabled={!canEdit || busy}
            className="grid min-w-0 grid-cols-1 gap-4 px-4 pb-5 sm:px-6"
          >
            <Tile title="Grunddaten">
              {choosePark && (
                <Field
                  label="Park"
                  htmlFor={ids.park}
                  error={parks.isError ? 'Die Parkliste ließ sich nicht laden.' : null}
                >
                  <SearchSelect
                    id={ids.park}
                    value={park}
                    onValueChange={(next) => {
                      // Rides belong to their park; a new park starts without any.
                      if (next !== park) set('attractionIds', []);
                      setPark(next);
                    }}
                    options={parkCatalogOptions(parks.data?.parks ?? [])}
                    placeholder={parks.isLoading ? 'Parks werden geladen…' : 'Park wählen'}
                    searchPlaceholder="Park suchen…"
                    disabled={parks.isLoading || parks.isError}
                    fuzzy="park"
                  />
                </Field>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Art" htmlFor={ids.kind}>
                  <Select
                    id={ids.kind}
                    value={draft.kind}
                    allowEmpty={false}
                    onValueChange={(value) => value && set('kind', value as ParkSeasonKind)}
                    options={SEASON_KIND_OPTIONS}
                  />
                </Field>
                <Field label="Status" htmlFor={ids.status}>
                  <Select
                    id={ids.status}
                    value={draft.status}
                    allowEmpty={false}
                    onValueChange={(value) => value && set('status', value as ParkSeasonStatus)}
                    options={SEASON_STATUS_OPTIONS}
                  />
                </Field>
              </div>
              <Field
                label="Name"
                htmlFor={ids.name}
                error={problems.name}
                hint="Wie der Park es nennt. Leer zeigt die Seite den Namen der Art."
              >
                <TextInput
                  id={ids.name}
                  value={draft.name}
                  autoComplete="off"
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="z. B. Halloween Fright Nights"
                />
              </Field>
            </Tile>

            <Tile title="Zeitraum">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Von" htmlFor={ids.start} error={problems.startDate}>
                  <TextInput
                    id={ids.start}
                    type="date"
                    value={draft.startDate}
                    onChange={(event) => set('startDate', event.target.value)}
                  />
                </Field>
                <Field label="Bis" htmlFor={ids.end} error={problems.endDate}>
                  <TextInput
                    id={ids.end}
                    type="date"
                    value={draft.endDate}
                    onChange={(event) => set('endDate', event.target.value)}
                  />
                </Field>
                <Field
                  label="Öffnet"
                  htmlFor={ids.opensAt}
                  error={problems.opensAt}
                  hint="Ortszeit des Parks."
                >
                  <TextInput
                    id={ids.opensAt}
                    type="time"
                    value={draft.opensAt}
                    onChange={(event) => set('opensAt', event.target.value)}
                  />
                </Field>
                <Field
                  label="Schließt"
                  htmlFor={ids.closesAt}
                  error={problems.closesAt}
                  hint="Mitternacht ist 00:00."
                >
                  <TextInput
                    id={ids.closesAt}
                    type="time"
                    value={draft.closesAt}
                    onChange={(event) => set('closesAt', event.target.value)}
                  />
                </Field>
              </div>
              <SeasonDays
                dates={draft.dates}
                start={draft.startDate}
                end={draft.endDate}
                error={problems.dates ?? null}
                readOnly={!canEdit}
                onChange={(dates) => set('dates', dates)}
              />
            </Tile>

            <Tile title="Ticket">
              <Switch
                checked={draft.separateTicket}
                onCheckedChange={(next) => set('separateTicket', next)}
                label="Braucht ein eigenes Ticket"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preis ab" htmlFor={ids.price} error={problems.priceFrom}>
                  <TextInput
                    id={ids.price}
                    inputMode="decimal"
                    value={draft.priceFrom}
                    onChange={(event) => set('priceFrom', event.target.value)}
                    placeholder="53,50"
                  />
                </Field>
                <Field label="Währung" htmlFor={ids.currency} error={problems.priceCurrency}>
                  <TextInput
                    id={ids.currency}
                    value={draft.priceCurrency}
                    onChange={(event) => set('priceCurrency', event.target.value.toUpperCase())}
                    maxLength={3}
                    autoComplete="off"
                    placeholder="EUR"
                  />
                </Field>
              </div>
            </Tile>

            <Tile title="Fahrgeschäfte">
              <Field
                label="Betrifft"
                htmlFor={ids.rides}
                error={rides.isError ? 'Die Fahrgeschäfte ließen sich nicht laden.' : null}
                hint="Leer, wenn es um den ganzen Park geht. Sonst die Bahnen dieses Parks, um die es geht: ein Wartungsfenster, eine umgestaltete Bahn."
              >
                <MultiSearchSelect
                  id={ids.rides}
                  value={draft.attractionIds}
                  onChange={(value) => set('attractionIds', value)}
                  options={rideOptions}
                  placeholder={
                    !park
                      ? 'Erst den Park wählen'
                      : rides.isLoading
                        ? 'Fahrgeschäfte werden geladen…'
                        : 'Fahrgeschäft hinzufügen'
                  }
                  searchPlaceholder="Fahrgeschäft suchen…"
                  disabled={!park || rides.isLoading || rides.isError}
                  fuzzy="attraction"
                />
              </Field>
            </Tile>

            <Tile title="Quellen">
              <Field label="Seite des Parks" htmlFor={ids.url} error={problems.url}>
                <UrlInput
                  id={ids.url}
                  value={draft.url}
                  onChange={(event) => set('url', event.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field
                label="Quelle"
                htmlFor={ids.sourceUrl}
                error={problems.sourceUrl}
                hint="Wo diese Termine stehen. Eine Saison ist eine Behauptung über die Welt."
              >
                <UrlInput
                  id={ids.sourceUrl}
                  value={draft.sourceUrl}
                  onChange={(event) => set('sourceUrl', event.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field
                label="Zuletzt an der Quelle geprüft"
                htmlFor={ids.confirmedAt}
                error={problems.confirmedAt}
                hint="Wann jemand die Termine dort nachgelesen hat. Ein korrigierter Tippfehler ist keine Prüfung."
              >
                <div className="flex items-center gap-2">
                  <TextInput
                    id={ids.confirmedAt}
                    type="datetime-local"
                    value={toDateTimeInput(draft.confirmedAt)}
                    onChange={(event) => set('confirmedAt', fromDateTimeInput(event.target.value))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => set('confirmedAt', new Date().toISOString())}
                  >
                    Jetzt
                  </Button>
                </div>
              </Field>
              <Field label="Notiz" htmlFor={ids.note} error={problems.note}>
                <TextArea
                  id={ids.note}
                  value={draft.note}
                  onChange={(event) => set('note', event.target.value)}
                  placeholder="Was sonst niemand mehr weiß."
                />
              </Field>
            </Tile>
          </fieldset>

          {canEdit && (
            <div className="bg-background sticky bottom-0 z-10 grid gap-2.5 border-t border-white/[0.07] px-4 py-3 sm:px-6">
              {error && (
                <p role="alert" className="text-destructive text-xs">
                  {error}
                </p>
              )}
              {confirmingDelete && season ? (
                // A season is hand-researched and no undo covers its delete, so the second step
                // names what goes. In the page, since `window.confirm` returns false unseen when
                // embedded.
                <div className="space-y-2">
                  <p className="text-sm font-medium">Saison endgültig löschen?</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {[
                      seasonTitle(season),
                      formatSeasonRange(season.startDate, season.endDate),
                      season.dates?.length ? `${season.dates.length} Termine` : null,
                      season.sourceUrl ? 'mit Quelle' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    . Rückgängig machen lässt sich das nicht, unter „Änderungen“ bleibt die ganze
                    Saison verzeichnet.
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      autoFocus
                      onClick={() => setConfirmingDelete(false)}
                      disabled={busy}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void remove()}
                      disabled={busy}
                      className="bg-destructive hover:bg-destructive/90 text-white"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Endgültig löschen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {season && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmingDelete(true)}
                      disabled={busy}
                      className="text-destructive hover:text-destructive mr-auto"
                    >
                      <Trash2 className="h-4 w-4" /> Löschen
                    </Button>
                  )}
                  <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                    {dirty ? 'Verwerfen' : 'Schließen'}
                  </Button>
                  <Button type="submit" disabled={!canSave}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {season ? 'Speichern' : 'Anlegen'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The picked days of a season: off means every day of the range. On, the days come from the
 * calendar, from whole weekdays of the range, or from a pasted list, since a park publishes its
 * event nights as a calendar or a list, and fifty clicks copy neither.
 */
function SeasonDays({
  dates,
  start,
  end,
  error,
  readOnly,
  onChange,
}: {
  dates: string[] | null;
  start: string;
  end: string;
  error: string | null;
  readOnly: boolean;
  onChange: (dates: string[] | null) => void;
}) {
  const [pasted, setPasted] = useState('');
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const pasteId = useFieldId('season-dates-paste');
  const picked = dates ?? [];
  const range = isRealDay(start) && isRealDay(end) && start <= end;
  const outside = range ? datesOutsideRange(picked, start, end) : [];

  const pickedSet = new Set(picked);
  const fullWeekdays = WEEKDAYS.map((day) => day.value).filter((value) => {
    const days = weekdayDates(start, end, Number(value));
    return days.length > 0 && days.every((day) => pickedSet.has(day));
  });

  function toggleWeekdays(next: string[]) {
    const result = new Set(picked);
    for (const value of next.filter((day) => !fullWeekdays.includes(day))) {
      for (const day of weekdayDates(start, end, Number(value))) result.add(day);
    }
    for (const value of fullWeekdays.filter((day) => !next.includes(day))) {
      for (const day of weekdayDates(start, end, Number(value))) result.delete(day);
    }
    onChange(uniqueDays(result));
  }

  function addPasted() {
    const parsed = parseSeasonDates(pasted);
    const inRange = range ? parsed.dates.filter((day) => day >= start && day <= end) : [];
    const skipped = parsed.dates.filter((day) => !inRange.includes(day));
    onChange(uniqueDays([...picked, ...inRange]));
    setPasteNote(
      [
        `${inRange.length} ${inRange.length === 1 ? 'Termin' : 'Termine'} übernommen.`,
        skipped.length > 0 ? `Außerhalb des Zeitraums: ${skipped.join(', ')}.` : null,
        parsed.unreadable.length > 0 ? `Nicht lesbar: ${parsed.unreadable.join(', ')}.` : null,
      ]
        .filter(Boolean)
        .join(' ')
    );
    if (skipped.length === 0 && parsed.unreadable.length === 0) setPasted('');
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/[0.07] p-3">
      <Switch
        checked={dates !== null}
        onCheckedChange={(next) => onChange(next ? picked : null)}
        label="Läuft nur an bestimmten Tagen"
      />
      {dates !== null && (
        <Field
          label={
            picked.length === 0
              ? 'Noch kein Tag gewählt. Ohne Auswahl gilt der ganze Zeitraum.'
              : `${picked.length} ${picked.length === 1 ? 'Termin' : 'Termine'} von höchstens ${SEASON_LIMITS.dates}`
          }
          error={error}
        >
          <div className="space-y-3">
            {outside.length > 0 && !readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(picked.filter((day) => !outside.includes(day)))}
              >
                Termine außerhalb des Zeitraums entfernen
              </Button>
            )}
            {range && !readOnly && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div role="group" aria-label="Auswahl ersetzen" className="flex flex-wrap gap-1.5">
                  {QUICK_PICKS.map((quick) => (
                    <button
                      key={quick.label}
                      type="button"
                      onClick={() =>
                        onChange(
                          quick.weekdays
                            ? uniqueDays(
                                quick.weekdays.flatMap((weekday) =>
                                  weekdayDates(start, end, weekday)
                                )
                              )
                            : quick.all
                              ? rangeDays(start, end)
                              : []
                        )
                      }
                      className="text-muted-foreground hover:text-foreground min-h-9 rounded-lg border border-white/[0.09] px-2.5 text-xs font-medium transition-colors sm:min-h-7"
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
                <ToggleChips
                  label="Ganze Wochentage dazu oder weg"
                  options={WEEKDAYS}
                  value={fullWeekdays}
                  onChange={toggleWeekdays}
                />
              </div>
            )}
            {range && (
              <DayCalendar
                start={start}
                end={end}
                value={picked}
                onChange={onChange}
                label="Termine"
                disabled={readOnly}
              />
            )}
            {range && !readOnly && (
              <p className="text-muted-foreground text-xs">
                Ein Klick wählt einen Tag, Umschalt-Klick alle Tage seit dem letzten Klick, der
                Monatsname den ganzen Monat.
              </p>
            )}
            {!readOnly && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor={pasteId} className="text-muted-foreground text-xs">
                    Liste einfügen, etwa aus dem Kalender des Parks: 2026-10-03 oder 3.10.2026, mit
                    Leerzeichen, Komma oder Zeilen getrennt
                  </label>
                  <TextArea
                    id={pasteId}
                    value={pasted}
                    onChange={(event) => {
                      setPasted(event.target.value);
                      setPasteNote(null);
                    }}
                    className="min-h-16"
                    placeholder="3.10.2026, 4.10.2026, 10.10.2026"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPasted}
                      disabled={pasted.trim() === '' || !range}
                    >
                      Hinzufügen
                    </Button>
                    {pasteNote && (
                      <p role="status" className="text-muted-foreground text-xs">
                        {pasteNote}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Field>
      )}
    </div>
  );
}
