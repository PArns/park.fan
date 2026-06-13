import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';
import { createResolveCache, eventToElement, pickClosestByCoords } from '../_lib/chip-utils';
import { widgetLabel, widgetTagLabel, WIDGET_NAMES } from '../_lib/widgets';

/**
 * Renders a card-style block preview *next to* each widget code fence in the
 * editor so authors see what their `park-widget`, `attraction-widget`, etc.
 * will look like at publish time. The empty fence body still owns the
 * document state — we only add a decoration; the user can still edit it.
 */

interface ResolvedData {
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
  backgroundImage?: string | null;
  avgWaitTime?: number | null;
  operatingAttractions?: number | null;
  totalAttractions?: number | null;
}

const cache = createResolveCache<ResolvedData>();

interface WidgetSpan {
  /** End position of the code-fence node — where the decoration is anchored. */
  pos: number;
  /** Fence info string (e.g. `park-widget`, `attraction-widget`). */
  name: string;
  /** Parsed attribute map from both the language string and the fence body. */
  attrs: Record<string, string>;
  /** Pre-computed `refValue` for the resolve-ref endpoint, when applicable. */
  refValue?: string;
}

const ATTR_RE = /\b([a-zA-Z][a-zA-Z0-9_-]*)\s*[:=]\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;

function parseAttrs(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of source.split(/\r?\n/)) {
    let m: RegExpExecArray | null;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(line)) !== null) {
      out[m[1]] = (m[2] ?? m[3] ?? m[4] ?? '').trim();
    }
  }
  return out;
}

function collectWidgets(doc: PMNode): WidgetSpan[] {
  const spans: WidgetSpan[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'codeBlock') return;
    const lang = (node.attrs as { language?: string }).language ?? '';
    // tiptap stores the fence info string in `language`. It can include
    // trailing attrs (e.g. `park-widget slug=phantasialand`) so split first.
    const firstSpace = lang.indexOf(' ');
    const name = (firstSpace === -1 ? lang : lang.slice(0, firstSpace)).trim();
    if (!WIDGET_NAMES.has(name)) return;
    const attrSource = `${lang.slice(name.length)}\n${node.textContent ?? ''}`;
    const attrs = parseAttrs(attrSource);
    let refValue: string | undefined;
    if (name === 'attraction-widget' && attrs.parkSlug && attrs.slug) {
      refValue = `${attrs.parkSlug}/${attrs.slug}`;
    } else if (attrs.slug && name !== 'glossary-widget' && name !== 'gallery-widget') {
      refValue = attrs.slug;
    }
    spans.push({ pos: pos + node.nodeSize, name, attrs, refValue });
  });
  return spans;
}

function buildWidgetCard(span: WidgetSpan): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = `widget-preview widget-preview--${span.name}`;
  wrapper.contentEditable = 'false';

  const header = document.createElement('div');
  header.className = 'widget-preview__header';
  const tag = document.createElement('span');
  tag.className = 'widget-preview__tag';
  tag.textContent = widgetTagLabel(span.name);
  header.appendChild(tag);

  const attrsSummary = document.createElement('span');
  attrsSummary.className = 'widget-preview__attrs';
  const summary: string[] = [];
  if (span.attrs.slug) summary.push(`slug=${span.attrs.slug}`);
  if (span.attrs.parkSlug) summary.push(`parkSlug=${span.attrs.parkSlug}`);
  if (span.attrs.folder) summary.push(`folder=${span.attrs.folder}`);
  if (span.attrs.heading) summary.push(`heading=${span.attrs.heading}`);
  attrsSummary.textContent = summary.join(' · ');
  header.appendChild(attrsSummary);
  wrapper.appendChild(header);

  const body = document.createElement('div');
  body.className = 'widget-preview__body';

  if (!span.refValue) {
    body.classList.add('widget-preview__body--hint');
    if (span.name === 'gallery-widget') {
      body.textContent = `Gallery${span.attrs.heading ? ` · ${span.attrs.heading}` : ''}${
        span.attrs.folder ? ` · ${span.attrs.folder}` : ''
      }`;
    } else if (span.name === 'glossary-widget') {
      body.textContent = `Glossary term · ${
        span.attrs.slug ?? span.attrs.term ?? span.attrs.id ?? '(not set)'
      }`;
    } else if (Object.keys(span.attrs).length === 0) {
      // Most likely the author wrote ```park-widget slug=phantasialand``` on
      // one line — TipTap drops everything after the first space. Nudge them
      // toward the body-attr form the editor preserves.
      body.textContent = 'Missing slug. Put attrs on their own lines:\nslug: phantasialand';
    } else {
      body.textContent = `Missing slug for ${widgetLabel(span.name)}`;
    }
    wrapper.appendChild(body);
    return wrapper;
  }

  const entry = cache.get(span.refValue);
  if (!entry || entry.state === 'loading') {
    const dot = document.createElement('span');
    dot.className = 'ref-preview-spinner';
    body.appendChild(dot);
    wrapper.appendChild(body);
    return wrapper;
  }
  if (entry.state === 'failed' || !entry.data.found) {
    body.classList.add('widget-preview__body--failed');
    body.textContent = `Could not resolve ${span.refValue}`;
    wrapper.appendChild(body);
    return wrapper;
  }

  const data = entry.data;
  if (data.backgroundImage) {
    const bg = document.createElement('div');
    bg.className = 'widget-preview__bg';
    bg.style.backgroundImage = `url(${data.backgroundImage})`;
    wrapper.appendChild(bg);
  }

  const title = document.createElement('div');
  title.className = 'widget-preview__title';
  title.textContent = data.name ?? span.refValue;
  body.appendChild(title);

  const sub = document.createElement('div');
  sub.className = 'widget-preview__sub';
  if (data.kind === 'park') {
    sub.textContent = `${data.city ?? ''}${data.country ? `, ${data.country}` : ''}`;
  } else {
    sub.textContent = [data.parkName, data.parkCity, data.country].filter(Boolean).join(' · ');
  }
  body.appendChild(sub);

  wrapper.appendChild(body);
  return wrapper;
}

function buildDecorations(doc: PMNode, spans: WidgetSpan[]): DecorationSet {
  const decorations: Decoration[] = [];
  for (const span of spans) {
    const entry = span.refValue ? cache.get(span.refValue) : undefined;
    const stateKey = entry ? entry.state : span.refValue ? 'unset' : 'static';
    decorations.push(
      Decoration.widget(span.pos, () => buildWidgetCard(span), {
        side: 1,
        key: `widget-preview:${span.name}:${span.refValue ?? Object.values(span.attrs).join(',')}:${stateKey}`,
      })
    );
  }
  return DecorationSet.create(doc, decorations);
}

interface PluginState {
  decorations: DecorationSet;
  spans: WidgetSpan[];
}

const widgetPreviewKey = new PluginKey<PluginState>('widgetPreview');

export const WidgetPreview = Extension.create({
  name: 'widgetPreview',
  addProseMirrorPlugins() {
    return [
      new Plugin<PluginState>({
        key: widgetPreviewKey,
        state: {
          init(_, state) {
            const spans = collectWidgets(state.doc);
            return { spans, decorations: buildDecorations(state.doc, spans) };
          },
          apply(tr, prev, _old, newState) {
            const refresh = tr.getMeta(widgetPreviewKey) === 'refresh';
            if (!tr.docChanged && !refresh) {
              return {
                spans: prev.spans,
                decorations: prev.decorations.map(tr.mapping, tr.doc),
              };
            }
            const spans = collectWidgets(newState.doc);
            return { spans, decorations: buildDecorations(newState.doc, spans) };
          },
        },
        view(view) {
          const trigger = () => {
            const s = widgetPreviewKey.getState(view.state);
            if (!s) return;
            for (const span of s.spans) {
              if (!span.refValue) continue;
              cache.ensure(span.refValue, () => {
                if (view.isDestroyed) return;
                view.dispatch(view.state.tr.setMeta(widgetPreviewKey, 'refresh'));
              });
            }
          };
          trigger();
          return {
            update(updatedView, prevState) {
              if (updatedView.state.doc !== prevState.doc) trigger();
            },
          };
        },
        props: {
          decorations(state) {
            return widgetPreviewKey.getState(state)?.decorations;
          },
          handleClick(view, _clickPos, event) {
            const chip = eventToElement(event)?.closest('.widget-preview') as HTMLElement | null;
            if (!chip) return false;
            const state = widgetPreviewKey.getState(view.state);
            const spans = state?.spans ?? [];
            const name = Array.from(chip.classList)
              .find((c) => c.startsWith('widget-preview--'))
              ?.replace('widget-preview--', '');
            if (!name) return false;
            const matches = spans.filter((s) => s.name === name);
            const pick = pickClosestByCoords(chip, matches, view, (s) => s.pos);
            if (!pick) return false;
            // The widget decoration anchors at the END of the codeBlock
            // node (`pos: pos + node.nodeSize` in collectWidgets). The
            // codeBlock node itself starts at pos - nodeSize. We compute the
            // node's start/end by walking the doc from the anchor backwards
            // until we find a codeBlock whose end matches `pick.pos`.
            const doc = view.state.doc;
            let nodeFrom = -1;
            let nodeTo = -1;
            doc.descendants((node, pos) => {
              if (node.type.name !== 'codeBlock') return;
              if (pos + node.nodeSize === pick.pos) {
                nodeFrom = pos;
                nodeTo = pos + node.nodeSize;
                return false;
              }
            });
            if (nodeFrom < 0) return false;
            event.preventDefault();
            const rect = chip.getBoundingClientRect();
            window.dispatchEvent(
              new CustomEvent('parkfan-selection', {
                detail: {
                  kind: 'widget',
                  name: pick.name,
                  attrs: pick.attrs,
                  nodeFrom,
                  nodeTo,
                  pos: nodeFrom,
                  rect: {
                    top: rect.top,
                    bottom: rect.bottom,
                    left: rect.left,
                    right: rect.right,
                  },
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
