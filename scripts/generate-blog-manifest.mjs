#!/usr/bin/env node
/**
 * Generate a static blog manifest from content/blog/{locale}/*.md plus
 * the image folders under public/blog/images/. This guarantees the blog
 * works on serverless deployments (Vercel) where Next.js cannot trace
 * dynamic fs.readdirSync() calls into the bundle.
 *
 * Deliberately THREE modules, because the post bodies dwarf everything else
 * (~900 KB against ~50 KB of frontmatter) and every route that so much as asks
 * "does this locale have a blog?" would otherwise bundle all of it:
 *
 *   lib/blog/manifest.ts           BLOG_POSTS_META — frontmatter + everything
 *                                  derived from the body at build time
 *                                  (reading time, the park references that
 *                                  drive the park-page backlinks). Small, and
 *                                  all any listing surface needs.
 *   lib/blog/manifest-bodies.ts    BLOG_POST_BODIES — the markdown itself,
 *                                  keyed `<locale>/<slug>`. Imported by the
 *                                  blog post page and nothing else.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
// Same implementation the app uses at render time — never a second copy here.
import {
  calcReadingTimeMinutes,
  extractGlossaryRefs,
  extractParkRefs,
  extractRideRefs,
} from '../lib/blog/derive.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const BLOG_ROOT = resolve(rootDir, 'content/blog');
const OUTPUT_META = resolve(rootDir, 'lib/blog/manifest.ts');
const OUTPUT_BODIES = resolve(rootDir, 'lib/blog/manifest-bodies.ts');

// Only locale-code directories hold posts (en, de, …). Reserved dirs such as
// `authors/` live alongside them and must not be scanned as locales.
const LOCALE_DIRS = readdirSync(BLOG_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^[a-z]{2}(-[a-z]{2})?$/i.test(d.name))
  .map((d) => d.name);

function isValidSlug(slug) {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

function collectPosts() {
  const posts = [];
  for (const locale of LOCALE_DIRS) {
    const dir = resolve(BLOG_ROOT, locale);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      if (!isValidSlug(slug)) continue;
      const filePath = resolve(dir, file);
      const raw = readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      posts.push({
        locale,
        slug,
        frontmatter: parsed.data,
        content: parsed.content,
      });
    }
  }
  return posts;
}

/**
 * `parkLinks` / `rideLinks` decide which catalog pages link a post, and a bad
 * value fails SILENTLY: a typo'd slug simply matches no park or ride, and a
 * list written into only the German file looks correct in that file while the
 * post is governed post-wide. Both are cheap to catch here, at the moment the
 * author runs the generator, so warn (never fail the build over content).
 */
function warnAboutCatalogLinks(posts) {
  const warnings = [];
  const byPost = new Map();

  // `parkLinks` entries name a park, `rideLinks` entries a `park/ride` pair;
  // both also accept the full `/parks/<continent>/<country>/<city>/…` form.
  const KINDS = [
    { key: 'parkLinks', segments: 1, shape: 'a park slug or /parks/… path' },
    {
      key: 'rideLinks',
      segments: 2,
      shape: 'a parkSlug/rideSlug pair, parkSlug/*, or /parks/… path',
    },
  ];

  for (const post of posts) {
    const file = `content/blog/${post.locale}/${post.slug}.md`;

    for (const { key, segments, shape } of KINDS) {
      const value = post.frontmatter[key];

      if (value !== undefined && value !== true && value !== false && !Array.isArray(value)) {
        warnings.push(`${file}: ${key} must be false or a list (got ${typeof value})`);
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          warnings.push(`${file}: ${key} is an empty list — use \`${key}: false\` to opt out`);
        }
        for (const entry of value) {
          const raw = String(entry).trim();
          const parts = raw.startsWith('/parks/')
            ? raw.slice('/parks/'.length).split('/').filter(Boolean).slice(3)
            : raw.split('/');
          // `rideLinks` also accepts the `parkSlug/*` wildcard (bare form only).
          const ok =
            parts.length === segments &&
            parts.every(
              (part, i) => isValidSlug(part) || (key === 'rideLinks' && i === 1 && part === '*')
            );
          if (!ok) warnings.push(`${file}: ${key} entry "${raw}" is not ${shape}`);
        }
      }

      const groupKey = `${post.frontmatter.translationKey?.trim() || post.slug}|${key}`;
      const group = byPost.get(groupKey) ?? [];
      // Normalised for comparison: order and case don't change what it means.
      const normalised = Array.isArray(value)
        ? JSON.stringify([...value.map((v) => String(v).trim().toLowerCase())].sort())
        : JSON.stringify(value ?? null);
      group.push({ file, normalised });
      byPost.set(groupKey, group);
    }
  }

  for (const [groupKey, group] of byPost) {
    const [key, field] = groupKey.split('|');
    const distinct = new Set(group.map((g) => g.normalised));
    if (distinct.size > 1) {
      warnings.push(
        `"${key}": ${field} differs between translations (it governs the post in ALL languages) — ` +
          group.map((g) => `${g.file} → ${g.normalised}`).join(', ')
      );
    }
  }

  for (const warning of warnings) console.warn(`⚠️  ${warning}`);
  return warnings.length;
}

const posts = collectPosts();
const catalogLinkWarnings = warnAboutCatalogLinks(posts);

const banner = `// AUTO-GENERATED by scripts/generate-blog-manifest.mjs. Do not edit by hand.
// Regenerated as part of \`pnpm prebuild\`.
`;

// Everything a LISTING needs: frontmatter plus the values derived from the body
// at build time, so no consumer has to touch the markdown to render a card, a
// feed entry or a park page's backlinks.
const meta = posts.map((post) => ({
  locale: post.locale,
  slug: post.slug,
  frontmatter: post.frontmatter,
  readingTimeMinutes: calcReadingTimeMinutes(post.content, post.frontmatter.readingTime),
  parkRefs: extractParkRefs(post.content),
  rideRefs: extractRideRefs(post.content),
  glossaryRefs: extractGlossaryRefs(post.content),
}));

const bodies = Object.fromEntries(
  posts.map((post) => [`${post.locale}/${post.slug}`, post.content])
);

const metaModule = `import type { BlogFrontmatter } from './types';

/** A park referenced by a post's body: bare slug, plus the geo paths a full-path \`ref:\` pinned. */
export interface ManifestParkRef {
  slug: string;
  geo?: string[];
  /** The body linked one of the park's rides (not only the park itself). */
  viaRide?: true;
}

/** A ride referenced by a post's body, keyed \`parkSlug/rideSlug\`. */
export interface ManifestRideRef {
  slug: string;
  geo?: string[];
}

export interface ManifestPostMeta {
  locale: string;
  slug: string;
  frontmatter: BlogFrontmatter;
  readingTimeMinutes: number;
  parkRefs: ManifestParkRef[];
  rideRefs: ManifestRideRef[];
  /** Glossary term IDs the body embeds a glossary-widget for — see derive.mjs. */
  glossaryRefs: string[];
}

export const BLOG_POSTS_META: ManifestPostMeta[] = ${JSON.stringify(meta, null, 2)};
`;

const bodiesModule = `/**
 * Post bodies, keyed \`<locale>/<slug>\`. By far the biggest generated artifact —
 * import it ONLY where the markdown is actually rendered, never from a listing
 * surface (see lib/blog/listing.ts).
 */
export const BLOG_POST_BODIES: Record<string, string> = ${JSON.stringify(bodies, null, 2)};
`;

writeFileSync(OUTPUT_META, banner + metaModule);
writeFileSync(OUTPUT_BODIES, banner + bodiesModule);

const kb = (file) => Math.round(readFileSync(file, 'utf8').length / 1024);
console.log(
  `📝 Generated blog manifest: ${posts.length} posts (${kb(OUTPUT_META)} KB meta, ` +
    `${kb(OUTPUT_BODIES)} KB bodies) → ${relative(rootDir, OUTPUT_META)}` +
    (catalogLinkWarnings > 0
      ? `\n   ⚠️  ${catalogLinkWarnings} park/ride link warning(s) above`
      : '')
);
