/**
 * The public changelog: one curated entry per released version.
 *
 * Deliberately NOT derived from `docs/changelog.md`. That file is the internal
 * log — German, written for whoever touches the code next, and it names files,
 * components and measurements. The public page is a rewrite for somebody who
 * uses the site, so the two are separate collections that happen to describe
 * the same releases. See `docs/rules/a-version-is-a-unit-of-communication.md`.
 */

/** A screenshot that carries one release's headline change. */
export interface ChangelogHighlight {
  /** Media database id, `<collection>/<name>` — e.g. `changelog/2-12-0-planner-fit`. */
  image: string;
}

/** The frontmatter of `content/changelog/<version>.md`, as authored. */
export interface ChangelogFrontmatter {
  /** Semver, matching the `version` in `package.json` at the time it was cut. */
  version: string;
  /**
   * Release date, authored as `YYYY-MM-DD`. Typed loosely because YAML hands
   * back a `Date` for an unquoted one; the loader normalises it.
   */
  date: string | Date;
  /** Headline of the release — a sentence, not a version number repeated. */
  title: string;
  /** One paragraph naming what changed for a visitor. */
  summary: string;
  /**
   * `draft` keeps an entry out of the page while a release is being written.
   * Anything else is published, which mirrors the blog's frontmatter (G-5).
   */
  mode?: 'published' | 'draft';
  highlights?: ChangelogHighlight[];
}

/** A highlight with its image resolved out of the media database. */
export interface ResolvedHighlight {
  /** Content-versioned public path, so a retargeted focal point is never served stale. */
  src: string;
  alt: string;
  caption: string | null;
  credit: string | null;
  width: number | null;
  height: number | null;
}

/** One entry, ready to render. */
export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: ResolvedHighlight[];
  /** The markdown body: the sections of this release. */
  content: string;
}
