/** About 2,500 tokens: enough to answer from a post, cheap enough per question. */
export const POST_TEXT_LIMIT = 9000;

/**
 * A post's Markdown as plain text for the chat assistant: code, images, embeds, HTML and table
 * rules removed, links reduced to their text, cut at a paragraph near {@link POST_TEXT_LIMIT}.
 */
export function postPlainText(markdown: string): { text: string; shortened: boolean } {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^:{2,}.*$/gm, '')
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.length <= POST_TEXT_LIMIT) return { text, shortened: false };
  const cut = text.lastIndexOf('\n\n', POST_TEXT_LIMIT);
  return {
    text: text.slice(0, cut > POST_TEXT_LIMIT / 2 ? cut : POST_TEXT_LIMIT),
    shortened: true,
  };
}
