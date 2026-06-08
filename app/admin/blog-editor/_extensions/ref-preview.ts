import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';

/**
 * Live WYSIWYG preview for `[label](ref:…)` links — adds the same inline
 * annotation (city, country + live badge) that the published blog renderer
 * shows. The decoration sits to the right of the link span; ?bare suppresses
 * it (matches the renderer) and ?full hides it too because the spotlight card
 * is rendered as a whole block instead.
 *
 * Implementation note: data is fetched once per unique ref via a module-level
 * cache so jumping between locale tabs or remounting the editor doesn't
 * re-hit the API for refs already seen this session.
 */

interface RefData {
  kind: 'park' | 'ride';
  found: boolean;
  name?: string;
  city?: string;
  country?: string;
  parkName?: string;
  parkCity?: string;
  status?: string | null;
  crowdLevel?: string | null;
  waitTime?: number | null;
  avgWaitTime?: number | null;
  operatingAttractions?: number | null;
  totalAttractions?: number | null;
  backgroundImage?: string | null;
}

type CacheEntry = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; data: RefData };

const cache = new Map<string, CacheEntry>();

function fetchRef(refValue: string, onResolve: () => void) {
  if (cache.has(refValue)) return;
  cache.set(refValue, { state: 'loading' });
  fetch(`/api/admin/blog-editor/resolve-ref?ref=${encodeURIComponent(refValue)}`)
    .then((r) => (r.ok ? (r.json() as Promise<RefData>) : Promise.reject()))
    .then((data) => {
      cache.set(refValue, { state: 'ready', data });
    })
    .catch(() => {
      cache.set(refValue, { state: 'failed' });
    })
    .finally(() => {
      onResolve();
    });
}

interface RefSpan {
  from: number;
  to: number;
  refValue: string;
  options: Set<string>;
}

function parseRefHref(href: string): { value: string; options: Set<string> } | null {
  if (!href.startsWith('ref:')) return null;
  const rest = href.slice('ref:'.length);
  const qIdx = rest.indexOf('?');
  if (qIdx === -1) return { value: rest, options: new Set() };
  return {
    value: rest.slice(0, qIdx),
    options: new Set(
      rest
        .slice(qIdx + 1)
        .split('&')
        .map((s) => s.split('=')[0]?.toLowerCase() ?? '')
        .filter(Boolean)
    ),
  };
}

/**
 * Walk the doc and collect contiguous spans of text that share a single
 * ref: link href. ProseMirror splits link-marked text across multiple text
 * nodes for any internal style change, so we coalesce by neighbour position +
 * matching href to find the actual end of the link.
 */
function collectRefs(doc: PMNode): RefSpan[] {
  const raw: Array<{ from: number; to: number; href: string }> = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const link = node.marks.find(
      (m) =>
        m.type.name === 'link' &&
        typeof m.attrs.href === 'string' &&
        (m.attrs.href as string).startsWith('ref:')
    );
    if (!link) return;
    const href = link.attrs.href as string;
    const from = pos;
    const to = pos + node.nodeSize;
    const last = raw[raw.length - 1];
    if (last && last.to === from && last.href === href) {
      last.to = to;
    } else {
      raw.push({ from, to, href });
    }
  });
  const out: RefSpan[] = [];
  for (const r of raw) {
    const parsed = parseRefHref(r.href);
    if (!parsed) continue;
    out.push({ from: r.from, to: r.to, refValue: parsed.value, options: parsed.options });
  }
  return out;
}

function statusBadgeText(status: string | null | undefined): string | null {
  if (!status) return null;
  if (status === 'OPERATING') return null;
  return status.replace(/_/g, ' ').toLowerCase();
}

function buildBadgeDOM(span: RefSpan): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'ref-preview-badge';
  // Critical — without this PM will try to map editing into our injected DOM
  // and split text nodes oddly.
  wrapper.contentEditable = 'false';
  wrapper.setAttribute('data-ref', span.refValue);
  // handleClick reads these to jump the caret back into the underlying link
  // mark, which lights up the BubbleMenu's variant chips for editing.
  wrapper.setAttribute('data-from', String(span.from));
  wrapper.setAttribute('data-to', String(span.to));

  const entry = cache.get(span.refValue);
  if (!entry || entry.state === 'loading') {
    wrapper.classList.add('ref-preview-badge--loading');
    const dot = document.createElement('span');
    dot.className = 'ref-preview-spinner';
    wrapper.appendChild(dot);
    return wrapper;
  }
  if (entry.state === 'failed' || !entry.data.found) {
    wrapper.classList.add('ref-preview-badge--failed');
    wrapper.textContent = '· not found';
    return wrapper;
  }
  const data = entry.data;

  const location = document.createElement('span');
  location.className = 'ref-preview-location';
  if (data.kind === 'park') {
    location.textContent = `(${data.city}, ${data.country})`;
  } else {
    location.textContent = `(${data.parkName}, ${data.country})`;
  }
  wrapper.appendChild(location);

  // Live badge — wait time for rides, crowd level for parks, status when shut.
  const statusText = statusBadgeText(data.status);
  if (statusText) {
    const badge = document.createElement('span');
    badge.className = 'ref-preview-pill ref-preview-pill--status';
    badge.textContent = statusText;
    wrapper.appendChild(badge);
  } else if (data.kind === 'ride' && typeof data.waitTime === 'number') {
    const badge = document.createElement('span');
    badge.className = 'ref-preview-pill ref-preview-pill--wait';
    const clock = document.createElement('span');
    clock.className = 'ref-preview-clock';
    clock.textContent = '◷';
    badge.appendChild(clock);
    badge.appendChild(document.createTextNode(`${data.waitTime} min`));
    wrapper.appendChild(badge);
  } else if (data.kind === 'park' && data.crowdLevel) {
    const badge = document.createElement('span');
    badge.className = `ref-preview-pill ref-preview-pill--crowd ref-preview-pill--crowd-${data.crowdLevel.toLowerCase()}`;
    badge.textContent = data.crowdLevel.toLowerCase();
    wrapper.appendChild(badge);
  }

  return wrapper;
}

function buildSpotlightDOM(span: RefSpan): HTMLElement {
  // Outer container holds the "ATTRAKTION IM FOKUS" label + the card itself,
  // matching the BlogParkWidget / BlogAttractionWidget shape on the published
  // page (label above, glass-top card below with photo bleed).
  const container = document.createElement('div');
  container.className = 'ref-preview-spotlight';
  container.contentEditable = 'false';
  container.setAttribute('data-ref', span.refValue);
  container.setAttribute('data-from', String(span.from));
  container.setAttribute('data-to', String(span.to));

  const entry = cache.get(span.refValue);

  // Best-effort label even before the API responds: a slash in the ref value
  // means it's a ride (`parkSlug/rideSlug` or `/parks/.../park/ride`). Once the
  // data lands we narrow further based on the resolved kind.
  const isRideHint = span.refValue.includes('/parks/')
    ? span.refValue.split('/').filter(Boolean).length >= 5
    : span.refValue.includes('/');
  const kindLabel = document.createElement('div');
  kindLabel.className = 'ref-preview-spotlight__label';
  if (entry && entry.state === 'ready' && entry.data.found) {
    kindLabel.textContent =
      entry.data.kind === 'ride' ? 'Attraction in focus' : 'Park spotlight';
  } else {
    kindLabel.textContent = isRideHint ? 'Attraction in focus' : 'Park spotlight';
  }
  container.appendChild(kindLabel);

  const card = document.createElement('div');
  card.className = 'ref-preview-spotlight__card';
  container.appendChild(card);

  if (!entry || entry.state === 'loading') {
    card.classList.add('ref-preview-spotlight__card--loading');
    const dot = document.createElement('span');
    dot.className = 'ref-preview-spinner';
    card.appendChild(dot);
    return container;
  }
  if (entry.state === 'failed' || !entry.data.found) {
    card.classList.add('ref-preview-spotlight__card--failed');
    card.textContent = `Could not resolve ${span.refValue}`;
    return container;
  }
  const data = entry.data;
  container.setAttribute('data-kind', data.kind);

  // Photo layer (z-0) — covers the whole card; the glass panel sits on top.
  if (data.backgroundImage) {
    const photo = document.createElement('div');
    photo.className = 'ref-preview-spotlight__photo';
    photo.style.backgroundImage = `url(${data.backgroundImage})`;
    card.appendChild(photo);
    // Scrim mimicking pk-scrim-top/bot.
    const scrim = document.createElement('div');
    scrim.className = 'ref-preview-spotlight__scrim';
    card.appendChild(scrim);
  } else {
    card.classList.add('ref-preview-spotlight__card--no-photo');
  }

  // Favorite star ornament — purely decorative in the editor preview.
  const star = document.createElement('div');
  star.className = 'ref-preview-spotlight__star';
  star.textContent = '☆';
  card.appendChild(star);

  // Glass panel on top.
  const panel = document.createElement('div');
  panel.className = 'ref-preview-spotlight__panel';

  const name = document.createElement('div');
  name.className = 'ref-preview-spotlight__name';
  name.textContent = data.name ?? span.refValue;
  panel.appendChild(name);

  const location = document.createElement('div');
  location.className = 'ref-preview-spotlight__loc';
  const pin = document.createElement('span');
  pin.className = 'ref-preview-spotlight__pin';
  pin.textContent = '⌖';
  location.appendChild(pin);
  const locText = document.createElement('span');
  if (data.kind === 'park') {
    locText.textContent = `${data.city ?? ''}${data.country ? `, ${data.country}` : ''}`;
  } else {
    const parts = [data.parkName, data.parkCity, data.country].filter(Boolean);
    locText.textContent = parts.join(' · ');
  }
  location.appendChild(locText);
  panel.appendChild(location);

  // Badge row — the big status badge gets prominence, just like the published
  // card's GESCHLOSSEN / OPEN pill.
  const badges = document.createElement('div');
  badges.className = 'ref-preview-spotlight__badges';

  const statusText = statusBadgeText(data.status);
  if (statusText) {
    const pill = document.createElement('span');
    pill.className = 'ref-preview-spotlight__status ref-preview-spotlight__status--closed';
    const dot = document.createElement('span');
    dot.className = 'ref-preview-spotlight__status-dot';
    dot.textContent = '⊗';
    pill.appendChild(dot);
    pill.appendChild(document.createTextNode(statusText));
    badges.appendChild(pill);
  } else {
    const pill = document.createElement('span');
    pill.className = 'ref-preview-spotlight__status ref-preview-spotlight__status--open';
    pill.textContent = 'OPEN';
    badges.appendChild(pill);
  }
  if (data.kind === 'ride' && typeof data.waitTime === 'number') {
    const pill = document.createElement('span');
    pill.className = 'ref-preview-pill ref-preview-pill--wait';
    pill.textContent = `${data.waitTime} min wait`;
    badges.appendChild(pill);
  } else if (data.kind === 'park' && data.crowdLevel) {
    const pill = document.createElement('span');
    pill.className = `ref-preview-pill ref-preview-pill--crowd ref-preview-pill--crowd-${data.crowdLevel.toLowerCase()}`;
    pill.textContent = data.crowdLevel.toLowerCase();
    badges.appendChild(pill);
  }
  if (data.kind === 'park' && typeof data.avgWaitTime === 'number') {
    const pill = document.createElement('span');
    pill.className = 'ref-preview-pill ref-preview-pill--avg';
    pill.textContent = `⌀ ${data.avgWaitTime} min`;
    badges.appendChild(pill);
  }
  if (
    data.kind === 'park' &&
    typeof data.operatingAttractions === 'number' &&
    typeof data.totalAttractions === 'number'
  ) {
    const pill = document.createElement('span');
    pill.className = 'ref-preview-pill ref-preview-pill--ops';
    pill.textContent = `${data.operatingAttractions}/${data.totalAttractions} open`;
    badges.appendChild(pill);
  }
  panel.appendChild(badges);

  card.appendChild(panel);
  return container;
}

function buildDecorations(doc: PMNode, spans: RefSpan[]): DecorationSet {
  const decorations: Decoration[] = [];
  for (const span of spans) {
    // ?bare suppresses the annotation entirely (matches the published renderer).
    if (span.options.has('bare')) continue;
    // The key MUST encode the resolution state — otherwise PM reuses the
    // loading-spinner DOM after the fetch resolves and the badge never
    // updates to "(City, Country)".
    const entry = cache.get(span.refValue);
    const stateKey = entry ? entry.state : 'unset';
    const optKey = [...span.options].sort().join(',');
    const full = span.options.has('full');
    decorations.push(
      Decoration.widget(
        span.to,
        () => (full ? buildSpotlightDOM(span) : buildBadgeDOM(span)),
        {
          side: 1,
          key: `ref-preview:${full ? 'spot' : 'inline'}:${span.refValue}:${optKey}:${stateKey}`,
        }
      )
    );
  }
  return DecorationSet.create(doc, decorations);
}

interface PluginState {
  decorations: DecorationSet;
  spans: RefSpan[];
}

const refPreviewKey = new PluginKey<PluginState>('refPreview');

export const RefPreview = Extension.create({
  name: 'refPreview',
  addProseMirrorPlugins() {
    return [
      new Plugin<PluginState>({
        key: refPreviewKey,
        state: {
          init(_, state) {
            const spans = collectRefs(state.doc);
            return { spans, decorations: buildDecorations(state.doc, spans) };
          },
          apply(tr, prev, _old, newState) {
            const refresh = tr.getMeta(refPreviewKey) === 'refresh';
            if (!tr.docChanged && !refresh) {
              return {
                spans: prev.spans,
                decorations: prev.decorations.map(tr.mapping, tr.doc),
              };
            }
            const spans = collectRefs(newState.doc);
            return { spans, decorations: buildDecorations(newState.doc, spans) };
          },
        },
        view(view) {
          const triggerFetches = () => {
            const s = refPreviewKey.getState(view.state);
            if (!s) return;
            for (const span of s.spans) {
              // ?bare suppresses any preview, so skip the fetch. ?full DOES
              // need the data — that's the spotlight card.
              if (span.options.has('bare')) continue;
              if (cache.has(span.refValue)) continue;
              fetchRef(span.refValue, () => {
                if (view.isDestroyed) return;
                view.dispatch(view.state.tr.setMeta(refPreviewKey, 'refresh'));
              });
            }
          };
          triggerFetches();
          return {
            update(updatedView, prevState) {
              if (updatedView.state.doc !== prevState.doc) triggerFetches();
            },
          };
        },
        props: {
          decorations(state) {
            return refPreviewKey.getState(state)?.decorations;
          },
          handleClick(view, _pos, event) {
            const target = event.target as HTMLElement | null;
            const chip = target?.closest(
              '.ref-preview-badge, .ref-preview-spotlight, .tiptap-canvas a[href^="ref:"]'
            ) as HTMLElement | null;
            if (!chip) return false;
            // For decoration chips we stashed the link range on the DOM; for
            // a click on the actual <a> we infer it from the link mark at the
            // click position.
            let from = Number.parseInt(chip.getAttribute('data-from') ?? '', 10);
            let to = Number.parseInt(chip.getAttribute('data-to') ?? '', 10);
            let href = chip.getAttribute('data-ref')
              ? `ref:${chip.getAttribute('data-ref')}`
              : '';
            if (Number.isNaN(from) || Number.isNaN(to)) {
              const $pos = view.state.doc.resolve(_pos);
              const linkMark = $pos.marks().find((m) => m.type.name === 'link');
              if (!linkMark) return false;
              href = String(linkMark.attrs.href ?? '');
              if (!href.startsWith('ref:')) return false;
              // Walk the textblock to find the contiguous link range.
              const parent = $pos.parent;
              let start = $pos.start();
              let end = $pos.start();
              parent.content.forEach((node, offset) => {
                const nodeFrom = $pos.start() + offset;
                const nodeTo = nodeFrom + node.nodeSize;
                if (nodeTo <= _pos) return;
                if (
                  node.marks.find(
                    (m) => m.type.name === 'link' && m.attrs.href === href
                  )
                ) {
                  if (start === end) start = nodeFrom;
                  end = nodeTo;
                }
              });
              from = start;
              to = end;
            }
            event.preventDefault();
            const sel = TextSelection.create(view.state.doc, from, to);
            view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
            view.focus();
            // Fire a window event the canvas listens for, with the chip rect
            // so the popover can position itself near what was clicked.
            const rect = chip.getBoundingClientRect();
            window.dispatchEvent(
              new CustomEvent('parkfan-ref-edit', {
                detail: {
                  from,
                  to,
                  href,
                  rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
                },
              })
            );
            return true;
          },
        },
      }),
    ];
  },
});
