import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { NewsAge } from '@/components/blog/news-age';
import { cn } from '@/lib/utils';

export interface NewsListItem {
  slug: string;
  title: string;
  /** Publication date, `YYYY-MM-DD`. */
  date: string;
  /** Cover, already versioned. Left out where the list shows no pictures (the header menu). */
  image?: string | null;
}

/**
 * News posts as a short list: age, title and — where there is room — a small cover.
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
    <ul className={cn('grid gap-x-6 gap-y-1', className)}>
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/blog/${item.slug}` as '/'}
            prefetch={false}
            className="group hover:bg-muted/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors"
          >
            {item.image && (
              <span className="bg-muted relative mt-0.5 block aspect-[16/10] w-16 shrink-0 overflow-hidden rounded-md">
                <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <NewsAge date={item.date} />
              <span className="text-foreground group-hover:text-primary line-clamp-2 block text-[13px] leading-snug font-medium text-pretty transition-colors">
                {item.title}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
