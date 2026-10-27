/**
 * Print the full list of glossary term ids as a TypeScript module.
 *
 * Nothing reads the output any more: the API checks term ids against this app's
 * `GET /api/glossary-term-ids` instead of a mirrored allowlist
 * (docs/features/glossary.md#keeping-term-ids-honest). The module it prints is
 * the shape that allowlist had.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(ROOT, 'lib/glossary/data.ts'), 'utf8');

const ids = [...source.matchAll(/id:\s*'([^']+)',\s*\n?\s*category:/g)].map((m) => m[1]);
if (ids.length === 0) {
  console.error('No glossary term ids found — did lib/glossary/data.ts change shape?');
  process.exit(1);
}

const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length > 0) {
  console.error(`Duplicate glossary term ids: ${[...new Set(duplicates)].join(', ')}`);
  process.exit(1);
}

process.stdout.write(`/**
 * Every glossary term id the park.fan frontend defines.
 *
 * GENERATED — do not edit by hand. Regenerate from the frontend repo:
 *
 *   node scripts/export-glossary-term-ids.mjs \\
 *     > ../v4.api.park.fan/src/attractions/data/glossary-term-ids.ts
 *
 * This exists so \`ride-profile-seed.spec.ts\` can fail CI on a term id that no
 * longer exists. Nothing at runtime reads it: the frontend resolves ids itself
 * and drops the ones it does not know.
 */
export const GLOSSARY_TERM_IDS = [
${ids
  .sort()
  .map((id) => `  "${id}",`)
  .join('\n')}
] as const;
`);
