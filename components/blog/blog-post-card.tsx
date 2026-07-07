import Image from 'next/image';
import { BookOpen, Calendar, Clock, Star } from 'lucide-react';
import { useFormatter, useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { CardPhoto } from '@/components/parks/card-photo';
import { cn } from '@/lib/utils';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { resolveAuthor } from '@/lib/blog/authors';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';

interface BlogPostCardProps {
  post: BlogListItem;
  variant?: 'default' | 'compact' | 'feature';
  className?: string;
}

/**
 * Blog post card built with the same visual language as ParkCard /
 * AttractionCard: photo background with a reflection seam, two glass panels
 * (`pk-panel-top` / `pk-panel-bot`) that overlap the image, hover lift via
 * the shared `--pk-card-shadow` CSS variables. Keeps the editorial surface
 * visually consistent with the rest of the site.
 */
export function BlogPostCard({ post, variant = 'default', className }: BlogPostCardProps) {
  const f = useFormatter();
  const t = useTranslations('blog');
  const localeStr = useLocale();
  const locale = localeStr as Locale;
  const { frontmatter, slug, isFallback, readingTimeMinutes } = post;

  const date = new Date(frontmatter.date);
  const author = resolveAuthor(frontmatter.author, locale).name;
  const categoryPath = frontmatter.category ?? '';
  const lastSegment = categoryPath.split('/').filter(Boolean).pop() ?? '';
  const categoryLabel = categoryPath
    ? resolveCategoryLabel(categoryPath, locale, lastSegment)
    : null;

  const cover = frontmatter.coverImage?.src ?? null;

  // ---------- compact: list-row variant, kept simple (no glass panels) ----------
  if (variant === 'compact') {
    return (
      <Link
        href={`/blog/${slug}` as '/'}
        className={cn(
          'group bg-card hover:bg-accent/30 -mx-2 flex items-start gap-3 rounded-lg p-2 transition-colors',
          className
        )}
      >
        {cover && (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md">
            <Image
              src={cover}
              alt={frontmatter.coverImage?.alt ?? frontmatter.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          {categoryLabel && (
            <div className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
              {categoryLabel}
            </div>
          )}
          <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-tight font-semibold transition-colors">
            {frontmatter.title}
          </h3>
          <div className="text-muted-foreground mt-1 text-xs">
            {f.dateTime(date, { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </Link>
    );
  }

  const isFeature = variant === 'feature';

  return (
    <Link
      href={`/blog/${slug}` as '/'}
      className={cn(
        // Each card provides its own row tracks. On phones the photo row
        // collapses to 0 (like ParkCard/AttractionCard) so the card shrinks to
        // just its two glass panels; from `sm` up the 220px floor opens the
        // photo row even when the surrounding grid has no row tracks.
        'grid [grid-template-rows:auto_0px_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]',
        className
      )}
    >
      <article
        className="group relative isolate row-span-3 grid cursor-pointer [grid-template-rows:subgrid] overflow-hidden rounded-[20px] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1"
        style={{ boxShadow: 'var(--pk-card-shadow)' }}
      >
        {/* Photo — z-0. Shared CardPhoto, identical to ParkCard/AttractionCard:
            hidden below `sm` so the card collapses on phones, placeholder +
            fade-in for a smooth load. Portrait editorial covers crop from the
            center (not the top) so the subject isn't sliced down to sky. */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {cover ? (
            <CardPhoto
              src={cover}
              alt={frontmatter.coverImage?.alt ?? frontmatter.title}
              hideOnMobile
              objectPosition="center"
              priority={isFeature}
              sizes={
                isFeature
                  ? '(max-width: 1024px) 100vw, 1024px'
                  : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              }
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
            'relative z-[2]',
            cover && (isFeature ? 'sm:min-h-[360px]' : 'sm:min-h-[220px]')
          )}
        />

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
              <Badge variant="outline" className="ml-auto h-4 text-[9px] tracking-wider uppercase">
                EN
              </Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
