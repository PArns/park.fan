import {
  Children,
  cloneElement,
  Fragment,
  Suspense,
  isValidElement,
  type ReactNode,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import type { Locale } from '@/i18n/config';
import { remarkTableThemes } from '@/lib/blog/remark-table-themes';
import {
  extractInlineRefs,
  parseRefKey,
  parseRefOptions,
  resolveAttraction,
  resolvePark,
  type ResolvedAttraction,
  type ResolvedPark,
} from '@/lib/blog/park-resolver';
import {
  getAttractionBackgroundImage,
  getParkBackgroundImage,
} from '@/lib/utils/park-assets';
import { parseGlossarySegments } from '@/lib/glossary/parse-segments';
import { GlossaryInjectTerm } from '@/components/glossary/glossary-inject-term';
import { getGlossaryTerms, GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { GlossaryTerm } from '@/lib/glossary/types';
import { BlogParkLink } from './blog-park-link';
import { BlogAttractionLink } from './blog-attraction-link';
import { BlogInlineImage, type BlogImageAlign } from './blog-inline-image';
import { BlogParkWidget } from './blog-park-widget';
import { BlogAttractionWidget } from './blog-attraction-widget';
import { BlogYouTubeEmbed } from './blog-youtube-embed';
import { BlogInstagramEmbed } from './blog-instagram-embed';
import { BlogSunoEmbed } from './blog-suno-embed';
import { parseYouTube, parseInstagram, parseSuno } from '@/lib/blog/embeds';
import { BlogMapWidget } from './blog-map-widget';
import { BlogWeatherWidget } from './blog-weather-widget';
import { BlogBestDaysWidget } from './blog-best-days-widget';
import { BlogStatsWidget } from './blog-stats-widget';
import { BlogGlossaryWidget } from './blog-glossary-widget';
import { BlogGallery } from './blog-gallery';
import { listFolderImages } from '@/lib/blog/gallery';
import type { BlogImage } from '@/lib/blog/types';

interface BlogContentProps {
  markdown: string;
  locale: Locale;
}

interface Segment {
  type: 'markdown' | 'widget';
  body: string;
  /** When type === 'widget'. */
  widget?: { name: string; attrs: Record<string, string> };
}

const WIDGET_FENCE = /^```([a-z][a-z0-9-]*-widget)(?:\s+([^\n`]+))?\n([\s\S]*?)\n?```$/gm;

/** Widgets keyed by a single park `slug=` attr — all pre-resolve into parkMap. */
const PARK_SLUG_WIDGETS = new Set([
  'park-widget',
  'map-widget',
  'weather-widget',
  'best-days-widget',
  'stats-widget',
]);

const SAFE_HTTP_LIKE = /^(https?:|mailto:|tel:|#|\/)/i;

/**
 * react-markdown's default urlTransform strips unknown protocols, which would
 * eat our `park:` and `attraction:` link references. Keep those (we render
 * them ourselves) while still defanging genuinely unsafe schemes like
 * `javascript:` or `data:`.
 */
function preserveCustomProtocols(url: string): string {
  if (!url) return '';
  if (url.startsWith('park:') || url.startsWith('attraction:') || url.startsWith('ref:')) {
    return url;
  }
  if (SAFE_HTTP_LIKE.test(url)) return url;
  return '';
}

type EntityRef = { kind: 'park' | 'ride'; key: string; options: Set<string> };

/**
 * Parse an entity-reference href into a normalized descriptor. Accepts the
 * unified `ref:` form (park vs ride decided by a slash in the key) plus the
 * `park:` / `attraction:` aliases. Returns null for any other href.
 */
function parseEntityRef(href: string | undefined): EntityRef | null {
  if (!href) return null;
  if (href.startsWith('ref:')) {
    const { slug, options } = parseRefOptions(href.slice('ref:'.length));
    // Accept both the legacy short form (`slug` or `parkSlug/rideSlug`) and the
    // full geo-path form the editor writes — `/parks/<continent>/<…>`.
    const { kind, key } = parseRefKey(slug);
    return { kind, key, options };
  }
  if (href.startsWith('attraction:')) {
    const { slug, options } = parseRefOptions(href.slice('attraction:'.length));
    return { kind: 'ride', key: slug, options };
  }
  if (href.startsWith('park:')) {
    const { slug, options } = parseRefOptions(href.slice('park:'.length));
    return { kind: 'park', key: slug, options };
  }
  return null;
}

/** True when an href is an entity reference carrying the `full` option. */
function isFullEntityHref(href: unknown): boolean {
  return typeof href === 'string' && (parseEntityRef(href)?.options.has('full') ?? false);
}

/**
 * Resolve the inline-image alignment from the alt-text segment and/or a
 * `?align=` query on the src. Query wins. Falls back to centered.
 */
function resolveImageAlign(altSegment: string | undefined, src: string): BlogImageAlign {
  const fromQuery = (() => {
    const q = src.indexOf('?');
    if (q === -1) return undefined;
    return new URLSearchParams(src.slice(q + 1)).get('align') ?? undefined;
  })();
  const raw = (fromQuery ?? altSegment ?? '').toLowerCase().trim();
  if (raw === 'left' || raw === 'right' || raw === 'wide' || raw === 'center') return raw;
  return 'center';
}

/**
 * Catch-all whitespace regex used to normalise text before the glossary
 * matcher runs. Combines JS `\s` (which already covers \n, \t, \r, \f, \v,
 * U+00A0 NBSP, U+1680, U+2000-U+200A, U+2028, U+2029, U+202F NARROW NBSP,
 * U+205F, U+3000 and U+FEFF) with the explicitly enumerated zero-width
 * characters that JS `\s` does *not* match (ZWSP U+200B, ZWNJ U+200C, ZWJ
 * U+200D, word-joiner U+2060). Without this the literal pattern
 * "Live Wait Times" never matches text like `live wait times`,
 * `live wait\ntimes` or `live wait​times`.
 */
const WHITESPACE_NORMALIZE_RE =
  /(?:\s|​|‌|‍|⁠)+/g;

/**
 * Replace glossary-term occurrences in a plain string with
 * `GlossaryInjectTerm` tooltips. Shares the project-wide first-occurrence
 * rule via the `used` Set passed in by BlogContent.
 */
function renderGlossaryString(
  text: string,
  terms: GlossaryTerm[],
  _used: Set<string>,
  locale: Locale,
  segment: string
): ReactNode {
  const normalized = text.replace(WHITESPACE_NORMALIZE_RE, ' ');
  if (!normalized.trim()) return text;
  const segments = parseGlossarySegments(normalized, terms);
  if (segments.every((s) => s.type === 'text')) return text;
  return segments.map((seg, i) => {
    if (seg.type === 'text') return <Fragment key={i}>{seg.content}</Fragment>;
    return (
      <GlossaryInjectTerm
        key={`${seg.id}-${i}`}
        matchedText={seg.matchedText}
        name={seg.name}
        slug={seg.slug}
        shortDefinition={seg.shortDefinition}
        locale={locale}
        segment={segment}
      />
    );
  });
}

function parseAttrs(line: string | undefined, body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const consume = (input: string) => {
    // Unquoted values run until the next ` key=` token or end of line, so a
    // bare `heading=A few moments from the trip` keeps its spaces instead of
    // collapsing to just "A". Quoted values win when present.
    const re =
      /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.+?))(?=\s+[a-zA-Z][a-zA-Z0-9_-]*\s*=|\s*$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      out[m[1]] = (m[2] ?? m[3] ?? m[4] ?? '').trim();
    }
  };
  if (line) consume(line);
  // Also accept attrs as `key: value` lines inside the fence.
  for (const ln of body.split(/\r?\n/)) {
    const m = ln.match(/^\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*[:=]\s*(.+?)\s*$/);
    if (m) {
      out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return out;
}

function segmentize(markdown: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const matches = Array.from(markdown.matchAll(WIDGET_FENCE));
  for (const match of matches) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ type: 'markdown', body: markdown.slice(lastIndex, start) });
    }
    const [, name, attrLine, body] = match;
    segments.push({
      type: 'widget',
      body: body ?? '',
      widget: { name, attrs: parseAttrs(attrLine, body ?? '') },
    });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < markdown.length) {
    segments.push({ type: 'markdown', body: markdown.slice(lastIndex) });
  }
  if (segments.length === 0) {
    segments.push({ type: 'markdown', body: markdown });
  }
  return segments;
}

export async function BlogContent({ markdown, locale }: BlogContentProps) {
  const { parkSlugs, attractions } = extractInlineRefs(markdown);

  // Pre-fetch glossary terms once so we can highlight them in headings and
  // paragraphs without making the renderer async. Dedupe is shared across
  // the whole post via `usedGlossaryTerms` — first occurrence wins, same
  // behaviour as on the marketing pages.
  const glossaryTerms = await getGlossaryTerms(locale);
  const glossarySegment = GLOSSARY_SEGMENTS[locale];
  const usedGlossaryTerms = new Set<string>();

  const parkEntries = await Promise.all(
    [...parkSlugs].map(async (slug) => [slug, await resolvePark(slug)] as const)
  );
  const parkMap = new Map<string, ResolvedPark | null>(parkEntries);

  const attractionEntries = await Promise.all(
    [...attractions].map(async (ref) => {
      const [parkSlug, attractionSlug] = ref.split('/');
      const park = await resolvePark(parkSlug);
      const attraction = await resolveAttraction(parkSlug, attractionSlug);
      return [ref, { park, attraction }] as const;
    })
  );
  const attractionMap = new Map<
    string,
    { park: ResolvedPark | null; attraction: ResolvedAttraction | null }
  >(attractionEntries);

  // Also pre-resolve any park slugs referenced from widgets — both
  // `park-widget slug=…` and `attraction-widget parkSlug=… slug=…`.
  const segments = segmentize(markdown);
  for (const seg of segments) {
    if (seg.type !== 'widget' || !seg.widget) continue;
    const { name, attrs } = seg.widget;
    if (PARK_SLUG_WIDGETS.has(name) && attrs.slug && !parkMap.has(attrs.slug)) {
      parkMap.set(attrs.slug, await resolvePark(attrs.slug));
    }
    if (name === 'attraction-widget') {
      const parkSlug = attrs.parkSlug ?? attrs.park;
      const aSlug = attrs.slug;
      if (parkSlug && aSlug) {
        const ref = `${parkSlug}/${aSlug}`;
        if (!parkMap.has(parkSlug)) {
          parkMap.set(parkSlug, await resolvePark(parkSlug));
        }
        if (!attractionMap.has(ref)) {
          const park = await resolvePark(parkSlug);
          const attraction = await resolveAttraction(parkSlug, aSlug);
          attractionMap.set(ref, { park, attraction });
        }
      }
    }
  }

  // Look up background images for every referenced park / attraction so the
  // hover-card preview matches the favorites cards visually.
  const parkBackgroundMap = new Map<string, string | null>();
  for (const slug of parkMap.keys()) {
    parkBackgroundMap.set(slug, getParkBackgroundImage(slug));
  }
  const attractionBackgroundMap = new Map<string, string | null>();
  for (const [ref] of attractionMap) {
    const [parkSlug, attractionSlug] = ref.split('/');
    attractionBackgroundMap.set(
      ref,
      getAttractionBackgroundImage(parkSlug, attractionSlug)
    );
  }

  /**
   * Walk a react-markdown children tree and replace plain-text occurrences of
   * glossary terms with the same `GlossaryInjectTerm` tooltip that's used on
   * the marketing pages. Mixed content (inline links, <strong>, etc.) is left
   * alone — only string nodes get processed.
   */
  const injectGlossary = (node: ReactNode): ReactNode => {
    if (typeof node === 'string') {
      return renderGlossaryString(node, glossaryTerms, usedGlossaryTerms, locale, glossarySegment);
    }
    if (Array.isArray(node)) {
      return node.map((child, i) => (
        <Fragment key={i}>{injectGlossary(child)}</Fragment>
      ));
    }
    // Recurse into inline formatting (strong/em/code) so a glossary term wrapped
    // in **bold** still gets a tooltip — but leave React elements with custom
    // logic (links, our own park/attraction components) untouched.
    if (isValidElement(node)) {
      const el = node as React.ReactElement<{ children?: ReactNode }>;
      if (
        typeof el.type === 'string' &&
        ['strong', 'em', 'i', 'b', 'mark', 'small', 'span'].includes(el.type)
      ) {
        return cloneElement(el, undefined, injectGlossary(el.props.children));
      }
    }
    return node;
  };

  // Build the full spotlight card for a resolved entity. `inRow` lets several
  // cards share a side-by-side grid row instead of each taking sm:w-1/2.
  const renderFullCard = (entity: EntityRef, inRow: boolean) => {
    if (entity.kind === 'ride') {
      const [parkSlugForBg, attractionSlug] = entity.key.split('/');
      const data = attractionMap.get(entity.key);
      return (
        <BlogAttractionWidget
          park={data?.park ?? null}
          attraction={data?.attraction ?? null}
          parkSlug={parkSlugForBg}
          attractionSlug={attractionSlug}
          inRow={inRow}
        />
      );
    }
    return <BlogParkWidget park={parkMap.get(entity.key) ?? null} slug={entity.key} inRow={inRow} />;
  };

  const components: Components = {
    a({ href, children }) {
      const text = typeof children === 'string' ? children : undefined;
      const flat = Array.isArray(children) ? children.join('') : (text ?? '');
      // Entity references: `ref:europa-park` (park) / `ref:europa-park/voltron`
      // (ride, detected by the slash), with `park:` / `attraction:` as aliases.
      // Renders an inline link by default, or the full spotlight card with
      // `?full`. The block card is hoisted out of its <p> by the `p` renderer.
      const entity = parseEntityRef(href);
      if (entity) {
        const full = entity.options.has('full');
        if (entity.kind === 'ride') {
          const [parkSlugForBg] = entity.key.split('/');
          const data = attractionMap.get(entity.key);
          if (full) return renderFullCard(entity, false);
          return (
            <BlogAttractionLink
              attraction={data?.attraction ?? null}
              park={data?.park ?? null}
              fallbackLabel={String(flat) || entity.key}
              refKey={entity.key}
              options={entity.options}
              attractionBackgroundImage={attractionBackgroundMap.get(entity.key) ?? null}
              parkBackgroundImage={parkBackgroundMap.get(parkSlugForBg) ?? null}
            >
              {children}
            </BlogAttractionLink>
          );
        }
        const park = parkMap.get(entity.key) ?? null;
        if (full) return renderFullCard(entity, false);
        return (
          <BlogParkLink
            park={park}
            fallbackLabel={String(flat) || entity.key}
            slug={entity.key}
            options={entity.options}
            backgroundImage={parkBackgroundMap.get(entity.key) ?? null}
          >
            {children}
          </BlogParkLink>
        );
      }
      const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
      return (
        <a
          href={href}
          {...(isExternal ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
          className="text-primary hover:text-primary/80 font-medium underline decoration-dotted underline-offset-4"
        >
          {children}
        </a>
      );
    },
    img({ src, alt }) {
      if (typeof src !== 'string' || !src) return null;
      // Authoring convention encoded in the markdown alt text:
      //   ![alt | caption | align | size](src)
      // where `align` is one of left | right | center | wide and `size` is an
      // optional small | medium | large override. Alignment can also come
      // from a ?align= query on the src, which wins if present.
      const altStr = typeof alt === 'string' ? alt : '';
      const parts = altStr.split('|').map((s) => s.trim());
      const imgAlt = parts[0] ?? '';
      const caption = parts[1] || undefined;
      const align = resolveImageAlign(parts[2], src);
      const sizeRaw = (parts[3] ?? '').toLowerCase();
      const size: 'small' | 'medium' | 'large' | undefined =
        sizeRaw === 'small' || sizeRaw === 'medium' || sizeRaw === 'large'
          ? sizeRaw
          : undefined;
      return (
        <BlogInlineImage
          src={src}
          alt={imgAlt}
          caption={caption}
          align={align}
          size={size}
        />
      );
    },
    h1: ({ children }) => (
      <h1 className="text-foreground mt-12 mb-6 text-3xl font-bold tracking-tight first:mt-0 sm:text-4xl">
        {injectGlossary(children)}
      </h1>
    ),
    h2: ({ children, id }) => (
      <h2
        id={id}
        className="text-foreground mt-12 mb-4 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        {injectGlossary(children)}
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3 id={id} className="text-foreground mt-8 mb-3 scroll-mt-24 text-xl font-semibold">
        {injectGlossary(children)}
      </h3>
    ),
    p: ({ children }) => {
      // A paragraph that is just a single link can become a block element: a
      // `?full` spotlight card or a YouTube/Instagram embed. A <div> inside <p>
      // is invalid and breaks hydration, so emit these without the <p> wrapper.
      // The child here is the `a` renderer element, so detect it by its href.
      const meaningful = Children.toArray(children).filter(
        (c) => !(typeof c === 'string' && c.trim() === '')
      );

      // Two or more `?full` references in one paragraph → a side-by-side row.
      if (meaningful.length >= 2) {
        const entities = meaningful.map((c) =>
          isValidElement(c) ? parseEntityRef((c.props as { href?: string }).href) : null
        );
        if (entities.every((e) => e?.options.has('full'))) {
          return (
            <div className="not-prose my-8 grid items-stretch gap-4 sm:grid-cols-2">
              {entities.map((e, i) => (
                <div key={i}>{renderFullCard(e as EntityRef, true)}</div>
              ))}
            </div>
          );
        }
      }

      const only = meaningful[0];
      if (meaningful.length === 1 && isValidElement(only)) {
        const props = only.props as { href?: string; children?: ReactNode };
        const href = props.href;
        if (isFullEntityHref(href)) return <>{only}</>;
        const yt = parseYouTube(href);
        if (yt) {
          const label = typeof props.children === 'string' ? props.children : undefined;
          return (
            <BlogYouTubeEmbed
              id={yt.id}
              start={yt.start}
              title={label && label !== href ? label : undefined}
            />
          );
        }
        const ig = parseInstagram(href);
        if (ig) return <BlogInstagramEmbed url={ig.url} />;
        const suno = parseSuno(href);
        if (suno) {
          const label = typeof props.children === 'string' ? props.children : undefined;
          return <BlogSunoEmbed id={suno.id} title={label && label !== href ? label : undefined} />;
        }
      }
      return <p className="text-foreground/90 my-5 leading-[1.75]">{injectGlossary(children)}</p>;
    },
    ul: ({ children }) => (
      <ul className="text-foreground/90 my-5 list-disc space-y-2 pl-6 leading-[1.75]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="text-foreground/90 my-5 list-decimal space-y-2 pl-6 leading-[1.75]">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{injectGlossary(children)}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-primary/40 text-foreground/80 my-6 border-l-4 pl-4 italic">
        {injectGlossary(children)}
      </blockquote>
    ),
    hr: () => <hr className="border-border my-10" />,
    table: ({ children, ...rest }) => {
      // Pass `data-theme` through when the remark-table-themes plugin
      // attached it from a `<!--tbl-theme: …-->` directive — the CSS
      // selectors in globals.css read it to colour the header row.
      const themeAttr = (rest as { 'data-theme'?: string })['data-theme'];
      return (
        <div className="not-prose border-border/60 my-6 w-full overflow-x-auto rounded-xl border">
          <table
            className="w-full border-collapse text-sm"
            {...(themeAttr ? { 'data-theme': themeAttr } : {})}
          >
            {children}
          </table>
        </div>
      );
    },
    thead: ({ children }) => (
      <thead className="bg-muted/40 border-border border-b">{children}</thead>
    ),
    tr: ({ children }) => (
      <tr className="border-border/40 border-b last:border-0">{children}</tr>
    ),
    th: ({ children }) => (
      <th
        scope="col"
        className="text-foreground px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider"
      >
        {injectGlossary(children)}
      </th>
    ),
    td: ({ children }) => (
      <td className="text-foreground/90 px-4 py-2.5 align-top">{injectGlossary(children)}</td>
    ),
    // strong / em renderers explicitly run injectGlossary on their text
    // children — without this, glossary terms wrapped in **bold** or _italic_
    // never get tooltipped because react-markdown delegates to these
    // function components before the parent <p>'s recursion can see inside.
    strong: ({ children }) => (
      <strong className="font-semibold">{injectGlossary(children)}</strong>
    ),
    em: ({ children }) => <em className="italic">{injectGlossary(children)}</em>,
    code: ({ className, children }) => {
      // Inline code only — widget fences are extracted before markdown runs.
      const isInline = !/language-/.test(className ?? '');
      if (isInline) {
        return (
          <code className="bg-muted text-foreground/90 rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            {children}
          </code>
        );
      }
      return <code className={`${className ?? ''} font-mono text-sm`}>{children}</code>;
    },
    pre: ({ children }) => (
      <pre className="bg-muted my-6 overflow-x-auto rounded-xl p-4 text-sm">{children}</pre>
    ),
  };

  return (
    <div className="blog-content max-w-none">
      {segments.map((seg, idx) => {
        if (seg.type === 'markdown') {
          return (
            <ReactMarkdown
              key={`md-${idx}`}
              components={components}
              remarkPlugins={[remarkGfm, remarkTableThemes]}
              rehypePlugins={[rehypeSlug]}
              urlTransform={preserveCustomProtocols}
            >
              {seg.body}
            </ReactMarkdown>
          );
        }
        // Widgets fetch live data (best-days, stats, etc.); wrap each in its own
        // Suspense so an uncached fetch streams without blocking the prerender shell.
        return (
          <Suspense key={`w-${idx}`} fallback={null}>
            {renderWidget(seg.widget!, seg.body, { parkMap, attractionMap, locale })}
          </Suspense>
        );
      })}
    </div>
  );
}

function renderWidget(
  widget: { name: string; attrs: Record<string, string> },
  body: string,
  ctx: {
    parkMap: Map<string, ResolvedPark | null>;
    attractionMap: Map<
      string,
      { park: ResolvedPark | null; attraction: ResolvedAttraction | null }
    >;
    locale: Locale;
  }
): React.ReactNode {
  const { name, attrs } = widget;
  if (name === 'park-widget') {
    const slug = attrs.slug;
    if (!slug) return null;
    const park = ctx.parkMap.get(slug) ?? null;
    return <BlogParkWidget park={park} slug={slug} />;
  }
  if (name === 'map-widget') {
    const slug = attrs.slug;
    if (!slug) return null;
    const park = ctx.parkMap.get(slug) ?? null;
    return <BlogMapWidget park={park} slug={slug} />;
  }
  if (name === 'weather-widget') {
    const slug = attrs.slug;
    if (!slug) return null;
    const park = ctx.parkMap.get(slug) ?? null;
    return <BlogWeatherWidget park={park} slug={slug} />;
  }
  if (name === 'best-days-widget') {
    const slug = attrs.slug;
    if (!slug) return null;
    const park = ctx.parkMap.get(slug) ?? null;
    return <BlogBestDaysWidget park={park} slug={slug} />;
  }
  if (name === 'stats-widget') {
    const slug = attrs.slug;
    if (!slug) return null;
    const park = ctx.parkMap.get(slug) ?? null;
    return <BlogStatsWidget park={park} slug={slug} />;
  }
  if (name === 'attraction-widget') {
    const parkSlug = attrs.parkSlug ?? attrs.park;
    const slug = attrs.slug;
    if (!parkSlug || !slug) return null;
    const data = ctx.attractionMap.get(`${parkSlug}/${slug}`);
    return (
      <BlogAttractionWidget
        park={data?.park ?? null}
        attraction={data?.attraction ?? null}
        parkSlug={parkSlug}
        attractionSlug={slug}
      />
    );
  }
  if (name === 'glossary-widget') {
    const slug = attrs.slug ?? attrs.term ?? attrs.id;
    if (!slug) return null;
    return <BlogGlossaryWidget slug={slug} locale={ctx.locale} />;
  }
  if (name === 'gallery-widget') {
    // Prefer a folder reference if one was passed via attrs; otherwise parse
    // the line-based body. The folder form is the recommended shape since it
    // requires no manual file listing and picks up captions.json overrides.
    const folder = attrs.folder ?? attrs.dir ?? attrs.path;
    const images = folder ? listFolderImages(folder) : parseGalleryBody(body);
    if (images.length === 0) return null;
    return <BlogGallery images={images} heading={attrs.heading} />;
  }
  return null;
}

/**
 * Parse a gallery code-fence body into BlogImage[].
 *
 * Accepts simple line-based format — one image per line:
 *
 *   - /path/to.jpg
 *   - /path/to.jpg | Alt text
 *   - /path/to.jpg | Alt text | Caption
 *   - /path/to.jpg | Alt text | Caption | © Credit
 *
 * Lines starting with attribute keys (heading=, slug=) are ignored — they were
 * already consumed as widget attrs by parseAttrs().
 */
function parseGalleryBody(body: string): BlogImage[] {
  const images: BlogImage[] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[a-zA-Z][a-zA-Z0-9_-]*\s*[:=]/.test(line) && !line.startsWith('-')) continue;
    const stripped = line.replace(/^-\s*/, '').trim();
    if (!stripped) continue;
    const [src, alt, caption, credit] = stripped.split('|').map((s) => s.trim());
    if (!src) continue;
    images.push({
      src,
      alt: alt || undefined,
      caption: caption || undefined,
      credit: credit || undefined,
    });
  }
  return images;
}
