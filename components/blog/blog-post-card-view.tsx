import Image from 'next/image';
import { BookOpen, Calendar, Clock, Star } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { CardPhoto, CardPhotoFrame } from '@/components/parks/card-photo';
import { cn } from '@/lib/utils';
import type { BlogListItem } from '@/lib/blog/types';

/**
 * What the row below `sm` actually paints: a 96px thumbnail. The panelled card is
 * `display:none` there, so its own `sizes` has to say 96px too — otherwise a phone
 * preloads a full-width cover for an element nobody can see, and the two layers
 * then pick the same srcset candidate as the row, i.e. one request instead of two.
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
 * The presentational blog post card.
 *
 * Split out from `BlogPostCard` so it can render anywhere: the wrapper resolves the
 * author and the category label through modules that read the filesystem, which
 * makes it unusable inside a client tree such as the admin's focal-point previews.
 * This half takes those two values as props and imports nothing server-only.
 *
 * Built with the same visual language as ParkCard /
 * AttractionCard: photo background with a reflection seam, two glass panels
 * (`pk-panel-top` / `pk-panel-bot`) that overlap the image, hover lift via
 * the shared `--pk-card-shadow` CSS variables. Keeps the editorial surface
 * visually consistent with the rest of the site.
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
  const { frontmatter, slug, isFallback, readingTimeMinutes } = post;

  const date = new Date(frontmatter.date);

  // ---------- compact + phones: the list row ----------
  // Below `sm` the panelled card hides its photo and collapses to nothing but its
  // two sheets of glass, which then overlap by the 32px they were meant to lay over
  // the picture — so the excerpt gets cut off mid-line and a post costs ~200px of
  // height for a title and a date. The row says the same thing in a third of that
  // and puts the cover back, so it is what a phone gets for every variant.
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

  return (
    <>
      {/* Phones get the row, everything from `sm` up the panelled card. Two
          markups rather than one responsive tree: the glass is a block of inline
          styles, which no breakpoint can switch off. */}
      <BlogPostRow
        post={post}
        cover={cover}
        coverPosition={coverPosition}
        categoryLabel={categoryLabel}
        priority={priority}
        className={cn('sm:hidden', className)}
      />

      <Link
        href={`/blog/${slug}` as '/'}
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
          {/* Photo — z-0. Shared CardPhoto, identical to ParkCard/AttractionCard:
            placeholder + fade-in for a smooth load. `hideOnMobile` is belt and
            braces — the whole card is `display:none` below `sm`, where the row
            above renders instead. Portrait editorial covers crop from the center
            (not the top) so the subject isn't sliced down to sky. */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {cover ? (
              <CardPhoto
                src={cover}
                alt={frontmatter.coverImage?.alt ?? frontmatter.title}
                hideOnMobile
                objectPosition={coverPosition}
                sizes={isFeature ? FEATURE_SIZES : CARD_SIZES}
              />
            ) : (
              <div className="from-muted to-card h-full w-full bg-gradient-to-br" />
            )}
          </div>

          {/* Scrim — z-1 */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                'linear-gradient(180deg, var(--pk-scrim-top) 0%, transparent 32%, transparent 56%, var(--pk-scrim-bot) 100%)',
            }}
          />

          {/* Top glass panel — z-3, mirrors pk-panel-top */}
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
            {/* Diagonal shine overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 36%)',
                mixBlendMode: 'overlay',
              }}
            />

            {/* Category label + optional Featured pill */}
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

            {/* Title */}
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

            {/* Excerpt — single source of truth, right under the title. The
              bottom panel below the cover only carries meta info. */}
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

          {/* Photo spacer — opens the 1fr middle row when there's a cover image.
            The featured tile gets a noticeably taller image area so it reads
            as the page's headliner. */}
          <div
            className={cn(
              'relative z-0',
              cover && (isFeature ? 'sm:min-h-[360px]' : 'sm:min-h-[240px]')
            )}
          >
            {cover && (
              <CardPhotoFrame
                src={cover}
                hideOnMobile
                priority={priority}
                objectPosition={coverPosition}
                sizes={isFeature ? FEATURE_SIZES : CARD_SIZES}
              />
            )}
          </div>

          {/* Bottom glass panel — z-3, mirrors pk-panel-bot */}
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

            {/* Footer meta row — date, reading time and author live here so the
              top panel is reserved for category + title + excerpt. */}
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
  className?: string;
}

/**
 * The blog post as a list row: thumbnail, category, title, date and reading time.
 *
 * Two jobs, one shape. It is the `compact` variant, and it is what every other
 * variant renders below `sm` — the panelled card has no photo there and nothing
 * between its two sheets of glass, so it spends ~200px on a title and a date and
 * clips the excerpt where the panels overlap.
 *
 * **No variants of its own.** The first version had two: a border and three title
 * lines where the row replaced a card, an `-mx-2` bleed and two lines where it sat
 * in a list. On the homepage those meet — the lead post is a card below `sm`, the
 * four under it are the list — and the lead came out inset by 8px, boxed, and with
 * a reading time its neighbours did not have. One row, or the seam shows wherever
 * the two are stacked.
 *
 * The thumbnail carries the same `objectPosition` the card uses, so a focal point
 * tuned in the admin holds at 96×64 too.
 */
function BlogPostRow({
  post,
  cover,
  coverPosition,
  categoryLabel,
  priority = false,
  className,
}: BlogPostRowProps) {
  const f = useFormatter();
  const t = useTranslations('blog');
  const { frontmatter, slug, isFallback, readingTimeMinutes } = post;
  const date = new Date(frontmatter.date);

  return (
    <Link
      href={`/blog/${slug}` as '/'}
      className={cn(
        'group bg-card hover:bg-accent/30 flex items-start gap-3 rounded-lg p-2 transition-colors',
        className
      )}
    >
      {cover && (
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md">
          <Image
            src={cover}
            alt={frontmatter.coverImage?.alt ?? frontmatter.title}
            fill
            sizes={ROW_THUMB_SIZES}
            className="object-cover"
            style={{ objectPosition: coverPosition }}
            priority={priority}
          />
        </div>
      )}
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
