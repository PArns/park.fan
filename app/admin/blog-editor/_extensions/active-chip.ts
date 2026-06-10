import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Highlights whichever chip is currently loaded in the PropertiesPanel.
 *
 * Clicking a chip fires `parkfan-selection` (consumed by the panel); this
 * plugin listens to the same event and rings the corresponding range in the
 * canvas so the author always sees WHICH park link / image / widget they're
 * editing — previously the only feedback was the panel content itself.
 *
 * Also binds Escape to clear the selection (panel + ring) for quick
 * keyboard-driven flows.
 */

interface ActiveRange {
  from: number;
  to: number;
  /** inline → text-range styling (refs/links); node → block ring. */
  mode: 'inline' | 'node';
}

interface SelectionDetail {
  kind?: string;
  from?: number;
  to?: number;
  pos?: number;
  nodeFrom?: number;
  nodeTo?: number;
  paragraphFrom?: number;
  paragraphTo?: number;
}

function rangeFromDetail(detail: SelectionDetail): ActiveRange | null {
  switch (detail.kind) {
    case 'ref':
    case 'link':
      if (typeof detail.from === 'number' && typeof detail.to === 'number') {
        return { from: detail.from, to: detail.to, mode: 'inline' };
      }
      return null;
    case 'image':
      if (typeof detail.pos === 'number') {
        return { from: detail.pos, to: detail.pos + 1, mode: 'node' };
      }
      return null;
    case 'widget':
      if (typeof detail.nodeFrom === 'number' && typeof detail.nodeTo === 'number') {
        return { from: detail.nodeFrom, to: detail.nodeTo, mode: 'node' };
      }
      return null;
    case 'embed':
      if (
        typeof detail.paragraphFrom === 'number' &&
        typeof detail.paragraphTo === 'number'
      ) {
        return { from: detail.paragraphFrom, to: detail.paragraphTo, mode: 'node' };
      }
      return null;
    default:
      return null;
  }
}

function buildDecorations(
  doc: import('@tiptap/pm/model').Node,
  range: ActiveRange | null
): DecorationSet {
  if (!range) return DecorationSet.empty;
  const max = doc.content.size;
  const from = Math.max(0, Math.min(range.from, max));
  const to = Math.max(from, Math.min(range.to, max));
  if (from === to) return DecorationSet.empty;
  try {
    const deco =
      range.mode === 'inline'
        ? Decoration.inline(from, to, { class: 'chip-active-inline' })
        : Decoration.node(from, to, { class: 'chip-active-node' });
    return DecorationSet.create(doc, [deco]);
  } catch {
    return DecorationSet.empty;
  }
}

const activeChipKey = new PluginKey<{ range: ActiveRange | null; decos: DecorationSet }>(
  'activeChip'
);

export const ActiveChip = Extension.create({
  name: 'activeChip',
  addProseMirrorPlugins() {
    return [
      new Plugin<{ range: ActiveRange | null; decos: DecorationSet }>({
        key: activeChipKey,
        state: {
          init: () => ({ range: null, decos: DecorationSet.empty }),
          apply(tr, prev) {
            const meta = tr.getMeta(activeChipKey) as
              | { range: ActiveRange | null }
              | undefined;
            if (meta !== undefined) {
              return { range: meta.range, decos: buildDecorations(tr.doc, meta.range) };
            }
            if (!tr.docChanged || !prev.range) {
              return { range: prev.range, decos: prev.decos.map(tr.mapping, tr.doc) };
            }
            // Doc changed under an active highlight — remap the range itself
            // so a later meta-less rebuild stays anchored.
            const from = tr.mapping.map(prev.range.from);
            const to = tr.mapping.map(prev.range.to);
            const range = { ...prev.range, from, to };
            return { range, decos: buildDecorations(tr.doc, range) };
          },
        },
        props: {
          decorations(state) {
            return activeChipKey.getState(state)?.decos;
          },
          handleKeyDown(view, event) {
            if (event.key !== 'Escape') return false;
            const has = activeChipKey.getState(view.state)?.range;
            if (!has) return false;
            window.dispatchEvent(new CustomEvent('parkfan-clear-selection'));
            return true;
          },
        },
        view(editorView) {
          const onSelect = (e: Event) => {
            const detail = (e as CustomEvent<SelectionDetail>).detail;
            const range = detail ? rangeFromDetail(detail) : null;
            editorView.dispatch(editorView.state.tr.setMeta(activeChipKey, { range }));
          };
          const onClear = () => {
            editorView.dispatch(
              editorView.state.tr.setMeta(activeChipKey, { range: null })
            );
          };
          window.addEventListener('parkfan-selection', onSelect as EventListener);
          window.addEventListener('parkfan-clear-selection', onClear);
          return {
            destroy() {
              window.removeEventListener('parkfan-selection', onSelect as EventListener);
              window.removeEventListener('parkfan-clear-selection', onClear);
            },
          };
        },
      }),
    ];
  },
});
