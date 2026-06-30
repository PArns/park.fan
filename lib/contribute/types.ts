import { z } from 'zod';

/**
 * Metadata describing the park/attraction a photo set is assigned to. This mirrors
 * the relevant subset of the search API's `SearchResultItem` (lib/api/types.ts) —
 * we only keep what's needed to identify the entity in the moderation queue and to
 * link back to its page, not the live wait-time fields.
 */
export const assignedEntitySchema = z.object({
  type: z.enum(['park', 'attraction']),
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  /** Canonical page path on park.fan, e.g. `/parks/.../phantasialand`. */
  url: z.string().optional(),
  country: z.string().optional(),
  /** For attractions: the park they belong to (helps moderators disambiguate). */
  parentParkName: z.string().optional(),
});

export type AssignedEntity = z.infer<typeof assignedEntitySchema>;

/**
 * The non-file part of a contribution. The actual image bytes travel as `File`
 * entries in the same multipart form; this schema validates the JSON `meta` field.
 */
export const contributionMetaSchema = z.object({
  entity: assignedEntitySchema,
  /** Optional caption / description the user typed for the set. */
  caption: z.string().max(500).optional().default(''),
  /** How the photographer wants to be credited (name / handle). Optional. */
  credit: z.string().max(120).optional().default(''),
  /** Must be true: the user confirms they own the rights and grant usage. */
  consent: z.literal(true),
});

export type ContributionMeta = z.infer<typeof contributionMetaSchema>;

/** One stored image within a persisted submission record. */
export interface StoredImageRecord {
  key: string;
  url: string;
  originalName: string;
  contentType: string;
  size: number;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

/**
 * A persisted contribution stored in the moderation queue (see
 * lib/contribute/submissions.ts). `status` starts as `pending` — nothing is shown
 * publicly until a human approves it.
 */
export interface SubmissionRecord {
  id: string;
  createdAt: string;
  status: SubmissionStatus;
  entity: AssignedEntity;
  caption: string;
  credit: string;
  images: StoredImageRecord[];
  /** Coarse client info kept for abuse triage (never shown publicly). */
  userAgent?: string;
}

/** Fields a moderator may edit on an existing submission. */
export interface SubmissionPatch {
  status?: SubmissionStatus;
  caption?: string;
  credit?: string;
}

/**
 * Signed, short-lived upload ticket. Issued by `/api/contribute/start` AFTER the
 * Turnstile challenge is verified, then presented (instead of re-solving Turnstile)
 * when authorizing each direct-to-Blob upload and when finalizing the submission.
 * HMAC-signed so the client can't tamper with the assignment or file budget.
 */
export interface TicketPayload {
  /** Submission id — also the Blob folder all files must land under. */
  sid: string;
  entity: AssignedEntity;
  caption: string;
  credit: string;
  /** Max number of files this ticket authorizes. */
  maxFiles: number;
  /** Expiry (epoch ms). */
  exp: number;
}

/** One file the client reports as uploaded, validated server-side in /finalize. */
export const uploadedBlobSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1),
  originalName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().nonnegative(),
});

export type UploadedBlob = z.infer<typeof uploadedBlobSchema>;
