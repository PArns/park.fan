/**
 * GitHub-style alert callouts (`> [!NOTE]`). remark-gfm leaves them as plain blockquotes; this
 * plugin strips the `[!TYPE]` marker and tags the blockquote `data-callout="note"` for the
 * renderer in blog-content.tsx. GitHub's syntax, so posts still render sensibly on GitHub.
 *
 * Two markers are ours: `[!CORRECTION]`, the dated note under a news post's signature (see
 * content/blog/README.md), and `[!QUOTE]`, whose last paragraph is the source line and becomes a
 * `<figcaption>`. In a quote, a paragraph starting with a language code is the original of a
 * translated quote, which `BlogQuote` shows on hover and tap:
 *
 *     > [!QUOTE]
 *     > Die übersetzten Worte.
 *     >
 *     > [en] The original words.
 *     >
 *     > Speaker, role, [where it was said](https://…), aus dem Englischen übersetzt
 */

export const CALLOUT_TYPES = [
  'note',
  'tip',
  'important',
  'warning',
  'caution',
  'correction',
  'quote',
] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

const MARKER_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|CORRECTION|QUOTE)\]\s*\n?/;
/** `[en]`, `[pt-BR]`: the language of a quote's original, at the start of its paragraph. */
const ORIGINAL_RE = /^\[([a-z]{2}(?:-[A-Z]{2})?)\]\s*/;

/** Tags a `[en] …` paragraph as the quote's original and strips the marker; false if it is none. */
function markOriginal(paragraph: MdNode): boolean {
  const first = paragraph.children?.[0];
  if (paragraph.type !== 'paragraph' || first?.type !== 'text') return false;
  const m = ORIGINAL_RE.exec(first.value ?? '');
  if (!m) return false;
  first.value = (first.value ?? '').slice(m[0].length);
  paragraph.data = {
    ...(paragraph.data ?? {}),
    hName: 'div',
    hProperties: { 'data-quote-original': m[1] },
  };
  return true;
}

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, string> };
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

/**
 * Remark plugin that turns a blockquote starting with `[!NOTE]`, `[!CORRECTION]`, `[!QUOTE]` and
 * the other markers into a callout tagged with `data-callout`.
 */
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
      if (type !== 'quote') return;
      // The original paragraphs are neither the words nor the source line.
      const own = (node.children ?? []).filter((child) => !markOriginal(child));
      const last = own.at(-1);
      if (own.length >= 2 && last?.type === 'paragraph') {
        last.data = { ...(last.data ?? {}), hName: 'figcaption' };
      }
    });
  };
}
