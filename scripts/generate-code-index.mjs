#!/usr/bin/env node
/**
 * Writes `docs/code-index/`, the searchable index of every exported component, hook, function,
 * constant and type in `app/`, `components/`, `lib/`, `i18n/`, `types/` and `proxy.ts`.
 *
 * The index is read from the source, not written by hand: each entry is the export's name, its
 * kind and the first sentence of its doc comment (`/** … *\/`, or the comment directly above it).
 * A file's header comment is the line under its heading. So the way to improve an entry is to
 * improve the doc comment in the code, and the way to keep the index current is to re-run this
 * script after adding, renaming or removing an export or changing its comment.
 *
 * One page per directory group (`components/parks`, `lib/utils`, `app/api`, …), so a pull request
 * that touches one directory rewrites one section of one page, and two pull requests in different
 * directories never edit the same lines. The README lists the pages and nothing that changes per
 * export, for the same reason.
 *
 * Run:
 *   pnpm generate:code-index           writes the pages
 *   pnpm check:code-index              fails when a page is stale (CI, job `code-index-drift`)
 *   node scripts/generate-code-index.mjs --missing [path-prefix]
 *                                      lists exports nobody has described yet
 *
 * Rule and reasoning: docs/rules/the-code-index-is-generated-from-the-doc-comments.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import ts from 'typescript';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(rootDir, 'docs/code-index');

/** Top-level roots that hold application code. */
const ROOTS = ['app/', 'components/', 'lib/', 'i18n/', 'types/', 'proxy.ts'];

/**
 * Files that are generated data, not code anybody looks up: indexing them would only add
 * thousands of lines nobody reads. Untracked generated files are already left out by git.
 */
const EXCLUDE = [/\.generated\.ts$/, /^lib\/media\/manifest/, /\.d\.ts$/];

/** Next.js files whose path is a route, so the index names the route next to the file. */
const ROUTE_FILES = new Set([
  'page',
  'layout',
  'route',
  'loading',
  'error',
  'not-found',
  'template',
  'default',
  'global-error',
  'opengraph-image',
  'twitter-image',
  'icon',
  'apple-icon',
  'sitemap',
  'robots',
  'manifest',
]);

/** Directories under app/ big enough for a page of their own. */
const APP_TREES = new Set(['[locale]', 'api', 'admin']);

/** Longest description the index prints before it cuts at a word. */
const MAX_DESCRIPTION = 240;

// ---------------------------------------------------------------------------------------------
// Collecting files
// ---------------------------------------------------------------------------------------------

/**
 * Tracked and untracked-but-not-ignored source files, so a file created a minute ago is indexed
 * before anyone has run `git add`, and gitignored build output never is.
 */
function listSourceFiles() {
  const out = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...ROOTS],
    { cwd: rootDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return [...new Set(out.split('\n'))]
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .filter((f) => !EXCLUDE.some((re) => re.test(f)))
    .filter((f) => fs.existsSync(path.join(rootDir, f)))
    .sort();
}

/**
 * The page a file is listed on: the first two path segments (`components/parks`, `lib/utils`),
 * the top-level directory for a file that sits directly in it (`lib/markdown.ts` → `lib`), and
 * `app/[locale]` shortened to `app/locale` in the page's file name.
 */
function groupOf(file) {
  const parts = file.split('/');
  if (parts.length === 1) return 'root';
  if (parts.length === 2) return parts[0];
  // app/ holds three big trees and a dozen one-file routes (robots.txt, the sitemaps, rss.xml):
  // the trees get a page each, the one-file routes share the app page.
  if (parts[0] === 'app' && !APP_TREES.has(parts[1])) return 'app';
  return `${parts[0]}/${parts[1]}`;
}

function pageFileName(group) {
  return `${group.replace(/\[|\]/g, '').replace(/\//g, '-')}.md`;
}

// ---------------------------------------------------------------------------------------------
// Reading one file
// ---------------------------------------------------------------------------------------------

function hasExportModifier(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
}

function hasDefaultModifier(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Default) !== 0;
}

/** Turns comment text into one plain line: `{@link X}` → `X`, whitespace collapsed. */
function normaliseComment(text) {
  return text
    .replace(/\{@link(?:code|plain)?\s+([^}|\s]+)(?:\s*\|\s*([^}]+))?\s*\}/g, (_, target, label) =>
      label ? label.trim() : `\`${target}\``
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/** First paragraph of a raw comment, without the comment markers and without `@tags`. */
function commentBody(raw) {
  let text;
  if (raw.startsWith('/*')) {
    text = raw
      .replace(/^\/\*\*?/, '')
      .replace(/\*\/$/, '')
      .split('\n')
      .map((line) => line.replace(/^\s*\* ?/, ''))
      .join('\n');
  } else {
    text = raw
      .split('\n')
      .map((line) => line.replace(/^\s*\/\/\/? ?/, ''))
      .join('\n');
  }
  const untagged = text.split(/\n\s*@\w+/)[0];
  const firstParagraph = untagged.trim().split(/\n\s*\n/)[0] ?? '';
  return normaliseComment(firstParagraph);
}

/**
 * The comment block directly above a node: the nearest leading comment range plus any line
 * comments that run into it without a blank line. Lint-directive comments do not count.
 */
function leadingComment(sourceText, node) {
  const ranges = ts.getLeadingCommentRanges(sourceText, node.getFullStart()) ?? [];
  const usable = ranges.filter((r) => {
    const raw = sourceText.slice(r.pos, r.end);
    if (/^\/[/*]\s*(eslint|@ts-|prettier-ignore|istanbul|webpackChunkName)/.test(raw)) return false;
    // Section banners (`// ====== Component ======`) divide a file; they describe nothing.
    return !/[=\-─━]{8,}/.test(raw);
  });
  if (usable.length === 0) return null;
  const last = usable[usable.length - 1];
  const lastRaw = sourceText.slice(last.pos, last.end);
  if (lastRaw.startsWith('/*')) return commentBody(lastRaw);
  // A run of `//` lines reads as one comment.
  const lines = [lastRaw];
  for (let i = usable.length - 2; i >= 0; i--) {
    const r = usable[i];
    const between = sourceText.slice(r.end, usable[i + 1].pos);
    if (between.split('\n').length > 2 || sourceText.slice(r.pos, r.end).startsWith('/*')) break;
    lines.unshift(sourceText.slice(r.pos, r.end));
  }
  return commentBody(lines.join('\n'));
}

/**
 * Shortens a description to whole sentences, or to a word boundary, within the length limit.
 * A sentence ends at `.`, `!` or `?` followed by a space and a capital, a quote or a backtick,
 * so `Date.now()` or `e.g. this` do not end one.
 */
function summarise(text) {
  if (!text) return '';
  if (text.length <= MAX_DESCRIPTION) return text;
  let end = -1;
  for (const m of text.matchAll(/[.!?](?=\s+[A-Z`"'“„(\[]|$)/g)) {
    if (m.index + 1 > MAX_DESCRIPTION) break;
    end = m.index + 1;
  }
  if (end >= 40) return text.slice(0, end);
  const cut = text.slice(0, MAX_DESCRIPTION);
  return `${cut.slice(0, cut.lastIndexOf(' '))} …`;
}

/** What an initializer is, from its syntax alone (no type checker: this script stays fast). */
function unwrapInitializer(init) {
  let node = init;
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node) ||
      ts.isTypeAssertionExpression(node))
  ) {
    node = node.expression;
  }
  return node;
}

function isFunctionLike(init) {
  const node = unwrapInitializer(init);
  if (!node) return false;
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return true;
  // memo(...), forwardRef(...), dynamic(...), React.memo(...), cache(...)
  if (ts.isCallExpression(node)) {
    const callee = node.expression.getText();
    return /(^|\.)(memo|forwardRef|dynamic|lazy|cache)$/.test(callee);
  }
  return false;
}

function classify(name, { isFunction, isClass, isType, file }) {
  if (isType) return 'type';
  if (isClass) return 'class';
  if (/^use[A-Z0-9]/.test(name)) return isFunction ? 'hook' : 'const';
  if (isFunction && /^[A-Z]/.test(name) && file.endsWith('.tsx')) return 'component';
  if (isFunction) return 'function';
  return 'const';
}

/**
 * Exports of one file, each with its kind and description, plus the file's header comment and
 * any modules it re-exports.
 */
function readFile(file) {
  const sourceText = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const sf = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  /** @type {Map<string, {kind: string, doc: string}>} declarations by local name */
  const locals = new Map();
  /** @type {{name: string, kind: string, doc: string}[]} */
  const exports = [];
  const reExports = [];
  let header = '';

  // The file header: the comment above the first statement when that statement is not itself an
  // exported declaration (whose comment is its own), skipping 'use client' / 'use server'.
  const statements = sf.statements.filter(
    (s) =>
      !(
        ts.isExpressionStatement(s) &&
        ts.isStringLiteral(s.expression) &&
        /^use (client|server)$/.test(s.expression.text)
      )
  );
  const first = statements[0];
  if (first) {
    const exportedDecl =
      (ts.canHaveModifiers(first) && hasExportModifier(first)) || ts.isExportAssignment(first);
    if (!exportedDecl) header = leadingComment(sourceText, first) ?? '';
    // A directive's own leading comment is a header too: `// comment` above 'use client'.
    if (!header && sf.statements[0] !== first) {
      header = leadingComment(sourceText, sf.statements[0]) ?? '';
    }
  }

  const add = (name, kind, doc) => {
    if (exports.some((e) => e.name === name)) return;
    exports.push({ name, kind, doc: summarise(doc ?? '') });
  };

  for (const stmt of sf.statements) {
    const doc = leadingComment(sourceText, stmt);
    const exported = ts.canHaveModifiers(stmt) && hasExportModifier(stmt);
    const isDefault = ts.canHaveModifiers(stmt) && hasDefaultModifier(stmt);

    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      const name = stmt.name.text;
      const kind = classify(name, { isFunction: true, file });
      locals.set(name, { kind, doc });
      if (exported) add(isDefault ? `default (${name})` : name, kind, doc);
    } else if (ts.isFunctionDeclaration(stmt) && exported) {
      add('default', 'function', doc);
    } else if (ts.isClassDeclaration(stmt) && stmt.name) {
      const name = stmt.name.text;
      locals.set(name, { kind: 'class', doc });
      if (exported) add(isDefault ? `default (${name})` : name, 'class', doc);
    } else if (
      ts.isInterfaceDeclaration(stmt) ||
      ts.isTypeAliasDeclaration(stmt) ||
      ts.isEnumDeclaration(stmt)
    ) {
      const name = stmt.name.text;
      const kind = ts.isEnumDeclaration(stmt) ? 'const' : 'type';
      locals.set(name, { kind, doc });
      if (exported) add(name, kind, doc);
    } else if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const name = decl.name.text;
        const kind = classify(name, { isFunction: isFunctionLike(decl.initializer), file });
        // With several declarators in one statement, only the first carries the comment.
        const ownDoc = leadingComment(sourceText, decl) ?? doc;
        locals.set(name, { kind, doc: ownDoc });
        if (exported) add(name, kind, ownDoc);
      }
    } else if (ts.isExportAssignment(stmt)) {
      const expr = stmt.expression;
      const target = ts.isIdentifier(expr) ? locals.get(expr.text) : null;
      if (target) {
        add(`default (${expr.text})`, target.kind, doc || target.doc);
      } else {
        add('default', isFunctionLike(expr) ? 'function' : 'const', doc);
      }
    } else if (ts.isExportDeclaration(stmt)) {
      if (stmt.moduleSpecifier) {
        reExports.push(stmt.moduleSpecifier.text);
        continue;
      }
      if (!stmt.exportClause || !ts.isNamedExports(stmt.exportClause)) continue;
      for (const el of stmt.exportClause.elements) {
        const localName = (el.propertyName ?? el.name).text;
        const exportedName = el.name.text;
        const local = locals.get(localName);
        const typeOnly = stmt.isTypeOnly || el.isTypeOnly;
        const kind = local?.kind ?? (typeOnly ? 'type' : 'const');
        const name =
          exportedName === 'default'
            ? `default (${localName})`
            : exportedName === localName
              ? exportedName
              : `${exportedName} (${localName})`;
        add(name, kind, local?.doc ?? '');
      }
    }
  }

  return { file, header: summarise(header), exports, reExports: [...new Set(reExports)] };
}

/** `app/[locale]/parks/[park]/page.tsx` → `/[locale]/parks/[park]`; route groups dropped. */
function routeOf(file) {
  if (!file.startsWith('app/')) return null;
  const base = path.basename(file).replace(/\.(ts|tsx)$/, '');
  if (!ROUTE_FILES.has(base)) return null;
  const dir = path
    .dirname(file)
    .slice('app'.length)
    .split('/')
    .filter((seg) => !/^\(.*\)$/.test(seg))
    .join('/');
  return { kind: base, path: dir || '/' };
}

/** Exports Next.js asks a route file for by name: the route describes them. */
const ROUTE_CONVENTION_EXPORTS =
  /^(default( \(.*\))?|generateMetadata|generateViewport|generateStaticParams|generateImageMetadata|GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/;

/**
 * Whether an export counts as described: its own comment; a route file's conventional export
 * (the route says what it is); or, with a file header, the file's only value export or one of its
 * components (a `.tsx` file exporting `Dialog`, `DialogContent`, `DialogHeader` is one thing,
 * and its header describes it).
 */
function isDescribed(entry, info) {
  if (entry.doc) return true;
  if (routeOf(info.file) && ROUTE_CONVENTION_EXPORTS.test(entry.name)) return true;
  if (!info.header) return false;
  const values = info.exports.filter((e) => e.kind !== 'type');
  return entry.kind === 'component' || (values.length === 1 && values[0] === entry);
}

// ---------------------------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------------------------

/** Escapes what Markdown would read as HTML, outside inline code. */
function escapeMarkdown(text) {
  return text
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('');
}

const KIND_ORDER = ['component', 'hook', 'function', 'class', 'const', 'type'];

function renderFile(info, group) {
  const rel = group === 'root' ? info.file : info.file.slice(group.length + 1);
  const link = path.relative(outDir, path.join(rootDir, info.file)).split(path.sep).join('/');
  const lines = [`### [\`${rel}\`](${encodeURI(link)})`, ''];

  const route = routeOf(info.file);
  if (route) lines.push(`Route \`${route.path}\` (${route.kind}).`, '');
  if (info.header) lines.push(escapeMarkdown(info.header), '');

  const values = info.exports
    .filter((e) => e.kind !== 'type')
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  const types = info.exports.filter((e) => e.kind === 'type');

  const items = [];
  for (const e of values) {
    const doc = e.doc ? ` ${escapeMarkdown(e.doc)}` : '';
    items.push(`- \`${e.name}\` _${e.kind}_${doc ? ':' + doc : ''}`);
  }
  if (types.length > 0) {
    items.push(`- Types: ${types.map((t) => `\`${t.name}\``).join(', ')}`);
  }
  if (info.reExports.length > 0) {
    items.push(`- Re-exports: ${info.reExports.map((m) => `\`${m}\``).join(', ')}`);
  }
  if (items.length === 0 && !route) items.push('- No exports.');
  lines.push(...items);
  return lines.join('\n');
}

function renderPage(group, infos) {
  const title = group === 'root' ? 'Root files' : `\`${group}/\``;
  const counts = { component: 0, hook: 0, function: 0 };
  for (const info of infos) for (const e of info.exports) if (e.kind in counts) counts[e.kind]++;
  const summary = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k === 'function' ? 'functions' : `${k}s`}`)
    .join(', ');

  return [
    `# ${title}`,
    '',
    '<!-- Generated by `pnpm generate:code-index` from the doc comments in the source. Do not edit',
    'by hand: change the comment in the code and re-run the script. -->',
    '',
    `${infos.length} files${summary ? `, ${summary}` : ''}. [All pages](README.md).`,
    '',
    ...infos.map((info) => renderFile(info, group) + '\n'),
  ].join('\n');
}

const GROUP_ORDER = ['components', 'lib', 'app', 'i18n', 'types', 'root'];

function renderReadme(groups) {
  const sorted = [...groups].sort((a, b) => {
    const ra = GROUP_ORDER.indexOf(a.split('/')[0]);
    const rb = GROUP_ORDER.indexOf(b.split('/')[0]);
    return ra - rb || a.localeCompare(b);
  });
  const rows = sorted.map((g) => {
    const label = g === 'root' ? 'Root files (`proxy.ts`)' : `\`${g}/\``;
    return `- [${label}](${pageFileName(g)})`;
  });
  return `# Code index

<!-- Generated by \`pnpm generate:code-index\`. Do not edit by hand. -->

Every exported component, hook, function, constant and type in \`app/\`, \`components/\`, \`lib/\`,
\`i18n/\`, \`types/\` and \`proxy.ts\`, one page per directory, each with the first sentence of its
doc comment. Look here before writing a helper or a component: the one you need may exist.

The pages are generated from the source. To change an entry, change the doc comment above the
export and run \`pnpm generate:code-index\`. After adding, renaming or removing an export, run it
too; \`pnpm check:code-index\` fails while a page is stale. To see what nobody has described yet:
\`node scripts/generate-code-index.mjs --missing components/parks\`.

Why it works this way: [the rule](../rules/the-code-index-is-generated-from-the-doc-comments.md).

## Pages

${rows.join('\n')}
`;
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

async function build() {
  const files = listSourceFiles();
  const infos = files.map(readFile);
  const byGroup = new Map();
  for (const info of infos) {
    const g = groupOf(info.file);
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(info);
  }

  const prettierConfig = (await prettier.resolveConfig(path.join(outDir, 'README.md'))) ?? {};
  const format = (text) => prettier.format(text, { ...prettierConfig, parser: 'markdown' });

  /** @type {Map<string, string>} file name → content */
  const pages = new Map();
  for (const [group, list] of byGroup) {
    pages.set(pageFileName(group), await format(renderPage(group, list)));
  }
  pages.set('README.md', await format(renderReadme([...byGroup.keys()])));
  return { infos, pages };
}

function printMissing(infos, prefix) {
  const rows = [];
  for (const info of infos) {
    if (prefix && !info.file.startsWith(prefix)) continue;
    for (const e of info.exports) {
      if (e.kind === 'type' || e.kind === 'const') continue;
      if (!isDescribed(e, info)) rows.push(`${info.file}\t${e.kind}\t${e.name}`);
    }
  }
  console.log(rows.join('\n'));
  console.error(`\n${rows.length} component, hook, function or class exports have no description.`);
}

const args = process.argv.slice(2);
const { infos, pages } = await build();

if (args.includes('--missing')) {
  const prefix = args.find((a) => !a.startsWith('--'));
  printMissing(infos, prefix);
} else if (args.includes('--check')) {
  const stale = [];
  for (const [name, content] of pages) {
    const file = path.join(outDir, name);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) stale.push(name);
  }
  const extra = fs.existsSync(outDir)
    ? fs.readdirSync(outDir).filter((f) => f.endsWith('.md') && !pages.has(f))
    : [];
  if (stale.length || extra.length) {
    console.error(
      `❌ docs/code-index is stale: ${[...stale, ...extra.map((f) => `${f} (no longer generated)`)].join(', ')}.\n` +
        '   Run `pnpm generate:code-index` and commit the result.'
    );
    process.exit(1);
  }
  console.log(`✅ docs/code-index is current — ${pages.size - 1} pages, ${infos.length} files.`);
} else {
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.md') && !pages.has(f)) fs.rmSync(path.join(outDir, f));
  }
  for (const [name, content] of pages) fs.writeFileSync(path.join(outDir, name), content);
  console.log(`✅ Wrote docs/code-index — ${pages.size - 1} pages, ${infos.length} files.`);
}
