import { isNewsCategory } from './paths';
import { newestPublishedFirst } from './published-at';

/**
 * The news export for the native app (`scripts/publish-media-r2.mjs`,
 * docs/features/media-database.md#export-for-the-native-app): which posts count and a post body as
 * plain blocks, so the app renders it without a markdown engine. Pure and import-light on purpose;
 * the script injects everything that needs the manifests ({@link BlockContext}).
 */

/** At most this many news posts per locale in `news/<locale>.json`. */
export const NEWS_EXPORT_CAP = 100;

export type NewsBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; imageId: string; alt: string; caption: string | null; credit: string | null }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string; source: string | null }
  | {
      type: 'callout';
      kind: string;
      text: string;
      date: string | null;
      label: string | null;
    }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'link'; text: string; url: string };

/** What {@link markdownToBlocks} cannot know by itself. Every resolver returns null for "leave it out". */
export interface BlockContext {
  /** `https://park.fan/<locale>`, no trailing slash. */
  site: string;
  /** The page of a `ref:`/`park:`/`attraction:` href, absolute. */
  refUrl(href: string): string | null;
  /** The real URL of a post linked as `/blog/<slug>` or `/news/<slug>`. */
  postUrl(slug: string): string | null;
  /** The exported photo behind a `/media/…` path; null when it is not exported. */
  image(src: string): { id: string; credit: string | null } | null;
}

/** News only (the `/news` listing), own-locale posts, newest first, capped. */
export function selectNews<
  T extends {
    isFallback: boolean;
    frontmatter: { category?: string; date: string; time?: string };
  },
>(posts: readonly T[], cap = NEWS_EXPORT_CAP): T[] {
  return posts
    .filter((p) => !p.isFallback && isNewsCategory(p.frontmatter.category))
    .sort((a, b) => newestPublishedFirst(a.frontmatter, b.frontmatter))
    .slice(0, cap);
}

const WIDGET_FENCES = new Set([
  'best-days-widget',
  'hourly-profile-widget',
  'ride-waits-widget',
  'stats-widget',
]);

/** `key: value` / `key=value` lines of a widget fence. */
function fenceAttrs(lines: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of lines) {
    const m = /^\s*([a-zA-Z][\w-]*)\s*[:=]\s*(.+?)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

/** A link target as the app can open it: absolute, or null for what the web resolves itself. */
function resolveHref(href: string, ctx: BlockContext): string | null {
  if (/^(ref|park|attraction):/.test(href)) return ctx.refUrl(href);
  if (/^(https?:|mailto:)/i.test(href)) return href;
  const post = /^(?:\/[a-z]{2})?\/(?:blog|news)\/([a-z0-9-]+)\/?(?:[?#].*)?$/.exec(href);
  if (post) return ctx.postUrl(post[1]);
  if (href.startsWith('/')) return `${ctx.site}${href}`;
  return null;
}

/** Inline markdown reduced to bold, italic and absolute links. Anything else is dropped. */
export function inlineText(raw: string, ctx: BlockContext): string {
  return raw
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/<(https?:\/\/[^>\s]+)>/g, '[$1]($1)')
    .replace(/\[([^\]]+)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, text: string, href: string) => {
      const url = resolveHref(href, ctx);
      return url ? `[${text}](${url})` : text;
    })
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Text with no marks at all, for headings and table headers. */
function plain(raw: string, ctx: BlockContext): string {
  return inlineText(raw, ctx)
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_)(?=\S)(.+?)(?<=\S)\1/g, '$2');
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim());

const CALLOUT = /^\[!([A-Z]+)\][ \t]*(.*)$/;

function calloutBlock(lines: string[], ctx: BlockContext): NewsBlock | null {
  const marker = CALLOUT.exec(lines[0]);
  const body = marker ? lines.slice(1) : lines;
  // Paragraphs of the quote; a `[en] …` paragraph is a quote's original and has no place here.
  const paragraphs = body
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => inlineText(p, ctx))
    .filter((p) => p && !/^\[[a-z]{2}(?:-[A-Z]{2})?]\s/.test(p));
  const kind = marker?.[1].toLowerCase() ?? 'quote';
  const rest = marker?.[2].trim() ?? '';
  if (kind === 'quote') {
    if (paragraphs.length === 0) return null;
    const source = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : null;
    const text = (source ? paragraphs.slice(0, -1) : paragraphs).join('\n\n');
    return { type: 'quote', text, source };
  }
  if (!marker)
    return paragraphs.length
      ? { type: 'quote', text: paragraphs.join('\n\n'), source: null }
      : null;
  const date = kind === 'update' && /^\d{4}-\d{2}-\d{2}$/.test(rest) ? rest : null;
  // `[!PARKY] Lohnt sich` carries Parky's verdict on the marker line, followed by the tip.
  const label = kind === 'parky' && rest && paragraphs.length ? rest : null;
  if (rest && !date && !label) paragraphs.unshift(inlineText(rest, ctx));
  if (paragraphs.length === 0) return null;
  return { type: 'callout', kind, text: paragraphs.join('\n\n'), date, label };
}

/**
 * A post body as blocks. Widgets that draw live park data (`best-days-widget`,
 * `hourly-profile-widget`, `ride-waits-widget`, `stats-widget`) are skipped, a `cta-widget`
 * becomes a `link` block, and a lone `[Park](ref:slug?full)` paragraph (the park card) a `link`
 * block to the park page. `skipped` names the fences left out.
 */
export function markdownToBlocks(
  markdown: string,
  ctx: BlockContext
): { blocks: NewsBlock[]; skipped: string[] } {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: NewsBlock[] = [];
  const skipped: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length === 0) return;
    const raw = paragraph.join(' ').trim();
    paragraph = [];
    const image = /^!\[([^\]]*)]\(([^)\s]+)\)$/.exec(raw);
    if (image) {
      const [alt, caption] = image[1].split('|').map((s) => s.trim());
      const photo = ctx.image(image[2]);
      if (photo) {
        blocks.push({
          type: 'image',
          imageId: photo.id,
          alt: alt ?? '',
          caption: caption || null,
          credit: photo.credit,
        });
      }
      return;
    }
    const card = /^\[([^\]]+)]\((ref:[^)\s]+\?[^)\s]*\bfull\b[^)\s]*)\)$/.exec(raw);
    if (card) {
      const url = ctx.refUrl(card[2]);
      if (url) blocks.push({ type: 'link', text: card[1], url });
      return;
    }
    const text = inlineText(raw, ctx);
    if (text) blocks.push({ type: 'paragraph', text });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^(`{3,}|~{3,})\s*([\w-]*)\s*(.*)$/.exec(line);
    if (fence) {
      flush();
      const body: string[] = [];
      while (++i < lines.length && !lines[i].startsWith(fence[1])) body.push(lines[i]);
      const name = fence[2];
      if (name === 'cta-widget') {
        const a = fenceAttrs(body);
        const url = a.href ? resolveHref(a.href, ctx) : null;
        if (url && a.label) blocks.push({ type: 'link', text: a.label, url });
      } else {
        skipped.push(WIDGET_FENCES.has(name) ? name : `code:${name}`);
      }
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: 'heading', level: heading[1].length, text: plain(heading[2], ctx) });
      continue;
    }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      continue;
    }
    if (line.startsWith('>')) {
      flush();
      const quote: string[] = [];
      for (; i < lines.length && lines[i].startsWith('>'); i++) {
        quote.push(lines[i].replace(/^>\s?/, ''));
      }
      i--;
      const block = calloutBlock(quote, ctx);
      if (block) blocks.push(block);
      continue;
    }
    if (line.trimStart().startsWith('|') && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? '')) {
      flush();
      const header = cells(line).map((c) => plain(c, ctx));
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].trimStart().startsWith('|'); i++) {
        rows.push(cells(lines[i]).map((c) => inlineText(c, ctx)));
      }
      i--;
      blocks.push({ type: 'table', header, rows });
      continue;
    }
    const item = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (item) {
      flush();
      const ordered = /\d/.test(item[2]);
      const items: string[] = [];
      // shortcut: a nested list is flattened into its parent, none of the news posts nests one.
      for (; i < lines.length; i++) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (m) items.push(m[3]);
        else if (/^\s+\S/.test(lines[i]) && items.length)
          items[items.length - 1] += ` ${lines[i].trim()}`;
        else break;
      }
      i--;
      blocks.push({ type: 'list', ordered, items: items.map((t) => inlineText(t, ctx)) });
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return { blocks, skipped };
}
