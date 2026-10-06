import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
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
 * The editor reads the same syntax into `data-align` and `data-size` decorations for CSS, and a
 * click dispatches `parkfan-selection` for the PropertiesPanel.
 */

type ImageAlign = 'center' | 'left' | 'right' | 'wide';
type ImageSize = 'small' | 'medium' | 'large' | undefined;

interface ParsedImageAlt {
  alt: string;
  caption?: string;
  align: ImageAlign;
  size?: ImageSize;
}

/**
 * Splits a markdown image alt string `Alt | Caption | align | size` into its parts. Unknown align
 * falls back to `center`, unknown size to none.
 */
function parseImageAlt(raw: string): ParsedImageAlt {
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
    // A fresh upload is not on disk until Save, so the rendered img points at its staged blob;
    // the doc keeps the final public path.
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
    // Right after the image, so the caption floats in the same column.
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
            const img = eventToElement(event)?.closest('img') as HTMLImageElement | null;
            if (!img) return false;
            // The span is found by src, the closer one winning when an image is used twice. A
            // fresh upload renders through its staging blob URL, so that matches too.
            const state = imagePreviewKey.getState(view.state);
            const spans = state?.spans ?? [];
            const src = img.getAttribute('src') ?? '';
            const matches = spans.filter(
              (s) => s.src === src || getPendingImage(s.src)?.objectUrl === src
            );
            const pick = pickClosestByCoords(img, matches, view, (s) => s.pos);
            if (!pick) return false;
            event.preventDefault();
            // The caret goes right after the image, in its paragraph, so typing works next to a
            // floated image instead of landing wherever the selection last was.
            try {
              const afterImage = pick.pos + 1;
              if (afterImage <= view.state.doc.content.size) {
                const sel = TextSelection.create(view.state.doc, afterImage);
                view.dispatch(view.state.tr.setSelection(sel));
                view.focus();
              }
            } catch {
              /* selection placement is best-effort */
            }
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
