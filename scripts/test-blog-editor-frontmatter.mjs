/**
 * Loading a post into the blog editor and saving it unchanged must write the same frontmatter
 * back: every file under content/blog/<locale>/ goes through `fromFrontmatter` → `toFrontmatter`
 * → `buildPostFile` and is parsed again. A field the form does not hold (`time`, `parkLinks`,
 * `coverImage.caption`, `seo.canonical` …) that goes missing fails here.
 *
 * Run: pnpm test:blog-editor-frontmatter
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import matter from 'gray-matter';
import { fromFrontmatter, toFrontmatter } from '../app/admin/blog-editor/_lib/types.ts';
import { buildPostFile } from '../app/admin/blog-editor/_lib/serialize.ts';

const root = join(import.meta.dirname, '..', 'content', 'blog');
const locales = ['en', 'de', 'nl', 'fr', 'es', 'it'];

let passed = 0;
let failed = 0;
for (const locale of locales) {
  for (const file of readdirSync(join(root, locale)).filter((f) => f.endsWith('.md'))) {
    const { data, content } = matter(readFileSync(join(root, locale, file), 'utf8'));
    // Through JSON, as the load route hands the draft to the browser.
    const draft = JSON.parse(JSON.stringify(fromFrontmatter(data)));
    const saved = matter(buildPostFile(toFrontmatter(draft), content)).data;
    if (isDeepStrictEqual(saved, data)) {
      passed++;
    } else {
      failed++;
      const keys = new Set([...Object.keys(data), ...Object.keys(saved)]);
      const changed = [...keys].filter((k) => !isDeepStrictEqual(data[k], saved[k]));
      console.log(`❌ FAIL: ${locale}/${file} changes ${changed.join(', ')}`);
    }
  }
}

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
