/**
 * The key requests developers file on their dashboard, as `/admin/api-keys` reviews them: the
 * proxy paths of the backend's `/v1/admin/api-key-requests` (owner only), what an approval starts
 * with, and the reply mail. A key never travels by mail: the developer picks it up on the
 * dashboard, once.
 */
import { SITE_URL } from '@/i18n/config';
import { DEVELOPER_DASHBOARD_PATH } from '@/lib/developers/paths';
import {
  requestedPermissions,
  suggestedRequestsPerHour,
  type KeyRequestRecord,
  type KeyRequestStatus,
} from '@/lib/developers/key-request';
import { sortPermissions, type ApiPermission } from '@/lib/developers/permissions';
import type { DataApiKeyUsage } from './api-keys';

/** The proxy path of the request list. */
export const KEY_REQUESTS_PATH = '/api/admin/api-key-requests';

/** What the owner can do with a request besides deleting it. */
export type KeyRequestAction = 'approve' | 'reject' | 'reopen';

/** The path of one request, or of a decision on it. */
export function keyRequestPath(id: string, action?: KeyRequestAction): string {
  const path = `${KEY_REQUESTS_PATH}/${encodeURIComponent(id)}`;
  return action ? `${path}/${action}` : path;
}

/** The React Query key of the list. */
export const KEY_REQUESTS_QUERY_KEY = ['admin', 'api-key-requests'] as const;

/** A request's state, as the admin's chip shows it. */
export const KEY_REQUEST_STATUS_LABELS: Record<KeyRequestStatus, string> = {
  pending: 'offen',
  approved: 'freigegeben',
  rejected: 'abgelehnt',
  withdrawn: 'zurückgezogen',
};

/** Open requests first, oldest of them on top; decided ones after, newest first. */
export function sortKeyRequests(items: readonly KeyRequestRecord[]): KeyRequestRecord[] {
  const open = items.filter((item) => item.status === 'pending');
  const decided = items.filter((item) => item.status !== 'pending');
  const time = (item: KeyRequestRecord) => Date.parse(item.decidedAt ?? item.createdAt);
  return [
    ...open.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    ...decided.sort((a, b) => time(b) - time(a)),
  ];
}

/** What the approval dialog starts with; the owner can change every field. */
export interface ApprovalDraft {
  name: string;
  usage: DataApiKeyUsage;
  permissions: ApiPermission[];
  /** Null for no per-key limit. */
  requestsPerHour: number | null;
  note: string;
}

/**
 * The approval's starting values: the project's name, commercial for a paid tier, the permissions
 * it asked for, the allowance its volume suggests, and a note that says where the key came from.
 */
export function approvalDraft(request: KeyRequestRecord): ApprovalDraft {
  const parks = request.parks ? ` Parks laut Antrag: ${request.parks}.` : '';
  const by = request.applicant ? `, ${request.applicant.email}` : '';
  return {
    name: request.projectName.slice(0, 80),
    usage: request.tier === 'paid' ? 'commercial' : 'non-commercial',
    permissions: requestedPermissions(request),
    requestsPerHour: suggestedRequestsPerHour(request.volume),
    note: `Antrag vom ${request.createdAt.slice(0, 10)}${by}.${parks}`.slice(0, 500),
  };
}

/** The body of an approval, as the backend takes it; empty optional fields left out. */
export interface ApproveKeyRequestBody {
  name: string;
  usage: DataApiKeyUsage;
  permissions: ApiPermission[];
  requestsPerHour: number | null;
  /** Null for every park. */
  allowedParkIds: string[] | null;
  expiresAt?: string;
  note?: string;
  message?: string;
}

/** An approval's body from the dialog's fields. */
export function approveKeyRequestBody(input: {
  name: string;
  usage: DataApiKeyUsage;
  permissions: readonly ApiPermission[];
  requestsPerHour: number | null;
  allowedParkIds: readonly string[];
  expiresAt: string | null;
  note: string;
  message: string;
}): ApproveKeyRequestBody {
  const note = input.note.trim();
  const message = input.message.trim();
  return {
    name: input.name.trim(),
    usage: input.usage,
    permissions: sortPermissions(input.permissions),
    requestsPerHour: input.requestsPerHour,
    allowedParkIds: input.allowedParkIds.length > 0 ? [...input.allowedParkIds] : null,
    ...(input.expiresAt && { expiresAt: input.expiresAt }),
    ...(note && { note }),
    ...(message && { message }),
  };
}

/** A `mailto:` link with subject and body, for the admin's own mail program. */
function mailto(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * The mail that tells an applicant their request was decided, in German for one who wrote from the
 * German page and in English otherwise, with the owner's note when there is one. It points to the
 * dashboard, where an approved key waits; null for an open or withdrawn request, or without an
 * address.
 */
export function keyDecisionMailto(request: KeyRequestRecord, signature: string): string | null {
  const to = request.applicant?.email;
  if (!to || (request.status !== 'approved' && request.status !== 'rejected')) return null;
  const approved = request.status === 'approved';
  const de = request.locale === 'de';
  const dashboard = `${SITE_URL}/${de ? 'de' : 'en'}${DEVELOPER_DASHBOARD_PATH}`;
  const name = request.applicant?.displayName ?? '';
  const note = request.decisionNote ? ['', request.decisionNote] : [];
  const lines = de
    ? [
        `Hallo ${name},`,
        '',
        approved
          ? `dein Antrag für ${request.projectName} ist freigegeben. Den Key holst du im Dashboard ab; er wird dir dort ein einziges Mal angezeigt.`
          : `danke für deinen Antrag für ${request.projectName}. Einen Key kann ich dafür nicht ausstellen.`,
        ...note,
        '',
        dashboard,
        '',
        'Viele Grüße',
        signature,
      ]
    : [
        `Hi ${name},`,
        '',
        approved
          ? `your request for ${request.projectName} is approved. Pick up the key on the dashboard; it is shown to you exactly once.`
          : `thank you for your request for ${request.projectName}. I cannot issue a key for it.`,
        ...note,
        '',
        dashboard,
        '',
        'Best regards',
        signature,
      ];
  const subject = de
    ? `Dein API-Antrag für ${request.projectName}`
    : `Your API request for ${request.projectName}`;
  return mailto(to, subject, lines.join('\n'));
}
