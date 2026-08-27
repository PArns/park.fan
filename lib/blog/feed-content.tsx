import 'server-only';
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SITE_URL, type Locale } from '@/i18n/config';
import { versionedPath } from '@/lib/media/focus';
import { parseRefKey, parseRefOptions, resolvePark } from './park-resolver';

/**
 * A post's markdown body, rendered as the standalone HTML a feed reader will
 * show — `content:encoded`, offline, in a client that has no JavaScript, no
 * stylesheet and no access to this app.
 *
 * That last part is what shapes every decision here. Three things in a post
 * body only mean something inside the site, and each is handled rather than
 * shipped broken:
 *
 *   - **Widget fences** are live tables. A feed item is archived by the reader
 *     the moment it arrives and never re-fetched, so rendering today's numbers
 *     into one freezes them in every subscriber's client forever — the same
 *     mistake as typing a wait time into a post, which is why the fences exist
 *     in the first place. They are replaced by a link to the live table.
 *   - **`ref:` links** are `ref:efteling/baron-1898`, a protocol only this app
 *     resolves; anywhere else it is a dead href. Resolved here against the geo
 *     structure — `resolvePark` only, never `resolveAttraction`, because a ride
 *     URL is its park's href plus the slug and the attraction payload is 425 KB
 *     of data no feed renders.
 *   - **Relative paths** resolve against the reader's host, not ours.
 *
 * The site's own renderer is deliberately not reused. It returns Tailwind-classed
 * React components, hover cards and client widgets; a feed wants `<p>`, `<h2>`,
 * `<figure>`. Same parser (react-markdown + remark-gfm, the direct dependencies),
 * different components map.
 */

/** Everything the site's renderer treats as a live widget: ```<name>-widget. */
const WIDGET_FENCE = /^```([a-z][a-z0-9-]*-widget)(?:[ \t]+([^\n`]+))?\n([\s\S]*?)\n?```$/gm;

/**
 * What the link replacing a widget says. Two kinds, because they fail
 * differently: a gallery frozen into a feed is merely incomplete, a wait-time
 * table frozen into a feed is wrong.
 */
const WIDGET_LABEL: Record<Locale, { live: string; gallery: string }> = {
  de: { live: 'Live-Daten – im Artikel ansehen', gallery: 'Bildergalerie – im Artikel ansehen' },
  en: { live: 'Live data — see the article', gallery: 'Photo gallery — see the article' },
  nl: { live: 'Live data — bekijk het artikel', gallery: 'Fotogalerij — bekijk het artikel' },
  fr: { live: 'Données en direct — voir l’article', gallery: 'Galerie photo — voir l’article' },
  es: { live: 'Datos en vivo — ver el artículo', gallery: 'Galería de fotos — ver el artículo' },
  it: { live: 'Dati in tempo reale — leggi l’articolo', gallery: 'Galleria — leggi l’articolo' },
};

/**
 * Swap every widget fence for a link back to the post, in place.
 *
 * In place, and one per fence, because the prose around a widget refers to it
 * ("the table below", "ab Mittag etwa die Hälfte"). Collecting them into a
 * single note at the end would leave those sentences pointing at nothing.
 */
function replaceWidgetFences(markdown: string, locale: Locale, postUrl: string): string {
  const labels = WIDGET_LABEL[locale] ?? WIDGET_LABEL.en;
  return markdown.replace(WIDGET_FENCE, (_match, name: string) => {
    const label = name === 'gallery-widget' ? labels.gallery : labels.live;
    return `> [${label}](${postUrl})\n`;
  });
}

/** Absolute, so a reader on another host resolves it against park.fan. */
function absolute(url: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return url;
}

/**
 * Resolve every `ref:` / `park:` / `attraction:` href in the body to a real URL.
 *
 * One pass up front rather than a lookup per link: `resolvePark` is memoised
 * over a single geo fetch, so the whole map costs one request no matter how
 * many rides an article names.
 */
async function buildRefUrls(markdown: string, locale: Locale): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const hrefs = new Set<string>();
  for (const m of markdown.matchAll(/\]\(((?:ref|park|attraction):[^)\s]+)\)/g)) {
    hrefs.add(m[1]);
  }

  for (const href of hrefs) {
    const [scheme, rest] = [href.slice(0, href.indexOf(':')), href.slice(href.indexOf(':') + 1)];
    const { slug } = parseRefOptions(rest);
    const parsed =
      scheme === 'ref'
        ? parseRefKey(slug)
        : { kind: scheme === 'park' ? 'park' : 'ride', key: slug, geoPath: undefined };

    const parkSlug = parsed.kind === 'ride' ? parsed.key.split('/')[0] : parsed.key;
    const rideSlug = parsed.kind === 'ride' ? parsed.key.split('/').slice(1).join('/') : null;
    const park = await resolvePark(parkSlug, parsed.geoPath);
    // Unresolvable (a typo, or a park the API did not answer for): left out of
    // the map, and the renderer drops the anchor and keeps the label. A dead
    // `ref:` href in a subscriber's archive is worse than plain text.
    if (!park) continue;
    const path = rideSlug ? `${park.href}/${rideSlug}` : park.href;
    out.set(href, `${SITE_URL}/${locale}${path}`);
  }
  return out;
}

/**
 * Turn one post body into feed HTML.
 *
 * `postUrl` is the canonical URL of the post in this locale — the target every
 * widget link points at.
 */
export async function renderFeedContentHtml(
  markdown: string,
  { locale, postUrl }: { locale: Locale; postUrl: string }
): Promise<string> {
  const body = replaceWidgetFences(markdown, locale, postUrl);
  const refUrls = await buildRefUrls(body, locale);

  // react-markdown's default `urlTransform` drops any protocol it does not
  // recognise, and `ref:` is one — every entity link arrived at the component
  // below as `href=""`, so not one of them resolved and the feed shipped empty
  // anchors around live ride names. The site renderer has the same guard for
  // the same reason.
  const urlTransform = (url: string): string =>
    /^(ref|park|attraction):/.test(url) ? url : defaultUrlTransform(url);

  const components: Components = {
    a({ href, children }) {
      const raw = typeof href === 'string' ? href : '';
      if (/^(ref|park|attraction):/.test(raw)) {
        const resolved = refUrls.get(raw);
        // Unresolved: the label survives, the dead protocol does not.
        return resolved ? <a href={resolved}>{children}</a> : <>{children}</>;
      }
      // `/blog/<slug>` is written without a locale in the bodies; the feed is
      // per-locale, so it belongs in this locale's tree.
      const localized = /^\/blog\//.test(raw) ? `/${locale}${raw}` : raw;
      return <a href={absolute(localized)}>{children}</a>;
    },
    p({ node, children }) {
      // Markdown wraps a lone image in a paragraph, and the img renderer below
      // turns a captioned one into a <figure> — which a <p> may not contain, so
      // a browser closes the paragraph early and the caption lands outside it.
      //
      // The decision reads the source node, not the rendered children: with a
      // `components` map react-markdown builds the child element with the
      // *component* as its type, so the <figure> does not exist yet when this
      // runs and a `child.type === 'figure'` test matches nothing.
      //
      // Unwrapped only when the paragraph holds nothing else; an image sitting
      // inside a sentence keeps its paragraph.
      const contents = (node?.children ?? []).filter(
        (child) => child.type !== 'text' || child.value.trim() !== ''
      );
      const onlyImages =
        contents.length > 0 &&
        contents.every((child) => child.type === 'element' && child.tagName === 'img');
      return onlyImages ? <>{children}</> : <p>{children}</p>;
    },
    img({ src, alt }) {
      if (typeof src !== 'string' || !src) return null;
      // Same authoring convention the site renderer reads:
      //   ![alt | caption | align | size](src)
      // Align and size describe a layout no feed reader has; the caption is
      // prose a reader should still get, so it becomes a <figcaption>.
      const parts = (typeof alt === 'string' ? alt : '').split('|').map((s) => s.trim());
      const imgAlt = parts[0] ?? '';
      const caption = parts[1] || undefined;
      // Versioned for the same reason every other media URL is: a reader caches
      // an image by its address, and a retargeted crop would otherwise keep the
      // old framing in every subscriber's client.
      const versioned = versionedPath(src) ?? src;
      // A feed reader has no next/image and no loader, so a plain <img> with an
      // absolute URL is the only thing it can render.
      // eslint-disable-next-line @next/next/no-img-element
      const img = <img src={absolute(versioned)} alt={imgAlt} />;
      return caption ? (
        <figure>
          {img}
          <figcaption>{caption}</figcaption>
        </figure>
      ) : (
        img
      );
    },
  };

  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
      {body}
    </ReactMarkdown>
  );
}
