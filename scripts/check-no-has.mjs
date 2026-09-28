#!/usr/bin/env node
/**
 * No `:has()` selector may reach a page's stylesheet.
 *
 * Run: pnpm check:no-has            (sources — what CI runs, no build needed)
 *      pnpm check:no-has --built    (also the CSS in .next/static — `pnpm build` runs this)
 *
 * WHY
 *
 * With any `:has()` rule active on a page, Chrome restyles `<html>` after every DOM change on that
 * page — a text node replaced inside one card is enough — and on park.fan's pages a restyle of
 * `<html>` recalculates every element. Measured on the Six Flags Great Adventure park page (390 px,
 * 4x CPU, production build): a one-character text change cost 400-500 ms of style recalc with the
 * thirteen `:has()` rules in place and 0-1 ms without them. It is paid by every React commit, so
 * every tap on the page carried it: typing in the ride search 792 -> 64 ms, the favourite star
 * 776 -> 200 ms. Search Console flagged the park pages for INP over 200 ms on 2026-09-23.
 * The rule and the measurements: docs/rules/no-has-selector-in-the-stylesheet.md.
 *
 * WHAT IT CHECKS
 *
 * 1. Tailwind variant candidates that compile to `:has()` — `has-[…]:`, `has-data-…:`,
 *    `group-has-…:`, `peer-has-…:`, `not-has-…:` followed by a utility — in EVERY text file
 *    Tailwind scans. Tailwind reads comments and Markdown too, so a complete class written in a
 *    doc comment or in docs/ is a rule in the global stylesheet. Name the variant without a
 *    utility after it when you need to write about it.
 * 2. A literal `:has(` in CSS (outside comments) and in app code (outside comments) — the
 *    latter catches selectors assembled into an inline `<style>`, which no build output shows.
 *    `scripts/` is exempt from this one: a Playwright locator is a query, not a stylesheet.
 * 3. With `--built`: `:has(` in any emitted stylesheet.
 *
 * The one exception is the admin blog editor's own stylesheet, which loads with the editor only.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BUILT = process.argv.includes('--built');

/** Files allowed to carry `:has()`, each with the reason. */
const ALLOWED_FILES = new Map([
  [
    'app/admin/blog-editor/_components/editor-canvas.css',
    'loads with the admin blog editor only, never on a public page',
  ],
  ['scripts/check-no-has.mjs', 'this check'],
]);
/** Selectors allowed in the built CSS — the editor's rules above, which land in its own chunk. */
const ALLOWED_BUILT = [/^\.tiptap-canvas\b/];

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.md',
  '.mdx',
  '.html',
]);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const problems = [];

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\0').filter((f) => f && TEXT_EXT.has(extname(f)));
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

/** Blank out comments, keeping offsets (so line numbers still point at the right place). */
function stripComments(text, ext) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  let out = text.replace(/\/\*[\s\S]*?\*\//g, blank);
  // `//` comments in script code, not `://` inside a URL.
  if (CODE_EXT.has(ext))
    out = out.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, pre) => pre + blank(m.slice(pre.length)));
  return out;
}

/**
 * Tailwind candidates whose variant compiles to `:has()`: the variant, its bracket group balanced,
 * an optional `/name`, then `:` and the start of a utility. A variant named on its own — as this
 * very comment does — is not a candidate and generates nothing.
 */
function findHasCandidates(text) {
  const hits = [];
  const re = /(?<![\w-])(?:group-|peer-|not-)?has-/g;
  let m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length;
    // `has-checked`, `has-data-[…]`, `has-aria-[…]`, `has-[…]`: a word, a bracket group, or both.
    const word = /^[a-z][\w-]*/.exec(text.slice(i));
    if (word) i += word[0].length;
    if (text[i] === '[') {
      let depth = 0;
      for (; i < text.length; i++) {
        if (text[i] === '[') depth++;
        else if (text[i] === ']' && --depth === 0) break;
        else if (text[i] === '\n') break;
      }
      if (text[i] !== ']') continue;
      i++;
    } else if (!word) continue;
    const name = /^\/[\w-]+/.exec(text.slice(i));
    if (name) i += name[0].length;
    if (text[i] === ':' && /^[!-]?[a-z[@]/.test(text.slice(i + 1, i + 3))) {
      hits.push({
        index: m.index,
        snippet: text.slice(m.index, Math.min(text.length, i + 24)).split(/[\s"'`]/)[0],
      });
    }
  }
  return hits;
}

for (const file of trackedFiles()) {
  if (ALLOWED_FILES.has(file)) continue;
  let text;
  try {
    text = readFileSync(join(ROOT, file), 'utf8');
  } catch {
    continue;
  }
  const ext = extname(file);
  for (const hit of findHasCandidates(text)) {
    problems.push(`${file}:${lineOf(text, hit.index)}  Tailwind :has() variant  ${hit.snippet}`);
  }
  // `scripts/` drives browsers, and a Playwright locator may use `:has()` freely: it is a query,
  // not a rule in any stylesheet. Tailwind still reads those files, so check 1 applies to them.
  if (ext === '.css' || (CODE_EXT.has(ext) && !file.startsWith('scripts/'))) {
    const code = stripComments(text, ext);
    const re = /:has\(\s*(?!\))/g;
    let m;
    while ((m = re.exec(code))) {
      const line = text.split('\n')[lineOf(text, m.index) - 1].trim();
      problems.push(`${file}:${lineOf(text, m.index)}  :has() selector  ${line.slice(0, 120)}`);
    }
  }
}

if (BUILT) {
  const dir = join(ROOT, '.next/static');
  const walk = (d) =>
    readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      return statSync(p).isDirectory() ? walk(p) : p.endsWith('.css') ? [p] : [];
    });
  let sheets = [];
  try {
    sheets = walk(dir);
  } catch {
    problems.push('.next/static not found — run `pnpm build` first, or drop --built');
  }
  for (const sheet of sheets) {
    const css = readFileSync(sheet, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    // Every selector list that contains `:has(`, cut at the brace that opens its block.
    const re = /([^{}]*:has\([^{}]*)\{/g;
    let m;
    while ((m = re.exec(css))) {
      const selector = m[1].trim();
      if (ALLOWED_BUILT.some((a) => a.test(selector))) continue;
      problems.push(`${sheet.slice(ROOT.length)}  built rule  ${selector.slice(0, 140)}`);
    }
  }
}

if (problems.length) {
  console.error(
    `✗ ${problems.length} :has() selector(s) found. Any active :has() rule makes every DOM change on`
  );
  console.error(
    '  the page restyle the whole document — see docs/rules/no-has-selector-in-the-stylesheet.md.\n'
  );
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`✓ no :has() selectors${BUILT ? ' (sources and built CSS)' : ' in sources'}`);
