import { foldText } from '@/lib/utils/text-fold';
import { matchStrength, queryWords } from '@/lib/navigation/post-search';

/** About 2,500 tokens: enough to answer from a post, cheap enough per question. */
export const POST_TEXT_LIMIT = 9000;

/** A section's heading says what it is about; a word found there counts this many body hits. */
const HEADING_WEIGHT = 4;

const CODE_FENCE = /```[\s\S]*?```/g;
const SECTION_HEADING = /^#{2,3}\s+(.+)$/gm;

/** Markdown as plain text: code, images, embeds, HTML and table rules gone, links as their text. */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(CODE_FENCE, '')
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
}

/** `text` cut at a paragraph break near `limit`, or hard at `limit` when none is past its half. */
function cutAtParagraph(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.lastIndexOf('\n\n', limit);
  return text.slice(0, cut > limit / 2 ? cut : limit);
}

/**
 * A post's Markdown as plain text for the chat assistant: code, images, embeds, HTML and table
 * rules removed, links reduced to their text, cut at a paragraph near {@link POST_TEXT_LIMIT}.
 */
export function postPlainText(markdown: string): { text: string; shortened: boolean } {
  const text = stripMarkdown(markdown);
  const cut = cutAtParagraph(text, POST_TEXT_LIMIT);
  return { text: cut, shortened: cut.length < text.length };
}

/** One H2 or H3 of a post, as plain text. */
export interface PostSection {
  heading: string;
  body: string;
}

/**
 * A post split at its H2 and H3 headings, each part plain text: `intro` is what stands before the
 * first one. Code blocks go first, so a `## ` inside one is not taken for a heading.
 */
export function postSections(markdown: string): { intro: string; sections: PostSection[] } {
  const source = markdown.replace(CODE_FENCE, '');
  const heads = [...source.matchAll(SECTION_HEADING)];
  const intro = stripMarkdown(source.slice(0, heads[0]?.index ?? source.length));
  const sections = heads.map((head, i) => ({
    heading: stripMarkdown(head[1]),
    body: stripMarkdown(source.slice(head.index + head[0].length, heads[i + 1]?.index)),
  }));
  return { intro, sections };
}

/**
 * A post's text for one question: the intro plus the sections that answer `query` best, in the
 * post's order, within {@link POST_TEXT_LIMIT}. Each query word matches by `matchStrength`, the
 * site search's matching, and counts {@link HEADING_WEIGHT} times in a heading, more the more
 * often it stands in the body, and less the more sections it is found in, so "how" or "the" add
 * next to nothing. Only the best section is cut to fit; sections without a hit fill what room is
 * left, in order. `sections` lists every heading, `omitted` those left out.
 */
export function postTextForQuery(
  markdown: string,
  query: string
): { text: string; shortened: boolean; sections: string[]; omitted: string[] } {
  const { intro, sections } = postSections(markdown);
  const all = queryWords(query);
  // shortcut: words under four letters ("how", "wie", "les") stand in for a stop-word list, and
  // go a three-letter name like "VIP" with them; a list per locale if that starts to miss.
  const long = all.filter((word) => word.length >= 4);
  const words = long.length ? long : all;
  const folded = sections.map((section) => ({
    heading: foldText(section.heading),
    body: foldText(section.body),
  }));
  const rarity = words.map((word) => {
    const found = folded.filter(
      ({ heading, body }) => matchStrength(heading, word) + matchStrength(body, word) > 0
    ).length;
    return found ? Math.log(1 + sections.length / found) : 0;
  });
  const ranked = sections
    .map((section, index) => {
      const { heading, body } = folded[index];
      const score = words.reduce(
        (sum, word, w) =>
          sum +
          rarity[w] *
            (HEADING_WEIGHT * matchStrength(heading, word) +
              matchStrength(body, word) * Math.log2(body.split(word).length)),
        0
      );
      return { index, score, text: `${section.heading}\n\n${section.body}`.trim() };
    })
    // `sort` is stable, so equal scores keep the post's order.
    .sort((a, b) => b.score - a.score);

  const head = cutAtParagraph(intro, POST_TEXT_LIMIT / 4);
  let room = POST_TEXT_LIMIT - head.length;
  let shortened = head.length < intro.length;
  const chosen = new Map<number, string>();
  for (const { index, score, text } of ranked) {
    const cost = text.length + 2;
    if (cost <= room) {
      chosen.set(index, text);
      room -= cost;
    } else if (score > 0 && chosen.size === 0) {
      const cut = cutAtParagraph(text, room - 2);
      chosen.set(index, cut);
      room -= cut.length + 2;
      shortened = true;
    }
  }

  const parts = [head, ...[...chosen.keys()].sort((a, b) => a - b).map((i) => chosen.get(i)!)];
  const omitted = sections.filter((_, i) => !chosen.has(i)).map((section) => section.heading);
  return {
    text: parts.filter(Boolean).join('\n\n'),
    shortened: shortened || omitted.length > 0,
    sections: sections.map((section) => section.heading),
    omitted,
  };
}
