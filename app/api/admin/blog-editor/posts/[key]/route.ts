import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextResponse, type NextRequest } from 'next/server';
import { fromFrontmatter } from '@/app/admin/blog-editor/_lib/types';
import { denyUnlessAdmin } from '@/lib/admin/session';
import { BLOG_LOCALE_RE, BLOG_SLUG_RE } from '@/lib/admin/blog-paths';

const BLOG_ROOT = path.resolve(process.cwd(), 'content', 'blog');

const WIDGET_NAMES = new Set([
  'park-widget',
  'map-widget',
  'weather-widget',
  'best-days-widget',
  'stats-widget',
  'attraction-widget',
  'glossary-widget',
  'gallery-widget',
  'park-comparison-widget',
  'ride-waits-widget',
  'hourly-profile-widget',
]);

/**
 * Moves widget fence attrs from the info string (```park-widget slug=…```) into the body
 * (`slug: …`) before the editor gets the markdown: TipTap keeps only the first token of the info
 * string, so the slug would vanish on the first save. The renderer reads both forms.
 */
function normaliseWidgetFences(md: string): string {
  return md.replace(
    /^```([a-z][a-z0-9-]*-widget)(?:[ \t]+([^\n]+))?\n([\s\S]*?)\n?```/gm,
    (full, name: string, info: string | undefined, body: string) => {
      if (!WIDGET_NAMES.has(name)) return full;
      const inlineAttrs = info?.trim();
      if (!inlineAttrs) return full;
      // Split `key=value` pairs (with optional quoted values) and emit each on
      // its own `key: value` line inside the body.
      const re = /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;
      const lines: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(inlineAttrs)) !== null) {
        lines.push(`${m[1]}: ${m[2] ?? m[3] ?? m[4] ?? ''}`);
      }
      if (lines.length === 0) return full;
      const newBody = [...lines, body.trim()].filter(Boolean).join('\n');
      return '```' + name + '\n' + newBody + '\n```';
    }
  );
}

/**
 * Loads every locale file of one post (by translationKey or source-locale slug) as a draft for the
 * editor. Keys must be slug-shaped, so `../` cannot read outside content/blog.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const unauthorized = await denyUnlessAdmin(req);
  if (unauthorized) return unauthorized;

  const { key } = await params;
  if (!key || !BLOG_SLUG_RE.test(key)) {
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
    if (!entry.isDirectory() || !BLOG_LOCALE_RE.test(entry.name)) continue;
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
          body: normaliseWidgetFences(content.trimStart()),
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
