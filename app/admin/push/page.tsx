'use client';

import { useRef, useState } from 'react';
import { BellRing, FileKey2, Loader2, PlugZap, Send, Smartphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  APNS_API,
  APNS_ENVIRONMENT_LABEL,
  APNS_STATE_TONE,
  apnsKeyFileProblem,
  apnsKeyIdFromFilename,
  apnsUploadBody,
  isApnsBackendMissing,
  type ApnsDevice,
  type ApnsEnvironment,
  type ApnsStatus,
  type ApnsTestResult,
} from '@/lib/admin/apns';
import { useCan } from '../_app/session';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { formatAgo } from '../_lib/format';
import { Field, TextInput } from '../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Meta,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
} from '../_ui/primitives';
import { useToast } from '../_ui/toast';

const DEVICES_PATH = `${APNS_API}/devices`;
const ENVIRONMENTS: ApnsEnvironment[] = ['production', 'sandbox'];

/**
 * Push to the iOS app: the owner uploads Apple's `.p8` key here and the API uses it at once. The
 * key is write-only: the file is read into memory, sent, and dropped; the API hands back a
 * fingerprint and nothing else.
 */
export default function PushPage() {
  const query = useAdminQuery<ApnsStatus>(adminKeys.raw(APNS_API), APNS_API);

  if (isApnsBackendMissing(query.error)) {
    return (
      <AdminPage width="narrow">
        <Notice>
          Die API kennt diese Seite noch nicht. Sie kommt mit ihrem nächsten Deploy; bis dahin
          gelten dort die Umgebungsvariablen <code>APNS_*</code>.
        </Notice>
        <KeyHelp />
      </AdminPage>
    );
  }
  if (query.error) return <ErrorState message={query.error.message} onRetry={query.refetch} />;
  if (!query.data) return <LoadingState label="Lädt Push-Status…" />;
  return <PushBoard status={query.data} />;
}

function PushBoard({ status }: { status: ApnsStatus }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const owner = useCan('owner');
  const [busy, setBusy] = useState<null | 'upload' | 'check' | 'remove'>(null);

  /** One write that answers with the new status: the toast, and both lists read again. */
  const run = async (
    kind: 'upload' | 'check' | 'remove',
    title: string,
    call: () => Promise<unknown>
  ) => {
    setBusy(kind);
    try {
      await call();
      toast.push({ title, tone: 'success' });
      return true;
    } catch (error) {
      toast.push({ title: 'Nicht geklappt', description: (error as Error).message, tone: 'error' });
      return false;
    } finally {
      invalidate(adminKeys.raw(APNS_API), adminKeys.raw(DEVICES_PATH));
      setBusy(null);
    }
  };

  const uploaded = status.source === 'database';

  return (
    <AdminPage width="narrow">
      {!status.secretConfigured && (
        <Notice>
          <code>ASSISTANT_SECRET_KEY</code> fehlt in der API. Ohne dieses Server-Geheimnis kann kein
          Schlüssel gespeichert werden.
        </Notice>
      )}
      {status.storedKeyUnreadable && (
        <Notice>
          Der gespeicherte Schlüssel lässt sich mit dem Server-Geheimnis der API nicht mehr öffnen.
          Lade die Datei erneut hoch.
        </Notice>
      )}

      <Panel>
        <PanelHeader
          icon={BellRing}
          title="Status"
          hint="Ob die API Mitteilungen an die iOS-App schicken kann, und was Apple zum Schlüssel sagt."
          action={
            <Chip tone={status.configured ? 'success' : 'danger'}>
              {status.configured ? 'Eingerichtet' : 'Kein Schlüssel'}
            </Chip>
          }
        />
        <PanelBody className="space-y-4">
          {status.configured && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Meta label="Key ID" value={status.keyId ?? '–'} />
              <Meta label="Team ID" value={status.teamId ?? '–'} />
              <Meta label="Bundle-ID" value={status.bundleId ?? '–'} />
              <Meta label="Fingerabdruck" value={status.fingerprint ?? '–'} />
              <Meta
                label="Quelle"
                value={uploaded ? 'Im Admin hochgeladen' : 'Umgebungsvariablen der API'}
                className="col-span-2"
              />
              <Meta label="Hochgeladen von" value={status.uploadedBy ?? '–'} />
              <Meta
                label="Hochgeladen"
                value={status.uploadedAt ? formatAgo(status.uploadedAt) : '–'}
              />
            </div>
          )}
          {status.configured && (
            <ul className="space-y-2">
              {ENVIRONMENTS.map((environment) => {
                const check = status.checks[environment];
                return (
                  <li key={environment} className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <Chip tone={check ? APNS_STATE_TONE[check.state] : 'muted'} className="mt-0.5">
                      {APNS_ENVIRONMENT_LABEL[environment]}
                    </Chip>
                    <p className="min-w-0 flex-1 text-sm">
                      {check ? check.text : 'Noch nicht geprüft.'}
                      {check && (
                        <span className="text-muted-foreground block text-xs">
                          {formatAgo(check.at)}
                          {check.status > 0 && ` · ${check.status} ${check.reason}`}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {!status.configured && (
            <p className="text-muted-foreground text-sm">
              Solange kein Schlüssel hinterlegt ist, bietet die App ihre Mitteilungen nicht an.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!status.configured || !owner || busy !== null}
              onClick={() =>
                run('check', 'Bei Apple geprüft', () =>
                  adminFetch(`${APNS_API}/check`, { method: 'POST' })
                )
              }
            >
              {busy === 'check' ? <Loader2 className="animate-spin" /> : <PlugZap />}
              Erneut prüfen
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!uploaded || !owner || busy !== null}
              onClick={() => {
                if (
                  confirm(
                    'Schlüssel entfernen? Ohne Umgebungsvariablen in der API bekommt die App danach keine Mitteilungen mehr.'
                  )
                ) {
                  void run('remove', 'Schlüssel entfernt', () =>
                    adminFetch(`${APNS_API}/key`, { method: 'DELETE' })
                  );
                }
              }}
            >
              {busy === 'remove' ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Schlüssel entfernen
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <KeyUpload
        status={status}
        disabled={!owner || busy !== null || !status.secretConfigured}
        uploading={busy === 'upload'}
        onUpload={(body) =>
          run('upload', 'Schlüssel gespeichert und geprüft', () =>
            adminFetch(`${APNS_API}/key`, { method: 'PUT', body })
          )
        }
      />

      <Devices status={status} owner={owner} />
      <KeyHelp />
    </AdminPage>
  );
}

/**
 * The file control. The file's text lives in a ref, never in state or the DOM, and is dropped
 * once it is sent; the page shows the file's name and the ids only.
 */
function KeyUpload({
  status,
  disabled,
  uploading,
  onUpload,
}: {
  status: ApnsStatus;
  disabled: boolean;
  uploading: boolean;
  onUpload: (body: Record<string, string>) => Promise<boolean>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const content = useRef<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [keyId, setKeyId] = useState('');
  const [teamId, setTeamId] = useState(status.teamId ?? status.defaults.teamId);
  const [bundleId, setBundleId] = useState(status.bundleId ?? status.defaults.bundleId);

  const forget = () => {
    content.current = null;
    setFilename(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const choose = async (file: File | undefined) => {
    forget();
    if (!file) return;
    const refused = apnsKeyFileProblem(file);
    setProblem(refused);
    if (refused) return;
    content.current = await file.text();
    setFilename(file.name);
    setKeyId(apnsKeyIdFromFilename(file.name) ?? '');
  };

  const send = async () => {
    if (!content.current || !filename) return;
    const body = apnsUploadBody(
      { name: filename, content: content.current },
      { keyId, teamId, bundleId }
    );
    // Dropped before the answer: a failed upload starts again from the file.
    forget();
    if (await onUpload(body)) setKeyId('');
  };

  return (
    <Panel>
      <PanelHeader
        icon={FileKey2}
        title={status.source === 'database' ? 'Schlüssel ersetzen' : 'Schlüssel hochladen'}
        hint="Die Datei AuthKey_….p8 von Apple. Sie wird verschlüsselt in der API gespeichert und nie wieder angezeigt; ein Neustart ist nicht nötig."
      />
      <PanelBody className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          aria-label="APNs-Schlüssel (.p8) auswählen"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null))
              setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void choose(event.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragging ? 'border-foreground bg-muted/50' : 'border-border hover:border-foreground'
          )}
        >
          <FileKey2 className="text-muted-foreground h-7 w-7" aria-hidden />
          <p className="text-sm font-medium">{filename ?? 'Datei hierher ziehen oder klicken'}</p>
          <p className="text-muted-foreground text-xs">
            {filename ? 'Bereit zum Hochladen.' : 'AuthKey_<Key-ID>.p8'}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".p8"
            className="hidden"
            onChange={(event) => void choose(event.target.files?.[0])}
          />
        </div>
        {problem && <Notice role="alert">{problem}</Notice>}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Key ID"
            htmlFor="apns-key-id"
            hint="Steht im Dateinamen; nur ausfüllen, wenn die Datei umbenannt wurde."
          >
            <TextInput
              id="apns-key-id"
              autoComplete="off"
              spellCheck={false}
              value={keyId}
              onChange={(event) => setKeyId(event.target.value.toUpperCase())}
              placeholder="aus dem Dateinamen"
            />
          </Field>
          <Field label="Team ID" htmlFor="apns-team-id">
            <TextInput
              id="apns-team-id"
              autoComplete="off"
              spellCheck={false}
              value={teamId}
              onChange={(event) => setTeamId(event.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Bundle-ID" htmlFor="apns-bundle-id">
            <TextInput
              id="apns-bundle-id"
              autoComplete="off"
              spellCheck={false}
              value={bundleId}
              onChange={(event) => setBundleId(event.target.value)}
            />
          </Field>
        </div>
        <Button size="sm" disabled={disabled || !filename} onClick={() => void send()}>
          {uploading && <Loader2 className="animate-spin" />}
          Hochladen und prüfen
        </Button>
      </PanelBody>
    </Panel>
  );
}

function Devices({ status, owner }: { status: ApnsStatus; owner: boolean }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const query = useAdminQuery<ApnsDevice[]>(adminKeys.raw(DEVICES_PATH), DEVICES_PATH);
  const [sending, setSending] = useState<string | null>(null);
  const { byEnvironment, byKind, total } = status.devices;

  const test = async (device: ApnsDevice) => {
    setSending(device.id);
    try {
      const result = await adminFetch<ApnsTestResult>(`${APNS_API}/test`, {
        method: 'POST',
        body: { deviceId: device.id },
      });
      toast.push({
        title: `${APNS_ENVIRONMENT_LABEL[result.environment]}: ${result.text}`,
        tone: result.state === 'ok' ? 'success' : 'error',
      });
    } catch (error) {
      toast.push({
        title: 'Testmitteilung nicht gesendet',
        description: (error as Error).message,
        tone: 'error',
      });
    } finally {
      invalidate(adminKeys.raw(APNS_API), adminKeys.raw(DEVICES_PATH));
      setSending(null);
    }
  };

  return (
    <Panel>
      <PanelHeader
        icon={Smartphone}
        title="Geräte und Testmitteilung"
        hint="Die zuletzt angemeldeten Installationen der App. Vom Geräte-Token sind nur die letzten sechs Zeichen zu sehen."
      />
      <PanelBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Meta label="Geräte" value={total} />
          <Meta label="Produktion" value={byEnvironment.production} />
          <Meta label="Sandbox" value={byEnvironment.sandbox} />
          <Meta label="Noch unbekannt" value={byEnvironment.unknown} />
        </div>
        {Object.keys(byKind).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(byKind).map(([kind, count]) => (
              <Chip key={kind}>
                {kind} · {count}
              </Chip>
            ))}
          </div>
        )}
        {status.errors.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1.5 text-xs">
              Von Apple abgelehnt in den letzten 24 Stunden
            </p>
            <div className="flex flex-wrap gap-1.5">
              {status.errors.map((error) => (
                <Chip key={`${error.environment}:${error.reason}`} tone="warning">
                  {error.reason} ({error.environment}) · {error.count}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {query.error ? (
          <ErrorState message={query.error.message} onRetry={query.refetch} />
        ) : !query.data ? (
          <LoadingState label="Lädt Geräte…" />
        ) : query.data.length === 0 ? (
          <EmptyState
            icon={Smartphone}
            title="Noch kein Gerät angemeldet"
            description="Sobald die App auf einem iPhone Mitteilungen erlaubt bekommt, steht es hier."
          />
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {query.data.map((device) => (
              <li key={device.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium tabular-nums">
                    …{device.tokenTail}
                    <span className="text-muted-foreground font-normal">
                      {' '}
                      · {device.locale}
                      {device.timezone && ` · ${device.timezone}`}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Angemeldet {formatAgo(device.registeredAt)}
                    {device.lastNotifiedAt && ` · zugestellt ${formatAgo(device.lastNotifiedAt)}`}
                    {device.kinds.length > 0 ? ` · ${device.kinds.join(', ')}` : ' · alles aus'}
                  </p>
                </div>
                {device.lastError && <Chip tone="danger">{device.lastError}</Chip>}
                <Chip tone={device.environment ? 'primary' : 'muted'}>
                  {device.environment ? APNS_ENVIRONMENT_LABEL[device.environment] : 'unbekannt'}
                </Chip>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!owner || !status.configured || sending !== null}
                  onClick={() => void test(device)}
                >
                  {sending === device.id ? <Loader2 className="animate-spin" /> : <Send />}
                  Testmitteilung senden
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}

function KeyHelp() {
  return (
    <Panel>
      <PanelHeader title="So bekommst du den Schlüssel" />
      <PanelBody>
        <ol className="text-muted-foreground list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            <a
              className="text-foreground underline underline-offset-2"
              href="https://developer.apple.com/account/resources/authkeys/list"
              target="_blank"
              rel="noreferrer"
            >
              developer.apple.com
            </a>{' '}
            → Certificates, Identifiers &amp; Profiles → Keys → +
          </li>
          <li>
            „Apple Push Notifications service (APNs)“ ankreuzen. Fragt Apple nach der Umgebung,
            „Sandbox &amp; Production“ wählen, damit auch aus Xcode installierte Apps Mitteilungen
            bekommen.
          </li>
          <li>
            Die Datei <code>AuthKey_&lt;Key-ID&gt;.p8</code> herunterladen. Apple gibt sie nur
            einmal heraus.
          </li>
          <li>
            Unter Identifiers → <code>fan.park.app</code> muss „Push Notifications“ aktiviert sein.
          </li>
          <li>
            Die Datei oben hochladen. Die API nutzt sie sofort, ohne Neustart, und fragt Apple in
            beiden Umgebungen, ob der Schlüssel passt.
          </li>
        </ol>
      </PanelBody>
    </Panel>
  );
}
