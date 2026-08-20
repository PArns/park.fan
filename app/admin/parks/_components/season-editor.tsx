'use client';

import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  CalendarDays,
  CalendarRange,
  Euro,
  Ghost,
  Loader2,
  Pencil,
  Plus,
  Snowflake,
  Sparkles,
  Ticket,
  Trash2,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { adminFetch, adminKeys, useInvalidateAdmin } from '../../_lib/api';
import type { ParkSeason, ParkSeasonKind, ParkSeasonStatus } from '../../_lib/types';
import { Chip, EmptyState } from '../../_ui/primitives';
import { Field, Select, Switch, TextArea, TextInput } from '../../_ui/controls';
import { useToast } from '../../_ui/toast';

/**
 * Seasons, as they are actually shaped.
 *
 * The naive model is two dates, and it is wrong for the seasons worth
 * recording. Walibi Holland's 2026 calendar is the case that settles it:
 * Spooky Days on the 14th, 15th, 19th, 20th and 21st of October; Fright Nights
 * on every weekend between 3 October and 1 November plus three single dates.
 * Stored as 3 Oct – 1 Nov, that tells a visitor the park is haunted on a
 * Tuesday.
 *
 * So the editor has two levels. The range is the season's outer bounds — what a
 * heading says and what a query filters on — and the calendar underneath is
 * optional: leave it alone and the season runs every day between the bounds,
 * or pick days and it runs only on those. The distinction is null-versus-list,
 * never an empty list, because "runs on no day at all" is not a state a season
 * should be able to represent.
 */

const KIND_META: Record<ParkSeasonKind, { label: string; icon: LucideIcon; tone: string }> = {
  halloween: { label: 'Halloween', icon: Ghost, tone: 'text-orange-400' },
  christmas: { label: 'Weihnachten', icon: Snowflake, tone: 'text-sky-400' },
  summer_nights: { label: 'Sommernächte', icon: Sparkles, tone: 'text-amber-400' },
  special_event: { label: 'Sonderevent', icon: Sparkles, tone: 'text-violet-400' },
  opening: { label: 'Saison', icon: CalendarRange, tone: 'text-emerald-400' },
  closure: { label: 'Schließzeit', icon: Snowflake, tone: 'text-zinc-400' },
  maintenance: { label: 'Wartung', icon: Wrench, tone: 'text-amber-400' },
};

const STATUS_META: Record<
  ParkSeasonStatus,
  { label: string; tone: 'success' | 'primary' | 'muted' | 'danger' }
> = {
  confirmed: { label: 'bestätigt', tone: 'success' },
  announced: { label: 'angekündigt', tone: 'primary' },
  expected: { label: 'erwartet', tone: 'muted' },
  cancelled: { label: 'abgesagt', tone: 'danger' },
};

export function SeasonList({
  parkId,
  seasons,
  canEdit,
}: {
  parkId: string;
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
          description="Halloween, Winterschließung, ein Wartungsfenster — alles, was der Park an bestimmten Tagen anders macht."
        />
      ) : (
        <ul className="space-y-2">
          {sorted.map((season) => (
            <SeasonRow
              key={season.id}
              season={season}
              canEdit={canEdit}
              onEdit={() => setEditing(season)}
            />
          ))}
        </ul>
      )}

      {editing && (
        <SeasonDialog
          parkId={parkId}
          season={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function SeasonRow({
  season,
  canEdit,
  onEdit,
}: {
  season: ParkSeason;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const meta = KIND_META[season.kind] ?? KIND_META.special_event;
  const status = STATUS_META[season.status] ?? STATUS_META.announced;
  const Icon = meta.icon;

  return (
    <li className="border-border/60 bg-card/40 flex items-start gap-3 rounded-lg border p-3">
      <span
        className={cn(
          'bg-muted/50 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          meta.tone
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{season.name || meta.label}</span>
          <Chip tone={status.tone}>{status.label}</Chip>
          {season.separateTicket && (
            <Chip>
              <Ticket className="h-3 w-3" /> Extra-Ticket
            </Chip>
          )}
          {season.dates && season.dates.length > 0 && (
            <Chip>
              <CalendarDays className="h-3 w-3" /> {season.dates.length} Termine
            </Chip>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          {formatRange(season.startDate, season.endDate)}
          {season.opensAt && season.closesAt && ` · ${season.opensAt}–${season.closesAt}`}
          {season.priceFrom && ` · ab ${season.priceFrom} ${season.priceCurrency ?? ''}`}
        </p>

        {season.note && <p className="text-muted-foreground text-xs italic">{season.note}</p>}

        {season.sourceUrl && (
          <a
            href={season.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary block truncate text-xs hover:underline"
          >
            {season.sourceUrl}
          </a>
        )}

        {/* An unconfirmed season with no source is the one a reader cannot act
            on: it says a park will do something, on whose authority nobody
            recorded. */}
        {!season.sourceUrl && season.status !== 'expected' && (
          <p className="flex items-center gap-1 text-xs text-amber-400">
            <TriangleAlert className="h-3 w-3" /> Ohne Quelle
          </p>
        )}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Bearbeiten"
          className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

function formatRange(start: string, end: string): string {
  const from = parseISO(start);
  const to = parseISO(end);
  if (start === end) return format(from, 'd. MMMM yyyy', { locale: de });
  if (from.getFullYear() === to.getFullYear()) {
    return `${format(from, 'd. MMM', { locale: de })} – ${format(to, 'd. MMM yyyy', { locale: de })}`;
  }
  return `${format(from, 'd. MMM yyyy', { locale: de })} – ${format(to, 'd. MMM yyyy', { locale: de })}`;
}

// ─── dialog ───────────────────────────────────────────────────────────────────

interface SeasonDraft {
  kind: ParkSeasonKind;
  name: string;
  startDate: string;
  endDate: string;
  dates: string[] | null;
  status: ParkSeasonStatus;
  separateTicket: boolean;
  priceFrom: string;
  priceCurrency: string;
  opensAt: string;
  closesAt: string;
  url: string;
  sourceUrl: string;
  note: string;
}

function draftFrom(season: ParkSeason | null): SeasonDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    kind: season?.kind ?? 'halloween',
    name: season?.name ?? '',
    startDate: season?.startDate ?? today,
    endDate: season?.endDate ?? today,
    dates: season?.dates ?? null,
    status: season?.status ?? 'announced',
    separateTicket: season?.separateTicket ?? false,
    priceFrom: season?.priceFrom ?? '',
    priceCurrency: season?.priceCurrency ?? 'EUR',
    opensAt: season?.opensAt ?? '',
    closesAt: season?.closesAt ?? '',
    url: season?.url ?? '',
    sourceUrl: season?.sourceUrl ?? '',
    note: season?.note ?? '',
  };
}

function SeasonDialog({
  parkId,
  season,
  onClose,
}: {
  parkId: string;
  season: ParkSeason | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [draft, setDraft] = useState<SeasonDraft>(() => draftFrom(season));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickDays, setPickDays] = useState(() => (season?.dates?.length ?? 0) > 0);

  const set = <K extends keyof SeasonDraft>(key: K, value: SeasonDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const selectedDays = useMemo(
    () => (draft.dates ?? []).map((date) => parseISO(date)),
    [draft.dates]
  );

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body = {
        kind: draft.kind,
        name: draft.name.trim() || null,
        startDate: draft.startDate,
        endDate: draft.endDate,
        // Null, never an empty array. The API rejects `[]` for the same reason
        // it exists as a distinct state: it would mean "runs on no day".
        dates: pickDays && draft.dates && draft.dates.length > 0 ? draft.dates : null,
        status: draft.status,
        separateTicket: draft.separateTicket,
        priceFrom: draft.priceFrom.trim() === '' ? null : Number(draft.priceFrom),
        priceCurrency: draft.priceFrom.trim() === '' ? null : draft.priceCurrency.trim() || null,
        opensAt: draft.opensAt.trim() || null,
        closesAt: draft.closesAt.trim() || null,
        url: draft.url.trim() || null,
        sourceUrl: draft.sourceUrl.trim() || null,
        note: draft.note.trim() || null,
      };

      if (season) {
        await adminFetch(`/api/admin/content/seasons/${season.id}`, {
          method: 'PATCH',
          body,
        });
      } else {
        await adminFetch(`/api/admin/content/parks/${parkId}/seasons`, {
          method: 'POST',
          body,
        });
      }

      invalidate(adminKeys.park(parkId), ['admin', 'seasons'], ['admin', 'parks']);
      toast.push({
        title: season ? 'Saison aktualisiert' : 'Saison angelegt',
        tone: 'success',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!season) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/content/seasons/${season.id}`, { method: 'DELETE' });
      invalidate(adminKeys.park(parkId), ['admin', 'seasons'], ['admin', 'parks']);
      toast.push({ title: 'Saison gelöscht', tone: 'success' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{season ? 'Saison bearbeiten' : 'Saison anlegen'}</DialogTitle>
          <DialogDescription>
            Der Zeitraum sind die äußeren Grenzen. Die Termine darunter sind optional — ohne sie
            läuft die Saison an jedem Tag dazwischen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Art">
              <Select
                value={draft.kind}
                allowEmpty={false}
                onValueChange={(value) => set('kind', (value as ParkSeasonKind) ?? 'halloween')}
                options={Object.entries(KIND_META).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                }))}
              />
            </Field>
            <Field
              label="Name"
              hint="Wie der Park es nennt. Leer lassen, wenn es keinen eigenen Namen hat."
            >
              <TextInput
                value={draft.name}
                onChange={(event) => set('name', event.target.value)}
                placeholder="z. B. Halloween Fright Nights"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Von">
              <TextInput
                type="date"
                value={draft.startDate}
                onChange={(event) => set('startDate', event.target.value)}
              />
            </Field>
            <Field label="Bis">
              <TextInput
                type="date"
                value={draft.endDate}
                onChange={(event) => set('endDate', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.status}
                allowEmpty={false}
                onValueChange={(value) => set('status', (value as ParkSeasonStatus) ?? 'announced')}
                options={Object.entries(STATUS_META).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                }))}
              />
            </Field>
          </div>

          <div className="border-border/60 rounded-lg border p-3">
            <Switch
              checked={pickDays}
              onCheckedChange={(next) => {
                setPickDays(next);
                if (!next) set('dates', null);
              }}
              label="Läuft nur an bestimmten Tagen"
            />
            {pickDays && (
              <div className="mt-3">
                <p className="text-muted-foreground mb-2 text-xs">
                  {(draft.dates?.length ?? 0) === 0
                    ? 'Noch kein Tag gewählt — ohne Auswahl gilt der ganze Zeitraum.'
                    : `${draft.dates?.length} Termine gewählt.`}
                </p>
                <div className="admin-daypicker overflow-x-auto">
                  <DayPicker
                    mode="multiple"
                    locale={de}
                    weekStartsOn={1}
                    showOutsideDays
                    numberOfMonths={2}
                    defaultMonth={parseISO(draft.startDate)}
                    selected={selectedDays}
                    onSelect={(days) =>
                      set(
                        'dates',
                        days && days.length > 0
                          ? days.map((day) => format(day, 'yyyy-MM-dd')).sort()
                          : null
                      )
                    }
                    disabled={[
                      { before: parseISO(draft.startDate) },
                      { after: parseISO(draft.endDate) },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Öffnet" hint="Park-lokale Uhrzeit, HH:MM.">
              <TextInput
                value={draft.opensAt}
                onChange={(event) => set('opensAt', event.target.value)}
                placeholder="19:00"
              />
            </Field>
            <Field label="Schließt">
              <TextInput
                value={draft.closesAt}
                onChange={(event) => set('closesAt', event.target.value)}
                placeholder="01:00"
              />
            </Field>
          </div>

          <div className="border-border/60 space-y-3 rounded-lg border p-3">
            <Switch
              checked={draft.separateTicket}
              onCheckedChange={(next) => set('separateTicket', next)}
              label="Braucht ein eigenes Ticket"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Preis ab">
                <div className="relative">
                  <Euro className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                  <TextInput
                    className="pl-8"
                    inputMode="decimal"
                    value={draft.priceFrom}
                    onChange={(event) => set('priceFrom', event.target.value)}
                    placeholder="53"
                  />
                </div>
              </Field>
              <Field label="Währung">
                <TextInput
                  value={draft.priceCurrency}
                  onChange={(event) => set('priceCurrency', event.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="EUR"
                />
              </Field>
            </div>
          </div>

          <Field label="Seite des Parks">
            <TextInput
              value={draft.url}
              onChange={(event) => set('url', event.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Field
            label="Quelle"
            hint="Wo diese Termine stehen. Eine Saison ist eine Behauptung über die Welt."
          >
            <TextInput
              value={draft.sourceUrl}
              onChange={(event) => set('sourceUrl', event.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Field label="Notiz">
            <TextArea
              value={draft.note}
              onChange={(event) => set('note', event.target.value)}
              placeholder="Was sonst niemand mehr weiß."
            />
          </Field>

          {error && (
            <p className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border px-3 py-2 text-xs">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={busy} size="sm">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {season ? 'Speichern' : 'Anlegen'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
              Abbrechen
            </Button>
            {season && (
              <Button
                variant="ghost"
                size="sm"
                onClick={remove}
                disabled={busy}
                className="text-destructive hover:text-destructive ml-auto"
              >
                <Trash2 className="h-4 w-4" /> Löschen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
