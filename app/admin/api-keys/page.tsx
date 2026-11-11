'use client';

import { useRef, useState, type FormEvent } from 'react';
import { KeySquare, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
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
  createDataApiKeyBody,
  dataApiKeyCurlExample,
  type CreatedDataApiKey,
  type DataApiKey,
  type DataApiKeyUsage,
} from '@/lib/admin/api-keys';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { formatAgo } from '../_lib/format';
import { useSession } from '../_app/session';
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
        description="Ohne Key liefert die API keine Prognosen. park.fan selbst braucht keinen."
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
    </>
  );
}

function KeyRow({ apiKey, onRevoke }: { apiKey: DataApiKey; onRevoke: () => void }) {
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
        {apiKey.note && <p className="text-muted-foreground text-xs">{apiKey.note}</p>}
      </div>
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
  };

  async function create(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !name.trim()) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await adminFetch<CreatedDataApiKey>(DATA_API_KEYS_PATH, {
        method: 'POST',
        body: createDataApiKeyBody({ name, contact, usage, note }),
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

  // The key exists only in this response, so the overlay and Escape do not dismiss it: only the
  // button does, after the person has seen the warning.
  const holdsSecret = created !== null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-xl"
        showCloseButton={!holdsSecret}
        onInteractOutside={(event) => holdsSecret && event.preventDefault()}
        onEscapeKeyDown={(event) => holdsSecret && event.preventDefault()}
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
              hint="Kommerziell nur mit schriftlicher Vereinbarung, so steht es in den Nutzungsbedingungen."
            >
              <Select
                value={usage}
                allowEmpty={false}
                onValueChange={(value) => setUsage((value as DataApiKeyUsage | null) ?? usage)}
                options={USAGE_OPTIONS}
              />
            </Field>
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
              <Button type="submit" disabled={busy || !name.trim()}>
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
