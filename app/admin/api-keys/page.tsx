'use client';

import { useRef, useState, type FormEvent } from 'react';
import { KeySquare, Loader2, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
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
  DEFAULT_REQUESTS_PER_HOUR,
  createDataApiKeyBody,
  dataApiKeyCurlExample,
  formatAllowedParks,
  formatHourlyUsage,
  MAX_REQUESTS_PER_HOUR,
  parseRequestsPerHour,
  type CreatedDataApiKey,
  type DataApiKey,
  type DataApiKeyUsage,
} from '@/lib/admin/api-keys';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import type { AdminParkListItem } from '../_lib/types';
import { formatAgo } from '../_lib/format';
import { useSession } from '../_app/session';
import { CodeBlock, SYSTEM_MONO } from '../_ui/code-block';
import { CopyButton } from '../_ui/copy-button';
import { Field, SearchSelect, Select, TextInput, useFieldId } from '../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
  Tile,
} from '../_ui/primitives';
import { useToast } from '../_ui/toast';

const USAGE_OPTIONS = (Object.keys(DATA_API_KEY_USAGE_LABELS) as DataApiKeyUsage[]).map(
  (usage) => ({ value: usage, label: DATA_API_KEY_USAGE_LABELS[usage] })
);

/**
 * The data API keys: who may read park.fan's forecasts on api.park.fan. Owner only, because a key
 * decides who uses the forecasts, which is a licensing decision rather than an editorial one; the
 * backend enforces the same.
 */
export default function ApiKeysPage() {
  const { identity } = useSession();
  const [creating, setCreating] = useState(false);
  const keys = useAdminQuery<{ items: DataApiKey[] }>(DATA_API_KEYS_QUERY_KEY, DATA_API_KEYS_PATH);

  if (identity.role !== 'owner') {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nur für Inhaber"
        description="API-Keys vergibt die Rolle „Inhaber“."
      />
    );
  }

  return (
    <AdminPage width="narrow">
      <Panel>
        <PanelHeader
          icon={KeySquare}
          title="API-Keys"
          hint="Ein Key schaltet die Prognosen auf api.park.fan frei, für eine Person oder ein Projekt."
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
            <KeyList items={keys.data?.items ?? []} />
          </PanelBody>
        )}
      </Panel>

      {creating && <CreateKeyDialog onClose={() => setCreating(false)} />}
    </AdminPage>
  );
}

function KeyList({ items }: { items: DataApiKey[] }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  // Kept after the dialog closes, so its text does not change while it fades out.
  const [pending, setPending] = useState<DataApiKey | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState<DataApiKey | null>(null);

  async function revoke(key: DataApiKey) {
    try {
      await adminFetch(`${DATA_API_KEYS_PATH}/${encodeURIComponent(key.id)}`, {
        method: 'DELETE',
      });
      invalidate(DATA_API_KEYS_QUERY_KEY);
      toast.push({ title: 'Key widerrufen', tone: 'success' });
    } catch (err) {
      toast.push({
        title: 'Widerrufen fehlgeschlagen',
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
        description="Ohne Key liefert die API keine Prognosen, auch park.fan selbst nicht. Für die Seite einen Key mit der Nutzung „park.fan selbst“ anlegen und in Vercel als API_DATA_KEY setzen."
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
            onEdit={() => setEditing(key)}
            onRevoke={() => {
              setPending(key);
              setConfirming(true);
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
        description="Wer diesen Key nutzt, bekommt sofort keine Prognosen mehr. Das lässt sich nicht rückgängig machen."
        confirmLabel="Widerrufen"
        cancelLabel="Abbrechen"
        onConfirm={() => pending && void revoke(pending)}
      />

      {editing && <EditKeyDialog apiKey={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function KeyRow({
  apiKey,
  onEdit,
  onRevoke,
}: {
  apiKey: DataApiKey;
  onEdit: () => void;
  onRevoke: () => void;
}) {
  const revoked = apiKey.revokedAt !== null;
  return (
    <li
      className={`border-border/60 bg-card/40 flex items-start gap-3 rounded-lg border px-3 py-2.5 ${revoked ? 'opacity-60' : ''}`}
    >
      <KeySquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="min-w-0 truncate font-medium">{apiKey.name}</span>
          <Chip tone={apiKey.usage === 'commercial' ? 'primary' : 'muted'}>
            {DATA_API_KEY_USAGE_LABELS[apiKey.usage]}
          </Chip>
          {revoked && <Chip tone="danger">widerrufen</Chip>}
        </p>
        <p className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          <code className={SYSTEM_MONO}>{apiKey.prefix}…</code>
          {apiKey.contact && <span className="break-all">{apiKey.contact}</span>}
          <span>erstellt {formatAgo(apiKey.createdAt)}</span>
          <span>
            {apiKey.lastUsedAt ? `zuletzt genutzt ${formatAgo(apiKey.lastUsedAt)}` : 'nie genutzt'}
          </span>
          {apiKey.revokedAt && <span>widerrufen {formatAgo(apiKey.revokedAt)}</span>}
        </p>
        {!revoked && (
          <p className="text-muted-foreground text-xs">
            {formatHourlyUsage(apiKey)} · {formatAllowedParks(apiKey)}
          </p>
        )}
        {apiKey.note && <p className="text-muted-foreground text-xs">{apiKey.note}</p>}
      </div>
      {!revoked && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${apiKey.name} bearbeiten`}
          className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1.5 max-sm:p-3"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {!revoked && (
        <button
          type="button"
          onClick={onRevoke}
          aria-label={`${apiKey.name} widerrufen`}
          className="text-muted-foreground hover:text-destructive -mr-1 shrink-0 rounded p-1.5 max-sm:p-3"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

function CreateKeyDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [usage, setUsage] = useState<DataApiKeyUsage>('non-commercial');
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(String(DEFAULT_REQUESTS_PER_HOUR));
  const [parkIds, setParkIds] = useState<string[]>([]);
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
  };
  const requestsPerHour = parseRequestsPerHour(limit);
  const complete = name.trim().length > 0 && requestsPerHour !== undefined;

  async function create(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !complete || requestsPerHour === undefined) return;
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
        className="sm:max-w-xl"
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

            <Notice role="alert">
              Der Key wird nur jetzt angezeigt. Danach lässt er sich nicht mehr abrufen. Geht er
              verloren, widerrufst du ihn und erstellst einen neuen.
            </Notice>

            <Tile title="Key" action={<CopyButton value={created.key} />}>
              <CodeBlock breakAnywhere>{created.key}</CodeBlock>
            </Tile>

            <Tile
              title="So wird er gesendet"
              hint="Im Header X-API-Key, nie in der URL."
              action={<CopyButton value={dataApiKeyCurlExample(created.key)} />}
            >
              <CodeBlock>{dataApiKeyCurlExample(created.key)}</CodeBlock>
            </Tile>

            <DialogFooter>
              <Button onClick={onClose}>Fertig</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={(event) => void create(event)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Key erstellen</DialogTitle>
              <DialogDescription>
                Ein Key gibt die Prognosen auf api.park.fan frei. Live-Daten braucht niemand einen
                Key.
              </DialogDescription>
            </DialogHeader>

            <Field label="Name" htmlFor={ids.name} hint="Wer oder welches Projekt den Key nutzt.">
              <TextInput
                id={ids.name}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                placeholder="z. B. Coaster-Club Website"
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
              hint="Kommerziell nur mit schriftlicher Vereinbarung, so steht es in den Nutzungsbedingungen."
            >
              <Select
                id={ids.usage}
                value={usage}
                allowEmpty={false}
                onValueChange={(value) => setUsage((value as DataApiKeyUsage | null) ?? usage)}
                options={USAGE_OPTIONS}
              />
            </Field>
            <LimitField id={ids.limit} value={limit} onChange={setLimit} />
            <ParksField id={ids.parks} value={parkIds} onChange={setParkIds} />
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

function LimitField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const invalid = parseRequestsPerHour(value) === undefined;
  return (
    <Field
      label="Anfragen pro Stunde"
      htmlFor={id}
      hint="Gezählt ab jeder vollen Stunde, zusätzlich zum allgemeinen Limit der API. Leer lassen für kein eigenes Limit."
      error={
        invalid
          ? `Eine ganze Zahl von 1 bis ${MAX_REQUESTS_PER_HOUR.toLocaleString('de-DE')}, oder leer.`
          : null
      }
    >
      <TextInput
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="kein eigenes Limit"
        autoComplete="off"
        aria-invalid={invalid || undefined}
      />
    </Field>
  );
}

/** Adds parks one at a time through the admin's park search; a chosen park is a chip to remove. */
function ParksField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  // The query the parks page already holds, so opening the dialog there costs no request.
  const parks = useAdminQuery<{ total: number; parks: AdminParkListItem[] }>(
    adminKeys.parks({ params: 'limit=500' }),
    '/api/admin/content/parks?limit=500',
    { staleTime: 10 * 60_000 }
  );
  const all = parks.data?.parks ?? [];
  const byId = new Map(all.map((park) => [park.id, park]));
  const options = all
    .filter((park) => !value.includes(park.id))
    .map((park) => ({
      value: park.id,
      label: park.name,
      hint: park.city ?? undefined,
      keywords: [park.slug, park.city ?? '', park.country ?? ''],
    }));

  return (
    <Field
      label="Parks"
      htmlFor={id}
      hint="Leer für alle Parks. Mit einer Auswahl liefert der Key Prognosen nur für diese Parks."
      error={parks.isError ? 'Die Parkliste ließ sich nicht laden.' : null}
    >
      <div className="grid gap-2">
        {value.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {value.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((other) => other !== id))}
                  aria-label={`${byId.get(id)?.name ?? id} entfernen`}
                  className="border-border bg-muted/60 hover:bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                >
                  {byId.get(id)?.name ?? id}
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <SearchSelect
          id={id}
          value={null}
          onValueChange={(id) => onChange([...value, id])}
          options={options}
          placeholder={parks.isLoading ? 'Parks werden geladen…' : 'Park hinzufügen'}
          searchPlaceholder="Park suchen…"
          disabled={parks.isLoading || parks.isError}
          fuzzy="park"
        />
      </div>
    </Field>
  );
}

/** Changes a key's hourly allowance and parks; the key itself, its name and usage stay. */
function EditKeyDialog({ apiKey, onClose }: { apiKey: DataApiKey; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [limit, setLimit] = useState(
    apiKey.requestsPerHour === null ? '' : String(apiKey.requestsPerHour)
  );
  const [parkIds, setParkIds] = useState<string[]>(apiKey.allowedParkIds ?? []);
  const [busy, setBusy] = useState(false);
  const fieldId = useFieldId('api-key-limit-edit');
  const parksId = useFieldId('api-key-parks-edit');
  const requestsPerHour = parseRequestsPerHour(limit);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || requestsPerHour === undefined) return;
    setBusy(true);
    try {
      await adminFetch(`${DATA_API_KEYS_PATH}/${encodeURIComponent(apiKey.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          requestsPerHour,
          allowedParkIds: parkIds.length > 0 ? parkIds : null,
        }),
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
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={(event) => void save(event)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{apiKey.name} bearbeiten</DialogTitle>
            <DialogDescription>
              Gilt ab der nächsten Anfrage. {formatHourlyUsage(apiKey)}.
            </DialogDescription>
          </DialogHeader>
          <LimitField id={fieldId} value={limit} onChange={setLimit} />
          <ParksField id={parksId} value={parkIds} onChange={setParkIds} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={busy || requestsPerHour === undefined}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
