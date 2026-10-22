'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { NewsAge } from '@/components/blog/news-age';
import {
  LISTING_SEARCH_INPUT_CLASS,
  PostStreamEntry,
  PostStreamLabel,
} from '@/components/blog/post-stream';
import { slugFromPostPath } from '@/components/blog/blog-cover-fallback';
import { usePostSearchIndex } from '@/lib/hooks/use-post-search-index';
import { usePostMetaLine } from '@/lib/hooks/use-post-meta-line';
import { isPostQuery, searchPosts } from '@/lib/navigation/post-search';
import type { PostSearchEntry } from '@/lib/navigation/blog-menu';

/**
 * The search over a listing: `/blog` searches every article, `/news` every news post, not only
 * the page on screen. Two letters or more swap the listing (`children`, rendered on the server and
 * kept mounted) for the matches, best first, in the stream's own entries; an empty field brings
 * the page back. The list is the site search's (`/api/nav/posts/[locale]`), fetched when the field
 * is first pointed at or focused, so a visit that never searches pays nothing. The field adds no
 * URL: the page keeps its canonical (docs/rules/a-listing-page-is-a-path-with-its-own-canonical.md).
 */
export function ListingSearch({
  scope,
  children,
}: {
  scope: 'articles' | 'news';
  children: ReactNode;
}) {
  // `navigation`: the chrome already ships it, so the field costs these pages no messages.
  const t = useTranslations('navigation');
  const [query, setQuery] = useState('');
  // The field stays urgent; the list it swaps reads a deferred copy, see
  // docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md.
  const deferredQuery = useDeferredValue(query);
  const [armed, setArmed] = useState(false);
  const { data: index, isError } = usePostSearchIndex(armed, scope);
  const searching = isPostQuery(deferredQuery);
  const result = useMemo(
    () => (searching && index ? searchPosts(index, deferredQuery, index.length) : null),
    [searching, index, deferredQuery]
  );
  // Until the list has arrived the page stays, rather than a blank one.
  const showResults = result !== null || (searching && isError);
  const placeholder = scope === 'news' ? t('searchNews') : t('searchArticles');

  return (
    <>
      <div
        role="search"
        className="relative mb-6 w-full sm:max-w-md"
        onPointerEnter={() => setArmed(true)}
      >
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setArmed(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) {
              event.preventDefault();
              setQuery('');
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className={LISTING_SEARCH_INPUT_CLASS}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {result ? t('searchResults', { count: result.total }) : ''}
      </span>

      {showResults && (
        <div>
          {result && result.total > 0 ? (
            <>
              <p className="text-muted-foreground mb-4 text-sm font-medium">
                {t('searchResults', { count: result.total })}
              </p>
              <PostSearchResultList posts={result.matches} />
            </>
          ) : (
            <p className="text-muted-foreground py-6 text-sm">
              {result
                ? scope === 'news'
                  ? t('searchNewsEmpty', { query: deferredQuery.trim() })
                  : t('searchEmpty', { query: deferredQuery.trim() })
                : t('searchFailed')}
            </p>
          )}
        </div>
      )}
      <div hidden={showResults}>{children}</div>
    </>
  );
}

/**
 * Posts found by the site search, in the stream's own entries (`PostStreamEntry`): an article under
 * its category with its date and reading time, a news post with its age. The listings' search and
 * `/search` draw the same list.
 */
export function PostSearchResultList({ posts }: { posts: readonly PostSearchEntry[] }) {
  const metaOf = usePostMetaLine();
  return (
    <ol className="space-y-3">
      {posts.map((post) => (
        <li key={post.path}>
          <PostStreamEntry
            href={post.path}
            title={post.title}
            excerpt={post.excerpt}
            label={
              post.category && post.categoryPath ? (
                <PostStreamLabel href={post.categoryPath} icon={FolderOpen}>
                  {post.category}
                </PostStreamLabel>
              ) : undefined
            }
            meta={post.news ? <NewsAge date={post.date} /> : metaOf(post)}
            image={post.image ?? null}
            imagePosition={post.imagePosition}
            fallbackSlug={slugFromPostPath(post.path)}
          />
        </li>
      ))}
    </ol>
  );
}
