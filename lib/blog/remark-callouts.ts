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
 *
 * `[!QUOTE]` is ours too: somebody else's words, with who said them and where.
 * The last paragraph is the source line and is renamed to `<figcaption>`, so
 * `BlogQuote` can set it apart from the words themselves:
 *
 *     > [!QUOTE]
 *     > The quoted words.
 *     >
 *     > Speaker, role, [where it was said](https://…)
 *
 * A `[!QUOTE]` with a single paragraph has no source line and renders without
 * one. GitHub shows the whole thing as a plain quote, source line included.
 *
 * A translated quote carries its original in a paragraph that starts with the
 * language code in brackets. It becomes a `<div data-quote-original="en">`,
 * which `BlogQuote` shows on hover and on tap, never in the running text:
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
