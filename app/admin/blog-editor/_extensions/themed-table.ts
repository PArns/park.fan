import { Table, TableView } from '@tiptap/extension-table';
import type { Node as PMNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';

/**
 * A table's header-row colour preset, set as `data-theme` on the rendered `<table>`. GFM has no
 * slot for table metadata, so it round-trips as a `<!--tbl-theme: NAME-->` line before the table
 * (`_lib/table-theme-md.ts`).
 */
export type TableTheme = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';

export const TABLE_THEMES: readonly TableTheme[] = [
  'default',
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
];

/**
 * TableView never reapplies table-level attributes to the live `<table>`, so a `theme` change
 * would leave `data-theme` stale; this subclass writes it on every update.
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
