import { foldText } from '@/lib/utils/text-fold';
import { matchStrength, queryWords } from '@/lib/navigation/post-search';

/** About 2,500 tokens: enough to answer from a post, cheap enough per question. */
export const POST_TEXT_LIMIT = 9000;

/** A section's heading says what it is about; a word found there counts this many body hits. */
const HEADING_WEIGHT = 4;

const CODE_FENCE = /```[\s\S]*?```/g;
const SECTION_HEADING = /^(#{2,3})\s+(.+)$/gm;

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
  level: 2 | 3;
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
    heading: stripMarkdown(head[2]),
    body: stripMarkdown(source.slice(head.index + head[0].length, heads[i + 1]?.index)),
    level: head[1].length as 2 | 3,
  }));
  return { intro, sections };
}

/**
 * The words under four letters that `query` writes as a name, folded: all capitals ("VIP",
 * "BTR") or capitalised inside a sentence ("Zoo" in "is the Zoo open").
 */
function namedShortWords(query: string): Set<string> {
  const named = new Set<string>();
  for (const match of query.matchAll(/[\p{L}\p{N}]+/gu)) {
    const word = match[0];
    if (word.length < 2 || word.length >= 4 || !/^\p{Lu}/u.test(word)) continue;
    const before = query.slice(0, match.index).trimEnd();
    const startsSentence = before === '' || /[.!?:¿¡]$/.test(before);
    if (word === word.toUpperCase() || !startsSentence) named.add(foldText(word));
  }
  return named;
}

/**
 * A post's text for one question: the intro plus the sections that answer `query` best, in the
 * post's order, within {@link POST_TEXT_LIMIT}. Each query word matches by `matchStrength`, the
 * site search's matching, and counts {@link HEADING_WEIGHT} times in a heading, more the more
 * often it stands in the body, and less the more sections it is found in, so "how" or "the" add
 * next to nothing. An H2 that is taken brings its H3s along, best first, as far as they fit; an H3
 * taken without its H2 gets the H2's heading line above it. Only the best section is cut to fit;
 * sections without a hit fill what room is left, in order. `sections` lists every heading,
 * `omitted` those whose text is left out, an H2 shown only as a heading line among them.
 */
export function postTextForQuery(
  markdown: string,
  query: string
): { text: string; shortened: boolean; sections: string[]; omitted: string[] } {
  const { intro, sections } = postSections(markdown);
  const all = queryWords(query);
  const named = namedShortWords(query);
  // shortcut: the other words under four letters ("how", "wie", "les") stand in for a stop-word
  // list; a list per locale if that starts to miss.
  const kept = all.filter((word) => word.length >= 4 || named.has(word));
  const words = kept.length ? kept : all;
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
  let h2 = -1;
  const parent = sections.map((section, index) => {
    if (section.level === 2) h2 = index;
    return section.level === 3 ? h2 : -1;
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
  const headingOnly = new Set<number>();

  function take(index: number, text: string, mayCut: boolean): boolean {
    if (chosen.has(index)) return false;
    const up = parent[index];
    const addsParent = up >= 0 && !chosen.has(up) && !headingOnly.has(up);
    const extra =
      (addsParent ? sections[up].heading.length + 2 : 0) -
      (headingOnly.has(index) ? sections[index].heading.length + 2 : 0);
    let body = text;
    if (body.length + 2 + extra > room) {
      if (!mayCut || room - extra - 2 <= 0) return false;
      body = cutAtParagraph(body, room - extra - 2);
      shortened = true;
    }
    chosen.set(index, body);
    headingOnly.delete(index);
    if (addsParent) headingOnly.add(up);
    room -= body.length + 2 + extra;
    return true;
  }

  for (const { index, score, text } of ranked) {
    if (!take(index, text, score > 0 && chosen.size === 0)) continue;
    for (const child of ranked) {
      if (parent[child.index] === index) take(child.index, child.text, false);
    }
  }

  const parts = [head];
  sections.forEach((section, index) => {
    parts.push(chosen.get(index) ?? (headingOnly.has(index) ? section.heading : ''));
  });
  const omitted = sections.filter((_, i) => !chosen.has(i)).map((section) => section.heading);
  return {
    text: parts.filter(Boolean).join('\n\n'),
    shortened: shortened || omitted.length > 0,
    sections: sections.map((section) => section.heading),
    omitted,
  };
}
