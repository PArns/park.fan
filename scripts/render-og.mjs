#!/usr/bin/env node
/**
 * OG image render harness.
 *
 * Fetches a curated set of dynamic OG images (one per template variant) from a
 * running server and writes them to `.og-preview/` as PNGs plus an
 * `index.html` contact sheet — so a change to any OG renderer can be verified
 * visually, not just by a green build.
 *
 * Usage:
 *   pnpm dev                       # start the Next dev server (separate shell)
 *   pnpm og:preview                # render against http://localhost:3000
 *   pnpm og:preview --base=https://park.fan
 *   OG_BASE=http://localhost:3001 pnpm og:preview
 *   pnpm og:preview en/europe/germany/bruehl/phantasialand   # + extra ad-hoc paths
 *
 * The paths are the segments after `/api/og/`; the harness appends the
 * `/og.png` suffix that social crawlers use, exactly like `getOgImageUrl`.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith('--base='));
const BASE = (
  baseArg?.slice('--base='.length) ||
  process.env.OG_BASE ||
  'http://localhost:3000'
).replace(/\/$/, '');
const OUT_DIR = join(process.cwd(), '.og-preview');

/** One representative path per OG template variant. */
const SAMPLES = [
  { label: 'home', path: 'en' },
  { label: 'generic-search', path: 'en/search' },
  { label: 'generic-howto', path: 'en/howto' },
  { label: 'generic-impressum', path: 'de/impressum' },
  { label: 'generic-glossary-overview', path: 'en/glossary' },
  { label: 'continent', path: 'en/europe' },
  { label: 'country', path: 'en/europe/germany' },
  { label: 'city', path: 'en/europe/germany/bruehl' },
  { label: 'park', path: 'en/europe/germany/bruehl/phantasialand' },
  { label: 'attraction', path: 'en/europe/germany/bruehl/phantasialand/taron' },
  { label: 'blog-index', path: 'en/blog' },
  { label: 'blog-post', path: 'en/blog/the-art-of-waiting' },
  { label: 'blog-category', path: 'en/blog/category/news' },
  { label: 'blog-tag', path: 'en/blog/tag/psychology' },
  { label: 'glossary-term', path: 'en/glossary/wait-time' },
];

// Any bare path args (not flags) are rendered too, labelled by their slug.
for (const extra of args.filter((a) => !a.startsWith('--'))) {
  SAMPLES.push({
    label: extra.replace(/[^a-z0-9]+/gi, '-'),
    path: extra.replace(/^\/+|\/+$/g, ''),
  });
}

const sanitize = (s) => s.replace(/[^a-z0-9-]+/gi, '-');

async function renderOne({ label, path }) {
  const url = `${BASE}/api/og/${path}/og.png`;
  const started = Date.now();
  try {
    const res = await fetch(url);
    const ms = Date.now() - started;
    if (!res.ok) {
      return { label, path, url, ok: false, status: res.status, ms };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const file = `${sanitize(label)}.png`;
    await writeFile(join(OUT_DIR, file), buf);
    return { label, path, url, ok: true, status: res.status, ms, file, bytes: buf.length };
  } catch (err) {
    return { label, path, url, ok: false, status: 0, ms: Date.now() - started, error: String(err) };
  }
}

function contactSheet(results) {
  const cards = results
    .map((r) => {
      const media = r.ok
        ? `<img src="./${r.file}" width="600" height="315" alt="${r.label}" loading="lazy" />`
        : `<div class="fail">FAILED — HTTP ${r.status}${r.error ? `<br><small>${r.error}</small>` : ''}</div>`;
      const meta = r.ok ? `${(r.bytes / 1024).toFixed(0)} KB · ${r.ms} ms` : `${r.ms} ms`;
      return `<figure class="${r.ok ? '' : 'is-fail'}">
        ${media}
        <figcaption><b>${r.label}</b> <span>${meta}</span><br><code>/api/og/${r.path}</code></figcaption>
      </figure>`;
    })
    .join('\n');
  return `<!doctype html><meta charset="utf-8"><title>OG preview</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 32px; background: #0b1120; color: #e2e8f0;
         font: 15px/1.5 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p.sub { margin: 0 0 28px; color: #94a3b8; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(600px, 1fr)); gap: 28px; }
  figure { margin: 0; background: #111827; border: 1px solid #1f2937; border-radius: 12px;
           overflow: hidden; }
  figure.is-fail { border-color: #7f1d1d; }
  img { display: block; width: 100%; height: auto; background: #000; }
  .fail { padding: 60px 20px; text-align: center; color: #fca5a5; background: #1f2937; }
  figcaption { padding: 12px 16px; }
  figcaption span { color: #64748b; font-size: 13px; }
  code { color: #7dd3fc; font-size: 12px; }
</style>
<h1>park.fan — OG image preview</h1>
<p class="sub">${BASE} · ${new Date().toISOString()} · ${results.filter((r) => r.ok).length}/${results.length} ok</p>
<div class="grid">
${cards}
</div>`;
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Rendering ${SAMPLES.length} OG images from ${BASE} …\n`);
  const results = [];
  for (const sample of SAMPLES) {
    const r = await renderOne(sample);
    results.push(r);
    const tag = r.ok ? 'ok ' : 'FAIL';
    console.log(
      `  [${tag}] ${r.label.padEnd(26)} ${String(r.status).padStart(3)}  ${String(r.ms).padStart(5)}ms  /api/og/${r.path}`
    );
  }

  await writeFile(join(OUT_DIR, 'index.html'), contactSheet(results));
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok}/${results.length} rendered → ${join(OUT_DIR, 'index.html')}`);
  if (ok < results.length) process.exitCode = 1;
}

main();
