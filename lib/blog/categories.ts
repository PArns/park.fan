import 'server-only';
import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Locale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import { listArticles } from './listing';
import type { BlogListItem, CategoryNode } from './types';

const LABELS_PATH = path.resolve(process.cwd(), 'content', 'blog', 'categories.json');

type CategoryLabels = Record<string, Partial<Record<Locale, string>>>;

/**
 * Whether the labels and the tree are kept for the life of the process: yes in production, where
 * nothing writes `categories.json` at runtime and the root layout asks on every page. Per request
 * in development, so an edit shows on reload; a file read with `fs` gets no HMR reset.
 */
const MEMOISE_PER_PROCESS = process.env.NODE_ENV === 'production';

const readLabels = cache((): CategoryLabels => {
  if (!fs.existsSync(LABELS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(LABELS_PATH, 'utf8')) as CategoryLabels;
  } catch {
    return {};
  }
});

let LABELS: CategoryLabels | undefined;

function getLabels(): CategoryLabels {
  if (!MEMOISE_PER_PROCESS) return readLabels();
  return (LABELS ??= readLabels());
}

/**
 * Returns a blog category's label in the locale from `content/blog/categories.json`, falling back
 * to English and then to the title-cased path segment.
 */
export function resolveCategoryLabel(
  fullPath: string,
  locale: Locale,
  fallbackSegment: string
): string {
  const labels = getLabels()[fullPath];
  if (labels) {
    return labels[locale] ?? labels[defaultLocale] ?? prettifySegment(fallbackSegment);
  }
  return prettifySegment(fallbackSegment);
}

function prettifySegment(segment: string): string {
  return segment
    .split('-')
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

/** Parse a slash-separated category path into normalized segments. */
export function parseCategoryPath(input: string | undefined | null): string[] {
  if (!input) return [];
  return input
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Return [["a"], ["a","b"], ["a","b","c"]] from "a/b/c". */
export function categoryPathBreadcrumbs(input: string | undefined | null): string[][] {
  const parts = parseCategoryPath(input);
  return parts.map((_, i) => parts.slice(0, i + 1));
}

/**
 * Builds the blog's category tree from every visible article; news has its own section and never
 * enters it (see docs/rules/news-is-set-apart-from-the-articles.md). Kept per locale in
 * production, so callers share one tree and must not mutate it.
 */
export function buildCategoryTree(locale: Locale): CategoryTree {
  if (!MEMOISE_PER_PROCESS) return buildTree(locale);
  let tree = CATEGORY_TREES.get(locale);
  if (!tree) {
    tree = buildTree(locale);
    CATEGORY_TREES.set(locale, tree);
  }
  return tree;
}

interface CategoryTree {
  root: CategoryNode;
  flat: Map<string, CategoryNode>;
}

const CATEGORY_TREES = new Map<Locale, CategoryTree>();

const buildTree = cache((locale: Locale): CategoryTree => {
  const posts = listArticles(locale);
  const flat = new Map<string, CategoryNode>();

  const ensureNode = (segments: string[]): CategoryNode => {
    const fullPath = segments.join('/');
    const existing = flat.get(fullPath);
    if (existing) return existing;
    const segment = segments[segments.length - 1] ?? '';
    const node: CategoryNode = {
      path: fullPath,
      segment,
      label: resolveCategoryLabel(fullPath, locale, segment),
      directPostCount: 0,
      totalPostCount: 0,
      children: [],
    };
    flat.set(fullPath, node);
    if (segments.length > 1) {
      const parent = ensureNode(segments.slice(0, -1));
      parent.children.push(node);
    }
    return node;
  };

  const root: CategoryNode = {
    path: '',
    segment: '',
    label: '',
    directPostCount: 0,
    totalPostCount: 0,
    children: [],
  };

  for (const post of posts) {
    const segments = parseCategoryPath(post.frontmatter.category);
    if (segments.length === 0) {
      root.directPostCount++;
      root.totalPostCount++;
      continue;
    }
    const node = ensureNode(segments);
    node.directPostCount++;
    for (let i = segments.length; i >= 1; i--) {
      const ancestorPath = segments.slice(0, i).join('/');
      const ancestor = flat.get(ancestorPath);
      if (ancestor) ancestor.totalPostCount++;
    }
    const top = flat.get(segments[0]);
    if (top && !root.children.includes(top)) root.children.push(top);
  }

  const sortNode = (n: CategoryNode) => {
    n.children.sort((a, b) => a.label.localeCompare(b.label));
    n.children.forEach(sortNode);
  };
  sortNode(root);

  return { root, flat };
});

/** Posts whose category path starts with the given segments (inclusive). */
export function filterPostsByCategory(
  posts: readonly BlogListItem[],
  segments: string[]
): BlogListItem[] {
  // Copy: the listings hand out a shared frozen array, and callers of this
  // helper own their result (they paginate and slice it).
  if (segments.length === 0) return [...posts];
  const prefix = segments.join('/');
  return posts.filter((p) => {
    const cat = p.frontmatter.category ?? '';
    if (!cat) return false;
    return cat === prefix || cat.startsWith(`${prefix}/`);
  });
}
