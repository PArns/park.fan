import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';
import { parseInstagram, parseSuno, parseYouTube } from '@/lib/blog/embeds';

/**
 * Inline chip showing what each bare embed URL (YouTube/Instagram/Suno on a
 * line by itself) will render as at publish time — a small labeled card with
 * provider + extracted id. Authors get a visible cue that the line isn't just
 * "a link" but a recognised embed.
 */

type EmbedKind = 'youtube' | 'instagram' | 'suno';

interface EmbedSpan {
  pos: number;
  kind: EmbedKind;
  label: string;
  href: string;
}

function detect(href: string): { kind: EmbedKind; label: string } | null {
  const yt = parseYouTube(href);
  if (yt) return { kind: 'youtube', label: `id ${yt.id}${yt.start ? ` · ${yt.start}s` : ''}` };
  const ig = parseInstagram(href);
  if (ig) {
    const path = new URL(ig.url).pathname.replace(/\/+$/, '');
    return { kind: 'instagram', label: path.slice(1) };
  }
  const su = parseSuno(href);
  if (su) return { kind: 'suno', label: `id ${su.id.slice(0, 8)}…` };
  return null;
}

function collectEmbeds(doc: PMNode): EmbedSpan[] {
  const out: EmbedSpan[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'paragraph') return;
    // Walk children; only consider paragraphs whose single child is a text or
    // link that holds exactly one URL with no surrounding prose.
    const child = node.firstChild;
    if (!child || node.childCount !== 1) return;
    const text = (child.text ?? '').trim();
    if (!text || /\s/.test(text)) return;
    const linkMark = child.marks.find((m) => m.type.name === 'link');
    const href = (linkMark?.attrs.href as string | undefined) ?? text;
    const hit = detect(href);
    if (!hit) return;
    out.push({ pos: pos + node.nodeSize, kind: hit.kind, label: hit.label, href });
  });
  return out;
}

function buildChip(span: EmbedSpan): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = `embed-preview embed-preview--${span.kind}`;
  wrapper.contentEditable = 'false';

  const tag = document.createElement('span');
  tag.className = 'embed-preview__tag';
  tag.textContent = span.kind === 'youtube' ? 'YouTube' : span.kind === 'instagram' ? 'Instagram' : 'Suno';
  wrapper.appendChild(tag);

  const label = document.createElement('span');
  label.className = 'embed-preview__label';
  label.textContent = span.label;
  wrapper.appendChild(label);

  return wrapper;
}

function buildDecorations(doc: PMNode, spans: EmbedSpan[]): DecorationSet {
  const decorations = spans.map((span) =>
    Decoration.widget(span.pos, () => buildChip(span), {
      side: 1,
      key: `embed-preview:${span.kind}:${span.href}`,
    })
  );
  return DecorationSet.create(doc, decorations);
}

interface PluginState {
  decorations: DecorationSet;
  spans: EmbedSpan[];
}

const embedPreviewKey = new PluginKey<PluginState>('embedPreview');

export const EmbedPreview = Extension.create({
  name: 'embedPreview',
  addProseMirrorPlugins() {
    return [
      new Plugin<PluginState>({
        key: embedPreviewKey,
        state: {
          init(_, state) {
            const spans = collectEmbeds(state.doc);
            return { spans, decorations: buildDecorations(state.doc, spans) };
          },
          apply(tr, prev, _old, newState) {
            if (!tr.docChanged) {
              return {
                spans: prev.spans,
                decorations: prev.decorations.map(tr.mapping, tr.doc),
              };
            }
            const spans = collectEmbeds(newState.doc);
            return { spans, decorations: buildDecorations(newState.doc, spans) };
          },
        },
        props: {
          decorations(state) {
            return embedPreviewKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});
