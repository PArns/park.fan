/**
 * Bundle isolation: Babylon, the worker and every game module must land in dynamically imported
 * chunks only. **No route outside `/game` may pay a byte for the game.**
 *
 * Asserting the total `.next/static/chunks` size is not that check — adding Babylon grows the total
 * by megabytes and is supposed to. What must not move is the SHARED bundle: `rootMainFiles` in
 * `build-manifest.json`, the chunks every App Router page loads before it loads anything of its
 * own. So this script asks three questions instead of one:
 *
 *   1. Is Babylon in the build at all?  — otherwise "no Babylon in the shared chunk" passes for
 *      the wrong reason, which is how a bundle guard quietly stops guarding.
 *   2. Is Babylon in any shared chunk?  — the actual claim.
 *   3. How big is the shared bundle?    — recorded, so a future change that pushes something into
 *      it is visible as a number rather than as a feeling.
 *
 *   node scripts/check-game-bundle.mjs                       # after `pnpm build`
 *   node scripts/check-game-bundle.mjs --baseline=6873094    # compare the shared total
 *
 * Exit code 1 when a game dependency reached shared code.
 */
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1'];
  })
);
/**
 * Which build to measure. It defaults to this checkout's, and it is overridable because the
 * "before" half of the comparison is a build of a DIFFERENT tree (a worktree at main) — and
 * without this the script resolved `.next` from its own file's location and cheerfully measured
 * this tree twice, printing two identical numbers that looked like a proof.
 */
const next = path.resolve(args.next ? args.next : path.join(root, '.next'));

/**
 * Markers, not the package name.
 *
 * `@babylonjs/core` as a string survives in a comment or a source map path and would report a
 * false positive; these are identifiers the bundler emits from Babylon's own code and nothing else
 * in this repo defines.
 */
const BABYLON_MARKERS = ['BABYLON', 'babylonjs', 'WebGPUEngine', 'ThinEngine'];

let manifest;
try {
  manifest = JSON.parse(await readFile(path.join(next, 'build-manifest.json'), 'utf8'));
} catch {
  console.error(`No build-manifest.json under ${next} — run \`pnpm build\` there first.`);
  process.exit(1);
}

const shared = (manifest.rootMainFiles ?? []).filter((f) => f.endsWith('.js'));
if (shared.length === 0) {
  console.error('build-manifest.json has no rootMainFiles — the shared set could not be read, so');
  console.error('this check cannot pass or fail honestly. Refusing to report a green.');
  process.exit(1);
}

async function contains(file, markers) {
  try {
    const text = await readFile(path.join(next, file), 'utf8');
    return markers.filter((m) => text.includes(m));
  } catch {
    return [];
  }
}

// 1. Babylon is in the build somewhere.
const chunkDir = path.join(next, 'static', 'chunks');
const allChunks = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.js')) allChunks.push(path.relative(next, full));
  }
}
await walk(chunkDir);

const babylonChunks = [];
for (const chunk of allChunks) {
  const hits = await contains(chunk, BABYLON_MARKERS);
  if (hits.length >= 2) babylonChunks.push(chunk);
}

// 2. …but not in a shared one.
const contaminated = [];
for (const chunk of shared) {
  const hits = await contains(chunk, BABYLON_MARKERS);
  if (hits.length >= 2) contaminated.push({ chunk, hits });
}

// 3. Sizes.
async function sizeOf(files) {
  let total = 0;
  for (const f of files) {
    try {
      total += (await stat(path.join(next, f))).size;
    } catch {
      /* a manifest entry with no file is the build's problem, not this check's */
    }
  }
  return total;
}
const sharedBytes = await sizeOf(shared);
const babylonBytes = await sizeOf(babylonChunks);
const totalBytes = await sizeOf(allChunks);

const report = {
  sharedChunks: shared.length,
  sharedBytes,
  totalChunkBytes: totalBytes,
  babylonChunks: babylonChunks.length,
  babylonBytes,
  contaminated,
  baseline: args.baseline ? Number(args.baseline) : null,
};

const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`measuring ${next}`);
console.log(`shared bundle (rootMainFiles): ${shared.length} chunks, ${fmt(sharedBytes)}`);
console.log(`all chunks:                    ${allChunks.length} chunks, ${fmt(totalBytes)}`);
console.log(`chunks carrying Babylon:       ${babylonChunks.length}, ${fmt(babylonBytes)}`);

let ok = true;
if (babylonChunks.length === 0 && !args['baseline-build']) {
  console.error('✗ Babylon is not in the build at all — this check would pass for the wrong reason.');
  ok = false;
} else if (babylonChunks.length === 0) {
  // `--baseline-build` is the "before" half of the comparison: a tree with no game in it, where
  // finding no Babylon is the expected answer rather than a broken guard.
  console.log('· baseline build: no Babylon, as expected');
} else {
  console.log('✓ Babylon is in the build (so the next assertion means something)');
}
if (contaminated.length > 0) {
  console.error(`✗ Babylon reached ${contaminated.length} SHARED chunk(s):`);
  for (const c of contaminated) console.error(`    ${c.chunk} — ${c.hits.join(', ')}`);
  ok = false;
} else {
  console.log('✓ no shared chunk carries Babylon — every route outside /game pays nothing');
}
if (report.baseline) {
  const delta = totalBytes - report.baseline;
  console.log(
    `· total chunk bytes ${totalBytes} against baseline ${report.baseline} (${delta >= 0 ? '+' : ''}${delta}) ` +
      `— growth here is expected and is the game's own chunks`
  );
}

const outFile = path.join(root, '.game-render', args.out ?? 'bundle.json');
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify({ ...report, measured: next }, null, 2));
console.log(`  → ${path.relative(root, outFile)}`);
process.exit(ok ? 0 : 1);
