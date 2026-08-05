/**
 * Apply a patch to media sidecars, normalized the way the build reads them.
 *
 * Run: node scripts/patch-sidecars.mjs <patch.json>
 *
 * The patch is `{ "<collection>/<name>": { …sidecar fields… } }` and is merged
 * over what is already there, so a patch that only sets `focus` leaves the credit
 * alone. It is written back through `normalizeSidecar` + `serializeSidecar` — the
 * same pair the admin's commit endpoint uses — so a file touched here is
 * byte-identical to one written from the UI or by hand. Anything else produces a
 * diff full of key-order churn that hides the actual change.
 *
 * Localized text merges PER LOCALE: `{"alt": {"en": "…"}}` adds English without
 * dropping the German that is already there.
 */

import fs from 'node:fs';
import path from 'node:path';

import { normalizeSidecar, serializeSidecar } from '../lib/media/sidecar.mjs';

const ROOT = 'public/media';

function mergeText(current = {}, incoming = {}) {
  return { ...current, ...incoming };
}

export function applyPatch(patch, { root = ROOT, quiet = false } = {}) {
  const touched = [];
  const missing = [];
  const issues = [];

  for (const [id, fields] of Object.entries(patch)) {
    const file = path.join(root, `${id}.json`);
    if (!fs.existsSync(file)) {
      missing.push(id);
      continue;
    }
    const before = JSON.parse(fs.readFileSync(file, 'utf8'));
    const merged = {
      ...before,
      ...fields,
      // Text is merged per locale rather than replaced, so a patch adding English
      // does not wipe the German next to it.
      alt: mergeText(before.alt, fields.alt),
      caption: mergeText(before.caption, fields.caption),
      credit: { ...before.credit, ...fields.credit },
    };

    const normalized = normalizeSidecar(merged);
    if (normalized.issues.length) issues.push(`${id}: ${normalized.issues.join('; ')}`);
    // `serializeSidecar` already returns the file's text, formatted the way the
    // admin writes it. Stringifying it again produced a JSON file whose only
    // content was a quoted blob of JSON.
    const serialized = serializeSidecar(normalized.sidecar, normalized.text);

    if (serialized !== fs.readFileSync(file, 'utf8')) {
      fs.writeFileSync(file, serialized, 'utf8');
      touched.push(id);
    }
  }

  if (!quiet) {
    console.log(`✅ ${touched.length} sidecar${touched.length === 1 ? '' : 's'} updated`);
    if (missing.length) console.log(`⚠️  unknown id: ${missing.join(', ')}`);
    for (const issue of issues) console.log(`⚠️  ${issue}`);
  }
  return { touched, missing, issues };
}

if (process.argv[2]) {
  applyPatch(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
}
