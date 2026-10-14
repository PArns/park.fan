import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { badgeLinkProps } from '@/components/ui/badge';
import { BlogCoverFallback } from '@/components/blog/blog-cover-fallback';
import { cn } from '@/lib/utils';

/**
 * The list both overviews draw, `/news` grouped by day and the blog listings by month, in one
 * definition so the two sections read as one surface. No hook and no server-only import: the
 * blog pages render it on the server, `NewsStream` inside its client filter.
 */

/** One entry of a {@link PostStreamGroup}. */
export interface PostStreamItem {
  key: string;
  /** What a client-side filter matches the entry by (the park on `/news`), or `null`. */
  filterKey?: string | null;
  /** The server-rendered entry, a {@link PostStreamEntry}. */
  node: ReactNode;
}

/** A run of entries under one heading: a day on `/news`, a month on the blog. */
export interface PostStreamGroup {
  key: string;
  /** The server-rendered heading, an `<h2>`. */
  heading: ReactNode;
  items: PostStreamItem[];
}

/**
 * The groups, each heading in a sticky column on the left and its entries along a rule on the
 * right; stacked on a phone. `data-stream-group` carries the filter keys of its entries, so a
 * filter can hide a group whose entries it hides without `:has()`
 * (docs/rules/no-has-selector-in-the-stylesheet.md).
 */
export function PostStreamGroups({ groups }: { groups: PostStreamGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const filterKeys = [
          ...new Set(group.items.map((item) => item.filterKey).filter(Boolean)),
        ].join(' ');
        return (
          <section
            key={group.key}
            data-stream-group=""
            data-filter-keys={filterKeys || undefined}
            className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"
          >
            <div className="sm:sticky sm:top-20 sm:self-start sm:pt-4">{group.heading}</div>
            <ol className="sm:border-border/60 space-y-3 sm:border-l sm:pl-8">
              {group.items.map((item) => (
                <li
                  key={item.key}
                  data-stream-item=""
                  data-filter-key={item.filterKey ?? undefined}
                >
                  {item.node}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/**
 * One post in the stream: a label over the title (the park on `/news`, the category on the blog),
 * the title, two lines of teaser, an optional meta line and a small cover on the right. The title
 * and the cover link the post; the cover is out of the tab order, so the post is one stop.
 */
export function PostStreamEntry({
  href,
  title,
  excerpt,
  label,
  meta,
  image,
  imagePosition,
  fallbackSlug,
}: {
  /** Locale-relative path of the post, from `postPath`. */
  href: string;
  title: string;
  excerpt?: string;
  label?: ReactNode;
  meta?: ReactNode;
  /** Cover path, already versioned; `null` draws {@link BlogCoverFallback}. */
  image: string | null;
  /** The cover's focal point as a CSS `object-position`. */
  imagePosition?: string;
  /** The post's slug, which picks the fallback cover's look. */
  fallbackSlug: string;
}) {
  return (
    <article className="border-border bg-card flex gap-4 rounded-2xl border p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        {label}
        <h3
          className={cn('text-base leading-snug font-bold text-pretty sm:text-lg', label && 'mt-2')}
        >
          <Link
            href={href as '/'}
            prefetch={false}
            className="hover:text-primary transition-colors"
          >
            {title}
          </Link>
        </h3>
        {excerpt && <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{excerpt}</p>}
        {meta && <div className="text-muted-foreground/80 mt-2 text-xs">{meta}</div>}
      </div>
      <Link
        href={href as '/'}
        prefetch={false}
        tabIndex={-1}
        aria-hidden="true"
        className="bg-muted relative block aspect-[16/10] w-24 shrink-0 self-start overflow-hidden rounded-xl sm:w-40"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 640px) 160px, 96px"
            style={imagePosition ? { objectPosition: imagePosition } : undefined}
            className="object-cover"
          />
        ) : (
          <BlogCoverFallback slug={fallbackSlug} />
        )}
      </Link>
    </article>
  );
}

/**
 * The label over an entry's title, as a link drawn as a badge, so it reads as a label rather than
 * a second headline: the park on `/news`, the category on the blog.
 */
export function PostStreamLabel({
  href,
  icon: Icon,
  children,
  className,
}: {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      {...badgeLinkProps({
        variant: 'outline',
        className: cn('bg-background/60 max-w-full gap-1.5 px-2.5 py-1', className),
      })}
    >
      <Icon className="text-primary" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

/** The row the filter pills sit in, over the stream. */
export const FILTER_PILL_ROW_CLASS = 'mb-8 flex flex-wrap gap-2';

/**
 * One pill over the stream: the park filter's buttons on `/news`, the category links on the blog.
 * `pressed` is the chosen one.
 */
export function filterPillClass(pressed: boolean): string {
  return cn(
    'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
    pressed
      ? 'bg-primary text-primary-foreground border-transparent'
      : 'border-border bg-card text-foreground hover:bg-muted'
  );
}
