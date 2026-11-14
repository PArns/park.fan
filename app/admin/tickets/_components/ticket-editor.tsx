'use client';

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MAX_TICKET_DAYS,
  MAX_TICKET_LINKS,
  MAX_TICKET_WINDOW,
  TICKET_PUBLISH_DELAY,
  TICKET_ANCHOR_LABELS,
  TICKET_CONFIDENCE_LABELS,
  TICKET_DRY_RUN_LABELS,
  TICKET_DRY_RUN_RESULTS,
  TICKET_HOPPING_LABELS,
  TICKET_LOCALES,
  TICKET_MARKETS,
  TICKET_MARKET_LABELS,
  draftFromProduct,
  emptyTicketDraft,
  mergeTicketProblems,
  moveItem,
  setOfficialTicketLink,
  withTicketLinkStore,
  setTicketDays,
  setTicketWindow,
  strayTicketProblems,
  ticketBody,
  ticketCatalogPath,
  ticketCheck,
  ticketClicks,
  ticketLinkProblems,
  ticketPatch,
  ticketProblemField,
  ticketProblemsAt,
  ticketProblemsOf,
  ticketProblemsUnder,
  TICKETS_QUERY_KEY,
  type AdminTicketProduct,
  type TicketAnchor,
  type TicketClickTable,
  type TicketConfidence,
  type TicketDaysDraft,
  type TicketDaysMode,
  type TicketDraft,
  type TicketHopping,
  type TicketLink,
  type TicketMarket,
  type TicketProblem,
  type TicketRuleDraft,
  type TicketValidation,
} from '@/lib/admin/tickets';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import type { TripRegionGroup, TripRegionPark } from '@/lib/trip-regions/types';
import { AdminApiError, adminFetch, useInvalidateAdmin } from '../../_lib/api';
import { formatAgo } from '../../_lib/format';
import {
  Field,
  MoveButtons,
  NumberInput,
  Segmented,
  Select,
  Switch,
  TextArea,
  TextInput,
  ToggleChips,
  UrlInput,
  useFieldId,
} from '../../_ui/controls';
import { Chip, Notice, SCROLLING_DIALOG, Tile } from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import { ClickFigure } from './click-figure';

/** How long the form waits after the last keystroke before it asks the API to check the draft. */
const VALIDATE_DELAY_MS = 700;

/** The product fields this form shows; a problem about any other path is listed on its own. */
const FORM_FIELDS = [
  'slug',
  'name',
  'description',
  'resort',
  'parks',
  'markets',
  'days',
  'windowTable',
  'windowDays',
  'anchor',
  'hopping',
  'hopSets',
  'caps',
  'allowance',
  'reservedDayParks',
  'pass',
  'blockouts',
  'blockoutUrl',
  'reservationUrl',
  'onSale',
  'until',
  'links',
  'sources',
  'notes',
  'confidence',
  'suggestRank',
] as const;

const DAYS_MODES: { value: TicketDaysMode; label: string }[] = [
  { value: 'fixed', label: 'Feste Zahl' },
  { value: 'range', label: 'Spanne' },
  { value: 'unlimited', label: 'Unbegrenzt' },
];

const MARKET_OPTIONS = TICKET_MARKETS.map((market) => ({
  value: market,
  label: TICKET_MARKET_LABELS[market],
}));

const LOCALE_OPTIONS = TICKET_LOCALES.map((locale) => ({ value: locale as string, label: locale }));

function joined(problems: readonly (TicketProblem | string)[]): string | null {
  if (problems.length === 0) return null;
  return problems
    .map((problem) => (typeof problem === 'string' ? problem : problem.message))
    .join(' · ');
}

/** The click tables the link figures are read from, as `useTicketClicks` answers them. */
export interface TicketClickState {
  byHost: TicketClickTable | null;
  bySeller: TicketClickTable | null;
  loading: boolean;
  failed: boolean;
}

/**
 * The form of one ticket product, or of a new one: basics, rules, sale, links, sources. The API
 * checks the draft a moment after each change and plans a sample trip with it (`validate`), and
 * every problem it names sits at the field it is about. Read-only below `editor`.
 */
export function TicketEditor({
  region,
  product,
  groups,
  parks,
  canEdit,
  clicks,
  onClose,
}: {
  region: string;
  /** Null for a new product. */
  product: AdminTicketProduct | null;
  groups: readonly TripRegionGroup[];
  parks: readonly TripRegionPark[];
  canEdit: boolean;
  clicks: TicketClickState;
  onClose: () => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  // A new product names no resort until the editor picks one: a default would file a LEGOLAND
  // ticket under Disney without anyone choosing it.
  const [initial] = useState(() => (product ? draftFromProduct(product) : emptyTicketDraft()));
  const [draft, setDraft] = useState(initial);
  const [saveProblems, setSaveProblems] = useState<TicketProblem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A second submit can arrive before the first one's re-render disables the button.
  const submitting = useRef(false);
  const ids = {
    slug: useFieldId('ticket-slug'),
    name: useFieldId('ticket-name'),
    description: useFieldId('ticket-description'),
    resort: useFieldId('ticket-resort'),
    windowDays: useFieldId('ticket-window-days'),
    blockoutUrl: useFieldId('ticket-blockout-url'),
    reservationUrl: useFieldId('ticket-reservation-url'),
    until: useFieldId('ticket-until'),
    notes: useFieldId('ticket-notes'),
    suggestRank: useFieldId('ticket-suggest-rank'),
  };

  const update = (change: (current: TicketDraft) => TicketDraft) => {
    setDraft(change);
    setSaveProblems([]);
    setError(null);
  };
  const set = <K extends keyof TicketDraft>(key: K, value: TicketDraft[K]) =>
    update((current) => ({ ...current, [key]: value }));

  const body = useMemo(() => ticketBody(draft), [draft]);
  const initialKey = useMemo(() => JSON.stringify(ticketBody(initial)), [initial]);
  const patch = useMemo(() => (product ? ticketPatch(product, draft) : null), [product, draft]);
  const dirty = patch ? Object.keys(patch).length > 0 : JSON.stringify(body) !== initialKey;

  const check = useMemo(() => ticketCheck(region, product, draft), [region, product, draft]);
  const checkKey = useMemo(() => JSON.stringify(check), [check]);
  const settledKey = useDebouncedValue(checkKey, VALIDATE_DELAY_MS);
  const validation = useQuery<TicketValidation, AdminApiError>({
    queryKey: ['admin', 'ticket-validate', settledKey],
    queryFn: async ({ signal }) => {
      const settled = JSON.parse(settledKey) as ReturnType<typeof ticketCheck>;
      try {
        return await adminFetch<TicketValidation>(settled.path, {
          method: 'POST',
          body: settled.body,
          signal,
        });
      } catch (err) {
        // A body the API cannot even read comes back as a 400 with the same list.
        const problems = err instanceof AdminApiError ? ticketProblemsOf(err.payload) : [];
        if (problems.length > 0) return { ok: false, problems };
        throw err;
      }
    },
    enabled: canEdit && dirty,
    staleTime: Infinity,
    gcTime: 60_000,
    retry: false,
    placeholderData: keepPreviousData,
  });
  const checking = canEdit && dirty && (settledKey !== checkKey || validation.isFetching);
  const checked = !checking && dirty && validation.isSuccess ? validation.data : null;
  const apiProblems = dirty ? (validation.data?.problems ?? []) : [];
  const localProblems = useMemo(() => ticketLinkProblems(draft.links), [draft.links]);
  const problems = mergeTicketProblems(localProblems, apiProblems, saveProblems);
  const refused = checked !== null && !checked.ok;
  const canSave = canEdit && dirty && !busy && localProblems.length === 0 && !checking && !refused;

  const at = (path: string) => joined(ticketProblemsAt(problems, path));
  const under = (path: string, except: readonly string[] = []) =>
    joined(ticketProblemsUnder(problems, path, except));
  const stray = strayTicketProblems(problems, FORM_FIELDS);
  const runProblems = stray.filter((problem) => ticketProblemField(problem.path) === 'dryRun');
  const otherProblems = stray.filter((problem) => ticketProblemField(problem.path) !== 'dryRun');

  const linkClicks = ticketClicks(
    { slug: product?.slug ?? draft.slug, links: draft.links },
    clicks.byHost,
    clicks.bySeller
  );

  const parkName = useMemo(() => new Map(parks.map((park) => [park.slug, park.name])), [parks]);
  const regionParkOptions = useMemo(
    () =>
      groups.flatMap((group) =>
        parks
          .filter((park) => park.group === group.key)
          .map((park) => ({ value: park.slug, label: park.name, title: group.name }))
      ),
    [groups, parks]
  );
  const productParkOptions = draft.parks.map((slug) => ({
    value: slug,
    label: parkName.get(slug) ?? slug,
  }));
  const allowanceParkOptions = regionParkOptions.filter(
    (option) => !draft.parks.includes(option.value)
  );

  async function save(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !canSave) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    setSaveProblems([]);
    try {
      if (product) {
        await adminFetch(ticketCatalogPath(region, product.slug), {
          method: 'PATCH',
          body: patch ?? {},
        });
      } else {
        await adminFetch(ticketCatalogPath(region), { method: 'POST', body });
      }
      invalidate(TICKETS_QUERY_KEY);
      toast.push({
        title: product ? 'Ticket gespeichert' : 'Ticket angelegt',
        description: TICKET_PUBLISH_DELAY,
        tone: 'success',
      });
      onClose();
    } catch (err) {
      const found = err instanceof AdminApiError ? ticketProblemsOf(err.payload) : [];
      setSaveProblems(found);
      setError(
        found.length > 0
          ? `Nicht gespeichert: ${found.length === 1 ? 'ein Problem' : `${found.length} Probleme`}, jeweils am Feld.`
          : err instanceof Error
            ? err.message
            : 'Speichern fehlgeschlagen'
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // Unsaved edits are not thrown away by a stray tap beside the dialog or an Escape: only
  // „Abbrechen“ and the close button leave them.
  const keep = dirty || busy;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent
        // The scroll padding is the sticky footer's height, so a field that takes the focus is
        // scrolled above it rather than under it.
        className={`${SCROLLING_DIALOG} scroll-pb-48 gap-0 p-0 sm:max-w-3xl sm:scroll-pb-36`}
        onInteractOutside={(event) => keep && event.preventDefault()}
        onEscapeKeyDown={(event) => keep && event.preventDefault()}
      >
        <form onSubmit={(event) => void save(event)} className="grid grid-cols-1">
          <DialogHeader className="px-4 pt-5 pr-12 pb-4 text-left sm:px-6">
            <DialogTitle className="leading-snug">
              {product ? product.name : 'Neues Ticket'}
            </DialogTitle>
            <DialogDescription>
              {product
                ? `${product.slug} · geändert ${formatAgo(product.updatedAt)}${product.updatedBy ? ` von ${product.updatedBy}` : ''}`
                : 'Ein Produkt, wie der Betreiber es verkauft. Der Planer rechnet mit seinen Regeln, sobald es gespeichert ist.'}
            </DialogDescription>
            {product && !product.active && (
              <Notice className="mt-1">
                Archiviert: nicht im Katalog des Planers und nie vorgeschlagen. Geteilte Pläne, die
                es nennen, rechnen weiter damit.
              </Notice>
            )}
            {!canEdit && (
              <p className="text-muted-foreground text-xs">
                Dein Konto darf lesen, aber nicht kuratieren.
              </p>
            )}
          </DialogHeader>

          <fieldset
            disabled={!canEdit || busy}
            className="grid min-w-0 grid-cols-1 gap-4 px-4 pb-5 sm:px-6"
          >
            <Tile title="Grunddaten">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Slug"
                  htmlFor={ids.slug}
                  error={at('slug')}
                  hint={
                    product
                      ? 'Fest: geteilte Pläne und Links nennen das Ticket so.'
                      : 'Kleinbuchstaben, Ziffern und Bindestriche, höchstens 60 Zeichen. Nach dem Anlegen fest.'
                  }
                >
                  <TextInput
                    id={ids.slug}
                    value={draft.slug}
                    readOnly={product !== null}
                    disabled={product !== null}
                    maxLength={60}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="wdw-date-based"
                    onChange={(event) => set('slug', event.target.value.toLowerCase())}
                  />
                </Field>
                <Field
                  label="Resort"
                  htmlFor={ids.resort}
                  error={at('resort')}
                  hint="Wessen Betreiber das Ticket verkauft."
                >
                  <Select
                    id={ids.resort}
                    value={draft.resort || null}
                    allowEmpty={false}
                    placeholder="Resort wählen"
                    onValueChange={(value) => value && set('resort', value)}
                    options={groups.map((group) => ({ value: group.key, label: group.name }))}
                  />
                </Field>
              </div>
              <Field
                label="Name"
                htmlFor={ids.name}
                error={at('name')}
                hint="Der Produktname des Betreibers, nicht übersetzt."
              >
                <TextInput
                  id={ids.name}
                  value={draft.name}
                  maxLength={120}
                  autoComplete="off"
                  onChange={(event) => set('name', event.target.value)}
                />
              </Field>
              <Field
                label="Beschreibung"
                htmlFor={ids.description}
                error={at('description')}
                hint="Optional, ein Satz auf Englisch, wie ihn der Planer zeigt."
              >
                <TextArea
                  id={ids.description}
                  value={draft.description}
                  maxLength={1000}
                  className="min-h-16"
                  onChange={(event) => set('description', event.target.value)}
                />
              </Field>
              <Field
                label="Parks"
                error={under('parks')}
                hint="Die Parks, die ein Tickettag abdeckt."
              >
                <ToggleChips
                  label="Parks"
                  options={regionParkOptions}
                  value={draft.parks}
                  onChange={(value) => set('parks', value)}
                />
              </Field>
              <Field
                label="Märkte"
                error={under('markets')}
                hint="Wo das Ticket verkauft wird. Die Website zeigt es als Hinweis („UK-Shop“), kein Filter: Der Vorschlag ohne Tickets nimmt jedes Produkt mit Vorschlagsrang."
              >
                <ToggleChips
                  label="Märkte"
                  options={MARKET_OPTIONS}
                  value={draft.markets}
                  onChange={(value) => set('markets', value as TicketMarket[])}
                />
              </Field>
            </Tile>

            <Tile title="Regeln">
              <Field label="Tage" error={under('days')}>
                <div className="grid gap-2">
                  <Segmented
                    label="Tage"
                    options={DAYS_MODES}
                    value={draft.daysMode}
                    onChange={(mode) =>
                      update((current) =>
                        setTicketDays(
                          current,
                          mode,
                          current.daysMin,
                          mode === 'range'
                            ? Math.max(current.daysMax ?? 1, current.daysMin ?? 1)
                            : current.daysMax
                        )
                      )
                    }
                    className="self-start"
                  />
                  {draft.daysMode === 'fixed' && (
                    <div className="flex items-center gap-2 text-sm">
                      <NumberInput
                        aria-label="Tage"
                        min={1}
                        max={MAX_TICKET_DAYS}
                        value={draft.daysMin}
                        onValueChange={(days) =>
                          update((current) => setTicketDays(current, 'fixed', days, days))
                        }
                        className="w-24"
                      />
                      <span className="text-muted-foreground">Tage</span>
                    </div>
                  )}
                  {draft.daysMode === 'range' && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <NumberInput
                        aria-label="Kürzeste Länge in Tagen"
                        min={1}
                        max={MAX_TICKET_DAYS}
                        value={draft.daysMin}
                        onValueChange={(min) =>
                          update((current) => setTicketDays(current, 'range', min, current.daysMax))
                        }
                        className="w-24"
                      />
                      <span className="text-muted-foreground">bis</span>
                      <NumberInput
                        aria-label="Längste Länge in Tagen"
                        min={1}
                        max={MAX_TICKET_DAYS}
                        value={draft.daysMax}
                        onValueChange={(max) =>
                          update((current) => setTicketDays(current, 'range', current.daysMin, max))
                        }
                        className="w-24"
                      />
                      <span className="text-muted-foreground">Tage</span>
                    </div>
                  )}
                </div>
              </Field>

              {draft.daysMode !== 'unlimited' ? (
                <Field
                  label="Fenster je Länge"
                  error={at('windowTable')}
                  hint="Kalendertage, über die sich die Tage verteilen dürfen, ab dem Starttag als Tag 1. Nie kürzer als die Tage und nie kürzer als bei der Länge davor."
                >
                  <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    {draft.windowTable.map((row, index) => {
                      const rowError = under(`windowTable[${index}]`);
                      return (
                        <li key={row.days}>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-16 shrink-0 tabular-nums">
                              {row.days} {row.days === 1 ? 'Tag' : 'Tage'}
                            </span>
                            <span className="text-muted-foreground">in</span>
                            <NumberInput
                              aria-label={`Fenster für ${row.days} ${row.days === 1 ? 'Tag' : 'Tage'}`}
                              aria-invalid={rowError ? true : undefined}
                              min={row.days}
                              max={MAX_TICKET_WINDOW}
                              value={row.window}
                              onValueChange={(window) =>
                                update((current) => ({
                                  ...current,
                                  windowTable: setTicketWindow(
                                    current.windowTable,
                                    row.days,
                                    window
                                  ),
                                }))
                              }
                              className="w-24"
                            />
                            <span className="text-muted-foreground">Tagen</span>
                          </div>
                          {rowError && <p className="text-destructive mt-1 text-xs">{rowError}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </Field>
              ) : (
                <div className="grid gap-3">
                  <Field
                    label="Fenster ohne Tageszahl"
                    htmlFor={ids.windowDays}
                    error={at('windowDays')}
                    hint="Beliebig viele Besuche in so vielen Kalendertagen, wie bei SeaWorlds Four Parks in 14. Leer bei einem Pass."
                  >
                    <NumberInput
                      id={ids.windowDays}
                      min={1}
                      max={MAX_TICKET_WINDOW}
                      value={draft.windowDays}
                      onValueChange={(windowDays) => set('windowDays', windowDays)}
                      className="w-28"
                    />
                  </Field>
                  <Field label="Pass" error={at('pass')}>
                    <Switch
                      checked={draft.pass}
                      onCheckedChange={(pass) => set('pass', pass)}
                      label="Jahreskarte oder Fun Card: beliebig viele Tage, kein Fenster"
                    />
                  </Field>
                </div>
              )}

              <Field label="Das Fenster beginnt mit dem" error={at('anchor')}>
                <Segmented
                  label="Das Fenster beginnt mit dem"
                  options={(Object.keys(TICKET_ANCHOR_LABELS) as TicketAnchor[]).map((anchor) => ({
                    value: anchor,
                    label: TICKET_ANCHOR_LABELS[anchor],
                  }))}
                  value={draft.anchor}
                  onChange={(anchor) => set('anchor', anchor)}
                  className="self-start"
                />
              </Field>

              <Field
                label="Hopping"
                error={at('hopping')}
                hint="Zwei Parks an einem Tag. Als Option kauft der Besucher den Hopper dazu (.h)."
              >
                <Segmented
                  label="Hopping"
                  options={(Object.keys(TICKET_HOPPING_LABELS) as TicketHopping[]).map((value) => ({
                    value,
                    label: TICKET_HOPPING_LABELS[value],
                  }))}
                  value={draft.hopping}
                  onChange={(hopping) => set('hopping', hopping)}
                  className="self-start"
                />
              </Field>
              {draft.hopping !== 'none' && (
                <RuleList
                  kind="hop"
                  title="Hop-Sets"
                  hint="Welche Parks ein Hop-Tag oder ein Abend verbinden darf, mindestens zwei der Parks des Tickets."
                  rules={draft.hopSets}
                  parkOptions={productParkOptions}
                  error={at('hopSets')}
                  rowError={(index) => under(`hopSets[${index}]`)}
                  onChange={(hopSets) => set('hopSets', hopSets)}
                />
              )}

              <RuleList
                kind="cap"
                title="Obergrenzen"
                hint="Höchstens so viele Tage mit einem dieser Parks; ein Hop-Tag zwischen zweien zählt einmal. 0 heißt: Diese Länge deckt die Parks nicht ab, wie Epic Universe bei 1 und 2 Tagen Universal."
                rules={draft.caps}
                parkOptions={productParkOptions}
                error={at('caps')}
                rowError={(index) => under(`caps[${index}]`)}
                onChange={(caps) => set('caps', caps)}
              />

              <Field
                label="Kontingent"
                error={under('allowance')}
                hint="Besuche, die keinen Tickettag kosten, wie die Wasserparks der UK Magic Tickets."
              >
                <div className="grid gap-2">
                  <Switch
                    checked={draft.allowance !== null}
                    onCheckedChange={(on) =>
                      set('allowance', on ? { parks: [], visits: 'days' } : null)
                    }
                    label="Mit Kontingent"
                  />
                  {draft.allowance && (
                    <>
                      <ToggleChips
                        label="Parks des Kontingents"
                        options={allowanceParkOptions}
                        value={draft.allowance.parks}
                        onChange={(value) =>
                          update((current) => ({
                            ...current,
                            allowance: current.allowance && { ...current.allowance, parks: value },
                          }))
                        }
                      />
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Segmented
                          label="Besuche"
                          options={[
                            { value: 'days', label: 'So viele wie Tage' },
                            { value: 'count', label: 'Feste Zahl' },
                          ]}
                          value={draft.allowance.visits === 'days' ? 'days' : 'count'}
                          onChange={(kind) =>
                            update((current) => ({
                              ...current,
                              allowance: current.allowance && {
                                ...current.allowance,
                                visits: kind === 'days' ? 'days' : 1,
                              },
                            }))
                          }
                        />
                        {draft.allowance.visits !== 'days' && (
                          <>
                            <NumberInput
                              aria-label="Besuche im Kontingent"
                              min={1}
                              value={draft.allowance.visits}
                              onValueChange={(visits) =>
                                update((current) => ({
                                  ...current,
                                  allowance: current.allowance && { ...current.allowance, visits },
                                }))
                              }
                              className="w-24"
                            />
                            <span className="text-muted-foreground">Besuche</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Field>

              <Field
                label="Nur am Starttag"
                error={under('reservedDayParks')}
                hint="Parks, die nur am Starttag gelten, wie Discovery Coves reservierter Tag."
              >
                <ToggleChips
                  label="Nur am Starttag"
                  options={productParkOptions}
                  value={draft.reservedDayParks}
                  onChange={(value) => set('reservedDayParks', value)}
                />
              </Field>

              <Field
                label="Sperrtage"
                error={at('blockouts')}
                hint="Der Plan prüft Sperrtage nicht, er weist nur darauf hin."
              >
                <Switch
                  checked={draft.blockouts}
                  onCheckedChange={(blockouts) => set('blockouts', blockouts)}
                  label="Für einige oder alle Versionen gelten Sperrtage"
                />
              </Field>
              {(draft.blockouts || draft.blockoutUrl !== '') && (
                <Field
                  label="Seite mit dem Sperrkalender"
                  htmlFor={ids.blockoutUrl}
                  error={at('blockoutUrl')}
                >
                  <UrlInput
                    id={ids.blockoutUrl}
                    value={draft.blockoutUrl}
                    maxLength={500}
                    placeholder="https://…"
                    onChange={(event) => set('blockoutUrl', event.target.value)}
                  />
                </Field>
              )}
              <Field
                label="Parkreservierung"
                htmlFor={ids.reservationUrl}
                error={at('reservationUrl')}
                hint="Optional: wo Passinhaber ihren Park reservieren, wie bei Disney."
              >
                <UrlInput
                  id={ids.reservationUrl}
                  value={draft.reservationUrl}
                  maxLength={500}
                  placeholder="https://…"
                  onChange={(event) => set('reservationUrl', event.target.value)}
                />
              </Field>
            </Tile>

            <Tile title="Verkauf">
              <Field
                label="Starttage im Verkauf"
                error={at('onSale')}
                hint="Für welche Starttage das Ticket verkauft wird; ein offenes Ende bleibt leer. Ohne Zeitraum ist keine Grenze bekannt."
              >
                <div className="grid gap-2">
                  {draft.onSale.map((range, index) => {
                    const rowError = under(`onSale[${index}]`);
                    const change = (key: 'from' | 'to', value: string) =>
                      update((current) => ({
                        ...current,
                        onSale: current.onSale.map((other, at) =>
                          at === index ? { ...other, [key]: value } : other
                        ),
                      }));
                    return (
                      <div key={index}>
                        <div className="flex items-center gap-2">
                          <TextInput
                            type="date"
                            aria-label={`Zeitraum ${index + 1} ab`}
                            value={range.from}
                            onChange={(event) => change('from', event.target.value)}
                            className="min-w-0 flex-1"
                          />
                          <span className="text-muted-foreground text-sm">bis</span>
                          <TextInput
                            type="date"
                            aria-label={`Zeitraum ${index + 1} bis`}
                            value={range.to}
                            onChange={(event) => change('to', event.target.value)}
                            className="min-w-0 flex-1"
                          />
                          <RemoveButton
                            label={`Zeitraum ${index + 1} entfernen`}
                            onClick={() =>
                              set(
                                'onSale',
                                draft.onSale.filter((_, at) => at !== index)
                              )
                            }
                          />
                        </div>
                        {rowError && <p className="text-destructive mt-1 text-xs">{rowError}</p>}
                      </div>
                    );
                  })}
                  <AddButton onClick={() => set('onSale', [...draft.onSale, { from: '', to: '' }])}>
                    Zeitraum hinzufügen
                  </AddButton>
                </div>
              </Field>
              <Field
                label="Gültig bis"
                htmlFor={ids.until}
                error={at('until')}
                hint="Der letzte gültige Tag eines Passes oder einer Fun Card."
              >
                <TextInput
                  id={ids.until}
                  type="date"
                  value={draft.until}
                  onChange={(event) => set('until', event.target.value)}
                  className="sm:w-48"
                />
              </Field>
            </Tile>

            <Tile
              title="Links"
              hint="Die Reihenfolge hier ist die auf der Website: Der erste Link steht vorn. Genau einer ist der Shop des Betreibers."
            >
              {at('links') && <p className="text-destructive text-xs">{at('links')}</p>}
              <ol className="grid gap-3">
                {draft.links.map((link, index) => (
                  <LinkRow
                    key={index}
                    index={index}
                    count={draft.links.length}
                    link={link}
                    clicks={linkClicks.links[index] ?? null}
                    clickState={clicks}
                    error={(field) =>
                      field === null
                        ? under(`links[${index}]`, [
                            `links[${index}].seller`,
                            `links[${index}].url`,
                            `links[${index}].markets`,
                            `links[${index}].locales`,
                            `links[${index}].store`,
                          ])
                        : under(`links[${index}].${field}`)
                    }
                    onChange={(next) =>
                      update((current) => ({
                        ...current,
                        links: current.links.map((other, at) => (at === index ? next : other)),
                      }))
                    }
                    onOfficial={() =>
                      update((current) => ({
                        ...current,
                        links: setOfficialTicketLink(current.links, index),
                      }))
                    }
                    onMove={(to) =>
                      update((current) => ({
                        ...current,
                        links: moveItem(current.links, index, to),
                      }))
                    }
                    onRemove={() =>
                      update((current) => ({
                        ...current,
                        links: current.links.filter((_, at) => at !== index),
                      }))
                    }
                  />
                ))}
              </ol>
              <AddButton
                disabled={draft.links.length >= MAX_TICKET_LINKS}
                onClick={() =>
                  set('links', [
                    ...draft.links,
                    {
                      seller: '',
                      url: '',
                      sponsored: false,
                      ...(draft.links.length === 0 && { official: true as const }),
                    },
                  ])
                }
              >
                Link hinzufügen
              </AddButton>
            </Tile>

            <Tile title="Quellen und Notizen">
              <Field
                label="Quellen"
                error={at('sources')}
                hint="Die Recherche hinter den Regeln. Nur hier sichtbar."
              >
                <div className="grid gap-3">
                  {draft.sources.map((source, index) => {
                    const change = (key: 'url' | 'title' | 'accessed' | 'note', value: string) =>
                      update((current) => ({
                        ...current,
                        sources: current.sources.map((other, at) =>
                          at === index ? { ...other, [key]: value } : other
                        ),
                      }));
                    const rowError = under(`sources[${index}]`);
                    return (
                      <div
                        key={index}
                        className="grid gap-2 rounded-lg border border-white/[0.07] p-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <UrlInput
                            aria-label={`Quelle ${index + 1}: Adresse`}
                            value={source.url}
                            maxLength={500}
                            placeholder="https://…"
                            onChange={(event) => change('url', event.target.value)}
                            className="min-w-0 flex-1"
                          />
                          <RemoveButton
                            label={`Quelle ${index + 1} entfernen`}
                            onClick={() =>
                              set(
                                'sources',
                                draft.sources.filter((_, at) => at !== index)
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_11rem]">
                          <TextInput
                            aria-label={`Quelle ${index + 1}: Titel`}
                            value={source.title ?? ''}
                            placeholder="Titel"
                            onChange={(event) => change('title', event.target.value)}
                          />
                          <TextInput
                            type="date"
                            aria-label={`Quelle ${index + 1}: abgerufen am`}
                            title="Abgerufen am"
                            value={source.accessed ?? ''}
                            onChange={(event) => change('accessed', event.target.value)}
                          />
                        </div>
                        <TextInput
                          aria-label={`Quelle ${index + 1}: Notiz`}
                          value={source.note ?? ''}
                          placeholder="Was dort steht"
                          onChange={(event) => change('note', event.target.value)}
                        />
                        {rowError && <p className="text-destructive text-xs">{rowError}</p>}
                      </div>
                    );
                  })}
                  <AddButton onClick={() => set('sources', [...draft.sources, { url: '' }])}>
                    Quelle hinzufügen
                  </AddButton>
                </div>
              </Field>
              <Field
                label="Notizen"
                htmlFor={ids.notes}
                error={at('notes')}
                hint="Was unsicher ist und warum der Plan die sichere Seite nimmt; Englisch, wie in der API."
              >
                <TextArea
                  id={ids.notes}
                  value={draft.notes}
                  maxLength={2000}
                  onChange={(event) => set('notes', event.target.value)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Wie sicher die Regeln sind"
                  error={at('confidence')}
                  hint="Wie gut die Quellen übereinstimmen."
                >
                  <Segmented
                    label="Wie sicher die Regeln sind"
                    options={(Object.keys(TICKET_CONFIDENCE_LABELS) as TicketConfidence[]).map(
                      (value) => ({ value, label: TICKET_CONFIDENCE_LABELS[value] })
                    )}
                    value={draft.confidence}
                    onChange={(confidence) => set('confidence', confidence)}
                    className="self-start"
                  />
                </Field>
                <Field
                  label="Vorschlagsrang"
                  htmlFor={ids.suggestRank}
                  error={at('suggestRank')}
                  hint="In dieser Reihenfolge probiert der Plan ohne Tickets die Produkte eines Resorts, kleinere zuerst. Leer: nie vorgeschlagen."
                >
                  <NumberInput
                    id={ids.suggestRank}
                    min={0}
                    max={1000}
                    value={draft.suggestRank}
                    onValueChange={(rank) => set('suggestRank', rank)}
                    placeholder="nie"
                    className="w-28"
                  />
                </Field>
              </div>
            </Tile>
          </fieldset>

          {canEdit && (
            <div className="bg-background sticky bottom-0 z-10 grid gap-2.5 border-t border-white/[0.07] px-4 py-3 sm:px-6">
              {otherProblems.length > 0 && (
                <ul className="text-destructive grid gap-0.5 text-xs" role="alert">
                  {otherProblems.map((problem) => (
                    <li key={`${problem.path}:${problem.message}`}>
                      {problem.path ? <span className="font-mono">{problem.path}: </span> : null}
                      {problem.message}
                    </li>
                  ))}
                </ul>
              )}
              <DryRun
                dirty={dirty}
                checking={checking}
                checked={checked}
                failure={!checking && validation.isError ? validation.error.message : null}
                problemCount={problems.length}
                runProblems={runProblems}
              />
              {error && (
                <p role="alert" className="text-destructive text-xs">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                  {dirty ? 'Verwerfen' : 'Schließen'}
                </Button>
                <Button type="submit" disabled={!canSave}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {product ? 'Speichern' : 'Anlegen'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A small text button that adds a row. */
function AddButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="justify-self-start max-sm:min-h-11"
    >
      <Plus className="h-4 w-4" /> {children}
    </Button>
  );
}

/** The bin beside a row, named for a screen reader. */
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1.5 disabled:opacity-30 max-sm:p-3"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

/** A length limit on a hop set or a cap: off for every length, or from … to … days. */
function TicketDaysLimit({
  value,
  onChange,
  name,
}: {
  value: TicketDaysDraft | null;
  onChange: (value: TicketDaysDraft | null) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Switch
        checked={value !== null}
        onCheckedChange={(on) => onChange(on ? { min: 1, max: 1 } : null)}
        label="Nur für bestimmte Längen"
      />
      {value && (
        <>
          <NumberInput
            aria-label={`${name}: kürzeste Länge`}
            min={1}
            max={MAX_TICKET_DAYS}
            value={value.min}
            onValueChange={(min) => onChange({ ...value, min })}
            className="w-20"
          />
          <span className="text-muted-foreground">bis</span>
          <NumberInput
            aria-label={`${name}: längste Länge`}
            min={1}
            max={MAX_TICKET_DAYS}
            value={value.max}
            onValueChange={(max) => onChange({ ...value, max })}
            className="w-20"
          />
          <span className="text-muted-foreground">Tage</span>
        </>
      )}
    </div>
  );
}

/** The hop sets or the caps of a product: rows of parks, a cap's number and a length limit. */
function RuleList({
  kind,
  title,
  hint,
  rules,
  parkOptions,
  error,
  rowError,
  onChange,
}: {
  kind: 'hop' | 'cap';
  title: string;
  hint: string;
  rules: TicketRuleDraft[];
  parkOptions: { value: string; label: string }[];
  error: string | null;
  rowError: (index: number) => string | null;
  onChange: (rules: TicketRuleDraft[]) => void;
}) {
  const noun = kind === 'hop' ? 'Hop-Set' : 'Obergrenze';
  const change = (index: number, next: TicketRuleDraft) =>
    onChange(rules.map((rule, at) => (at === index ? next : rule)));
  return (
    <Field label={title} error={error} hint={hint}>
      <div className="grid gap-2">
        {rules.map((rule, index) => {
          const name = `${noun} ${index + 1}`;
          const problem = rowError(index);
          return (
            <div key={index} className="grid gap-2 rounded-lg border border-white/[0.07] p-2.5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <ToggleChips
                    label={`${name}: Parks`}
                    options={parkOptions}
                    value={rule.parks}
                    onChange={(parks) => change(index, { ...rule, parks })}
                  />
                </div>
                <RemoveButton
                  label={`${name} entfernen`}
                  onClick={() => onChange(rules.filter((_, at) => at !== index))}
                />
              </div>
              {kind === 'cap' && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">höchstens</span>
                  <NumberInput
                    aria-label={`${name}: höchstens so viele Tage`}
                    min={0}
                    max={MAX_TICKET_DAYS}
                    value={rule.max ?? null}
                    onValueChange={(max) => change(index, { ...rule, max })}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">Tage</span>
                </div>
              )}
              <TicketDaysLimit
                name={name}
                value={rule.ticketDays}
                onChange={(ticketDays) => change(index, { ...rule, ticketDays })}
              />
              {problem && <p className="text-destructive text-xs">{problem}</p>}
            </div>
          );
        })}
        <AddButton
          onClick={() =>
            onChange([
              ...rules,
              kind === 'cap'
                ? { parks: [], max: 1, ticketDays: null }
                : { parks: [], ticketDays: null },
            ])
          }
        >
          {noun} hinzufügen
        </AddButton>
      </div>
    </Field>
  );
}

/**
 * One purchase link: its place in the order, seller, address, whether it is the operator's shop or
 * a partner link, whom it is for, and its clicks.
 */
function LinkRow({
  index,
  count,
  link,
  clicks,
  clickState,
  error,
  onChange,
  onOfficial,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  link: TicketLink;
  clicks: number | null;
  clickState: TicketClickState;
  /** The problems of one field of the link, or with `null` of the link as a whole. */
  error: (field: 'seller' | 'url' | 'markets' | 'locales' | 'store' | null) => string | null;
  onChange: (link: TicketLink) => void;
  onOfficial: () => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const name = link.seller.trim() || `Link ${index + 1}`;
  const rest = error(null);
  return (
    <li className="grid gap-2.5 rounded-lg border border-white/[0.07] p-2.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground min-w-0 flex-1 text-xs">
          <span className="text-foreground font-medium tabular-nums">{index + 1}.</span>
          {index === 0 ? ' Steht vorn' : null}
          <span className="mx-1.5">·</span>
          <ClickFigure count={clicks} loading={clickState.loading} failed={clickState.failed} />
        </span>
        <div className="-my-1 -mr-1 flex shrink-0">
          <MoveButtons
            name={name}
            onUp={index > 0 ? () => onMove(index - 1) : null}
            onDown={index < count - 1 ? () => onMove(index + 1) : null}
          />
          <RemoveButton label={`${name} entfernen`} onClick={onRemove} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[14rem_1fr]">
        <Field label="Verkäufer" error={error('seller')}>
          <TextInput
            aria-label={`Link ${index + 1}: Verkäufer`}
            value={link.seller}
            maxLength={80}
            autoComplete="off"
            placeholder="Attraction Tickets"
            onChange={(event) => onChange({ ...link, seller: event.target.value })}
          />
        </Field>
        <Field label="Adresse" error={error('url')}>
          <UrlInput
            aria-label={`Link ${index + 1}: Adresse`}
            value={link.url}
            maxLength={500}
            placeholder="https://…"
            onChange={(event) => onChange({ ...link, url: event.target.value })}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Switch
          checked={link.official === true}
          onCheckedChange={(on) => {
            if (on) onOfficial();
            else {
              const { official: _official, ...withoutOfficial } = link;
              onChange(withoutOfficial);
            }
          }}
          label="Offizieller Shop"
        />
        <Switch
          checked={link.sponsored}
          onCheckedChange={(sponsored) => onChange({ ...link, sponsored })}
          label="Partnerlink"
        />
      </div>
      {link.sponsored && (
        <p className="text-muted-foreground text-xs">
          Ein Affiliate- oder bezahlter Link: Die Website kennzeichnet ihn als Partnerlink und
          verlinkt ihn mit rel=&quot;sponsored&quot;.
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field
          label="Markt"
          error={error('markets')}
          hint="Wo der Händler verkauft, als Hinweis am Link. Leer: überall."
        >
          <ToggleChips
            label={`Link ${index + 1}: Märkte`}
            options={MARKET_OPTIONS}
            value={link.markets ?? []}
            onChange={(markets) => onChange({ ...link, markets: markets as TicketMarket[] })}
          />
        </Field>
        <Field label="Für Sprachen" error={error('locales')} hint="Leer: für alle.">
          <ToggleChips
            label={`Link ${index + 1}: Sprachen`}
            options={LOCALE_OPTIONS}
            value={link.locales ?? []}
            onChange={(locales) => onChange({ ...link, locales })}
          />
        </Field>
      </div>
      <Field
        label="Länder-Shop"
        error={error('store')}
        hint="Land und Währung des Shops, etwa IE und EUR: Die Website nennt den Link „Attraction Tickets · Irland (€)“. Leer: Händler mit einem Shop."
      >
        <div className="flex gap-2">
          <TextInput
            aria-label={`Link ${index + 1}: Land des Shops`}
            value={link.store?.country ?? ''}
            maxLength={2}
            autoComplete="off"
            placeholder="GB"
            className="w-20 uppercase"
            onChange={(event) =>
              onChange(withTicketLinkStore(link, { country: event.target.value }))
            }
          />
          <TextInput
            aria-label={`Link ${index + 1}: Währung des Shops`}
            value={link.store?.currency ?? ''}
            maxLength={3}
            autoComplete="off"
            placeholder="GBP"
            className="w-24 uppercase"
            onChange={(event) =>
              onChange(withTicketLinkStore(link, { currency: event.target.value }))
            }
          />
        </div>
      </Field>
      {rest && <p className="text-destructive text-xs">{rest}</p>}
    </li>
  );
}

/**
 * What the API made of the draft: still checking, the problems to fix first, or the sample trip
 * planned once with the product as an owned ticket and once in plan first.
 */
function DryRun({
  dirty,
  checking,
  checked,
  failure,
  problemCount,
  runProblems,
}: {
  dirty: boolean;
  checking: boolean;
  checked: TicketValidation | null;
  failure: string | null;
  problemCount: number;
  runProblems: TicketProblem[];
}) {
  let content: ReactNode;
  if (!dirty) {
    content = (
      <span className="text-muted-foreground">
        Nach der ersten Änderung prüft die API das Ticket und plant damit eine Probereise.
      </span>
    );
  } else if (checking) {
    content = (
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Prüft…
      </span>
    );
  } else if (failure) {
    content = (
      <span className="text-amber-300">
        Die Prüfung ließ sich nicht abrufen ({failure}). Beim Speichern prüft die API trotzdem.
      </span>
    );
  } else if (checked?.dryRun) {
    const run = checked.dryRun;
    content = (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {(['owned', 'planFirst'] as const).map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="text-muted-foreground">{TICKET_DRY_RUN_LABELS[key]}</span>
            <Chip tone={TICKET_DRY_RUN_RESULTS[run[key]].tone}>
              {TICKET_DRY_RUN_RESULTS[run[key]].label}
            </Chip>
          </span>
        ))}
        {run.note && <span className="text-muted-foreground">{run.note}</span>}
      </span>
    );
  } else if (problemCount > 0) {
    content = (
      <span className="text-muted-foreground">
        {problemCount === 1 ? 'Ein Problem' : `${problemCount} Probleme`} an den Feldern. Die
        Probereise läuft, sobald das Ticket die Prüfung besteht.
      </span>
    );
  } else {
    content = <span className="text-muted-foreground">Geprüft.</span>;
  }
  return (
    <div className="grid gap-1 text-xs" aria-live="polite">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-foreground/80 font-medium">Probereise</span>
        {content}
      </p>
      {runProblems.map((problem) => (
        <p key={`${problem.path}:${problem.message}`} className="text-destructive">
          {TICKET_DRY_RUN_LABELS[problem.path.slice('dryRun.'.length) as 'owned' | 'planFirst'] ??
            problem.path}
          : {problem.message}
        </p>
      ))}
    </div>
  );
}
