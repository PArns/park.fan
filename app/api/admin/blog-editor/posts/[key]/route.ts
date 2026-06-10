import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextResponse, type NextRequest } from 'next/server';
import { fromFrontmatter } from '@/app/admin/blog-editor/_lib/types';
import { requireAdminPass } from '@/lib/admin/verify-pass';

const BLOG_ROOT = path.resolve(process.cwd(), 'content', 'blog');
const LOCALE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;
const SAFE_KEY = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

const WIDGET_NAMES = new Set([
  'park-widget',
  'map-widget',
  'weather-widget',
  'best-days-widget',
  'stats-widget',
  'attraction-widget',
  'glossary-widget',
  'gallery-widget',
]);

/**
 * TipTap's CodeBlock parses only the first space-delimited token of the fence
 * info string as the `language` attr — anything after that is silently dropped.
 * Existing posts in this repo use the inline form (```park-widget slug=…``);
 * if we hand that to the editor verbatim, the slug vanishes on the first save.
 *
 * Migrate any widget fence with info-string attrs to the body-attr form
 * (```park-widget\nslug: …\n```) BEFORE we send the markdown to the client.
 * The renderer already supports both syntaxes, so this is a safe normalisation.
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
      const re =
        /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;
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
 * Load every locale file belonging to one post (matched by translationKey or
 * the source-locale slug) and hand the editor back a ready-to-hydrate draft
 * payload. Keys are validated against a slug-shape regex so we can't be
 * tricked into reading outside content/blog via `../`.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;

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
