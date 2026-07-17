#!/usr/bin/env node
/**
 * Generate a static blog manifest from content/blog/{locale}/*.md plus
 * the image folders under public/blog/images/. This guarantees the blog
 * works on serverless deployments (Vercel) where Next.js cannot trace
 * dynamic fs.readdirSync() calls into the bundle.
 *
 * Produces lib/blog/manifest.ts with:
 *   - BLOG_POSTS_RAW: every post's frontmatter + body, keyed by locale + slug
 *   - BLOG_GALLERY_FOLDERS: every /public/blog/images/<folder>/ image listing,
 *     including the optional captions.json overrides
 *   - BLOG_GALLERY_FOLDERS_L10N: per-locale caption overrides for folders that
 *     ship a captions.<locale>.json (consumers fall back to BLOG_GALLERY_FOLDERS)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { resolve, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// sharp is a hard dependency, but never break the manifest build over it — images
// simply ship without intrinsic dimensions (the gallery then falls back to
// height-auto layout, as before dimensions existed).
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  sharp = null;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const BLOG_ROOT = resolve(rootDir, 'content/blog');
const PUBLIC_BLOG_IMAGES = resolve(rootDir, 'public/blog/images');
const OUTPUT_FILE = resolve(rootDir, 'lib/blog/manifest.ts');

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
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

function readCaptions(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Rendered pixel dimensions of an image, honoring EXIF orientation (values 5-8
 * rotate by 90°, swapping the axes the browser ultimately displays). Baked into
 * the manifest so galleries/inline images can reserve their box before the bytes
 * load — without dimensions every image pop-in reflowed the surrounding article.
 */
async function readDimensions(fileAbs) {
  if (!sharp) return null;
  try {
    const meta = await sharp(fileAbs).metadata();
    if (!meta.width || !meta.height) return null;
    const swapped = meta.orientation != null && meta.orientation >= 5;
    return swapped
      ? { width: meta.height, height: meta.width }
      : { width: meta.width, height: meta.height };
  } catch {
    return null;
  }
}

// Turn a captions map (filename → string | {alt,caption,credit}) into BlogImage[].
function buildImages(files, baseUrl, captions, dims) {
  return files.map((name) => {
    const meta = captions[name];
    const fallbackAlt = name.replace(IMAGE_EXT, '').replace(/[-_]+/g, ' ').trim();
    const size = dims[name] ?? undefined;
    if (typeof meta === 'string') {
      return { src: `${baseUrl}${name}`, alt: fallbackAlt, caption: meta, ...size };
    }
    return {
      src: `${baseUrl}${name}`,
      alt: meta?.alt ?? fallbackAlt,
      caption: meta?.caption,
      credit: meta?.credit,
      ...size,
    };
  });
}

// List a folder's images as { base, byLocale }. Per-locale captions live in
// captions.<locale>.json next to captions.json and override it entry-by-entry
// (any filename the locale file omits falls back to the base file), so a
// translator only localises the strings that actually change. `byLocale` holds
// an entry only for locales that ship a captions.<locale>.json.
async function listImages(folderAbs) {
  if (!existsSync(folderAbs) || !statSync(folderAbs).isDirectory()) {
    return { base: [], byLocale: {} };
  }

  const base = readCaptions(resolve(folderAbs, 'captions.json')) ?? {};

  const files = readdirSync(folderAbs, { withFileTypes: true })
    .filter((d) => d.isFile() && IMAGE_EXT.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const relPath = '/' + relative(resolve(rootDir, 'public'), folderAbs).split(sep).join('/');
  const baseUrl = relPath.endsWith('/') ? relPath : `${relPath}/`;

  const dims = {};
  for (const name of files) {
    const d = await readDimensions(resolve(folderAbs, name));
    if (d) dims[name] = d;
  }

  const byLocale = {};
  for (const locale of LOCALE_DIRS) {
    const localeCaptions = readCaptions(resolve(folderAbs, `captions.${locale}.json`));
    if (!localeCaptions) continue;
    const merged = {};
    for (const name of files) {
      const b = base[name];
      const l = localeCaptions[name];
      if (l === undefined) {
        if (b !== undefined) merged[name] = b;
      } else if (typeof l === 'string' || typeof b !== 'object' || b === null) {
        merged[name] = l;
      } else {
        merged[name] = { ...b, ...l };
      }
    }
    byLocale[locale] = buildImages(files, baseUrl, merged, dims);
  }

  return { base: buildImages(files, baseUrl, base, dims), byLocale };
}

async function collectGalleryFolders() {
  const base = {};
  const l10n = {};
  if (!existsSync(PUBLIC_BLOG_IMAGES)) return { base, l10n };

  async function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const sub = resolve(dir, entry.name);
      const relFromPublic = '/' + relative(resolve(rootDir, 'public'), sub).split(sep).join('/');
      // The blog-resolver looks up by leading-slash relative path; index both
      // "/blog/images/foo" and "/blog/images/foo/" for safety.
      const { base: images, byLocale } = await listImages(sub);
      if (images.length > 0) {
        base[relFromPublic] = images;
        base[`${relFromPublic}/`] = images;
        if (Object.keys(byLocale).length > 0) {
          l10n[relFromPublic] = byLocale;
          l10n[`${relFromPublic}/`] = byLocale;
        }
      }
      await walk(sub);
    }
  }
  await walk(PUBLIC_BLOG_IMAGES);
  return { base, l10n };
}

const posts = collectPosts();
const { base: galleries, l10n: galleriesL10n } = await collectGalleryFolders();

const banner = `// AUTO-GENERATED by scripts/generate-blog-manifest.mjs. Do not edit by hand.
// Regenerated as part of \`pnpm prebuild\`.
`;

const body = `import type { BlogFrontmatter, BlogImage } from './types';

export interface ManifestPost {
  locale: string;
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

export const BLOG_POSTS_RAW: ManifestPost[] = ${JSON.stringify(posts, null, 2)};

export const BLOG_GALLERY_FOLDERS: Record<string, BlogImage[]> = ${JSON.stringify(galleries, null, 2)};

/**
 * Per-locale gallery caption overrides, keyed by folder path then locale code.
 * Present only for folders that ship a captions.<locale>.json; consumers fall
 * back to BLOG_GALLERY_FOLDERS for any locale without an override.
 */
export const BLOG_GALLERY_FOLDERS_L10N: Record<string, Record<string, BlogImage[]>> = ${JSON.stringify(galleriesL10n, null, 2)};
`;

writeFileSync(OUTPUT_FILE, banner + body);

console.log(
  `📝 Generated blog manifest: ${posts.length} posts, ${
    Object.keys(galleries).length / 2
  } gallery folders → ${relative(rootDir, OUTPUT_FILE)}`
);
