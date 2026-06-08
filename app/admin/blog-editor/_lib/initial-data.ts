import 'server-only';
import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import matter from 'gray-matter';
import { locales, type Locale } from '@/i18n/config';
import { listAuthorKeys, getAuthor } from '@/lib/blog/authors';

const CATEGORIES_PATH = path.resolve(process.cwd(), 'content', 'blog', 'categories.json');
const BLOG_ROOT = path.resolve(process.cwd(), 'content', 'blog');

export interface AuthorOption {
  key: string;
  name: string;
  avatar?: string;
  role?: string;
  /** Full editable fields — read once upfront so the Edit modal can pre-fill
   *  without an extra round-trip. Tiny payload for the handful of authors. */
  location?: string;
  url?: string;
  bio?: string;
}

export interface CategoryOption {
  path: string;
  labelEn: string;
  labelDe: string;
  /** Every per-locale label as stored in categories.json, so the Edit modal
   *  can show all of them at once. */
  labels: Partial<Record<Locale, string>>;
}

export interface EditorInitialData {
  locales: readonly Locale[];
  authors: AuthorOption[];
  categories: CategoryOption[];
  tags: string[];
  repoOwner: string;
  repoName: string;
  baseBranch: string;
}

/** Read the category map and flatten into options keyed by full path. */
const getCategories = cache((): CategoryOption[] => {
  if (!fs.existsSync(CATEGORIES_PATH)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8')) as Record<
      string,
      Partial<Record<Locale, string>>
    >;
    return Object.entries(raw).map(([p, labels]) => ({
      path: p,
      labelEn: labels.en ?? p,
      labelDe: labels.de ?? labels.en ?? p,
      labels,
    }));
  } catch {
    return [];
  }
});

/** Walk every published .md and collect the union of tags seen. */
const getAllTags = cache((): string[] => {
  if (!fs.existsSync(BLOG_ROOT)) return [];
  const tags = new Set<string>();
  for (const dir of fs.readdirSync(BLOG_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory() || !/^[a-z]{2}(-[a-z]{2})?$/i.test(dir.name)) continue;
    const localeDir = path.join(BLOG_ROOT, dir.name);
    for (const file of fs.readdirSync(localeDir)) {
      if (!file.endsWith('.md')) continue;
      try {
        const { data } = matter(fs.readFileSync(path.join(localeDir, file), 'utf8'));
        const t = (data as { tags?: unknown }).tags;
        if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && tags.add(x));
      } catch {
        /* skip malformed */
      }
    }
  }
  return Array.from(tags).sort();
});

/** Load authors with the fields the picker dropdown needs (name + avatar). */
const getAuthors = cache((): AuthorOption[] => {
  const out: AuthorOption[] = [];
  for (const key of listAuthorKeys()) {
    const a = getAuthor(key, 'en' as Locale);
    if (!a) continue;
    out.push({
      key,
      name: a.name,
      ...(a.avatar ? { avatar: a.avatar } : {}),
      ...(a.role ? { role: a.role } : {}),
      ...(a.location ? { location: a.location } : {}),
      ...(a.url ? { url: a.url } : {}),
      ...(a.bioBody ? { bio: a.bioBody } : a.bio ? { bio: a.bio } : {}),
    });
  }
  return out;
});

export function getInitialEditorData(): EditorInitialData {
  // Defaults: parse owner/repo from env (set by Vercel) or fall back to ours.
  const repoEnv = process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
  const [repoOwner = 'PArns', repoName = 'park.fan'] = repoEnv.split('/');
  return {
    locales,
    authors: getAuthors(),
    categories: getCategories(),
    tags: getAllTags(),
    repoOwner,
    repoName,
    baseBranch: process.env.BLOG_EDITOR_BASE_BRANCH ?? 'main',
  };
}
