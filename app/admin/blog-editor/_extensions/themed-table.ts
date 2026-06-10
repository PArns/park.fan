import { Table, TableView } from '@tiptap/extension-table';
import type { Node as PMNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';

/**
 * Tiptap's Table extension with one extra attribute: `theme`. Drives a
 * `data-theme` attr on the rendered `<table>` element so authors can pick
 * from a handful of header-row colour presets (default / primary / accent /
 * success / warning / danger).
 *
 * The attribute round-trips through the markdown layer via a magic HTML
 * comment line (`<!--tbl-theme: NAME-->`) prepended to themed tables — GFM
 * tables themselves have no slot for table-level metadata, so we encode the
 * theme in a leading sibling that survives the GFM parser as a raw `html`
 * node. The save / load helpers in `_lib/table-theme-md.ts` keep both ends
 * of the round-trip in sync.
 */
export type TableTheme =
  | 'default'
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export const TABLE_THEMES: readonly TableTheme[] = [
  'default',
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
];

/**
 * TableView only re-runs `updateColumns` when the node changes — it never
 * reapplies the table-level HTMLAttributes back onto the live <table> DOM
 * element. That means setting `theme` via setNodeAttribute updates the
 * ProseMirror doc but leaves the rendered <table data-theme="…"> stale.
 * This subclass writes the live theme attr onto the DOM on every update.
 */
class ThemedTableView extends TableView {
  update(node: PMNode): boolean {
    const ok = super.update(node);
    if (ok) {
      const theme = (node.attrs.theme as TableTheme | undefined) ?? 'default';
      if (theme === 'default') this.table.removeAttribute('data-theme');
      else this.table.setAttribute('data-theme', theme);
    }
    return ok;
  }
}

export const ThemedTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      theme: {
        default: 'default' as TableTheme,
        parseHTML: (el) => (el.getAttribute('data-theme') ?? 'default') as TableTheme,
        renderHTML: (attrs) => {
          const t = (attrs.theme as TableTheme | undefined) ?? 'default';
          if (t === 'default') return {};
          return { 'data-theme': t };
        },
      },
    };
  },
  addNodeView() {
    const minWidth = this.options.cellMinWidth as number;
    const configured = this.options.HTMLAttributes as Record<string, string>;
    return ({ node, editor }: { node: PMNode; editor: { view: EditorView } }) => {
      // Seed the constructor with both the configured HTMLAttributes (so a
      // future `ThemedTable.configure({ HTMLAttributes })` keeps working) and
      // the initial theme attr; ThemedTableView.update keeps the latter in
      // sync afterwards.
      const theme = (node.attrs.theme as TableTheme | undefined) ?? 'default';
      const attrs: Record<string, string> = { ...configured };
      if (theme !== 'default') attrs['data-theme'] = theme;
      return new ThemedTableView(node, minWidth, editor.view, attrs);
    };
  },
});
