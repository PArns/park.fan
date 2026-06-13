import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextResponse } from 'next/server';
import { requireAdminPass } from '@/lib/admin/verify-pass';

const BLOG_ROOT = path.resolve(process.cwd(), 'content', 'blog');
const LOCALE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

interface PostLocaleSummary {
  slug: string;
  title: string;
  mode: 'published' | 'hidden' | 'draft';
  date: string;
  updatedAt: string;
}

interface PostSummary {
  /** Stable handle the load endpoint uses — translationKey when present, else
   *  the source-locale slug. */
  key: string;
  /** Shown in the picker — from whichever locale we treat as source. */
  title: string;
  /** Heuristic source locale: `en` if it exists, else the first locale found. */
  sourceLocale: string;
  /** All locales found for this translation key, keyed by locale code. */
  locales: Record<string, PostLocaleSummary>;
  /** Newest date across all locales — used to sort the picker newest-first. */
  latestDate: string;
}

/**
 * Walk every `content/blog/<locale>/*.md`, group by translationKey (falling
 * back to the slug for posts that don't declare one yet) and return a flat
 * summary list for the editor's "Open existing post" picker.
 */
export async function GET(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;
  if (!fs.existsSync(BLOG_ROOT)) return NextResponse.json({ posts: [] });

  type MdRecord = {
    locale: string;
    slug: string;
    fm: Record<string, unknown>;
  };
  const records: MdRecord[] = [];
  for (const entry of fs.readdirSync(BLOG_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !LOCALE_RE.test(entry.name)) continue;
    const localeDir = path.join(BLOG_ROOT, entry.name);
    for (const file of fs.readdirSync(localeDir)) {
      if (!file.endsWith('.md')) continue;
      try {
        const { data } = matter(fs.readFileSync(path.join(localeDir, file), 'utf8'));
        records.push({
          locale: entry.name,
          slug: file.slice(0, -3),
          fm: data as Record<string, unknown>,
        });
      } catch {
        /* skip malformed */
      }
    }
  }

  const grouped = new Map<string, MdRecord[]>();
  for (const r of records) {
    const tk = typeof r.fm.translationKey === 'string' ? r.fm.translationKey.trim() : '';
    const key = tk || r.slug;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const dateStr = (v: unknown): string => {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'string') return v.slice(0, 10);
    return '';
  };

  const posts: PostSummary[] = [];
  for (const [key, group] of grouped) {
    const locales: Record<string, PostLocaleSummary> = {};
    for (const r of group) {
      const mode = typeof r.fm.mode === 'string' ? r.fm.mode : '';
      locales[r.locale] = {
        slug: r.slug,
        title: typeof r.fm.title === 'string' ? r.fm.title : r.slug,
        mode:
          mode === 'hidden' || mode === 'draft' ? (mode as PostLocaleSummary['mode']) : 'published',
        date: dateStr(r.fm.date),
        updatedAt: dateStr(r.fm.updatedAt),
      };
    }
    const sourceLocale = locales.en ? 'en' : Object.keys(locales)[0]!;
    const latestDate =
      Object.values(locales)
        .map((l) => l.updatedAt || l.date)
        .filter(Boolean)
        .sort()
        .reverse()[0] ?? '';
    posts.push({
      key,
      title: locales[sourceLocale].title,
      sourceLocale,
      locales,
      latestDate,
    });
  }
  posts.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  return NextResponse.json({ posts });
}
