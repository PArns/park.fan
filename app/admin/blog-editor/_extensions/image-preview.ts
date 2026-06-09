import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';
import { eventToElement, pickClosestByCoords } from '../_lib/chip-utils';
import { getPendingImage } from '../_lib/pending-images';

/**
 * Visual + selection layer for inline images.
 *
 * The published renderer encodes presentation into the markdown alt string:
 *
 *   ![Alt text | Caption | align | size](src)
 *
 *   align ∈ left | right | center | wide   (defaults to center)
 *   size  ∈ small | medium | large         (optional override)
 *
 * In the editor we honour the same syntax: parse the alt parts, set
 * data-align / data-size attributes on the rendered `<img>` via a node
 * decoration so CSS can float/center it, and dispatch a parkfan-selection
 * event on click so the PropertiesPanel can offer an inline editor.
 */

export type ImageAlign = 'center' | 'left' | 'right' | 'wide';
export type ImageSize = 'small' | 'medium' | 'large' | undefined;

export interface ParsedImageAlt {
  alt: string;
  caption?: string;
  align: ImageAlign;
  size?: ImageSize;
}

export function parseImageAlt(raw: string): ParsedImageAlt {
  const parts = (raw ?? '').split('|').map((s) => s.trim());
  const align = normaliseAlign(parts[2]);
  const size = normaliseSize(parts[3]);
  return {
    alt: parts[0] ?? '',
    caption: parts[1] || undefined,
    align,
    size,
  };
}

export function serialiseImageAlt(parts: ParsedImageAlt): string {
  // Trim trailing empty segments so we don't emit `Alt | | center` when the
  // caption is empty. Always keep at least `alt`.
  const out: string[] = [
    parts.alt,
    parts.caption ?? '',
    parts.align,
    parts.size ?? '',
  ];
  while (out.length > 1 && out[out.length - 1] === '') out.pop();
  return out.join(' | ').replace(/\s+\|/g, ' |').replace(/\|\s+/g, '| ');
}

function normaliseAlign(value: string | undefined): ImageAlign {
  const v = (value ?? '').toLowerCase();
  if (v === 'left' || v === 'right' || v === 'wide' || v === 'center') return v;
  return 'center';
}
function normaliseSize(value: string | undefined): ImageSize {
  const v = (value ?? '').toLowerCase();
  if (v === 'small' || v === 'medium' || v === 'large') return v;
  return undefined;
}

interface ImageSpan {
  pos: number;
  src: string;
  parsed: ParsedImageAlt;
}

function collectImages(doc: PMNode): ImageSpan[] {
  const out: ImageSpan[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'image') return;
    const src = String(node.attrs.src ?? '');
    const alt = String(node.attrs.alt ?? '');
    out.push({ pos, src, parsed: parseImageAlt(alt) });
  });
  return out;
}

function buildCaptionDOM(caption: string, align: ImageAlign): HTMLElement {
  const node = document.createElement('span');
  node.className = `editor-img-caption editor-img-caption-align-${align}`;
  node.contentEditable = 'false';
  node.textContent = caption;
  return node;
}

function buildDecorations(doc: PMNode, spans: ImageSpan[]): DecorationSet {
  const decorations: Decoration[] = [];
  for (const s of spans) {
    // Freshly-uploaded images don't exist on disk yet — the bytes are staged
    // in the pending-images store until Save commits them. Point the
    // rendered <img> at the staging blob so the author sees the picture
    // instead of a broken thumbnail. The doc keeps the final public path.
    const staged = getPendingImage(s.src);
    decorations.push(
      Decoration.node(s.pos, s.pos + 1, {
        class: [
          'editor-img',
          `editor-img-align-${s.parsed.align}`,
          s.parsed.size ? `editor-img-size-${s.parsed.size}` : '',
        ]
          .filter(Boolean)
          .join(' '),
        'data-align': s.parsed.align,
        ...(s.parsed.size ? { 'data-size': s.parsed.size } : {}),
        ...(staged ? { src: staged.objectUrl } : {}),
      })
    );
    // Caption widget — sits right after the image so it floats with the same
    // alignment column. Empty captions skip the widget entirely.
    if (s.parsed.caption) {
      decorations.push(
        Decoration.widget(
          s.pos + 1,
          () => buildCaptionDOM(s.parsed.caption ?? '', s.parsed.align),
          {
            side: 1,
            key: `image-caption:${s.pos}:${s.parsed.caption}:${s.parsed.align}`,
          }
        )
      );
    }
  }
  return DecorationSet.create(doc, decorations);
}

interface PluginState {
  decorations: DecorationSet;
  spans: ImageSpan[];
}

const imagePreviewKey = new PluginKey<PluginState>('imagePreview');

export const ImagePreview = Extension.create({
  name: 'imagePreview',
  addProseMirrorPlugins() {
    return [
      new Plugin<PluginState>({
        key: imagePreviewKey,
        state: {
          init(_, state) {
            const spans = collectImages(state.doc);
            return { spans, decorations: buildDecorations(state.doc, spans) };
          },
          apply(tr, prev, _old, newState) {
            if (!tr.docChanged) {
              return {
                spans: prev.spans,
                decorations: prev.decorations.map(tr.mapping, tr.doc),
              };
            }
            const spans = collectImages(newState.doc);
            return { spans, decorations: buildDecorations(newState.doc, spans) };
          },
        },
        props: {
          decorations(state) {
            return imagePreviewKey.getState(state)?.decorations;
          },
          handleClick(view, _clickPos, event) {
            const img = eventToElement(event)?.closest('img') as
              | HTMLImageElement
              | null;
            if (!img) return false;
            // Find the span matching this <img> by src. When the same image is
            // used twice, disambiguate by hypot(Δx, Δy) so the closer instance
            // wins even when both share a line.
            const state = imagePreviewKey.getState(view.state);
            const spans = state?.spans ?? [];
            const src = img.getAttribute('src') ?? '';
            const matches = spans.filter((s) => s.src === src);
            const pick = pickClosestByCoords(img, matches, view, (s) => s.pos);
            if (!pick) return false;
            event.preventDefault();
            const rect = img.getBoundingClientRect();
            window.dispatchEvent(
              new CustomEvent('parkfan-selection', {
                detail: {
                  kind: 'image',
                  pos: pick.pos,
                  src: pick.src,
                  alt: pick.parsed.alt,
                  caption: pick.parsed.caption ?? '',
                  align: pick.parsed.align,
                  size: pick.parsed.size,
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
