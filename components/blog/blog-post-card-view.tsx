import Image from 'next/image';
import { BookOpen, Calendar, Clock, Star } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { CardPhoto, CardPhotoFrame } from '@/components/parks/card-photo';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { cn } from '@/lib/utils';
import type { BlogListItem } from '@/lib/blog/types';
import { postPath } from '@/lib/blog/paths';

/**
 * What the row below `sm` paints: a 96 px thumbnail. The panelled card is `display:none` there, so
 * its `sizes` says 96 px too. A lazy `<img>` under `display:none` is never fetched, so only a
 * `priority` card loads both layers; it hands its own `sizes` to the row (see `BlogPostCardView`),
 * so both build the same srcset and React merges the two preloads into one.
 */
const ROW_THUMB_SIZES = '96px';
const FEATURE_SIZES = '(max-width: 640px) 96px, (max-width: 1024px) 100vw, 1024px';
const CARD_SIZES = '(max-width: 640px) 96px, (max-width: 1024px) 50vw, 33vw';

export interface BlogPostCardViewProps {
  post: BlogListItem;
  /** Display name of the author, already resolved. */
  author: string;
  /** Localized category label, already resolved; null when the post has none. */
  categoryLabel: string | null;
  variant?: 'default' | 'compact' | 'feature';
  /**
   * Cover path and where to crop it, both resolved by the SERVER wrapper. Looking
   * them up here would import the media manifest, and this view is rendered inside
   * a client tree (the admin's focal-point previews).
   */
  cover: string | null;
  coverPosition: string;
  /** Mark the cover as LCP priority — set on the first card above the fold. */
  priority?: boolean;
  className?: string;
}

/**
 * The presentational blog post card, split from `BlogPostCard` so it can render in a client tree
 * (the admin's focal-point previews): it takes the author and category label as props and imports
 * nothing server-only. Same visual language as ParkCard and AttractionCard: a photo with two
 * overlapping glass panels and the shared hover lift.
 */
export function BlogPostCardView({
  post,
  variant = 'default',
  priority = false,
  className,
  author,
  categoryLabel,
  cover,
  coverPosition,
}: BlogPostCardViewProps) {
  const f = useFormatter();
  const t = useTranslations('blog');
  const { frontmatter, isFallback, readingTimeMinutes } = post;

  const date = new Date(frontmatter.date);

  // Below `sm` the panelled card loses its photo and its two glass sheets overlap, cutting off the
  // excerpt, so a phone gets the list row for every variant.
  if (variant === 'compact') {
    return (
      <BlogPostRow
        post={post}
        cover={cover}
        coverPosition={coverPosition}
        categoryLabel={categoryLabel}
        className={className}
      />
    );
  }

  const isFeature = variant === 'feature';
  const cardSizes = isFeature ? FEATURE_SIZES : CARD_SIZES;

  return (
    <>
      {/* Phones get the row, everything from `sm` up the panelled card: two markups, because the
          glass is a block of inline styles no breakpoint can switch off. A media query rather
          than `@container/page`: the row is a phone treatment, and `sizes` can only express a
          viewport condition. Below `sm` the page is never inset, so the two agree. See
          docs/rules/a-blog-card-is-a-row-on-phones.md. */}
      <BlogPostRow
        post={post}
        cover={cover}
        coverPosition={coverPosition}
        categoryLabel={categoryLabel}
        priority={priority}
        sizes={priority ? cardSizes : ROW_THUMB_SIZES}
        className={cn('sm:hidden', className)}
      />

      <Link
        href={postPath(post) as '/'}
        className={cn(
          // The card provides its own row tracks from `sm` up, where the 220px
          // floor opens the photo row even when the surrounding grid has none.
          'hidden sm:grid sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]',
          className
        )}
      >
        <article
          className="pk-card-fx group relative isolate row-span-3 grid cursor-pointer [grid-template-rows:subgrid] overflow-hidden rounded-[20px] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1"
          data-card-fx
          style={{ boxShadow: 'var(--pk-card-shadow)' }}
        >
          {/* Photo, z-0: the shared CardPhoto. Portrait editorial covers crop from the centre,
              not the top, so the subject is not sliced down to sky. */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {cover ? (
              <CardPhoto
                src={cover}
                alt={frontmatter.coverImage?.alt ?? frontmatter.title}
                hideOnMobile
                objectPosition={coverPosition}
                sizes={cardSizes}
              />
            ) : (
              // The ground only: the pin goes into the photo strip below, like a cover's frame.
              <BlogCoverFallback slug={post.slug} mark="none" />
            )}
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                'linear-gradient(180deg, var(--pk-scrim-top) 0%, transparent 32%, transparent 56%, var(--pk-scrim-bot) 100%)',
            }}
          />

          <div
            className="pk-panel-top relative z-[3] -mb-4 overflow-hidden"
            style={{
              padding: '14px 16px 13px 16px',
              background: 'var(--pk-panel-highlight-top), var(--pk-panel)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid var(--pk-panel-border)',
              boxShadow: 'inset 0 1px 0 var(--pk-panel-shine), inset 0 -1px 0 rgba(0,0,0,0.06)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 36%)',
                mixBlendMode: 'overlay',
              }}
            />

            {(categoryLabel || frontmatter.featured) && (
              <div className="relative mb-1 flex items-center gap-2">
                {frontmatter.featured && (
                  <span
                    className="bg-primary/15 text-primary inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[9.5px] font-bold tracking-[0.06em] uppercase ring-1 ring-current/30"
                    aria-label={t('featured')}
                  >
                    <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                    {t('featured')}
                  </span>
                )}
                {categoryLabel && (
                  <span
                    className="text-[10.5px] font-semibold tracking-[0.08em] uppercase"
                    style={{ color: 'var(--pk-text-3)' }}
                  >
                    {categoryLabel}
                  </span>
                )}
              </div>
            )}

            <div
              className={cn(
                'relative font-extrabold tracking-[-0.022em] transition-colors group-hover:text-[color:var(--primary)]',
                isFeature ? 'text-[22px] leading-[1.15]' : 'text-[17px] leading-[1.2]'
              )}
              style={{ color: 'var(--pk-text-1)' }}
            >
              <span
                className="overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {frontmatter.title}
              </span>
            </div>

            {/* The excerpt sits under the title; the bottom panel carries only meta. */}
            <p
              className={cn(
                'relative mt-[6px] leading-[1.45]',
                isFeature ? 'text-[13.5px]' : 'text-[12.5px]'
              )}
              style={{ color: 'var(--pk-text-2)' }}
            >
              <span
                className="overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: isFeature ? 3 : 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {frontmatter.excerpt}
              </span>
            </p>
          </div>

          {/* Photo spacer — opens the 1fr middle row. A post without a cover opens it
            too, for `BlogCoverFallback`'s pin: the strip between the panels is what a
            visitor sees of the picture (docs/rules/card-photos-are-two-layers.md), so
            that is where the pin is centred. The featured tile gets a noticeably taller
            image area so it reads as the page's headliner. */}
          <div className={cn('relative z-0', isFeature ? 'sm:min-h-[360px]' : 'sm:min-h-[240px]')}>
            {cover ? (
              <CardPhotoFrame
                src={cover}
                hideOnMobile
                priority={priority}
                objectPosition={coverPosition}
                sizes={cardSizes}
              />
            ) : (
              <BlogCoverFallback ground={false} />
            )}
          </div>

          <div
            className="pk-panel-bot relative z-[3] -mt-4 overflow-hidden"
            style={{
              padding: '13px 16px 14px',
              background: 'var(--pk-panel-highlight-bot), var(--pk-panel)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderTop: '1px solid var(--pk-panel-border)',
              boxShadow: 'inset 0 1px 0 var(--pk-panel-shine), inset 0 -1px 0 rgba(0,0,0,0.03)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'linear-gradient(225deg, rgba(255,255,255,0.14) 0%, transparent 40%)',
                mixBlendMode: 'overlay',
              }}
            />

            <div
              className="relative flex flex-wrap items-center gap-x-[10px] gap-y-1 text-[11.5px] font-medium"
              style={{ color: 'var(--pk-text-2)' }}
            >
              <span className="inline-flex items-center gap-[5px]">
                <Calendar
                  className="h-[11px] w-[11px] shrink-0"
                  style={{ color: 'var(--pk-text-3)' }}
                  aria-hidden="true"
                />
                <time dateTime={frontmatter.date}>
                  {f.dateTime(date, { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
              </span>
              <span style={{ color: 'var(--pk-text-3)' }} aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-[5px]">
                <Clock
                  className="h-[11px] w-[11px] shrink-0"
                  style={{ color: 'var(--pk-text-3)' }}
                  aria-hidden="true"
                />
                <span>{t('readingTime', { minutes: readingTimeMinutes })}</span>
              </span>
              {author && (
                <>
                  <span style={{ color: 'var(--pk-text-3)' }} aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-[5px]">
                    <BookOpen
                      className="h-[11px] w-[11px] shrink-0"
                      style={{ color: 'var(--pk-text-3)' }}
                      aria-hidden="true"
                    />
                    <span style={{ color: 'var(--pk-text-1)' }}>{author}</span>
                  </span>
                </>
              )}
              {isFallback && (
                <Badge
                  variant="outline"
                  className="ml-auto h-4 text-[9px] tracking-wider uppercase"
                >
                  EN
                </Badge>
              )}
            </div>
          </div>
        </article>
      </Link>
    </>
  );
}

interface BlogPostRowProps {
  post: BlogListItem;
  cover: string | null;
  coverPosition: string;
  categoryLabel: string | null;
  priority?: boolean;
  /** `sizes` for the thumbnail; a `priority` card passes its own (see `ROW_THUMB_SIZES`). */
  sizes?: string;
  className?: string;
}

/**
 * The blog post as a list row: thumbnail, category, title, date and reading time. It is the
 * `compact` variant and what every other variant renders below `sm`. No variants of its own, so a
 * lead post and the list under it never show a seam where they stack. The thumbnail keeps the
 * card's `objectPosition`.
 */
function BlogPostRow({
  post,
  cover,
  coverPosition,
  categoryLabel,
  priority = false,
  sizes = ROW_THUMB_SIZES,
  className,
}: BlogPostRowProps) {
  const f = useFormatter();
  const t = useTranslations('blog');
  const { frontmatter, isFallback, readingTimeMinutes } = post;
  const date = new Date(frontmatter.date);

  return (
    <Link
      href={postPath(post) as '/'}
      className={cn(
        'group bg-card hover:bg-accent/30 flex items-start gap-3 rounded-lg p-2 transition-colors',
        className
      )}
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md">
        {cover ? (
          <Image
            src={cover}
            alt={frontmatter.coverImage?.alt ?? frontmatter.title}
            fill
            sizes={sizes}
            className="object-cover"
            style={{ objectPosition: coverPosition }}
            priority={priority}
          />
        ) : (
          <BlogCoverFallback slug={post.slug} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {(categoryLabel || frontmatter.featured) && (
          <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {frontmatter.featured && (
              <span
                className="bg-primary/15 text-primary inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[9.5px] font-bold tracking-[0.06em] uppercase ring-1 ring-current/30"
                aria-label={t('featured')}
              >
                <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                {t('featured')}
              </span>
            )}
            {categoryLabel && (
              <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                {categoryLabel}
              </span>
            )}
          </div>
        )}
        {/* Three lines, not two: the title is the only thing on a row that sells
            the post, and a German headline runs past two lines at 250px. A short
            one costs nothing — `line-clamp` is a ceiling, not a height. */}
        <h3 className="text-foreground group-hover:text-primary line-clamp-3 text-sm leading-tight font-semibold transition-colors">
          {frontmatter.title}
        </h3>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-[7px] gap-y-0.5 text-xs">
          <time dateTime={frontmatter.date}>
            {f.dateTime(date, { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
          <span aria-hidden="true">·</span>
          <span>{t('readingTime', { minutes: readingTimeMinutes })}</span>
          {isFallback && (
            <Badge variant="outline" className="h-4 text-[9px] tracking-wider uppercase">
              EN
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
