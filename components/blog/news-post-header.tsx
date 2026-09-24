import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BLOG_TOP_ID } from '@/lib/blog/toc';
import { resolveAuthor } from '@/lib/blog/authors';
import { NEWS_INDEX_PATH } from '@/lib/blog/paths';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { OWN_PHOTO_AUTHOR } from '@/lib/media/types';
import { PhotoCredit } from '@/components/media/photo-credit';
import { NewsAge } from '@/components/blog/news-age';
import { NewsParkLabel } from '@/components/blog/news-park-label';
import type { NewsPark } from '@/lib/blog/news-park';
import type { Locale } from '@/i18n/config';
import type { BlogPost } from '@/lib/blog/types';

/**
 * The head of a news post: date and park first, then the title, and the cover as a band under
 * it instead of the article's full-bleed hero. A note is short and dated, so the date is the
 * first thing on the page and there is no reading time.
 *
 * It sits in the page flow under the normal header bar, which is why `/news/…` is not one of the
 * header's hero pages (`isBlogPost` in `components/layout/header.tsx`).
 */
export function NewsPostHeader({
  post,
  park,
  currentLocale,
  label,
}: {
  post: BlogPost;
  park: NewsPark | null;
  currentLocale: Locale;
  /** The news section's name, for the link back to the overview. */
  label: string;
}) {
  const t = useTranslations('news');
  const { frontmatter } = post;

  // Same cover rule as the article banner: an SVG cover is skipped.
  const cover =
    frontmatter.coverImage?.src && !/\.svg(\?|$)/i.test(frontmatter.coverImage.src)
      ? versionedPath(frontmatter.coverImage.src)
      : null;
  const coverCredit = frontmatter.coverImage?.credit;
  const showCredit = cover && coverCredit && coverCredit !== OWN_PHOTO_AUTHOR;
  const author = resolveAuthor(frontmatter.author, currentLocale);

  return (
    <header className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={NEWS_INDEX_PATH as '/'}
          prefetch={false}
          className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-[0.12em] uppercase transition-colors"
        >
          <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </Link>
        {park && <NewsParkLabel park={park} />}
      </div>

      <NewsAge date={frontmatter.date} className="mt-4 text-sm" />

      <h1
        id={BLOG_TOP_ID}
        className="text-foreground mt-2 max-w-4xl scroll-mt-24 text-3xl leading-tight font-black tracking-tight text-balance sm:text-4xl"
      >
        {frontmatter.title}
      </h1>
      <p className="text-foreground/80 mt-4 max-w-3xl text-base leading-relaxed sm:text-lg">
        {frontmatter.excerpt}
      </p>
      <p className="text-muted-foreground mt-4 text-sm">{t('byline', { author: author.name })}</p>

      {cover && (
        <div className="bg-muted relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl sm:aspect-[5/2]">
          {/* `priority`: on a phone the band is inside the first screen and is the LCP element. */}
          <Image
            src={cover}
            alt={frontmatter.coverImage?.alt ?? frontmatter.title}
            fill
            priority
            quality={60}
            sizes="(min-width: 1536px) 1504px, (min-width: 1280px) 1248px, 100vw"
            className="object-cover"
            style={{ objectPosition: objectPositionForSrc(cover, '50% 50%') }}
          />
          {showCredit && <PhotoCredit credit={coverCredit} />}
        </div>
      )}
    </header>
  );
}
