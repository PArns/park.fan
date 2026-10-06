/**
 * Derives, per route, which message namespaces have to reach the browser. Plain JS, so
 * `scripts/generate-route-namespaces.mjs` (which writes `i18n/route-namespaces.generated.ts`) and
 * `scripts/check-client-messages.mjs` (which fails on drift) run the same graph walk. See
 * docs/rules/translations-are-routed-not-bundled.md.
 *
 * `useTranslations()` reads the provider's messages only inside a client boundary: a file with
 * `'use client'`, or one imported transitively by such a file. Server Components read through
 * `getTranslations` and need nothing shipped, so they are excluded even though they call the same
 * hook name.
 */
import fs from 'node:fs';
import path from 'node:path';

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs'];

/** Directories scanned for the global client boundary. */
const SOURCE_DIRS = ['app', 'components', 'lib', 'i18n'];

/** `admin`/`dev` render inside their own provider with hand-built messages. */
const EXCLUDED_FROM_BOUNDARY = /[/\\](admin|dev)[/\\]/;

/**
 * Route files that render OUTSIDE a page's `<RouteMessages>`, so whatever they
 * read has to be in the LAYOUT set rather than a route delta.
 *
 * An `error.tsx`, `loading.tsx` or `not-found.tsx` renders without the page's
 * provider, and a nested `layout.tsx` sits above it, so a namespace only in the
 * route's delta would render as a raw key on exactly the screens nobody tests.
 * They guard every descendant segment too, so they are collected tree-wide.
 */
const SHELL_ROUTE_FILES = [
  'layout.tsx',
  'template.tsx',
  'error.tsx',
  'loading.tsx',
  'not-found.tsx',
  'global-error.tsx',
];

/**
 * Components that fetch their message namespaces on demand instead of taking
 * them from the page payload, and the namespaces they load. `FavoritesSection`
 * renders nothing until the visitor has favorites, so the card namespaces it
 * reaches would be dead weight in most routes' HTML. The graph walk stops at
 * these files: whatever is still reachable another way stays eager.
 *
 * @type {{ file: string, namespaces: readonly string[] }[]}
 */
export const LAZY_MESSAGE_BOUNDARIES = [
  {
    file: 'components/parks/favorites-section.tsx',
    // `pushAlerts.*` ride along because `ShowCard` and `AttractionCard` carry the
    // follow and alert bells. `nearby` and `parkCard` are `ParkCard`'s own; a
    // route that already ships them makes no request (`useLazyMessages`).
    namespaces: [
      'parks',
      'attractions',
      'nearby',
      'parkCard',
      'pushAlerts.showBell',
      'pushAlerts.showDialog',
      'pushAlerts.rideBell',
      'pushAlerts.rideDialog',
      'pushAlerts.pushErrors',
    ],
  },
  {
    // Mounted in the layout, so its namespace would otherwise sit in the chrome
    // of every page in six locales — for a panel that only exists once the
    // visitor has planned something, which almost none of them have.
    file: 'components/planner/planner-launcher.tsx',
    // `parks.weather` is the condition label on the context band. It rides in
    // the chunk anyway because `FavoritesSection` asks for all of `parks`, and
    // that is exactly why it is named here: an unstated dependency on another
    // boundary's list breaks silently the day that list narrows.
    namespaces: ['planner', 'parks.weather'],
  },
  {
    // The park calendar's "plan this day" button. Rendered only inside the
    // day-detail dialog, so the chunk is fetched when that opens and the park and
    // calendar pages keep the namespace out of their payload.
    file: 'components/planner/plan-day-button-lazy.tsx',
    namespaces: ['planner'],
  },
];

/** Every namespace any lazy boundary can supply. */
export const LAZY_CHUNK_NAMESPACES = [
  ...new Set(LAZY_MESSAGE_BOUNDARIES.flatMap((b) => b.namespaces)),
].sort();

/**
 * Resolves an import specifier to a file on disk. Bare package specifiers
 * return `null` — the graph deliberately stops at `node_modules`.
 *
 * @param {string} specifier
 * @param {string} fromFile
 * @param {string} root
 * @returns {string | null}
 */
function resolveImport(specifier, fromFile, root) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(fromFile), specifier);
  else return null;

  for (const ext of EXTENSIONS) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  if (fs.existsSync(base)) {
    if (fs.statSync(base).isDirectory()) {
      for (const ext of EXTENSIONS) {
        const index = path.join(base, 'index' + ext);
        if (fs.existsSync(index)) return index;
      }
      return null;
    }
    return base;
  }
  return null;
}

/**
 * Removes comments so prose cannot be mistaken for code: a doc comment quoting
 * `useTranslations('seo.faq')` would register as a call. Only block comments
 * and lines that start with `//` go, since a trailing `//` may be part of a URL
 * inside a string literal.
 *
 * @param {string} source
 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Creates a memoized per-file reader: resolved imports, the namespaces the file
 * reads via `useTranslations`, and whether it opens a client boundary itself.
 *
 * @param {string} root
 */
function createFileReader(root) {
  const cache = new Map();

  return function read(file) {
    const cached = cache.get(file);
    if (cached) return cached;

    let source = '';
    try {
      source = fs.readFileSync(file, 'utf-8');
    } catch {
      // A resolved path that cannot be read (e.g. a directory without an index)
      // contributes nothing; treat it as an empty leaf rather than failing the
      // whole build.
    }

    const imports = new Set();
    // Static `from '…'` and lazy `import('…')` alike: `next/dynamic` boundaries
    // still ship their messages through the same provider, so both count.
    for (const pattern of [/from\s+['"]([^'"]+)['"]/g, /import\(\s*['"]([^'"]+)['"]\s*\)/g]) {
      for (const match of source.matchAll(pattern)) {
        const resolved = resolveImport(match[1], file, root);
        if (resolved) imports.add(resolved);
      }
    }

    const info = {
      imports: [...imports],
      namespaces: [
        ...stripComments(source).matchAll(/useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g),
      ].map((m) => m[1]),
      isClientEntry: /^\s*['"]use client['"]/.test(source.trimStart()),
    };
    cache.set(file, info);
    return info;
  };
}

/**
 * @param {string} dir
 * @param {string[]} [out]
 */
function walkSourceFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      walkSourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * True when `namespace` is already delivered by an entry in `provided`.
 *
 * Only an ancestor counts: shipping `parks` covers `parks.status`, but shipping
 * `parks.status` does NOT cover `parks` — which is exactly the case the layout
 * set creates, since the chrome takes `parks.crowdLevels` + `parks.status` while
 * a park route needs the whole namespace.
 *
 * @param {readonly string[]} provided
 * @param {string} namespace
 */
export function isCoveredBy(provided, namespace) {
  return provided.some((entry) => namespace === entry || namespace.startsWith(entry + '.'));
}

/**
 * Collapses a namespace set so a child is dropped when its parent is present:
 * shipping `parks` already ships `parks.status`.
 *
 * @param {Iterable<string>} namespaces
 * @returns {string[]}
 */
export function collapseNamespaces(namespaces) {
  const sorted = [...new Set(namespaces)].sort();
  const kept = [];
  for (const namespace of sorted) {
    if (kept.some((k) => namespace.startsWith(k + '.'))) continue;
    kept.push(namespace);
  }
  return kept;
}

/**
 * Walks the app directory for route segments that render a page.
 *
 * @param {string} root
 * @param {string} dir  Directory relative to `root`.
 * @param {string[]} [out]
 */
function walkRoutes(root, dir, out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    // `_private` folders are not routable; route groups `(x)` would be, but the
    // app does not use them.
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const sub = path.join(dir, entry.name);
    if (fs.existsSync(path.join(root, sub, 'page.tsx'))) out.push(sub);
    walkRoutes(root, sub, out);
  }
  return out;
}

/**
 * The URL-shaped key a route is addressed by in the generated map.
 *
 * @param {string} routeDir  e.g. `app/[locale]/blog/[slug]`
 * @returns {string}         e.g. `/blog/[slug]`
 */
export function routeKeyFor(routeDir) {
  const rest = routeDir.split(path.sep).slice(2).join('/');
  return rest ? `/${rest}` : '/';
}

/**
 * Derives the layout set and each route's delta.
 *
 * @param {object} [options]
 * @param {string} [options.root]  Repository root.
 * @returns {{
 *   layout: string[],
 *   routes: Record<string, string[]>,
 *   lazy: string[],
 *   consumers: Record<string, Record<string, string[]>>,
 * }}
 */
export function analyzeRouteNamespaces({ root = process.cwd() } = {}) {
  const read = createFileReader(root);

  // 1. Global client boundary: every 'use client' file plus everything it pulls in.
  const clientBoundary = new Set();
  {
    const sourceFiles = SOURCE_DIRS.flatMap((dir) => walkSourceFiles(path.join(root, dir)));
    const stack = sourceFiles.filter(
      (file) => read(file).isClientEntry && !EXCLUDED_FROM_BOUNDARY.test(file)
    );
    while (stack.length > 0) {
      const file = stack.pop();
      if (clientBoundary.has(file)) continue;
      clientBoundary.add(file);
      for (const imported of read(file).imports) {
        if (!clientBoundary.has(imported)) stack.push(imported);
      }
    }
  }

  const lazyFiles = new Set(LAZY_MESSAGE_BOUNDARIES.map((b) => path.join(root, b.file)));
  for (const file of lazyFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(
        `LAZY_MESSAGE_BOUNDARIES points at a file that no longer exists: ${path.relative(root, file)}`
      );
    }
  }

  /**
   * Modules reachable from `entries`. By default a lazy boundary is itself
   * reachable (it still renders) but the walk does not continue THROUGH it —
   * its subtree loads its own messages.
   *
   * Pass `throughLazy` to ignore the boundaries and get everything a route can
   * possibly render, which is what the coverage check below compares against.
   *
   * @param {string[]} entries
   * @param {{ throughLazy?: boolean }} [options]
   */
  function reachableFrom(entries, { throughLazy = false } = {}) {
    const seen = new Set();
    const stack = [...entries];
    while (stack.length > 0) {
      const file = stack.pop();
      if (seen.has(file)) continue;
      seen.add(file);
      if (!throughLazy && lazyFiles.has(file)) continue;
      for (const imported of read(file).imports) {
        if (!seen.has(imported)) stack.push(imported);
      }
    }
    return seen;
  }

  /**
   * Namespaces read inside the client boundary, with the files that read them.
   *
   * @param {Set<string>} files
   */
  function namespacesIn(files) {
    /** @type {Map<string, string[]>} */
    const found = new Map();
    for (const file of files) {
      if (!clientBoundary.has(file)) continue;
      for (const namespace of read(file).namespaces) {
        if (!found.has(namespace)) found.set(namespace, []);
        found.get(namespace).push(path.relative(root, file).split(path.sep).join('/'));
      }
    }
    return found;
  }

  /**
   * Every shell file in the app tree — see {@link SHELL_ROUTE_FILES}. Collected
   * tree-wide because each one guards its own segment AND all of its
   * descendants, so there is no route it can be scoped to.
   *
   * @param {string} dir  Directory relative to `root`.
   * @param {string[]} [out]
   */
  function collectShellFiles(dir, out = []) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) return out;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // `admin`/`dev` render inside their own provider with hand-built messages.
        if (entry.name === 'admin' || entry.name === 'dev') continue;
        collectShellFiles(full, out);
      } else if (SHELL_ROUTE_FILES.includes(entry.name)) {
        out.push(path.join(root, full));
      }
    }
    return out;
  }

  // 2. Everything that renders outside a page's own provider: the chrome (header,
  //    footer, search, banner) plus every error/loading/not-found boundary. Every
  //    route pays this, so it stays in the root provider.
  const localeLayoutDir = path.join('app', '[locale]');
  const layout = collapseNamespaces(namespacesIn(reachableFrom(collectShellFiles('app'))).keys());

  // 3. Per route: everything the route needs on top of the layout set.
  const routeDirs = walkRoutes(root, localeLayoutDir);
  if (fs.existsSync(path.join(root, localeLayoutDir, 'page.tsx'))) {
    routeDirs.unshift(localeLayoutDir);
  }

  /** @type {Record<string, string[]>} */
  const routes = {};
  /** @type {Record<string, Record<string, string[]>>} */
  const consumers = {};
  /** @type {Record<string, string[]>} Namespaces neither shipped nor fetchable. */
  const lazyGaps = {};

  for (const routeDir of routeDirs) {
    // Only `page.tsx`: everything else in the segment is a shell file and was
    // already folded into the layout set above.
    const found = namespacesIn(reachableFrom([path.join(root, routeDir, 'page.tsx')]));
    const required = collapseNamespaces(found.keys());
    // Drop anything the layout set already covers, including children of a
    // layout-provided parent.
    const delta = required.filter((ns) => !isCoveredBy(layout, ns));
    const key = routeKeyFor(routeDir);
    routes[key] = delta;
    consumers[key] = Object.fromEntries([...found].map(([ns, files]) => [ns, files.sort()]));

    // A lazy boundary's own subtree must be fully covered by what the page ships
    // plus what the chunk fetches. `LAZY_CHUNK_NAMESPACES` is declared by hand,
    // so a component added below `FavoritesSection` that reads a namespace no
    // other consumer on the route keeps eager would fall through both and render
    // raw keys — silently, and only for visitors who have favorites.
    const everything = collapseNamespaces(
      namespacesIn(
        reachableFrom([path.join(root, routeDir, 'page.tsx')], { throughLazy: true })
      ).keys()
    );
    const uncovered = everything.filter(
      (ns) =>
        !isCoveredBy(layout, ns) &&
        !isCoveredBy(delta, ns) &&
        !isCoveredBy(LAZY_CHUNK_NAMESPACES, ns)
    );
    if (uncovered.length > 0) lazyGaps[key] = uncovered;
  }

  return { layout, routes, lazy: [...LAZY_CHUNK_NAMESPACES], consumers, lazyGaps };
}
