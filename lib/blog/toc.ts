import GithubSlugger from 'github-slugger';

export interface TocEntry {
  depth: 2 | 3;
  text: string;
  id: string;
}

/** Anchor id on the post's <h1>, so the ToC can offer a jump back to the top. */
export const BLOG_TOP_ID = 'blog-top';

const HEADING_RE = /^(#{2,3})\s+(.+?)\s*#*\s*$/gm;
const FENCE_RE = /^```[\s\S]*?```$/gm;

/** Strip the inline markdown that can appear in heading text for display. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1') // links → label
    .replace(/[*_`~]/g, '') // emphasis / code marks
    .trim();
}

/**
 * Extract h2/h3 headings from a post's markdown for a table of contents. IDs
 * are produced with the same GithubSlugger that rehype-slug uses on render, so
 * the anchors line up. Headings inside fenced code blocks are ignored.
 */
export function extractToc(markdown: string): TocEntry[] {
  const withoutFences = markdown.replace(FENCE_RE, '');
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let match: RegExpExecArray | null;
  while ((match = HEADING_RE.exec(withoutFences)) !== null) {
    const text = stripInlineMarkdown(match[2]);
    if (!text) continue;
    entries.push({
      depth: match[1].length === 2 ? 2 : 3,
      text,
      id: slugger.slug(text),
    });
  }
  return entries;
}
