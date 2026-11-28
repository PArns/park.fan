/**
 * Parky's boxes in the posts (docs/rules/a-parky-box-hands-the-reader-one-move.md): at most two a
 * post, the same boxes in all six translations, and a stamp the card can draw.
 *
 * Run: pnpm test:blog-parky   (pure local data, no API, no server)
 *
 * - **At most two** `> [!PARKY]` boxes a post.
 * - **The six translations agree**: the same number of boxes, stamped and plain in the same order.
 *   A box is written into all six in one pull request, so a gap means one locale lost or never got it.
 * - **A stamp the card draws**: text on the marker line is read by `parseParkyStamp`, the parser the
 *   page uses. A line it refuses (over `PARKY_STAMP_MAX_CHARS`, or with no tip under it) would
 *   silently become the tip's first sentence, so it fails here. A stamp carries no `!` or `¡`,
 *   because it counts towards the post's exclamation budget (docs/writing/4-typography.md §4.5).
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { PARKY_STAMP_MAX_CHARS, parseParkyStamp } from '../lib/blog/remark-callouts.ts';
import { checkThat, finishChecks, quietChecks } from './lib/run-cases.mjs';

quietChecks();

/** A box that breaks a rule is a failed check under the sentence that says which. */
const fail = (message) => checkThat(message, false);

const BLOG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../content/blog');
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];
const MAX_BOXES = 2;

/** Each `> [!PARKY]` box of a body as the text remark sees: the quote's lines without `> `. */
function parkyBoxes(body) {
  const lines = body.split('\n');
  const boxes = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('> [!PARKY]')) continue;
    const quote = [];
    for (let j = i; j < lines.length && lines[j].startsWith('>'); j++) {
      quote.push(lines[j].replace(/^> ?/, ''));
    }
    boxes.push(quote.join('\n'));
  }
  return boxes;
}

/** translationKey → [{ locale, file, kinds }], `kinds` being 'stamp' or 'plain' per box. */
const groups = new Map();
for (const locale of LOCALES) {
  const dir = path.join(BLOG_DIR, locale);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const where = `${locale}/${file}`;
    const { data, content } = matter(readFileSync(path.join(dir, file), 'utf8'));
    const kinds = [];
    for (const box of parkyBoxes(content)) {
      const markerText = box.split('\n')[0].slice('[!PARKY]'.length).trim();
      if (!markerText) {
        kinds.push('plain');
        continue;
      }
      const stamp = parseParkyStamp(box);
      if (!stamp) {
        fail(
          `${where}: „${markerText}“ on the marker line is no stamp (more than ${PARKY_STAMP_MAX_CHARS} characters, or no tip under it) and would read as the tip's first sentence`
        );
      } else if (/[!¡]/.test(stamp.label)) {
        fail(`${where}: the stamp „${stamp.label}“ carries an exclamation mark`);
      }
      kinds.push('stamp');
    }
    if (kinds.length > MAX_BOXES)
      fail(`${where}: ${kinds.length} Parky boxes, at most ${MAX_BOXES}`);
    if (!data.translationKey) continue;
    if (!groups.has(data.translationKey)) groups.set(data.translationKey, []);
    groups.get(data.translationKey).push({ locale, file, kinds: kinds.join(',') });
  }
}

for (const [key, posts] of groups) {
  const shapes = new Set(posts.map((p) => p.kinds));
  if (shapes.size > 1) {
    const list = posts.map((p) => `${p.locale}: ${p.kinds || 'none'}`).join('; ');
    fail(`${key}: the translations carry different Parky boxes (${list})`);
  }
}

finishChecks();
console.log(`✅ blog-parky: ${groups.size} translation groups agree on their Parky boxes`);
