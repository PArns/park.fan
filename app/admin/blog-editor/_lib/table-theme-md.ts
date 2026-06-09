import type { Editor } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import type { TableTheme } from '../_extensions/themed-table';

/**
 * Markdown round-trip glue for table themes.
 *
 * GFM tables don't carry table-level attributes, so we encode the theme as a
 * leading magic HTML comment that the GFM parser preserves verbatim:
 *
 *     <!--tbl-theme: primary-->
 *     | h1 | h2 |
 *     |----|----|
 *     |  1 |  2 |
 *
 * `serialize` walks the editor doc looking for themed tables and prepends
 * those comments to the markdown string (matching by Nth table). `parse`
 * goes the other way — strips the comments from the incoming markdown,
 * returning the cleaned-up source plus a per-table-index theme map that
 * can be applied to the parsed editor doc.
 */

const MAGIC_RE = /<!--\s*tbl-theme:\s*([a-zA-Z]+)\s*-->\n?/gm;

const isTable = (node: PMNode) => node.type.name === 'table';

function collectTableThemes(doc: PMNode): TableTheme[] {
  const out: TableTheme[] = [];
  doc.descendants((node) => {
    if (!isTable(node)) return;
    const t = (node.attrs.theme as TableTheme | undefined) ?? 'default';
    out.push(t);
  });
  return out;
}

/**
 * Walk the markdown string finding each GFM table start (first `|`-prefixed
 * line that's followed by a `|---|` divider line). Returns the line index of
 * each table start.
 */
function findTableStarts(md: string): number[] {
  const lines = md.split('\n');
  const starts: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (!line.startsWith('|') || !next) continue;
    // Header / divider line is `|---|---|` (with optional alignment colons).
    if (/^\s*\|?[\s|:-]+\|?\s*$/.test(next) && next.includes('-')) {
      starts.push(i);
    }
  }
  return starts;
}

/** Inject magic comments above themed tables in the rendered markdown. */
export function serializeWithThemes(editor: Editor, markdown: string): string {
  const themes = collectTableThemes(editor.state.doc);
  if (themes.every((t) => t === 'default')) return markdown;
  const lines = markdown.split('\n');
  const starts = findTableStarts(markdown);
  // Walk from the LAST table backwards so earlier insertions don't shift the
  // indices we still need to operate on. A trailing blank line is required
  // so the GFM parser sees the comment as its own HTML block rather than
  // absorbing it into the table.
  for (let i = Math.min(starts.length, themes.length) - 1; i >= 0; i--) {
    const theme = themes[i];
    if (theme === 'default') continue;
    lines.splice(starts[i], 0, `<!--tbl-theme: ${theme}-->`, '');
  }
  return lines.join('\n');
}

/**
 * Strip the magic comments from incoming markdown and return both the clean
 * source AND the per-table-index theme map so the caller can re-apply themes
 * after tiptap-markdown has built the editor doc.
 */
export function parseThemesFromMarkdown(markdown: string): {
  cleaned: string;
  themes: TableTheme[];
} {
  // Walk line-by-line so we can correctly bind each comment to the NEXT GFM
  // table — and so we count tables (themed or not) in the same order
  // findTableStarts will produce after the comments are stripped.
  const inLines = markdown.split('\n');
  const outLines: string[] = [];
  const themes: TableTheme[] = [];
  let pendingTheme: TableTheme | null = null;
  for (let i = 0; i < inLines.length; i++) {
    const line = inLines[i];
    const m = /^\s*<!--\s*tbl-theme:\s*([a-zA-Z]+)\s*-->\s*$/.exec(line);
    if (m) {
      pendingTheme = m[1] as TableTheme;
      // The serializer pads the comment with a trailing blank line so the
      // GFM parser doesn't merge it into the next table. Eat that blank too,
      // otherwise blank lines accumulate on every round trip.
      if (i + 1 < inLines.length && inLines[i + 1].trim() === '') i++;
      continue; // strip the magic line — it never reaches the parser
    }
    const isTableStart =
      line.startsWith('|') &&
      i + 1 < inLines.length &&
      /^\s*\|?[\s|:-]+\|?\s*$/.test(inLines[i + 1]) &&
      inLines[i + 1].includes('-');
    if (isTableStart) {
      themes.push(pendingTheme ?? 'default');
      pendingTheme = null;
    }
    outLines.push(line);
  }
  return { cleaned: outLines.join('\n'), themes };
}

/** Apply the per-table-index theme map to a freshly-parsed editor doc. */
export function applyThemesToDoc(editor: Editor, themes: TableTheme[]): void {
  if (themes.every((t) => t === 'default')) return;
  const positions: number[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (isTable(node)) positions.push(pos);
  });
  editor
    .chain()
    .command(({ tr }) => {
      for (let i = 0; i < Math.min(positions.length, themes.length); i++) {
        const theme = themes[i];
        if (theme === 'default') continue;
        tr.setNodeAttribute(positions[i], 'theme', theme);
      }
      return true;
    })
    .run();
}

/** Strip ALL magic comments from a markdown string — used when the post is
 *  consumed outside the editor (preview pane, server-side renderer that
 *  doesn't yet understand the directive). Keeps body counts stable. */
export function stripThemeComments(markdown: string): string {
  return markdown.replace(MAGIC_RE, '');
}
