'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, ExternalLink, Inbox, Loader2, Mail, RotateCcw, Trash2, X } from 'lucide-react';
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
  DATA_API_KEYS_QUERY_KEY,
  DATA_API_KEY_USAGE_LABELS,
  parseRequestsPerHour,
  type DataApiKeyUsage,
} from '@/lib/admin/api-keys';
import {
  REQUEST_LABELS,
  REQUEST_TIER_LABELS,
  formatPermissions,
} from '@/lib/admin/developer-labels';
import {
  KEY_REQUESTS_PATH,
  KEY_REQUESTS_QUERY_KEY,
  KEY_REQUEST_STATUS_LABELS,
  approvalDraft,
  approveKeyRequestBody,
  keyDecisionMailto,
  keyRequestPath,
  sortKeyRequests,
} from '@/lib/admin/key-requests';
import { KEY_REQUEST_LIMITS, type KeyRequestRecord } from '@/lib/developers/key-request';
import type { ApiPermission } from '@/lib/developers/permissions';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import { useSession } from '../../_app/session';
import { formatAgo } from '../../_lib/format';
import { Field, Select, TextArea, TextInput, useFieldId } from '../../_ui/controls';
import {
  Chip,
  EmptyState,
  ErrorState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  SCROLLING_DIALOG,
  SkeletonRows,
  type ChipTone,
} from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import { ExpiryField, LimitField, ParksField, PermissionsField, useKeyExpiry } from './key-fields';

const USAGE_OPTIONS = (Object.keys(DATA_API_KEY_USAGE_LABELS) as DataApiKeyUsage[]).map(
  (usage) => ({ value: usage, label: DATA_API_KEY_USAGE_LABELS[usage] })
);

const STATUS_TONES: Record<KeyRequestRecord['status'], ChipTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'muted',
};

/**
 * The developers' key requests from the API. An API that answers them stores permissions too, so
 * the page reads its success as that, also while no key exists yet to show the field.
 */
export function useKeyRequests() {
  return useAdminQuery<{ items: KeyRequestRecord[] }>(
    KEY_REQUESTS_QUERY_KEY,
    KEY_REQUESTS_PATH,
    // An API without the requests answers 404, which retrying does not change.
    { retry: (count, error) => error.status !== 404 && count < 2 }
  );
}

/**
 * The key requests developers filed on their dashboard, open ones first. Each is approved into a
 * key, with the permissions, allowance, parks and end date the owner sets, or declined with a note
 * the developer reads. Nothing is issued without this step.
 */
export function KeyRequestsPanel() {
  const requests = useKeyRequests();
  const [approving, setApproving] = useState<KeyRequestRecord | null>(null);
  const [rejecting, setRejecting] = useState<KeyRequestRecord | null>(null);
  const items = sortKeyRequests(requests.data?.items ?? []);
  const open = items.filter((item) => item.status === 'pending');
  const decided = items.filter((item) => item.status !== 'pending');

  return (
    <Panel>
      <PanelHeader
        icon={Inbox}
        title="Anträge"
        hint="Entwickler beantragen Keys im Dashboard des Entwicklerportals. Jeder Antrag wird hier von Hand entschieden."
        action={open.length > 0 ? <Chip tone="warning">{open.length} offen</Chip> : undefined}
      />
      {requests.error?.status === 404 ? (
        <PanelBody>
          <Notice>
            Die API kennt noch keine Anträge. Sie erscheinen hier, sobald das Backend mit den
            Entwicklerkonten läuft.
          </Notice>
        </PanelBody>
      ) : requests.isError ? (
        <ErrorState message={requests.error.message} onRetry={() => void requests.refetch()} />
      ) : requests.isLoading ? (
        <SkeletonRows rows={2} />
      ) : (
        <PanelBody className="space-y-3">
          {open.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Kein offener Antrag"
              description="Neue Anträge stehen hier, bis du sie freigibst oder ablehnst."
            />
          ) : (
            <ul className="space-y-2">
              {open.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => setApproving(request)}
                  onReject={() => setRejecting(request)}
                />
              ))}
            </ul>
          )}
          {decided.length > 0 && (
            <details className="group">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                Entschiedene und zurückgezogene Anträge ({decided.length})
              </summary>
              <ul className="mt-2 space-y-2">
                {decided.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </ul>
            </details>
          )}
        </PanelBody>
      )}

      {approving && (
        <ApproveDialog key={approving.id} request={approving} onClose={() => setApproving(null)} />
      )}
      {rejecting && (
        <RejectDialog key={rejecting.id} request={rejecting} onClose={() => setRejecting(null)} />
      )}
    </Panel>
  );
}

/** One line of a request's answers; nothing when the applicant left it empty. */
function Answer({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function ExternalUrl({ href }: { href?: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary inline-flex items-center gap-1 break-all hover:underline"
    >
      {href}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </a>
  );
}

/**
 * A request with everything the form asked: who, what, which platforms, open or closed, how it
 * earns, what it needs, how it calls the API and where the backlink sits. Open requests carry the
 * decision buttons, decided ones the reply mail and, once over, a delete.
 */
function RequestCard({
  request,
  onApprove,
  onReject,
}: {
  request: KeyRequestRecord;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const { identity } = useSession();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const mail = keyDecisionMailto(request, identity.displayName);

  async function act(path: string, method: 'POST' | 'DELETE', done: string) {
    try {
      await adminFetch(path, { method });
      invalidate(KEY_REQUESTS_QUERY_KEY);
      toast.push({ title: done, tone: 'success' });
    } catch (err) {
      toast.push({
        title: 'Das hat nicht geklappt',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <li className="border-border/60 bg-card/40 space-y-3 rounded-lg border px-3 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="min-w-0 font-medium">{request.projectName}</span>
        <Chip tone={STATUS_TONES[request.status]}>{KEY_REQUEST_STATUS_LABELS[request.status]}</Chip>
        <Chip tone={request.tier === 'free' ? 'success' : 'primary'}>
          {REQUEST_TIER_LABELS[request.tier]}
        </Chip>
        <span className="text-muted-foreground ml-auto text-xs">
          {formatAgo(request.createdAt)}
        </span>
      </div>

      <dl className="space-y-1.5 text-xs">
        <Answer label="Konto">
          {request.applicant && `${request.applicant.displayName} · ${request.applicant.email}`}
        </Answer>
        <Answer label="Art">
          {`${REQUEST_LABELS.kind[request.kind]} · ${request.platforms
            .map((platform) => REQUEST_LABELS.platform[platform])
            .join(', ')}`}
        </Answer>
        <Answer label="Sprachen">{request.languages}</Answer>
        <Answer label="Website">{request.website && <ExternalUrl href={request.website} />}</Answer>
        <Answer label="Beschreibung">
          <span className="whitespace-pre-line">{request.description}</span>
        </Answer>
        <Answer label="Quellcode">
          {REQUEST_LABELS.source[request.source]}
          {request.license ? `, ${request.license}` : ''}
        </Answer>
        <Answer label="Repository">
          {request.repository && <ExternalUrl href={request.repository} />}
        </Answer>
        <Answer label="Finanzierung">
          {request.revenue.map((model) => REQUEST_LABELS.revenue[model]).join(' · ')}
        </Answer>
        <Answer label="Berechtigungen">{formatPermissions(request.permissions)}</Answer>
        <Answer label="Volumen">{`${REQUEST_LABELS.volume[request.volume]} pro Tag`}</Answer>
        <Answer label="Parks">{request.parks}</Answer>
        <Answer label="Endpunkte">
          {request.endpoints && (
            <span className="font-mono text-[11px] whitespace-pre-line">{request.endpoints}</span>
          )}
        </Answer>
        <Answer label="Server">
          {request.serverSide ? 'Key bleibt auf dem Server' : 'nicht bestätigt'}
        </Answer>
        <Answer label="Caching">
          <span className="whitespace-pre-line">{request.caching}</span>
        </Answer>
        <Answer label="Backlink">
          <ExternalUrl href={request.attributionUrl} />
        </Answer>
        <Answer label="Nachricht">
          {request.message && <span className="whitespace-pre-line">{request.message}</span>}
        </Answer>
        <Answer label="Entscheidung">
          {request.decidedAt &&
            `${KEY_REQUEST_STATUS_LABELS[request.status]} ${formatAgo(request.decidedAt)}${
              request.decisionNote ? `: ${request.decisionNote}` : ''
            }`}
        </Answer>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        {request.status === 'pending' && onApprove && (
          <Button size="sm" onClick={onApprove}>
            <Check className="h-4 w-4" /> Freigeben…
          </Button>
        )}
        {request.status === 'pending' && onReject && (
          <Button size="sm" variant="outline" onClick={onReject}>
            <X className="h-4 w-4" /> Ablehnen…
          </Button>
        )}
        {mail && (
          <Button size="sm" variant="outline" asChild>
            <a href={mail}>
              <Mail className="h-4 w-4" /> Antwort mailen
            </a>
          </Button>
        )}
        {request.status === 'rejected' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              void act(keyRequestPath(request.id, 'reopen'), 'POST', 'Antrag wieder offen')
            }
          >
            <RotateCcw className="h-4 w-4" /> Wieder öffnen
          </Button>
        )}
        {request.status !== 'pending' && request.status !== 'approved' && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setConfirmingDelete(true)}
            aria-label={`Antrag ${request.projectName} löschen`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        icon={Trash2}
        tone="destructive"
        title={`Antrag „${request.projectName}“ löschen?`}
        description="Der Antrag verschwindet aus der Liste und aus dem Dashboard des Entwicklers; unter „Änderungen“ bleibt er verzeichnet."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={() => void act(keyRequestPath(request.id), 'DELETE', 'Antrag gelöscht')}
      />
    </li>
  );
}

/** A decided request with the account the list showed, which a decision's answer leaves out. */
function withApplicant(item: KeyRequestRecord, listed: KeyRequestRecord): KeyRequestRecord {
  return { ...item, applicant: item.applicant ?? listed.applicant };
}

/**
 * Approves a request into a key. The fields start with what the request asked for; the key goes
 * to the developer's account unrevealed, and they pick it up on their dashboard.
 */
function ApproveDialog({ request, onClose }: { request: KeyRequestRecord; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const { identity } = useSession();
  // Read once: the fields are the owner's from here on.
  const [draft] = useState(() => approvalDraft(request));
  const [name, setName] = useState(draft.name);
  const [usage, setUsage] = useState<DataApiKeyUsage>(draft.usage);
  const [permissions, setPermissions] = useState<ApiPermission[]>(draft.permissions);
  const [limit, setLimit] = useState(
    draft.requestsPerHour === null ? '' : String(draft.requestsPerHour)
  );
  const [parkIds, setParkIds] = useState<string[]>([]);
  const [note, setNote] = useState(draft.note);
  const [message, setMessage] = useState('');
  const expiry = useKeyExpiry(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<KeyRequestRecord | null>(null);
  // A second submit can arrive before the first one's re-render disables the button.
  const submitting = useRef(false);
  const ids = {
    name: useFieldId('approve-name'),
    usage: useFieldId('approve-usage'),
    limit: useFieldId('approve-limit'),
    parks: useFieldId('approve-parks'),
    expiry: useFieldId('approve-expiry'),
    note: useFieldId('approve-note'),
    message: useFieldId('approve-message'),
  };
  const requestsPerHour = parseRequestsPerHour(limit);
  const complete =
    name.trim().length > 0 &&
    permissions.length > 0 &&
    requestsPerHour !== undefined &&
    expiry.expiresAt !== undefined;

  async function approve(event: FormEvent) {
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
      const result = await adminFetch<{ item: KeyRequestRecord }>(
        keyRequestPath(request.id, 'approve'),
        {
          method: 'POST',
          body: approveKeyRequestBody({
            name,
            usage,
            permissions,
            requestsPerHour,
            allowedParkIds: parkIds,
            expiresAt: expiry.expiresAt,
            note,
            message,
          }),
        }
      );
      setApproved(withApplicant(result.item, request));
      invalidate(KEY_REQUESTS_QUERY_KEY, DATA_API_KEYS_QUERY_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Freigabe fehlgeschlagen');
      toast.push({ title: 'Nicht freigegeben', tone: 'error' });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const mail = approved ? keyDecisionMailto(approved, identity.displayName) : null;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className={`${SCROLLING_DIALOG} sm:max-w-xl`} showCloseButton={!busy}>
        {approved ? (
          <>
            <DialogHeader>
              <DialogTitle>{request.projectName} ist freigegeben</DialogTitle>
              <DialogDescription>
                Der Key liegt im Dashboard des Entwicklers und wird dort beim Abholen ein einziges
                Mal angezeigt. Hier erscheint er in der Liste der Keys.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {mail && (
                <Button variant="outline" asChild>
                  <a href={mail}>
                    <Mail className="h-4 w-4" /> Benachrichtigung mailen
                  </a>
                </Button>
              )}
              <Button onClick={onClose}>Fertig</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={(event) => void approve(event)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{request.projectName} freigeben</DialogTitle>
              <DialogDescription>
                {request.tier === 'paid'
                  ? 'Laut Antrag kostenpflichtig: Freigeben erst, wenn die schriftliche Vereinbarung steht.'
                  : 'Laut Antrag kostenlos: Open Source und ohne Einnahmen. Prüf den Backlink, bevor du freigibst.'}
              </DialogDescription>
            </DialogHeader>

            <Field label="Name" htmlFor={ids.name} hint="So heißt der Key hier und im Dashboard.">
              <TextInput
                id={ids.name}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
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
              stored
              value={permissions}
              onChange={setPermissions}
              requested={draft.permissions}
            />
            <LimitField id={ids.limit} value={limit} onChange={setLimit} />
            <ParksField
              id={ids.parks}
              value={parkIds}
              onChange={setParkIds}
              requested={request.parks}
            />
            <ExpiryField id={ids.expiry} expiry={expiry} />
            <Field label="Notiz" htmlFor={ids.note} hint="Nur für dich, am Key.">
              <TextInput
                id={ids.note}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                autoComplete="off"
              />
            </Field>
            <Field
              label="Nachricht an den Entwickler"
              htmlFor={ids.message}
              hint="Optional. Steht im Dashboard neben der Freigabe, etwa eine Bedingung."
            >
              <TextArea
                id={ids.message}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={KEY_REQUEST_LIMITS.reason}
                rows={3}
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
                Freigeben
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Declines a request, with a reason the developer reads on the dashboard. */
function RejectDialog({ request, onClose }: { request: KeyRequestRecord; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const { identity } = useSession();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<KeyRequestRecord | null>(null);
  const reasonId = useFieldId('reject-reason');

  async function reject(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const text = reason.trim();
      const result = await adminFetch<{ item: KeyRequestRecord }>(
        keyRequestPath(request.id, 'reject'),
        { method: 'POST', body: text ? { reason: text } : {} }
      );
      setRejected(withApplicant(result.item, request));
      invalidate(KEY_REQUESTS_QUERY_KEY);
    } catch (err) {
      toast.push({
        title: 'Nicht abgelehnt',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  const mail = rejected ? keyDecisionMailto(rejected, identity.displayName) : null;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {rejected ? (
          <>
            <DialogHeader>
              <DialogTitle>{request.projectName} abgelehnt</DialogTitle>
              <DialogDescription>
                Der Entwickler sieht die Entscheidung und die Begründung im Dashboard.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {mail && (
                <Button variant="outline" asChild>
                  <a href={mail}>
                    <Mail className="h-4 w-4" /> Benachrichtigung mailen
                  </a>
                </Button>
              )}
              <Button onClick={onClose}>Fertig</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={(event) => void reject(event)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{request.projectName} ablehnen</DialogTitle>
              <DialogDescription>Der Antrag lässt sich danach wieder öffnen.</DialogDescription>
            </DialogHeader>
            <Field
              label="Begründung"
              htmlFor={reasonId}
              hint="Optional. Der Entwickler liest sie im Dashboard."
            >
              <TextArea
                id={reasonId}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={KEY_REQUEST_LIMITS.reason}
                rows={4}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                Abbrechen
              </Button>
              <Button type="submit" variant="destructive" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Ablehnen
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
