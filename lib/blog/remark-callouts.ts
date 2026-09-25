/**
 * GitHub-style alert callouts:
 *
 *     > [!NOTE]
 *     > Useful context the reader shouldn't skip.
 *
 * remark-gfm leaves these as plain blockquotes; this plugin detects the
 * `[!TYPE]` marker in the first paragraph, strips it, and tags the
 * blockquote with `data-callout="note"` so the blockquote renderer in
 * blog-content.tsx can swap in the coloured box + icon. Unmarked
 * blockquotes pass through untouched.
 *
 * The syntax is deliberately GitHub's — posts render sensibly on GitHub
 * itself and survive any GFM round-trip the editor does.
 *
 * `[!CORRECTION]` is ours, not GitHub's: the dated note a news post carries
 * after a factual fix, set under the signature as a quiet grey box (see
 * content/blog/README.md, "Callouts, and the correction note"). Guides never
 * carry one. GitHub shows it as a plain quote.
 */

export const CALLOUT_TYPES = [
  'note',
  'tip',
  'important',
  'warning',
  'caution',
  'correction',
] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

const MARKER_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|CORRECTION)\]\s*\n?/;

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hProperties?: Record<string, string> };
}
interface MdRoot {
  children: MdNode[];
}

function visit(node: MdNode | MdRoot, fn: (n: MdNode) => void): void {
  for (const child of node.children ?? []) {
    fn(child);
    visit(child, fn);
  }
}

export function remarkCallouts(): (tree: MdRoot) => void {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'blockquote') return;
      const firstPara = node.children?.[0];
      if (!firstPara || firstPara.type !== 'paragraph') return;
      const firstText = firstPara.children?.[0];
      if (!firstText || firstText.type !== 'text') return;
      const m = MARKER_RE.exec(firstText.value ?? '');
      if (!m) return;
      const type = m[1].toLowerCase();
      // Strip the marker (and the newline GitHub puts after it). When the
      // marker was the paragraph's only content, drop the whole text node /
      // paragraph so no empty shell renders.
      const rest = (firstText.value ?? '').slice(m[0].length);
      if (rest) {
        firstText.value = rest;
      } else {
        firstPara.children = firstPara.children?.slice(1) ?? [];
        if (firstPara.children.length === 0) {
          node.children = node.children?.slice(1) ?? [];
        }
      }
      node.data = node.data ?? {};
      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        'data-callout': type,
      };
    });
  };
}
