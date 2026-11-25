import GithubSlugger from 'github-slugger';
import { isNewsCategory } from './paths';
import { newestPublishedFirst } from './published-at';
import { parseWidgetAttrs, parseWidgetParkRef, parseWidgetRideRef } from './widget-park';

/**
 * The news and guides export for the native app (`scripts/publish-media-r2.mjs`,
 * docs/features/media-database.md#export-for-the-native-app): which posts count and a post body as
 * plain blocks, so the app renders it without a markdown engine. Pure and import-light on purpose;
 * the script injects everything that needs the manifests ({@link BlockContext}).
 */

/** At most this many news posts per locale in `news/<locale>.json`. */
export const NEWS_EXPORT_CAP = 100;

export type NewsBlock =
  | { type: 'heading'; level: number; text: string; id: string }
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
  | { type: 'link'; text: string; url: string; park?: string }
  | NewsWidgetBlock;

/** A widget fence that draws live park data, for the app to draw from its own API calls. */
export interface NewsWidgetBlock {
  type: 'widget';
  widget: 'best-days' | 'hourly-profile' | 'ride-waits' | 'stats';
  /** The park's API geo path, or null when the fence names rides only or no path is known. */
  park: string | null;
  /** The park's slug, for the app to find in its own park list when `park` is null. */
  parkSlug: string | null;
  /** `ride-waits` with `rides=`: each ride's park (geo path or null, slug), ride slug and label. */
  rides?: { park: string | null; parkSlug: string; ride: string; label: string | null }[];
  /** The fence's other attributes as written (`top`, `columns`, `highlight`, `show`, `from`, `to`). */
  params: Record<string, string>;
  /** The post on the web, for an app that cannot draw this widget. */
  url: string;
}

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
  /** A park as a widget fence or `ref:` names it (bare slug or `/parks/…`) → its API geo path. */
  parkPath(ref: string): string | null;
  /** The post's own page, absolute. */
  postPage: string;
}

interface Selectable {
  isFallback: boolean;
  frontmatter: { category?: string; date: string; time?: string };
}

function select<T extends Selectable>(posts: readonly T[], news: boolean, cap: number): T[] {
  return posts
    .filter((p) => !p.isFallback && isNewsCategory(p.frontmatter.category) === news)
    .sort((a, b) => newestPublishedFirst(a.frontmatter, b.frontmatter))
    .slice(0, cap);
}

/** News only (the `/news` listing), own-locale posts, newest first, capped. */
export function selectNews<T extends Selectable>(posts: readonly T[], cap = NEWS_EXPORT_CAP): T[] {
  return select(posts, true, cap);
}

/**
 * The guides (the `/blog` listing: every post that is not news), own-locale posts, newest first.
 * Not capped, because a guide stays worth reading where a news post ages out.
 */
export function selectGuides<T extends Selectable>(posts: readonly T[]): T[] {
  return select(posts, false, Infinity);
}

const WIDGET_FENCES: Record<string, NewsWidgetBlock['widget']> = {
  'best-days-widget': 'best-days',
  'hourly-profile-widget': 'hourly-profile',
  'ride-waits-widget': 'ride-waits',
  'stats-widget': 'stats',
};

/** A live-data widget fence as a block; null when it names no park or ride the app can find. */
function widgetBlock(
  widget: NewsWidgetBlock['widget'],
  attrs: Record<string, string>,
  ctx: BlockContext
): NewsWidgetBlock | null {
  const { slug, park: parkAttr, rides: ridesAttr, ...params } = attrs;
  const parkRef = parkAttr ?? slug;
  const parkSlug = parkRef ? (parseWidgetParkRef(parkRef)?.slug ?? null) : null;
  const rides: NonNullable<NewsWidgetBlock['rides']> = [];
  if (widget === 'ride-waits' && !parkRef && ridesAttr) {
    for (const entry of ridesAttr.split(';')) {
      const [ref, label] = entry.split('|');
      const ride = parseWidgetRideRef(ref ?? '');
      const rideParkSlug = ride ? parseWidgetParkRef(ride.parkKey)?.slug : null;
      if (ride && rideParkSlug) {
        rides.push({
          park: ctx.parkPath(ride.parkKey),
          parkSlug: rideParkSlug,
          ride: ride.rideSlug,
          label: label?.trim() || null,
        });
      }
    }
  }
  if (!parkSlug && rides.length === 0) return null;
  return {
    type: 'widget',
    widget,
    park: parkRef ? ctx.parkPath(parkRef) : null,
    parkSlug,
    ...(rides.length ? { rides } : {}),
    params,
    url: ctx.postPage,
  };
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
 * `hourly-profile-widget`, `ride-waits-widget`, `stats-widget`) become `widget` blocks the app
 * fills from its own API calls, a `cta-widget` becomes a `link` block, and a lone
 * `[Park](ref:slug?full)` paragraph (the park card) a `link` block to the park page carrying the
 * park's geo path. `skipped` names the fences left out.
 */
export function markdownToBlocks(
  markdown: string,
  ctx: BlockContext
): { blocks: NewsBlock[]; skipped: string[] } {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: NewsBlock[] = [];
  const skipped: string[] = [];
  // The same slugs rehype-slug gives the headings on the web, so `#id` lands on the section.
  const slugger = new GithubSlugger();
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
      const park = ctx.parkPath(card[2].replace(/^ref:/, '').split('?')[0]);
      if (url) blocks.push({ type: 'link', text: card[1], url, ...(park ? { park } : {}) });
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
      const attrs = parseWidgetAttrs(fence[3], body.join('\n'));
      if (name === 'cta-widget') {
        const url = attrs.href ? resolveHref(attrs.href, ctx) : null;
        if (url && attrs.label) blocks.push({ type: 'link', text: attrs.label, url });
      } else if (Object.hasOwn(WIDGET_FENCES, name)) {
        const block = widgetBlock(WIDGET_FENCES[name], attrs, ctx);
        if (block) blocks.push(block);
        else skipped.push(name);
      } else {
        skipped.push(`code:${name}`);
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
      const text = plain(heading[2], ctx);
      blocks.push({ type: 'heading', level: heading[1].length, text, id: slugger.slug(text) });
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
