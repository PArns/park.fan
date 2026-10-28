'use client';

import Image from 'next/image';
import { BookOpen, Megaphone, Newspaper } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { NewsAge } from '@/components/blog/news-age';
import { SearchResultRowBody } from '@/components/search/search-result-row-body';
import { usePostMetaLine } from '@/lib/hooks/use-post-meta-line';
import { cn, stripNewPrefix } from '@/lib/utils';
import type { SearchResultItem } from '@/lib/api/types';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { PostSearchEntry } from '@/lib/navigation/blog-menu';
import type { NearbySearchExtras } from '@/lib/hooks/use-hero-browse-parks';

interface SearchResultRowProps {
  result: SearchResultItem & NearbySearchExtras;
  /** The row's 0-based place in its group, which the click reports. */
  position?: number;
  onSelect: (result: SearchResultItem, position?: number) => void;
  className?: string;
}

/** A single park/attraction/show/restaurant/location result row. */
export function SearchResultRow({ result, position, onSelect, className }: SearchResultRowProps) {
  return (
    <CommandItem
      value={`${stripNewPrefix(result.name)} ${result.type} ${result.id}`}
      onSelect={() => onSelect(result, position)}
      className={cn('flex cursor-pointer items-center gap-2.5 sm:gap-4', className)}
    >
      <SearchResultRowBody result={result} />
    </CommandItem>
  );
}

interface GlossaryResultItemProps {
  item: GlossarySearchItem;
  /** The row's 0-based place in its group, which the click reports. */
  position: number;
  onSelect: (item: GlossarySearchItem, position: number) => void;
}

/** A single glossary term result row (shared by the glossary-only and mixed-results branches). */
export function GlossaryResultItem({ item, position, onSelect }: GlossaryResultItemProps) {
  return (
    <CommandItem
      value={`${item.name} glossary`}
      onSelect={() => onSelect(item, position)}
      className="flex cursor-pointer items-center gap-2.5 sm:gap-4"
    >
      <div className="bg-foreground/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl">
        <BookOpen className="text-foreground/65 h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
        <span className="truncate text-sm leading-none font-semibold sm:text-[15px]">
          {item.name}
        </span>
        <span className="text-foreground/45 truncate text-xs">{item.shortDefinition}</span>
      </div>
    </CommandItem>
  );
}

interface PostResultItemProps {
  post: PostSearchEntry;
  position: number;
  onSelect: (post: PostSearchEntry, position: number) => void;
}

/**
 * A guide or news post as a result row: its cover, its title, and under it the category and date
 * of a guide or the age of a news post (`NewsAge`), the line each carries in its own listing.
 */
export function PostResultItem({ post, position, onSelect }: PostResultItemProps) {
  const metaOf = usePostMetaLine();
  const Icon = post.news ? Megaphone : Newspaper;

  return (
    <CommandItem
      value={`${post.title} ${post.path}`}
      onSelect={() => onSelect(post, position)}
      className="flex cursor-pointer items-center gap-2.5 sm:gap-4"
    >
      <div className="bg-foreground/10 relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-11 sm:w-11 sm:rounded-xl">
        {post.image ? (
          <Image
            src={post.image}
            alt=""
            fill
            sizes="96px"
            quality={75}
            className="object-cover"
            style={post.imagePosition ? { objectPosition: post.imagePosition } : undefined}
          />
        ) : (
          <Icon className="text-foreground/65 h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
        <span className="truncate text-sm leading-none font-semibold sm:text-[15px]">
          {post.title}
        </span>
        {post.news ? (
          <NewsAge date={post.date} className="text-xs" />
        ) : (
          <span className="text-foreground/45 truncate text-xs">
            {post.category ? `${post.category} · ${metaOf(post)}` : metaOf(post)}
          </span>
        )}
      </div>
    </CommandItem>
  );
}
