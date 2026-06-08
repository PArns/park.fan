import type { BlogFrontmatter } from '@/lib/blog/types';

/** What the editor's form-state holds. All optional/strings so empty fields don't crash. */
export interface EditorFrontmatter {
  title: string;
  excerpt: string;
  date: string;
  updatedAt: string;
  authorKey: string;
  mode: 'published' | 'hidden' | 'draft';
  featured: boolean;
  category: string;
  tags: string[];
  coverSrc: string;
  coverAlt: string;
  coverCredit: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  translationKey: string;
}

/** Convert the form state into the final blog frontmatter shape we serialise to YAML. */
export function toFrontmatter(fm: EditorFrontmatter): BlogFrontmatter {
  const out: BlogFrontmatter = {
    title: fm.title.trim(),
    date: fm.date,
    author: fm.authorKey,
    excerpt: fm.excerpt.trim(),
  };
  if (fm.translationKey.trim()) out.translationKey = fm.translationKey.trim();
  if (fm.updatedAt) out.updatedAt = fm.updatedAt;
  if (fm.mode !== 'published') out.mode = fm.mode;
  if (fm.featured) out.featured = true;
  if (fm.tags.length) out.tags = fm.tags;
  if (fm.category.trim()) out.category = fm.category.trim();
  if (fm.coverSrc.trim()) {
    out.coverImage = {
      src: fm.coverSrc.trim(),
      ...(fm.coverAlt.trim() ? { alt: fm.coverAlt.trim() } : {}),
      ...(fm.coverCredit.trim() ? { credit: fm.coverCredit.trim() } : {}),
    };
  }
  const seo: NonNullable<BlogFrontmatter['seo']> = {};
  if (fm.seoTitle.trim()) seo.title = fm.seoTitle.trim();
  if (fm.seoDescription.trim()) seo.description = fm.seoDescription.trim();
  if (fm.seoKeywords.length) seo.keywords = fm.seoKeywords;
  if (Object.keys(seo).length) out.seo = seo;
  return out;
}

/** Sensible defaults for a fresh post. */
export function emptyFrontmatter(): EditorFrontmatter {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: '',
    excerpt: '',
    date: today,
    updatedAt: '',
    authorKey: '',
    mode: 'draft',
    featured: false,
    category: '',
    tags: [],
    coverSrc: '',
    coverAlt: '',
    coverCredit: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    translationKey: '',
  };
}

/** Slugify a title into a URL-safe post slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
