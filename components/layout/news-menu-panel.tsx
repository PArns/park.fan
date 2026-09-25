'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowRight, Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { NewsAge } from '@/components/blog/news-age';
import { newsPostPath } from '@/lib/blog/paths';
import type { NewsMenu } from '@/lib/navigation/news-menu';

/**
 * The news menu: one lead, then the headlines on a time line.
 *
 * It is the blog panel's neighbour in the bar and deliberately does not look like it (see
 * `lib/navigation/news-menu.ts` for why the two are split). The blog panel sells an article by its
 * cover, its teaser and its reading time. A news item is picked by what happened and when, so here
 * only the lead keeps a cover and a teaser, and every item leads with its age (`NewsAge`, in the
 * accent colour for the first seven days) rather than a category, which would be "News" six times.
 *
 * The time line on the right is a border with a dot per item, not a list of cards: headlines one
 * under the other read as a sequence of events, which is what they are.
 *
 * `navigation` for the strings, never `blog` — see `BlogMenuPanel` for the 3 KB that one
 * `useTranslations('blog')` in the header chrome costs every page.
 */
export function NewsMenuPanel({ label, path, items, total }: NewsMenu) {
  const t = useTranslations('navigation');
  const [lead, ...wire] = items;
  if (!lead) return null;

  return (
    <div className="flex flex-col gap-4">
      <div data-menu-stagger>
        <MenuSectionHeading label={t('latestNews')} href={path} />
      </div>

      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* The lead: the one item with a picture and a teaser. */}
        <div data-menu-stagger>
          <Link
            href={newsPostPath(lead.slug) as '/'}
            prefetch={false}
            className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
          >
            {lead.image && (
              <span className="bg-muted relative mb-3 block aspect-[16/9] overflow-hidden rounded-xl">
                <Image
                  src={lead.image}
                  alt=""
                  width={640}
                  height={360}
                  sizes="(min-width: 1024px) 440px, 100vw"
                  style={lead.imagePosition ? { objectPosition: lead.imagePosition } : undefined}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="bg-background/90 text-primary absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] uppercase shadow-sm">
                  <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </span>
              </span>
            )}
            <NewsAge date={lead.date} className="text-xs" />
            <span className="text-foreground group-hover:text-primary mt-1 block text-lg leading-snug font-bold text-pretty transition-colors">
              {lead.title}
            </span>
            {lead.excerpt && (
              <span className="text-muted-foreground mt-1.5 line-clamp-3 block text-[13px] leading-relaxed">
                {lead.excerpt}
              </span>
            )}
          </Link>
        </div>

        {/* The headlines: age and title on a time line, newest at the top. */}
        {wire.length > 0 && (
          <div data-menu-stagger className="flex flex-col">
            <ol className="border-border/70 ml-1 border-l">
              {wire.map((item) => (
                <li key={item.slug} className="relative">
                  <span
                    aria-hidden="true"
                    className="bg-primary/70 absolute top-2.5 -left-[4.5px] size-2 rounded-full"
                  />
                  <Link
                    href={newsPostPath(item.slug) as '/'}
                    prefetch={false}
                    className="group hover:bg-muted/60 ml-3 block rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <NewsAge date={item.date} />
                    <span className="text-foreground group-hover:text-primary mt-0.5 line-clamp-2 block text-sm leading-snug font-semibold text-pretty transition-colors">
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link
              href={path as '/'}
              prefetch={false}
              className="text-primary mt-3 ml-5 inline-flex items-center gap-1.5 self-start text-xs font-semibold hover:underline"
            >
              {t('allNews')}
              <span className="text-muted-foreground font-normal tabular-nums">{total}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
