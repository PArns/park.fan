import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextResponse, type NextRequest } from 'next/server';
import { fromFrontmatter } from '@/app/admin/blog-editor/_lib/types';

const BLOG_ROOT = path.resolve(process.cwd(), 'content', 'blog');
const LOCALE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;
const SAFE_KEY = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * Load every locale file belonging to one post (matched by translationKey or
 * the source-locale slug) and hand the editor back a ready-to-hydrate draft
 * payload. Keys are validated against a slug-shape regex so we can't be
 * tricked into reading outside content/blog via `../`.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!key || !SAFE_KEY.test(key)) {
    return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  }
  if (!fs.existsSync(BLOG_ROOT)) {
    return NextResponse.json({ error: 'no content directory' }, { status: 404 });
  }

  const perLocale: Record<
    string,
    {
      slug: string;
      fm: ReturnType<typeof fromFrontmatter>;
      body: string;
    }
  > = {};

  for (const entry of fs.readdirSync(BLOG_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !LOCALE_RE.test(entry.name)) continue;
    const localeDir = path.join(BLOG_ROOT, entry.name);
    for (const file of fs.readdirSync(localeDir)) {
      if (!file.endsWith('.md')) continue;
      const slug = file.slice(0, -3);
      try {
        const raw = fs.readFileSync(path.join(localeDir, file), 'utf8');
        const { data, content } = matter(raw);
        const tk = typeof data.translationKey === 'string' ? data.translationKey.trim() : '';
        const matches = tk ? tk === key : slug === key;
        if (!matches) continue;
        perLocale[entry.name] = {
          slug,
          fm: fromFrontmatter(data as Record<string, unknown>),
          body: content.trimStart(),
        };
      } catch {
        /* skip malformed */
      }
    }
  }

  const locales = Object.keys(perLocale);
  if (locales.length === 0) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const sourceLocale = perLocale.en ? 'en' : locales[0]!;
  return NextResponse.json({
    key,
    sourceLocale,
    baseSlug: perLocale[sourceLocale].slug,
    perLocale,
  });
}
