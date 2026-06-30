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

/**
 * A persisted contribution. In the prototype these are appended to a JSONL file
 * (see lib/contribute/submissions.ts); in production this is the row you'd write to
 * your moderation table. `status` starts as `pending` — nothing is shown publicly
 * until a human approves it.
 */
export interface SubmissionRecord {
  id: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  entity: AssignedEntity;
  caption: string;
  credit: string;
  images: StoredImageRecord[];
  /** Coarse client info kept for abuse triage (never shown publicly). */
  ip?: string;
  userAgent?: string;
}
