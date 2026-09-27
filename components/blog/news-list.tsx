import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { NewsAge } from '@/components/blog/news-age';
import { cn } from '@/lib/utils';
import { newsPostPath } from '@/lib/blog/paths';

export interface NewsListItem {
  slug: string;
  title: string;
  /** Publication date, `YYYY-MM-DD`. */
  date: string;
  /** Cover, already versioned. A post without one gets a text-only row. */
  image?: string | null;
  /** The cover's focal point as a CSS `object-position`, resolved on the server. */
  imagePosition?: string;
}

/**
 * News posts as a short list: a small cover, the age and the title.
 *
 * News is set a size below the articles on purpose, everywhere it appears (homepage, header menu,
 * park and ride pages): the articles are what the blog is for, the news is what happened this
 * month. Its first line is the post's age ({@link NewsAge}), not its category — every item here is
 * news, and how old it is decides whether it is still worth a click.
 *
 * No server-only imports, so the header menu (a client tree) renders the same component as the
 * server-rendered pages. The caller decides the columns through `className`.
 */
export function NewsList({ items, className }: { items: NewsListItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={cn('grid gap-x-6 gap-y-2', className)}>
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={newsPostPath(item.slug) as '/'}
            prefetch={false}
            className="group hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
          >
            {item.image && (
              <span className="bg-muted relative block aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="112px"
                  style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <NewsAge date={item.date} />
              <span className="text-foreground group-hover:text-primary mt-0.5 line-clamp-3 text-sm leading-snug font-semibold text-pretty transition-colors">
                {item.title}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
