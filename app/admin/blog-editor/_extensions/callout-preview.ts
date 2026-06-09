import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';

/**
 * WYSIWYG layer for GitHub-style alert callouts:
 *
 *     > [!NOTE]
 *     > Useful context the reader shouldn't skip.
 *
 * The doc keeps the plain blockquote + `[!TYPE]` marker text (perfect GFM
 * round-trip, renders sensibly on GitHub too) — this plugin only decorates:
 * the blockquote gets a coloured `editor-callout--<type>` class matching the
 * published blog's box, and the marker itself is styled as a badge pill.
 * Deleting the marker text turns the box back into a regular quote — honest
 * WYSIWYG with no hidden state.
 */

const MARKER_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/;

interface CalloutSpan {
  /** Blockquote node position. */
  from: number;
  to: number;
  /** Marker text range (inside the first paragraph). */
  markerFrom: number;
  markerTo: number;
  type: string;
}

function collectCallouts(doc: PMNode): CalloutSpan[] {
  const spans: CalloutSpan[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'blockquote') return;
    const firstChild = node.firstChild;
    if (!firstChild || !firstChild.isTextblock) return;
    const m = MARKER_RE.exec(firstChild.textContent);
    if (!m) return;
    // pos → blockquote start; +1 enters the blockquote; +1 more enters the
    // first paragraph's content where the marker text begins.
    const markerFrom = pos + 2;
    spans.push({
      from: pos,
      to: pos + node.nodeSize,
      markerFrom,
      markerTo: markerFrom + m[0].length,
      type: m[1].toLowerCase(),
    });
    return false; // no nested callouts
  });
  return spans;
}

function buildDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];
  for (const s of collectCallouts(doc)) {
    decorations.push(
      Decoration.node(s.from, s.to, {
        class: `editor-callout editor-callout--${s.type}`,
        'data-callout': s.type,
      }),
      Decoration.inline(s.markerFrom, s.markerTo, {
        class: `editor-callout-marker editor-callout-marker--${s.type}`,
      })
    );
  }
  return DecorationSet.create(doc, decorations);
}

const calloutPreviewKey = new PluginKey<DecorationSet>('calloutPreview');

export const CalloutPreview = Extension.create({
  name: 'calloutPreview',
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: calloutPreviewKey,
        state: {
          init: (_, state) => buildDecorations(state.doc),
          apply: (tr, prev) =>
            tr.docChanged ? buildDecorations(tr.doc) : prev.map(tr.mapping, tr.doc),
        },
        props: {
          decorations(state) {
            return calloutPreviewKey.getState(state);
          },
        },
      }),
    ];
  },
});
