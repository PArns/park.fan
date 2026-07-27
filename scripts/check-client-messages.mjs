#!/usr/bin/env node
/**
 * Guards the client message allowlist in `i18n/client-messages.ts`.
 *
 * The locale layout ships only those namespaces to `<NextIntlClientProvider>` (see the module's
 * own doc comment for why). If a client component reads a namespace that isn't reachable from
 * the allowlist, next-intl doesn't throw — it logs a MISSING_MESSAGE error and renders the raw
 * key, which is exactly the kind of regression that reaches production unnoticed.
 *
 * So: scan for `useTranslations('<namespace>')` and fail when the namespace is neither listed nor
 * nested under a listed one.
 *
 * The scan deliberately covers EVERY file, not only the ones carrying a `'use client'` directive.
 * A shared component without the directive inherits the client boundary from whichever component
 * imports it, and `useTranslations` then reads the provider's messages — `geo-location-card.tsx`
 * (`explore`) is exactly that case, and an earlier directive-only version of this check waved it
 * through. The hook form is the signal; `getTranslations` (server-only) is correctly ignored.
 *
 * Run via `pnpm release:check`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['app', 'components', 'lib', 'i18n'];
// `admin`/`dev` render inside their own NextIntlClientProvider with hand-built messages.
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'admin', 'dev']);
// The allowlist module quotes namespaces in its own doc comment.
const SKIP_FILES = new Set(['i18n/client-messages.ts']);

/** Namespaces from `CLIENT_MESSAGE_NAMESPACES`, read straight out of the TS source. */
function readAllowlist() {
  const source = fs.readFileSync(path.join(rootDir, 'i18n/client-messages.ts'), 'utf-8');
  const block = source.match(/CLIENT_MESSAGE_NAMESPACES[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!block) {
    throw new Error('Could not parse CLIENT_MESSAGE_NAMESPACES from i18n/client-messages.ts');
  }
  // Strip `//` comments first — prose apostrophes ("the contribute page's hero") would
  // otherwise pair up with the real quotes and shred the list.
  const entries = block[1].replace(/\/\/.*$/gm, '');
  return [...entries.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

const allowlist = readAllowlist();
const isAllowed = (namespace) =>
  allowlist.some((allowed) => namespace === allowed || namespace.startsWith(allowed + '.'));

const violations = [];

for (const dir of SCAN_DIRS) {
  const abs = path.join(rootDir, dir);
  if (!fs.existsSync(abs)) continue;

  for (const file of walk(abs)) {
    if (SKIP_FILES.has(path.relative(rootDir, file))) continue;
    const source = fs.readFileSync(file, 'utf-8');

    for (const match of source.matchAll(/useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const namespace = match[1];
      if (isAllowed(namespace)) continue;
      const line = source.slice(0, match.index).split('\n').length;
      violations.push({ file: path.relative(rootDir, file), line, namespace });
    }
  }
}

if (violations.length > 0) {
  console.error(
    '\n❌ Client components read message namespaces that are not shipped to the client:\n'
  );
  for (const { file, line, namespace } of violations) {
    console.error(`   🔸 "${namespace}"  —  ${file}:${line}`);
  }
  console.error(
    '\n   Add the namespace to CLIENT_MESSAGE_NAMESPACES in i18n/client-messages.ts,\n' +
      '   or move the translation lookup to a Server Component (getTranslations).\n'
  );
  process.exit(1);
}

console.log(
  `✅ All client-side translation namespaces are shipped (${allowlist.length} allowlisted).`
);
