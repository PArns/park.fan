/**
 * park.fan Coaster — asset fetcher.
 *
 * CC0 only, vendored, never hotlinked. Downloads into `public/game/assets/`, which is gitignored:
 * the repo carries the *list*, not the bytes.
 *
 * **The game must be fully playable with this folder empty.** Every consumer falls back to
 * procedural geometry and a generated PBR material, and logs that it did. That is not a nicety —
 * it is what keeps a flaky network from being a white screen, and it is asserted by the fact that
 * every screenshot in this repo so far was taken with no assets on disk at all.
 *
 *   pnpm game:assets              download what is missing
 *   pnpm game:assets --check      verify digests, download nothing, exit 1 on drift
 *   pnpm game:assets --record     download and RECORD the digest of what arrived
 *
 * On digests: a pinned SHA-256 is only worth something if it was measured. This script therefore
 * ships with `sha256: null` for entries nobody has downloaded yet and refuses to invent one —
 * `--record` writes what actually arrived, and from then on a changed file is an error rather than
 * a surprise. A digest typed from memory is worse than no digest, because it fails honest fetches
 * and passes nothing.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'game', 'assets');
const manifestPath = path.join(root, 'scripts', 'game-assets.json');
const ledgerPath = path.join(root, 'docs', 'game', 'ASSETS.md');

const args = new Set(process.argv.slice(2).map((a) => a.replace(/^--/, '')));
const checkOnly = args.has('check');
const record = args.has('record');

/**
 * The pinned list.
 *
 * Every entry names its source, its author and its licence, and every licence here is CC0-1.0.
 * Mixamo, non-CC0 Sketchfab and anything extracted from a shipped game are forbidden — see
 * docs/game/ASSETS.md.
 */
const DEFAULT_MANIFEST = {
  version: 1,
  files: [
    {
      id: 'hdri/kloofendal-partly-cloudy-1k',
      url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr',
      target: 'polyhaven/hdri/day-clear-1k.hdr',
      source: 'Poly Haven',
      author: 'Greg Zaal / Jarod Guest',
      license: 'CC0-1.0',
      usedBy: 'environment (IBL, day)',
      sha256: null,
    },
    {
      id: 'hdri/dusk-1k',
      url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr',
      target: 'polyhaven/hdri/dusk-1k.hdr',
      source: 'Poly Haven',
      author: 'Greg Zaal',
      license: 'CC0-1.0',
      usedBy: 'environment (IBL, golden hour)',
      sha256: null,
    },
    {
      id: 'hdri/night-1k',
      url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dikhololo_night_1k.hdr',
      target: 'polyhaven/hdri/night-1k.hdr',
      source: 'Poly Haven',
      author: 'Greg Zaal',
      license: 'CC0-1.0',
      usedBy: 'environment (IBL, night)',
      sha256: null,
    },
  ],
};

async function loadManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    await writeFile(manifestPath, JSON.stringify(DEFAULT_MANIFEST, null, 2) + '\n');
    return DEFAULT_MANIFEST;
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function digestOf(file) {
  try {
    return sha256(await readFile(file));
  } catch {
    return null;
  }
}

const manifest = await loadManifest();
const results = [];
let drift = 0;
let fetched = 0;
let failed = 0;

for (const entry of manifest.files) {
  const target = path.join(outDir, entry.target);
  const present = await stat(target).then(
    () => true,
    () => false
  );

  if (present) {
    const have = await digestOf(target);
    if (entry.sha256 && have !== entry.sha256) {
      console.error(
        `✗ ${entry.target} — digest drift\n    expected ${entry.sha256}\n    got      ${have}`
      );
      drift++;
    } else if (!entry.sha256 && record) {
      entry.sha256 = have;
      console.log(`· ${entry.target} — recorded ${have.slice(0, 16)}…`);
    } else {
      console.log(`✓ ${entry.target}`);
    }
    results.push({ ...entry, present: true, sha256: entry.sha256 ?? have });
    continue;
  }

  if (checkOnly) {
    console.log(`· ${entry.target} — not downloaded (the game runs procedurally without it)`);
    results.push({ ...entry, present: false });
    continue;
  }

  try {
    const response = await fetch(entry.url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const have = sha256(buffer);
    if (entry.sha256 && have !== entry.sha256) {
      throw new Error(`digest mismatch: expected ${entry.sha256}, got ${have}`);
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);
    if (!entry.sha256) entry.sha256 = have;
    fetched++;
    console.log(
      `↓ ${entry.target} — ${(buffer.length / 1024).toFixed(0)} KB, ${have.slice(0, 16)}…`
    );
    results.push({ ...entry, present: true, sha256: have });
  } catch (error) {
    // A failed fetch is not a failed build. It is a plainer park, and the module that wanted the
    // file says so at runtime.
    failed++;
    console.warn(`! ${entry.target} — ${error instanceof Error ? error.message : String(error)}`);
    results.push({ ...entry, present: false, error: String(error) });
  }
}

if (record || fetched > 0) {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

// The ledger is written back into ASSETS.md so it cannot drift from what is on disk — the same
// rule the media database applies to its sidecars.
const rows = results
  .map(
    (r) =>
      `| \`${r.target}\` | ${r.source} | ${r.author} | ${r.license} | ${
        r.sha256 ? '`' + r.sha256.slice(0, 16) + '…`' : '—'
      } | ${r.usedBy} | ${r.present ? 'on disk' : 'not fetched (procedural fallback)'} |`
  )
  .join('\n');
const table = `| File | Source | Author | Licence | SHA-256 | Used by | State |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows}`;

try {
  const ledger = await readFile(ledgerPath, 'utf8');
  const marker = '## Ledger';
  const index = ledger.indexOf(marker);
  if (index >= 0) {
    const head = ledger.slice(0, index + marker.length);
    const rest = ledger.slice(index + marker.length);
    const nextSection = rest.indexOf('\n## ');
    const tail = nextSection >= 0 ? rest.slice(nextSection) : '';
    await writeFile(ledgerPath, `${head}\n\n${table}\n${tail}`);
  }
} catch {
  // No ledger yet is not an error worth failing a fetch over.
}

console.log(
  `\n${fetched} fetched · ${results.filter((r) => r.present).length}/${results.length} on disk · ` +
    `${failed} unavailable · ${drift} digest drift`
);
if (checkOnly && drift > 0) process.exit(1);
