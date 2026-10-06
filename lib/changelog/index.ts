import 'server-only';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getMediaImage } from '@/lib/media';
import { versionedSrc } from '@/lib/media/focus';
import { getCreditLine, getMediaAlt, getMediaCaption } from '@/lib/media/text';
import type {
  ChangelogEntry,
  ChangelogFrontmatter,
  ChangelogHighlight,
  ResolvedHighlight,
} from './types';

/**
 * The public changelog, read from `content/changelog/<version>.md` at build time. A directory
 * read rather than a generated manifest like the blog's: one prerendered route renders it, so
 * there is no import graph to keep the bodies out of.
 */

const CONTENT_DIR = path.resolve(process.cwd(), 'content', 'changelog');

/** The page is English-only, so alt and caption are read in English. */
const CONTENT_LOCALE = 'en';

/** Numeric semver comparison, newest first; a string sort puts `2.9.0` above `2.12.0`. */
function compareVersionsDesc(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsB[i] ?? 0) - (partsA[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function resolveHighlight(highlight: ChangelogHighlight): ResolvedHighlight | null {
  const image = getMediaImage(highlight.image);
  // A renamed or removed screenshot drops its figure rather than breaking the
  // page — the release text stands on its own, the picture illustrates it.
  if (!image) return null;

  return {
    src: versionedSrc(image),
    alt: getMediaAlt(image.id, CONTENT_LOCALE) ?? image.title,
    caption: getMediaCaption(image.id, CONTENT_LOCALE),
    credit: getCreditLine(image),
    width: image.width || null,
    height: image.height || null,
  };
}

function isPublished(fm: Partial<ChangelogFrontmatter>): boolean {
  return fm.mode !== 'draft';
}

/**
 * `date` as `YYYY-MM-DD`, whatever YAML made of it: js-yaml parses an unquoted `2026-09-21` as a
 * `Date`, whose `String(…)` the sitemap cannot read back as a date.
 */
function toIsoDate(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  return null;
}

/**
 * Every published entry, newest version first.
 *
 * An entry missing `version`, `date` or `title` is skipped with a warning
 * rather than thrown: a half-written file in the tree should not take the whole
 * page down, and the build log names it.
 */
export function getChangelogEntries(): ChangelogEntry[] {
  let files: string[];
  try {
    // `README.md` is the authoring contract that lives beside the entries, the
    // way `content/blog/README.md` does. Excluded by name rather than by a
    // pattern over the version files, so a misnamed entry still reaches the
    // warning below instead of being skipped in silence.
    files = readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.md') && name !== 'README.md');
  } catch {
    return [];
  }

  const entries: ChangelogEntry[] = [];

  for (const file of files) {
    const raw = readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const fm = data as Partial<ChangelogFrontmatter>;
    const date = toIsoDate(fm.date);

    if (!fm.version || !date || !fm.title) {
      console.warn(
        `[changelog] content/changelog/${file}: version, title or a YYYY-MM-DD date missing`
      );
      continue;
    }
    if (!isPublished(fm)) continue;

    entries.push({
      version: String(fm.version),
      through: fm.through ? String(fm.through) : null,
      reconstructed: fm.reconstructed === true,
      date,
      title: fm.title,
      summary: fm.summary ?? '',
      highlights: (fm.highlights ?? [])
        .map(resolveHighlight)
        .filter((h): h is ResolvedHighlight => h !== null),
      content: content.trim(),
    });
  }

  return entries.sort((a, b) => compareVersionsDesc(a.version, b.version));
}
