import 'server-only';
import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import matter from 'gray-matter';
import { defaultLocale, locales, type Locale } from '@/i18n/config';
import type { BlogAuthor } from './types';

const AUTHORS_DIR = path.resolve(process.cwd(), 'content', 'blog', 'authors');

/** A resolved author, plus its registry `key` and long-form (markdown) bio. */
export interface ResolvedAuthor extends BlogAuthor {
  key?: string;
  /** Long-form bio (the markdown body of the author file). */
  bioBody?: string;
}

interface AuthorFile {
  fields: BlogAuthor;
  bioBody?: string;
}

/** Per author key: the base file plus any per-locale override files. */
interface AuthorRecord {
  base?: AuthorFile;
  byLocale: Partial<Record<Locale, AuthorFile>>;
}

const LOCALE_SET = new Set<string>(locales);

/**
 * Load every author file once. Files are named `<key>.md` (the base, in the
 * default locale) plus optional `<key>.<locale>.md` translations. Frontmatter
 * carries the structured fields; the markdown body is the long-form bio.
 *
 * Language-neutral fields (name, url, avatar, links) normally live only in the
 * base file; locale files just translate role/location/bio and the body.
 */
const getRegistry = cache((): Map<string, AuthorRecord> => {
  const registry = new Map<string, AuthorRecord>();
  if (!fs.existsSync(AUTHORS_DIR)) return registry;

  for (const file of fs.readdirSync(AUTHORS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const name = file.replace(/\.md$/, '');
    const segments = name.split('.');
    const maybeLocale = segments.length > 1 ? segments[segments.length - 1] : '';
    const isLocaleFile = LOCALE_SET.has(maybeLocale);
    const key = isLocaleFile ? segments.slice(0, -1).join('.') : name;

    let parsed: AuthorFile;
    try {
      const raw = matter(fs.readFileSync(path.join(AUTHORS_DIR, file), 'utf8'));
      const body = raw.content.trim();
      parsed = { fields: raw.data as BlogAuthor, ...(body ? { bioBody: body } : {}) };
    } catch {
      continue; // skip malformed files
    }

    const record = registry.get(key) ?? { byLocale: {} };
    if (isLocaleFile) record.byLocale[maybeLocale as Locale] = parsed;
    else record.base = parsed;
    registry.set(key, record);
  }
  return registry;
});

/** Drop empty-string fields so they don't override fallbacks (e.g. avatar). */
function clean(author: Partial<BlogAuthor>): Partial<BlogAuthor> {
  return {
    ...(author.name ? { name: author.name } : {}),
    ...(author.url ? { url: author.url } : {}),
    ...(author.bio ? { bio: author.bio } : {}),
    ...(author.avatar ? { avatar: author.avatar } : {}),
    ...(author.role ? { role: author.role } : {}),
    ...(author.location ? { location: author.location } : {}),
    ...(author.links ? { links: author.links } : {}),
  };
}

/** Merge a locale override onto the base file, field by field. */
function mergeRecord(record: AuthorRecord, locale: Locale): ResolvedAuthor | null {
  const base = record.base ?? record.byLocale[defaultLocale];
  const override = record.byLocale[locale];
  const baseFields = base ? clean(base.fields) : {};
  const overrideFields = override ? clean(override.fields) : {};
  const merged = { ...baseFields, ...overrideFields } as BlogAuthor;
  if (!merged.name) return null;
  const bioBody = override?.bioBody ?? base?.bioBody;
  return { ...merged, ...(bioBody ? { bioBody } : {}) };
}

/**
 * Resolve a post's `author` frontmatter to a full author object for a locale. A
 * string is looked up as an author key (with per-locale fallback); if no file
 * exists it is treated as a literal display name. An inline object is returned
 * as-is. The `key` is only set for registry authors — those with a profile page.
 */
export function resolveAuthor(
  author: BlogAuthor | string | undefined,
  locale: Locale
): ResolvedAuthor {
  if (!author) return { name: 'park.fan' };
  if (typeof author === 'string') {
    const merged = getAuthor(author, locale);
    return merged ?? { name: author };
  }
  return clean(author) as ResolvedAuthor;
}

/** Look up a registry author by key for a locale (for the author profile page). */
export function getAuthor(key: string, locale: Locale): ResolvedAuthor | null {
  const record = getRegistry().get(key);
  if (!record) return null;
  const merged = mergeRecord(record, locale);
  return merged ? { ...merged, key } : null;
}

/** All registry author keys — used to pre-render profile pages. */
export function listAuthorKeys(): string[] {
  return Array.from(getRegistry().keys());
}
