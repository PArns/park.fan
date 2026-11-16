'use client';

import { useState } from 'react';
import { ExternalLink, Inbox, KeySquare, Mail, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatScopes } from '@/lib/admin/api-keys';
import {
  KEY_REQUESTS_PATH,
  KEY_REQUESTS_QUERY_KEY,
  PROJECT_KIND_LABELS,
  REQUEST_VOLUME_LABELS,
  REVENUE_MODEL_LABELS,
  SOURCE_MODEL_LABELS,
  keyRejectionMailto,
  keyRequestPath,
} from '@/lib/admin/key-requests';
import {
  KEY_REQUEST_LIMITS,
  isCommercialRequest,
  requestedScopes,
  type KeyRequestRecord,
  type KeyRequestStatus,
} from '@/lib/developers/key-request';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import { formatAgo } from '../../_lib/format';
import { useSession } from '../../_app/session';
import { SYSTEM_MONO } from '../../_ui/code-block';
import { Field, TextArea, useFieldId } from '../../_ui/controls';
import {
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
  type ChipTone,
} from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';

const STATUS_CHIPS: Record<KeyRequestStatus, { label: string; tone: ChipTone }> = {
  pending: { label: 'offen', tone: 'warning' },
  approved: { label: 'bewilligt', tone: 'success' },
  rejected: { label: 'abgelehnt', tone: 'muted' },
};

/**
 * The key requests from the developer portal, open ones first, decided ones behind a switch. „Key
 * erstellen“ hands a request to the key dialog with its values filled in (`onApprove`); the dialog
 * marks it approved once the key exists. Turning one down asks for a reason and then offers the
 * reply mail.
 */
export function KeyRequestsPanel({
  onApprove,
}: {
  onApprove: (request: KeyRequestRecord) => void;
}) {
  const requests = useAdminQuery<{ items: KeyRequestRecord[] }>(
    KEY_REQUESTS_QUERY_KEY,
    KEY_REQUESTS_PATH
  );
  const [showDecided, setShowDecided] = useState(false);
  const items = requests.data?.items ?? [];
  const open = items.filter((request) => request.status === 'pending');
  const shown = showDecided ? items : open;
  const decided = items.length - open.length;

  return (
    <Panel>
      <PanelHeader
        icon={Inbox}
        title={open.length > 0 ? `Anträge (${open.length} offen)` : 'Anträge'}
        hint="Aus dem Formular auf park.fan/developers. „Key erstellen“ übernimmt die Angaben in den Dialog."
        action={
          decided > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setShowDecided((value) => !value)}>
              {showDecided ? 'Nur offene' : `Entschiedene zeigen (${decided})`}
            </Button>
          )
        }
      />
      {requests.isError ? (
        <ErrorState message={requests.error.message} onRetry={() => void requests.refetch()} />
      ) : requests.isLoading ? (
        <SkeletonRows rows={2} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Keine offenen Anträge"
          description="Neue Anträge aus dem Entwicklerportal erscheinen hier."
        />
      ) : (
        <PanelBody>
          <ul className="space-y-3">
            {shown.map((request) => (
              <KeyRequestRow key={request.id} request={request} onApprove={onApprove} />
            ))}
          </ul>
        </PanelBody>
      )}
    </Panel>
  );
}

/** A link that leaves the admin, opened in a new tab. */
function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-ink inline-flex items-center gap-1 break-all hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </a>
  );
}

/** One line of the request's answers: what was asked, then the answer. */
function Answer({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function KeyRequestRow({
  request,
  onApprove,
}: {
  request: KeyRequestRecord;
  onApprove: (request: KeyRequestRecord) => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const { identity } = useSession();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const reasonId = useFieldId('key-request-reason');
  const commercial = isCommercialRequest(request.revenue);
  const status = STATUS_CHIPS[request.status];

  async function patch(body: object, done: string) {
    try {
      await adminFetch(keyRequestPath(request.id), { method: 'PATCH', body });
      invalidate(KEY_REQUESTS_QUERY_KEY);
      toast.push({ title: done, tone: 'success' });
    } catch (err) {
      toast.push({
        title: 'Speichern fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    }
  }

  async function remove() {
    try {
      await adminFetch(keyRequestPath(request.id), { method: 'DELETE' });
      invalidate(KEY_REQUESTS_QUERY_KEY);
      toast.push({ title: 'Antrag gelöscht', tone: 'success' });
    } catch (err) {
      toast.push({
        title: 'Löschen fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <li className="border-border/60 bg-card/40 space-y-3 rounded-lg border px-3 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{request.projectName}</span>
        <Chip tone={status.tone}>{status.label}</Chip>
        <Chip tone={commercial ? 'warning' : 'muted'}>
          {commercial ? 'kommerziell' : 'nicht-kommerziell'}
        </Chip>
        <Chip tone={request.source === 'open-source' ? 'success' : 'muted'}>
          {SOURCE_MODEL_LABELS[request.source]}
        </Chip>
        <Chip>{PROJECT_KIND_LABELS[request.kind]}</Chip>
        <Chip>{request.locale.toUpperCase()}</Chip>
      </div>

      <p className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        <span>{request.name}</span>
        <a href={`mailto:${request.email}`} className="text-primary-ink break-all hover:underline">
          {request.email}
        </a>
        {request.organisation && <span>{request.organisation}</span>}
        <span>eingegangen {formatAgo(request.createdAt)}</span>
      </p>

      <p className="text-sm leading-relaxed whitespace-pre-line">{request.description}</p>

      <dl className="space-y-1.5 text-xs">
        {request.website && (
          <Answer label="Website">
            <OutLink href={request.website}>{request.website}</OutLink>
          </Answer>
        )}
        {request.repository && (
          <Answer label="Repository">
            <OutLink href={request.repository}>{request.repository}</OutLink>
          </Answer>
        )}
        <Answer label="Finanzierung">
          {request.revenue.map((model) => REVENUE_MODEL_LABELS[model]).join(', ')}
        </Answer>
        <Answer label="Berechtigungen">{formatScopes(requestedScopes(request))}</Answer>
        <Answer label="Volumen">{REQUEST_VOLUME_LABELS[request.volume]}</Answer>
        {request.parks && <Answer label="Parks">{request.parks}</Answer>}
        {request.message && (
          <Answer label="Nachricht">
            <span className="whitespace-pre-line">{request.message}</span>
          </Answer>
        )}
        {request.decision && (
          <Answer label={request.status === 'approved' ? 'Bewilligt' : 'Abgelehnt'}>
            {request.decision.by}, {formatAgo(request.decision.at)}
            {request.decision.keyPrefix && (
              <>
                {' · Key '}
                <code className={SYSTEM_MONO}>{request.decision.keyPrefix}…</code>
              </>
            )}
            {request.decision.reason && (
              <span className="mt-0.5 block whitespace-pre-line">{request.decision.reason}</span>
            )}
          </Answer>
        )}
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
        {request.status === 'pending' && (
          <>
            <Button size="sm" onClick={() => onApprove(request)}>
              <KeySquare className="h-4 w-4" /> Key erstellen
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
              <XCircle className="h-4 w-4" /> Ablehnen
            </Button>
          </>
        )}
        {request.status === 'rejected' && (
          <>
            <Button size="sm" variant="outline" asChild>
              <a href={keyRejectionMailto(request, identity.displayName)}>
                <Mail className="h-4 w-4" /> Absage-Mail schreiben
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void patch({ status: 'pending' }, 'Antrag wieder offen')}
            >
              <RotateCcw className="h-4 w-4" /> Wieder öffnen
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="hover:text-destructive ml-auto"
          onClick={() => setDeleting(true)}
          aria-label={`Antrag von ${request.projectName} löschen`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        icon={XCircle}
        title={`Antrag für „${request.projectName}“ ablehnen?`}
        description="Der Grund steht danach in der Absage-Mail, die du aus der Liste heraus schreibst. Den Antrag kannst du später wieder öffnen."
        confirmLabel="Ablehnen"
        cancelLabel="Abbrechen"
        onConfirm={() =>
          void patch(
            { status: 'rejected', ...(reason.trim() && { reason: reason.trim() }) },
            'Antrag abgelehnt'
          )
        }
      >
        <Field label="Grund" htmlFor={reasonId} hint="Optional. Steht so in der Mail.">
          <TextArea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={KEY_REQUEST_LIMITS.message}
            rows={4}
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        icon={Trash2}
        tone="destructive"
        title={`Antrag für „${request.projectName}“ löschen?`}
        description="Der Antrag mit Name und E-Mail-Adresse verschwindet endgültig. Ein dafür erstellter Key bleibt bestehen."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={() => void remove()}
      />
    </li>
  );
}
