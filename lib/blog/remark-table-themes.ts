/**
 * Remark plugin that consumes the `<!--tbl-theme: NAME-->` magic comments
 * the blog editor writes above themed tables and rewrites them into a
 * `data-theme` attribute on the corresponding GFM table node. The matching
 * CSS in globals.css (`.blog-content table[data-theme='primary'] th`, etc.)
 * then paints the header row with the picked colour preset.
 *
 * The directive is opt-in — non-themed tables stay as plain GFM and are
 * unaffected.
 */
const MAGIC_RE = /^\s*<!--\s*tbl-theme:\s*([a-zA-Z]+)\s*-->\s*$/;

interface MdNode {
  type: string;
  value?: string;
  data?: { hProperties?: Record<string, string> };
}
interface MdRoot {
  children: MdNode[];
}

export function remarkTableThemes(): (tree: MdRoot) => void {
  return (tree) => {
    const children = tree.children;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.type !== 'html') continue;
      const m = MAGIC_RE.exec(node.value ?? '');
      if (!m) continue;
      const theme = m[1];
      // Walk forward past any blank html nodes to find the next table.
      let j = i + 1;
      while (j < children.length && children[j].type === 'html' && !(children[j].value ?? '').trim()) j++;
      const next = children[j];
      if (next && next.type === 'table') {
        next.data = next.data ?? {};
        next.data.hProperties = {
          ...(next.data.hProperties ?? {}),
          'data-theme': theme,
        };
      }
      // Drop the magic comment from the rendered tree either way so it never
      // shows up as a stray HTML island next to the table.
      children.splice(i, 1);
      i--;
    }
  };
}
