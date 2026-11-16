'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Activity,
  BarChart3,
  KeySquare,
  Loader2,
  Pencil,
  Plus,
  RotateCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DATA_API_KEYS_PATH,
  DATA_API_KEYS_QUERY_KEY,
  DATA_API_KEY_USAGE_LABELS,
  apiStoresPermissions,
  effectivePermissions,
  isLegacyKey,
  DEFAULT_ROTATION_GRACE_HOURS,
  ROTATION_GRACE_CHOICES,
  createDataApiKeyBody,
  dataApiKeyPath,
  describeRotationGrace,
  formatAllowedParks,
  formatHourlyUsage,
  formatKeyExpiry,
  formatKeyMoment,
  formatKeyUsage,
  formatPreviousKeyStatus,
  formatUsageMonth,
  usedMonths,
  parseRequestsPerHour,
  previousKeyValidUntil,
  type CreatedDataApiKey,
  type DataApiKey,
  type DataApiKeyUsage,
  type RotationGraceHours,
} from '@/lib/admin/api-keys';
import { formatPermissions } from '@/lib/admin/developer-labels';
import {
  API_PERMISSIONS,
  DEFAULT_KEY_REQUESTS_PER_HOUR,
  apiKeyCurlExample,
  type ApiPermission,
} from '@/lib/developers/permissions';
import { usageTotals } from '@/lib/developers/dashboard';
import { hasPassed } from '@/lib/admin/mcp';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { formatAgo } from '../_lib/format';
import { useSession } from '../_app/session';
import { BarList, CATEGORICAL, SeriesChart, Sparkline } from '../_ui/charts';
import { CodeBlock, SYSTEM_MONO } from '../_ui/code-block';
import { CopyButton } from '../_ui/copy-button';
import { Field, Select, TextInput, useFieldId } from '../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  SCROLLING_DIALOG,
  SkeletonRows,
  StatTile,
  Tile,
} from '../_ui/primitives';
import {
  ExpiryField,
  LimitField,
  ParksField,
  PermissionsField,
  useKeyExpiry,
} from './_components/key-fields';
import { KeyRequestsPanel } from './_components/key-requests-panel';
import { useToast } from '../_ui/toast';

const USAGE_OPTIONS = (Object.keys(DATA_API_KEY_USAGE_LABELS) as DataApiKeyUsage[]).map(
  (usage) => ({ value: usage, label: DATA_API_KEY_USAGE_LABELS[usage] })
);

/**
 * The data API keys: who may read what on api.park.fan, permission by permission. Owner only,
 * because a key is a licensing decision rather than an editorial one; the backend enforces the
 * same. On top, the keys' use in figures; then the requests from the developer dashboard, each of
 * which becomes a key only here; then the keys themselves.
 */
export default function ApiKeysPage() {
  const { identity } = useSession();
  const [creating, setCreating] = useState(false);
  const keys = useAdminQuery<{ items: DataApiKey[] }>(DATA_API_KEYS_QUERY_KEY, DATA_API_KEYS_PATH);
  const items = keys.data?.items ?? [];
  const permissionsStored = apiStoresPermissions(items);

  if (identity.role !== 'owner') {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nur für Inhaber"
        description="API-Keys vergibt nur, wer die Rolle „Inhaber“ hat."
      />
    );
  }

  return (
    <AdminPage width="narrow">
      {items.length > 0 && <KeyOverview items={items} />}

      <KeyRequestsPanel permissionsStored={permissionsStored} />

      <Panel>
        <PanelHeader
          icon={KeySquare}
          title="API-Keys"
          hint="Ein Key öffnet api.park.fan Berechtigung für Berechtigung, für eine Person oder ein Projekt. Ohne Key sind nur die Wartezeiten offen."
          action={
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Key erstellen
            </Button>
          }
        />
        {keys.isError ? (
          <ErrorState message={keys.error.message} onRetry={() => void keys.refetch()} />
        ) : keys.isLoading ? (
          <SkeletonRows rows={3} />
        ) : (
          <PanelBody>
            <KeyList items={items} permissionsStored={permissionsStored} />
          </PanelBody>
        )}
      </Panel>

      {creating && (
        <CreateKeyDialog permissionsStored={permissionsStored} onClose={() => setCreating(false)} />
      )}
    </AdminPage>
  );
}

/**
 * Every key's use at a glance: the live keys, the requests of this hour, today and the last 30
 * days across all of them, and the busiest keys of those 30 days.
 */
function KeyOverview({ items }: { items: DataApiKey[] }) {
  const now = useMinuteNow();
  const totals = usageTotals(items);
  const live = items.filter(
    (key) => !key.revokedAt && (now === null || !hasPassed(key.expiresAt, now))
  );
  const fromRequests = live.filter((key) => key.ownerUserId).length;
  const waiting = live.filter((key) => key.revealedAt === null).length;
  const sum = (key: DataApiKey, field: 'requests' | 'limited') =>
    (key.stats?.days ?? []).reduce((total, day) => total + day[field], 0);
  const limited = live.reduce((total, key) => total + sum(key, 'limited'), 0);
  const busiest = live
    .map((key) => ({ key: key.id, label: key.name, value: sum(key, 'requests') }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
  const count = (value: number) => value.toLocaleString('de-DE');
  const origin = [
    fromRequests > 0 && `${count(fromRequests)} aus Anträgen`,
    waiting > 0 && `${count(waiting)} nicht abgeholt`,
  ].filter(Boolean);
  return (
    <Panel>
      <PanelHeader
        icon={Activity}
        title="Nutzung"
        hint="Alle aktiven Keys zusammen; ein Tag läuft nach UTC."
      />
      <PanelBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Aktive Keys"
            value={count(live.length)}
            sub={origin.length > 0 ? origin.join(', ') : undefined}
          />
          <StatTile label="Diese Stunde" value={count(totals.thisHour)} />
          <StatTile label="Heute" value={count(totals.today)} />
          <StatTile
            label="30 Tage"
            value={count(totals.last30Days)}
            sub={limited > 0 ? `${count(limited)} über dem Limit abgelehnt` : undefined}
          />
        </div>
        {busiest.length > 0 && <BarList unit="Anfragen in 30 Tagen" limit={8} rows={busiest} />}
      </PanelBody>
    </Panel>
  );
}

function KeyList({
  items,
  permissionsStored,
}: {
  items: DataApiKey[];
  permissionsStored: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  // Kept after the dialog closes, so its text does not change while it fades out.
  const [pending, setPending] = useState<DataApiKey | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState<DataApiKey | null>(null);
  const [viewing, setViewing] = useState<DataApiKey | null>(null);
  const [rotating, setRotating] = useState<DataApiKey | null>(null);
  // Kept after their dialogs close, like `pending`.
  const [ending, setEnding] = useState<DataApiKey | null>(null);
  const [deleting, setDeleting] = useState<DataApiKey | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const now = useMinuteNow();

  async function act(
    path: string,
    method: 'DELETE' | 'POST',
    toasts: { done: string; failed: string }
  ) {
    try {
      await adminFetch(path, { method });
      invalidate(DATA_API_KEYS_QUERY_KEY);
      toast.push({ title: toasts.done, tone: 'success' });
    } catch (err) {
      toast.push({
        title: toasts.failed,
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={KeySquare}
        title="Noch keine Keys"
        description="Ohne Key liefert die API nur Wartezeiten. Leg für die Website einen Key mit der Nutzung „park.fan selbst“ an und setz ihn in Vercel als API_DATA_KEY; bis die API mit FORECAST_BYPASS_KEY=off läuft, öffnet ihr auch der Bypass-Key alles."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((key) => (
          <KeyRow
            key={key.id}
            apiKey={key}
            now={now}
            permissionsStored={permissionsStored}
            onStats={() => setViewing(key)}
            onEdit={() => setEditing(key)}
            onRotate={() => setRotating(key)}
            onEndGrace={() => {
              setEnding(key);
              setConfirmingEnd(true);
            }}
            onRevoke={() => {
              setPending(key);
              setConfirming(true);
            }}
            onDelete={() => {
              setDeleting(key);
              setConfirmingDelete(true);
            }}
          />
        ))}
      </ul>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        icon={Trash2}
        tone="destructive"
        title={`Key „${pending?.name ?? ''}“ widerrufen?`}
        description={
          pending?.usage === 'internal'
            ? 'Das ist der Key der Website: park.fan bekommt von der API dann nur noch Wartezeiten, bis ein neuer Key in Vercel als API_DATA_KEY steht. Das lässt sich nicht rückgängig machen.'
            : 'Wer diesen Key nutzt, bekommt ab der nächsten Anfrage nur noch, was ohne Key offen ist. Das lässt sich nicht rückgängig machen.'
        }
        confirmLabel="Widerrufen"
        cancelLabel="Abbrechen"
        onConfirm={() =>
          pending &&
          void act(dataApiKeyPath(pending.id), 'DELETE', {
            done: 'Key widerrufen',
            failed: 'Widerruf fehlgeschlagen',
          })
        }
      />

      <ConfirmDialog
        open={confirmingEnd}
        onOpenChange={setConfirmingEnd}
        icon={Trash2}
        tone="destructive"
        title={`Alten Key von „${ending?.name ?? ''}“ jetzt sperren?`}
        description={
          ending?.usage === 'internal'
            ? 'Das ist der Key der Website: Steht der neue Key noch nicht in Vercel als API_DATA_KEY, bekommt park.fan ab der nächsten Anfrage nur noch Wartezeiten. Der neue Key gilt weiter.'
            : 'Wer noch den alten Key sendet, bekommt ab der nächsten Anfrage nur noch, was ohne Key offen ist. Der neue Key gilt weiter.'
        }
        confirmLabel="Alten Key sperren"
        cancelLabel="Abbrechen"
        onConfirm={() =>
          ending &&
          void act(dataApiKeyPath(ending.id, 'previous'), 'DELETE', {
            done: 'Alter Key gesperrt',
            failed: 'Sperren fehlgeschlagen',
          })
        }
      />

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        icon={Trash2}
        tone="destructive"
        title={`Key „${deleting?.name ?? ''}“ endgültig löschen?`}
        description="Der widerrufene Key verschwindet aus der Liste, mit seiner Statistik; unter „Änderungen“ bleibt er verzeichnet. Das lässt sich nicht rückgängig machen."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={() =>
          deleting &&
          void act(dataApiKeyPath(deleting.id, 'delete'), 'POST', {
            done: 'Key gelöscht',
            failed: 'Löschen fehlgeschlagen',
          })
        }
      />

      {editing && (
        <EditKeyDialog
          apiKey={editing}
          permissionsStored={permissionsStored}
          onClose={() => setEditing(null)}
        />
      )}
      {rotating && <RotateKeyDialog apiKey={rotating} onClose={() => setRotating(null)} />}
      {viewing && <StatsDialog apiKey={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function KeyRow({
  apiKey,
  now,
  permissionsStored,
  onStats,
  onEdit,
  onRotate,
  onEndGrace,
  onRevoke,
  onDelete,
}: {
  apiKey: DataApiKey;
  /** Null until the clock is known, so the server and the first render agree. */
  now: number | null;
  permissionsStored: boolean;
  onStats: () => void;
  onEdit: () => void;
  onRotate: () => void;
  onEndGrace: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}) {
  const revoked = apiKey.revokedAt !== null;
  const expired = !revoked && now !== null && hasPassed(apiKey.expiresAt, now);
  // An expired key is refused a rotation: its new secret would open nothing until it is extended.
  const rotatable = !revoked && now !== null && !expired;
  const previousUntil = rotatable ? previousKeyValidUntil(apiKey, now) : null;
  // Only the text dims: an expired key is extended through its edit button, which stays as is.
  const dimmed = revoked || expired ? 'opacity-60' : '';
  return (
    <li className="border-border/60 bg-card/40 rounded-lg border px-3 py-2.5">
      {/* The buttons share the first line with the name, so on a phone the details below get the
          card's whole width instead of a column beside two buttons. */}
      <div className="flex items-start gap-3">
        <KeySquare
          className={`text-muted-foreground mt-0.5 h-4 w-4 shrink-0 ${dimmed}`}
          aria-hidden
        />
        <p
          className={`flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm ${dimmed}`}
        >
          <span className="min-w-0 truncate font-medium">{apiKey.name}</span>
          <Chip tone={apiKey.usage === 'commercial' ? 'primary' : 'muted'}>
            {DATA_API_KEY_USAGE_LABELS[apiKey.usage]}
          </Chip>
          {apiKey.owner && <Chip tone="muted">Entwicklerkonto</Chip>}
          {!revoked && apiKey.revealedAt === null && <Chip tone="warning">nicht abgeholt</Chip>}
          {revoked && <Chip tone="danger">widerrufen</Chip>}
          {expired && <Chip tone="danger">abgelaufen</Chip>}
        </p>
        <div className="-my-1 -mr-1 flex shrink-0">
          {apiKey.stats && (
            <button
              type="button"
              onClick={onStats}
              aria-label={`Aufrufe von ${apiKey.name}`}
              className="text-muted-foreground hover:text-foreground rounded p-1.5 max-sm:p-3"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
          )}
          {!revoked && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`${apiKey.name} bearbeiten`}
              className="text-muted-foreground hover:text-foreground rounded p-1.5 max-sm:p-3"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {rotatable && (
            <button
              type="button"
              onClick={onRotate}
              aria-label={`${apiKey.name} rotieren`}
              title="Rotieren"
              className="text-muted-foreground hover:text-foreground rounded p-1.5 max-sm:p-3"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={revoked ? onDelete : onRevoke}
            aria-label={`${apiKey.name} ${revoked ? 'löschen' : 'widerrufen'}`}
            className="text-muted-foreground hover:text-destructive rounded p-1.5 max-sm:p-3"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className={`text-muted-foreground mt-1 space-y-1 text-xs sm:pl-7 ${dimmed}`}>
        <p className="flex flex-wrap gap-x-3 gap-y-0.5">
          <code className={SYSTEM_MONO}>{apiKey.prefix}…</code>
          {apiKey.owner ? (
            <span className="break-all">
              {apiKey.owner.displayName} · {apiKey.owner.email}
            </span>
          ) : (
            apiKey.contact && <span className="break-all">{apiKey.contact}</span>
          )}
          <span>erstellt {formatAgo(apiKey.createdAt)}</span>
          <span>
            {apiKey.lastUsedAt ? `zuletzt genutzt ${formatAgo(apiKey.lastUsedAt)}` : 'nie genutzt'}
          </span>
          {apiKey.rotatedAt && <span>rotiert {formatAgo(apiKey.rotatedAt)}</span>}
          {apiKey.revokedAt && <span>widerrufen {formatAgo(apiKey.revokedAt)}</span>}
        </p>
        {!revoked && (
          <>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span>{formatHourlyUsage(apiKey)}</span>
              {now !== null && <span>{formatKeyExpiry(apiKey.expiresAt, now)}</span>}
            </p>
            <p>{formatAllowedParks(apiKey)}</p>
            {permissionsStored && (
              <p>
                {apiKey.usage === 'internal'
                  ? 'liest alles, als park.fan selbst'
                  : isLegacyKey(apiKey)
                    ? 'Altbestand ohne eigene Berechtigungen: liest alles'
                    : formatPermissions(effectivePermissions(apiKey))}
              </p>
            )}
          </>
        )}
        {previousUntil && (
          <div className="text-foreground/80 flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
            <span>
              {formatPreviousKeyStatus(
                previousUntil,
                apiKey.previousLastUsedAt ? formatAgo(apiKey.previousLastUsedAt) : null
              )}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={onEndGrace}>
              Alten Key jetzt sperren
            </Button>
          </div>
        )}
        {apiKey.stats && (
          <p className="flex items-center gap-2">
            <Sparkline values={apiKey.stats.days.map((day) => day.requests)} className="h-4 w-16" />
            <span>{formatKeyUsage(apiKey.stats)}</span>
          </p>
        )}
        {apiKey.note && <p>{apiKey.note}</p>}
      </div>
    </li>
  );
}

/**
 * Issues a key by hand, for park.fan itself or a partner with an agreement; developers' keys come
 * from their requests. The key is shown once, in this dialog.
 */
function CreateKeyDialog({
  permissionsStored,
  onClose,
}: {
  permissionsStored: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [usage, setUsage] = useState<DataApiKeyUsage>('non-commercial');
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(String(DEFAULT_KEY_REQUESTS_PER_HOUR));
  const [parkIds, setParkIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([...API_PERMISSIONS]);
  const expiry = useKeyExpiry(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The key lives in this state and nowhere else, and goes when the dialog does.
  const [created, setCreated] = useState<CreatedDataApiKey | null>(null);
  // A second submit can arrive before the first one's re-render disables the button.
  const submitting = useRef(false);
  const ids = {
    name: useFieldId('api-key-name'),
    contact: useFieldId('api-key-contact'),
    note: useFieldId('api-key-note'),
    limit: useFieldId('api-key-limit'),
    usage: useFieldId('api-key-usage'),
    parks: useFieldId('api-key-parks'),
    expiry: useFieldId('api-key-expiry'),
  };
  const requestsPerHour = parseRequestsPerHour(limit);
  const complete =
    name.trim().length > 0 &&
    requestsPerHour !== undefined &&
    expiry.expiresAt !== undefined &&
    (!permissionsStored || permissions.length > 0);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (
      submitting.current ||
      !complete ||
      requestsPerHour === undefined ||
      expiry.expiresAt === undefined
    ) {
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await adminFetch<CreatedDataApiKey>(DATA_API_KEYS_PATH, {
        method: 'POST',
        body: createDataApiKeyBody({
          name,
          contact,
          usage,
          note,
          requestsPerHour,
          allowedParkIds: parkIds,
          expiresAt: expiry.expiresAt,
          ...(permissionsStored && { permissions }),
        }),
      });
      setCreated(result);
      invalidate(DATA_API_KEYS_QUERY_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erstellen fehlgeschlagen');
      toast.push({ title: 'Key nicht erstellt', tone: 'error' });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // The key exists only in this response, so the overlay and Escape do not dismiss it, nor while
  // the request that returns it is still running: only the button does, after the person has seen
  // the warning.
  const locked = busy || created !== null;

  return (
    <Dialog open onOpenChange={(open) => !open && !locked && onClose()}>
      <DialogContent
        className={`${SCROLLING_DIALOG} sm:max-w-xl`}
        showCloseButton={!locked}
        onInteractOutside={(event) => locked && event.preventDefault()}
        onEscapeKeyDown={(event) => locked && event.preventDefault()}
      >
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Key erstellt</DialogTitle>
              <DialogDescription>
                Für {created.item.name}, {DATA_API_KEY_USAGE_LABELS[created.item.usage]}.
              </DialogDescription>
            </DialogHeader>

            <OneTimeKey
              apiKey={created.key}
              ifLost="Geht er verloren, widerrufst du ihn und erstellst einen neuen."
            />

            <DialogFooter>
              <Button onClick={onClose}>Fertig</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={(event) => void create(event)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Key erstellen</DialogTitle>
              <DialogDescription>
                Für park.fan selbst oder einen Partner mit Vereinbarung. Ein Key von hier gehört
                keinem Entwicklerkonto; Anträge gibst du oben frei.
              </DialogDescription>
            </DialogHeader>

            <Field label="Name" htmlFor={ids.name} hint="Wer oder welches Projekt den Key nutzt.">
              <TextInput
                id={ids.name}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                placeholder="z. B. Coaster-Club-Website"
                autoComplete="off"
              />
            </Field>
            <Field label="Kontakt" htmlFor={ids.contact} hint="E-Mail oder Website, optional.">
              <TextInput
                id={ids.contact}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                maxLength={200}
                autoComplete="off"
              />
            </Field>
            <Field
              label="Nutzung"
              htmlFor={ids.usage}
              hint="Kommerziell nur mit schriftlicher Vereinbarung (Impressum, „Nutzung der Daten“)."
            >
              <Select
                id={ids.usage}
                value={usage}
                allowEmpty={false}
                onValueChange={(value) => setUsage((value as DataApiKeyUsage | null) ?? usage)}
                options={USAGE_OPTIONS}
              />
            </Field>
            <PermissionsField
              stored={permissionsStored}
              value={permissions}
              onChange={setPermissions}
            />
            <LimitField id={ids.limit} value={limit} onChange={setLimit} />
            <ParksField id={ids.parks} value={parkIds} onChange={setParkIds} />
            <ExpiryField id={ids.expiry} expiry={expiry} />
            <Field label="Notiz" htmlFor={ids.note} hint="Optional, nur für dich.">
              <TextInput
                id={ids.note}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                autoComplete="off"
              />
            </Field>

            {error && (
              <p role="alert" className="text-destructive text-xs">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={busy || !complete}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * A key in clear, the one time the API answers it: the warning, the key and how it is sent, each
 * with a copy button. The key's copy button takes the focus, because the button that asked for the
 * key is gone.
 */
function OneTimeKey({ apiKey, ifLost }: { apiKey: string; ifLost: string }) {
  const tiles = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tiles.current?.querySelector('button')?.focus();
  }, []);
  return (
    <>
      <Notice role="alert">
        Speichere den Key jetzt: Er wird nur dieses eine Mal angezeigt und lässt sich danach nicht
        mehr abrufen. {ifLost}
      </Notice>

      <div ref={tiles} className="grid gap-4">
        <Tile title="Key" action={<CopyButton value={apiKey} />}>
          <CodeBlock breakAnywhere>{apiKey}</CodeBlock>
        </Tile>

        <Tile
          title="So wird er gesendet"
          hint="Im Header X-API-Key, nie in der URL."
          action={<CopyButton value={apiKeyCurlExample(apiKey)} />}
        >
          <CodeBlock>{apiKeyCurlExample(apiKey)}</CodeBlock>
        </Tile>
      </div>
    </>
  );
}

/**
 * Gives a key a new secret; name, usage, limits, parks and statistics stay. The old secret can keep
 * working for a grace period, so the holder switches without an outage. The new key is shown once,
 * as on create.
 */
function RotateKeyDialog({ apiKey, onClose }: { apiKey: DataApiKey; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [grace, setGrace] = useState<RotationGraceHours>(DEFAULT_ROTATION_GRACE_HOURS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The key lives in this state and nowhere else, and goes when the dialog does.
  const [rotated, setRotated] = useState<CreatedDataApiKey | null>(null);
  const submitting = useRef(false);
  const graceId = useFieldId('api-key-grace');

  async function rotate(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await adminFetch<CreatedDataApiKey>(dataApiKeyPath(apiKey.id, 'rotate'), {
        method: 'POST',
        body: { graceHours: grace },
      });
      setRotated(result);
      invalidate(DATA_API_KEYS_QUERY_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rotieren fehlgeschlagen');
      toast.push({ title: 'Key nicht rotiert', tone: 'error' });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // As on create: while the request runs and while the key is shown, only the button closes it.
  const locked = busy || rotated !== null;
  // Seen from the rotation itself, which the answer dates; the key's own end date can come first.
  const previousUntil = rotated
    ? previousKeyValidUntil(rotated.item, Date.parse(rotated.item.rotatedAt ?? ''))
    : null;

  return (
    <Dialog open onOpenChange={(open) => !open && !locked && onClose()}>
      <DialogContent
        className={`${SCROLLING_DIALOG} sm:max-w-xl`}
        showCloseButton={!locked}
        onInteractOutside={(event) => locked && event.preventDefault()}
        onEscapeKeyDown={(event) => locked && event.preventDefault()}
      >
        {rotated ? (
          <>
            <DialogHeader>
              <DialogTitle>Neuer Key für {rotated.item.name}</DialogTitle>
              <DialogDescription>
                {previousUntil
                  ? `Der alte Key gilt bis ${formatKeyMoment(previousUntil)}.`
                  : 'Der alte Key ist gesperrt.'}
              </DialogDescription>
            </DialogHeader>

            <OneTimeKey
              apiKey={rotated.key}
              ifLost="Geht er verloren, rotierst du den Key noch einmal."
            />

            <DialogFooter>
              <Button onClick={onClose}>Fertig</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={(event) => void rotate(event)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{apiKey.name} rotieren</DialogTitle>
              <DialogDescription>
                Der Key bekommt ein neues Geheimnis. Name, Nutzung, Limits, Parks und Statistik
                bleiben.
              </DialogDescription>
            </DialogHeader>

            {apiKey.usage === 'internal' && (
              <Notice>
                Das ist der Key der Website: Trag den neuen Key in Vercel als API_DATA_KEY ein,
                bevor der alte gesperrt wird.
              </Notice>
            )}

            <Field
              label="Übergangszeit"
              htmlFor={graceId}
              // Read out when the choice changes, since it says what the choice does.
              hint={<span aria-live="polite">{describeRotationGrace(grace)}</span>}
            >
              <Select
                id={graceId}
                value={String(grace)}
                allowEmpty={false}
                onValueChange={(value) =>
                  setGrace(value === null ? grace : (Number(value) as RotationGraceHours))
                }
                options={ROTATION_GRACE_CHOICES.map((choice) => ({
                  value: String(choice.value),
                  label: choice.label,
                }))}
              />
            </Field>

            {error && (
              <p role="alert" className="text-destructive text-xs">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Rotieren
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * A key's use: its requests per UTC day for the last 30 days, with the ones its allowance refused
 * when there were any, and its requests per month for the last 12, newest first.
 */
function StatsDialog({ apiKey, onClose }: { apiKey: DataApiKey; onClose: () => void }) {
  const stats = apiKey.stats;
  const refused = stats?.days.some((day) => day.limited > 0) ?? false;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${SCROLLING_DIALOG} sm:max-w-2xl`}>
        <DialogHeader>
          <DialogTitle>Aufrufe von {apiKey.name}</DialogTitle>
          <DialogDescription>
            Jede Anfrage, die mit diesem Key durchkam, gezählt nach Tagen in UTC; der heutige Tag
            läuft noch.
          </DialogDescription>
        </DialogHeader>
        {stats && (
          <>
            <SeriesChart
              label={`Aufrufe von ${apiKey.name} pro Tag`}
              days={stats.days.map((day) => day.date)}
              partial={stats.days.map((_, index) => index === stats.days.length - 1)}
              height={200}
              series={[
                {
                  key: 'requests',
                  label: 'Anfragen',
                  color: CATEGORICAL[0],
                  values: stats.days.map((day) => day.requests),
                },
                ...(refused
                  ? [
                      {
                        key: 'limited',
                        label: 'davon über dem Limit abgelehnt',
                        color: CATEGORICAL[1],
                        values: stats.days.map((day) => day.limited),
                      },
                    ]
                  : []),
              ]}
            />
            <div className="space-y-2">
              <h3 className="text-foreground/80 text-xs font-medium tracking-wide">Pro Monat</h3>
              <BarList
                unit="Anfragen"
                limit={6}
                rows={usedMonths(stats).map((month) => ({
                  key: month.month,
                  label: formatUsageMonth(month.month),
                  value: month.requests,
                }))}
              />
            </div>
          </>
        )}
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Changes a key's permissions, hourly allowance, parks and end date; the key itself, its name and
 * usage stay. A key from before permissions gets its first list here, starting with everything.
 */
function EditKeyDialog({
  apiKey,
  permissionsStored,
  onClose,
}: {
  apiKey: DataApiKey;
  permissionsStored: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [limit, setLimit] = useState(
    apiKey.requestsPerHour === null ? '' : String(apiKey.requestsPerHour)
  );
  const [parkIds, setParkIds] = useState<string[]>(apiKey.allowedParkIds ?? []);
  const [permissions, setPermissions] = useState<ApiPermission[]>(() =>
    effectivePermissions(apiKey)
  );
  const [busy, setBusy] = useState(false);
  const expiry = useKeyExpiry(apiKey.expiresAt);
  const fieldId = useFieldId('api-key-limit-edit');
  const parksId = useFieldId('api-key-parks-edit');
  const expiryId = useFieldId('api-key-expiry-edit');
  const requestsPerHour = parseRequestsPerHour(limit);
  const ready =
    requestsPerHour !== undefined &&
    expiry.expiresAt !== undefined &&
    (!permissionsStored || permissions.length > 0);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    try {
      await adminFetch(dataApiKeyPath(apiKey.id), {
        method: 'PATCH',
        body: {
          requestsPerHour,
          allowedParkIds: parkIds.length > 0 ? parkIds : null,
          ...(permissionsStored && { permissions }),
          // Only when it changed: an expired key's old date would be refused as past.
          ...(!expiry.unchanged && { expiresAt: expiry.expiresAt }),
        },
      });
      invalidate(DATA_API_KEYS_QUERY_KEY);
      toast.push({ title: 'Key gespeichert', tone: 'success' });
      onClose();
    } catch (err) {
      toast.push({
        title: 'Speichern fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${SCROLLING_DIALOG} sm:max-w-lg`}>
        <form onSubmit={(event) => void save(event)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{apiKey.name} bearbeiten</DialogTitle>
            <DialogDescription>
              Gilt ab der nächsten Anfrage. {formatHourlyUsage(apiKey)}.
            </DialogDescription>
          </DialogHeader>
          <PermissionsField
            stored={permissionsStored}
            value={permissions}
            onChange={setPermissions}
          />
          <LimitField id={fieldId} value={limit} onChange={setLimit} />
          <ParksField id={parksId} value={parkIds} onChange={setParkIds} />
          <ExpiryField id={expiryId} expiry={expiry} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={busy || !ready}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
