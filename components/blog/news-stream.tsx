'use client';

import { Suspense, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FILTER_PILL_ROW_CLASS,
  filterPillClass,
  PostStreamGroups,
  type PostStreamGroup,
} from '@/components/blog/post-stream';
import { isSlug } from '@/lib/utils/servable-route';

export interface NewsStreamPark {
  /**
   * The filter key, and the value of `?park=`: the park slug, or slug plus city where two parks
   * with news share a slug (`NewsIndexPageBody`).
   */
  slug: string;
  name: string;
  count: number;
}

/** The query parameter the park filter lives in. `/news?park=europa-park` */
const PARK_PARAM = 'park';

/**
 * One page of the news overview's stream (`PostStreamGroups`), newest day first, with a filter by
 * park. Every entry is rendered on the server, so the page's list is in the static HTML. The
 * filter is `?park=` on the page's own URL (the canonical drops it), written with
 * `history.replaceState`, and it filters the page it is on: the pills offer the parks of that
 * page. Filtering is CSS, not a re-render: an inline script sets `data-news-filter` before paint,
 * so a shared link arrives filtered without the list shifting, and one rule per park hides the
 * rest. Days match with `data-filter-keys ~=`, not `:has()`
 * (docs/rules/no-has-selector-in-the-stylesheet.md). After hydration the URL is the only state,
 * and a pill press rebuilds no list
 * (docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md).
 */
export function NewsStream({
  groups,
  parks,
  filterLabel,
  allLabel,
}: {
  /** The days; each item's `filterKey` is its park's {@link NewsStreamPark} slug. */
  groups: PostStreamGroup[];
  parks: NewsStreamPark[];
  filterLabel: string;
  allLabel: string;
}) {
  // The stream's root, whose `data-news-filter` the CSS rules below read. React never renders the
  // attribute: the inline script sets it before paint and `FilterBar` keeps it in step with the
  // URL afterwards, so this component does not re-render when a pill is pressed.
  const rootRef = useRef<HTMLDivElement>(null);

  // Slugs are `[a-z0-9-]`; anything else is dropped rather than escaped into a selector.
  const rules = parks
    .filter((p) => isSlug(p.slug))
    .map(
      ({ slug }) =>
        `[data-news-filter="${slug}"] [data-stream-item]:not([data-filter-key="${slug}"]),` +
        `[data-news-filter="${slug}"] [data-stream-group]:not([data-filter-keys~="${slug}"]){display:none}`
    )
    .join('');

  return (
    // `suppressHydrationWarning`: the script below sets `data-news-filter` from the URL before
    // React hydrates this element.
    <div ref={rootRef} suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(s){try{var p=new URLSearchParams(location.search).get(${JSON.stringify(PARK_PARAM)});if(p)s.parentElement.setAttribute("data-news-filter",p)}catch(e){}})(document.currentScript)`,
        }}
      />
      {rules && <style>{rules}</style>}

      {parks.length > 1 && (
        // The pills read the URL (`useSearchParams`), and on a prerendered page that renders the
        // nearest Suspense boundary in the browser. The boundary sits around the pills alone, so
        // the stream below stays in the static HTML. The fallback is the same row with nothing
        // chosen yet: same height, so the swap after hydration moves nothing.
        <Suspense
          fallback={
            <FilterPills parks={parks} park={null} filterLabel={filterLabel} allLabel={allLabel} />
          }
        >
          <FilterBar
            parks={parks}
            filterLabel={filterLabel}
            allLabel={allLabel}
            rootRef={rootRef}
          />
        </Suspense>
      )}

      <PostStreamGroups groups={groups} />
    </div>
  );
}

/**
 * The pills, driven by the URL. The chosen park IS `?park=`: there is no state of its own, so a
 * navigation to plain `/news` (the header's News entry, the footer link) clears the filter
 * instead of leaving the list filtered under an address that says it is not. `replaceState`
 * integrates with the Next router, so `useSearchParams` sees a pill press as well.
 */
function FilterBar({
  parks,
  filterLabel,
  allLabel,
  rootRef,
}: {
  parks: NewsStreamPark[];
  filterLabel: string;
  allLabel: string;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  const fromUrl = useSearchParams().get(PARK_PARAM);
  const park = fromUrl && parks.some((p) => p.slug === fromUrl) ? fromUrl : null;

  // A DOM write, not state: the list is filtered by CSS and never re-rendered by a pill.
  useEffect(() => {
    rootRef.current?.setAttribute('data-news-filter', park ?? '');
  }, [park, rootRef]);

  const choose = (next: string | null) => {
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(PARK_PARAM, next);
    else url.searchParams.delete(PARK_PARAM);
    window.history.replaceState(window.history.state, '', url);
  };

  return (
    <FilterPills
      parks={parks}
      park={park}
      filterLabel={filterLabel}
      allLabel={allLabel}
      onChoose={choose}
    />
  );
}

function FilterPills({
  parks,
  park,
  filterLabel,
  allLabel,
  onChoose,
}: {
  parks: NewsStreamPark[];
  park: string | null;
  filterLabel: string;
  allLabel: string;
  onChoose?: (next: string | null) => void;
}) {
  return (
    <div role="group" aria-label={filterLabel} className={FILTER_PILL_ROW_CLASS}>
      <FilterPill pressed={park === null} onClick={() => onChoose?.(null)}>
        {allLabel}
      </FilterPill>
      {parks.map((p) => (
        <FilterPill key={p.slug} pressed={park === p.slug} onClick={() => onChoose?.(p.slug)}>
          {p.name}
          <span className="tabular-nums opacity-70">{p.count}</span>
        </FilterPill>
      ))}
    </div>
  );
}

function FilterPill({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={filterPillClass(pressed)}
    >
      {children}
    </button>
  );
}
