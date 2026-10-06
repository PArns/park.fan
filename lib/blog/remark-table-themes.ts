/**
 * Table colour themes: the blog editor writes `<!--tbl-theme: NAME-->` above a themed table, and
 * globals.css paints `.blog-content table[data-theme='…']`. Tables without one stay plain GFM.
 */
// Deliberately NOT anchored to ^…$ — remark may merge adjacent raw-HTML
// lines into one node, so the directive just needs to appear in the value.
const MAGIC_RE = /<!--\s*tbl-theme:\s*([a-zA-Z]+)\s*-->/;

interface MdNode {
  type: string;
  value?: string;
  data?: { hProperties?: Record<string, string> };
}
interface MdRoot {
  children: MdNode[];
}

/** Turns a `<!--tbl-theme: NAME-->` comment into `data-theme` on the next table. */
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
      while (
        j < children.length &&
        children[j].type === 'html' &&
        !(children[j].value ?? '').trim()
      )
        j++;
      const next = children[j];
      if (next && next.type === 'table') {
        next.data = next.data ?? {};
        next.data.hProperties = {
          ...(next.data.hProperties ?? {}),
          'data-theme': theme,
        };
      }
      // Drop the comment either way so it never renders as a stray HTML island. When remark
      // merged it with other raw HTML into one node, strip only the directive.
      const stripped = (node.value ?? '').replace(MAGIC_RE, '').trim();
      if (stripped) {
        node.value = stripped;
      } else {
        children.splice(i, 1);
        i--;
      }
    }
  };
}
