#!/usr/bin/env node

/**
 * What each Vercel Function in this build actually carries, and how close it is to the 250 MB
 * uncompressed limit.
 *
 * Vercel only tells you after a failed deploy (`The Vercel Function "api/og/[...path]" is 290.96mb
 * uncompressed`), and by then the answer costs a push and a build. The number is knowable locally:
 * `next build` writes one `*.nft.json` per route listing every file the tracer decided that
 * function needs, so summing them is the same arithmetic Vercel does. Measured against the commit
 * that failed at 290.96 MB, this printed **287.0 MB** — the gap is the Linux sharp/libvips binary
 * against the darwin one, so it is close enough to budget against.
 *
 * The useful part is not the total but the bucket list. A function is rarely big because of code:
 * it is big because a runtime `join(process.cwd(), <root>, <variable>)` somewhere in its import
 * graph could not be resolved statically, and the tracer's answer to that is to bundle the whole
 * directory the path is rooted at. That shows up here as a bucket with hundreds of files in it.
 * See [the rule](../docs/rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md).
 *
 * Usage:
 *   pnpm build                              # the trace is a build artefact; no build, no answer
 *   pnpm measure:function-size              # every function, largest first
 *   pnpm measure:function-size api/og       # one function, broken down by bucket
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SERVER_DIR = path.join(ROOT, '.next', 'server');

/** Vercel's uncompressed limit for a single function. */
const LIMIT_MB = 250;

/** Warn this far under it — a function inside the limit today still has to survive the next photo. */
const WARN_MB = 150;

const filter = process.argv[2];

function collectTraces(dir) {
  const traces = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) traces.push(...collectTraces(abs));
    else if (entry.name.endsWith('.nft.json')) traces.push(abs);
  }
  return traces;
}

/**
 * Sum one trace, de-duplicated.
 *
 * A trace lists the same file more than once when several imports reach it, and counting it twice
 * would overstate exactly the buckets that matter most.
 */
function measure(tracePath) {
  const { files } = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
  const base = path.dirname(tracePath);
  const buckets = new Map();
  const seen = new Set();
  let bytes = 0;

  for (const file of files) {
    const abs = path.resolve(base, file);
    if (seen.has(abs)) continue;
    seen.add(abs);

    let size;
    try {
      size = fs.statSync(abs).size;
    } catch {
      continue; // a trace entry the build later removed — not ours to explain
    }
    bytes += size;

    const key = bucketFor(path.relative(ROOT, abs));
    const bucket = buckets.get(key) ?? { bytes: 0, files: 0 };
    bucket.bytes += size;
    bucket.files += 1;
    buckets.set(key, bucket);
  }

  return { bytes, files: seen.size, buckets };
}

/**
 * Group a traced file under something a reader can act on.
 *
 * `node_modules` collapses to the package, everything else to its top two path segments — deep
 * enough to tell `public/media` from `content/blog`, shallow enough that 157 photos read as one
 * line rather than 157.
 */
function bucketFor(rel) {
  if (rel.startsWith('node_modules')) return rel.split(path.sep).slice(0, 3).join('/');
  return rel.split(path.sep).slice(0, 2).join('/');
}

/** `.next/server/app/api/og/[...path]/route.js.nft.json` → `api/og/[...path]` */
function routeName(tracePath) {
  return path
    .relative(SERVER_DIR, tracePath)
    .replace(/\.(js|json)\.nft\.json$/, '')
    .replace(/[/\\](route|page)$/, '')
    .replace(/^app[/\\]/, '')
    .split(path.sep)
    .join('/');
}

const mb = (bytes) => bytes / 1024 / 1024;
const fmt = (bytes) => `${mb(bytes).toFixed(1)} MB`;

function main() {
  if (!fs.existsSync(SERVER_DIR)) {
    console.error(
      '❌ No build output. The trace is written by `next build` — run `pnpm build` first.'
    );
    process.exit(1);
  }

  const measured = collectTraces(SERVER_DIR)
    .map((trace) => ({ name: routeName(trace), ...measure(trace) }))
    .filter((route) => !filter || route.name.includes(filter))
    .sort((a, b) => b.bytes - a.bytes);

  if (measured.length === 0) {
    console.error(`❌ No function matched "${filter}".`);
    process.exit(1);
  }

  if (filter && measured.length === 1) {
    const [route] = measured;
    console.log(`\n${route.name} — ${fmt(route.bytes)} in ${route.files} files\n`);
    for (const [key, bucket] of [...route.buckets].sort((a, b) => b[1].bytes - a[1].bytes)) {
      if (bucket.bytes < 64 * 1024) continue;
      console.log(
        `  ${fmt(bucket.bytes).padStart(9)}  ${String(bucket.files).padStart(5)} files  ${key}`
      );
    }
    console.log();
  } else {
    console.log(
      `\n${measured.length} functions, largest first (limit ${LIMIT_MB} MB uncompressed):\n`
    );
    for (const route of measured.slice(0, 20)) {
      const size = mb(route.bytes);
      const mark = size > LIMIT_MB ? '❌' : size > WARN_MB ? '⚠️ ' : '  ';
      console.log(`  ${mark} ${fmt(route.bytes).padStart(9)}  ${route.name}`);
    }
    console.log();
  }

  const over = measured.filter((route) => mb(route.bytes) > LIMIT_MB);
  if (over.length > 0) {
    for (const route of over) {
      console.error(`❌ ${route.name} is ${fmt(route.bytes)}, over the ${LIMIT_MB} MB limit.`);
    }
    process.exit(1);
  }
}

main();
