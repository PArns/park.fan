import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type { SubmissionRecord } from './types';

/**
 * Persists submission metadata as a MODERATION QUEUE. Nothing a user uploads is
 * shown publicly until a human flips its status to `approved` — user-generated
 * media must always be reviewed (copyright, NSFW, mislabelled rides).
 *
 * Prototype implementation: append one JSON object per line to `.data/contributions.jsonl`
 * (gitignored). In production, replace this with a real datastore so you can query
 * and update status — e.g. an endpoint on api.park.fan, Vercel Postgres/Neon, or
 * Turso/SQLite. The `recordSubmission` signature stays the same; only the body changes.
 */

const STORE_PATH = path.join(process.cwd(), '.data', 'contributions.jsonl');

export async function recordSubmission(record: SubmissionRecord): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.appendFile(STORE_PATH, JSON.stringify(record) + '\n', 'utf8');
}
