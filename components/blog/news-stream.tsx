'use client';

import { Suspense, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NewsStreamItem {
  key: string;
  /** The item's park filter key (see {@link NewsStreamPark}), or `null` when it has no park. */
  park: string | null;
  /** The server-rendered entry. */
  node: ReactNode;
}

export interface NewsStreamGroup {
  /** The day, `YYYY-MM-DD`. */
  key: string;
  /** The server-rendered day heading. */
  heading: ReactNode;
  items: NewsStreamItem[];
}

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
 * The news overview's stream, newest day first, with a filter by park. Every entry is rendered on
 * the server, so the full list is in the static page. The filter is `?park=` on the one `/news`
 * page (the canonical stays `/news`), written with `history.replaceState`. Filtering is CSS, not a
 * re-render: an inline script sets `data-news-filter` before paint, so a shared link arrives
 * filtered without the list shifting, and one rule per park hides the rest. Days match with
 * `data-parks ~=`, not `:has()` (docs/rules/no-has-selector-in-the-stylesheet.md). After hydration
 * the URL is the only state, and a pill press rebuilds no list
 * (docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md).
 */
export function NewsStream({
  groups,
  parks,
  filterLabel,
  allLabel,
}: {
  groups: NewsStreamGroup[];
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
    .filter((p) => /^[a-z0-9-]+$/.test(p.slug))
    .map(
      ({ slug }) =>
        `[data-news-filter="${slug}"] [data-news-item]:not([data-park="${slug}"]),` +
        `[data-news-filter="${slug}"] [data-news-day]:not([data-parks~="${slug}"]){display:none}`
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

      <div className="space-y-10">
        {groups.map((group) => (
          <section
            key={group.key}
            data-news-day=""
            data-parks={[...new Set(group.items.map((item) => item.park).filter(Boolean))].join(
              ' '
            )}
            className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"
          >
            <div className="sm:sticky sm:top-20 sm:self-start sm:pt-4">{group.heading}</div>
            <ol className="sm:border-border/60 space-y-3 sm:border-l sm:pl-8">
              {group.items.map((item) => (
                <li key={item.key} data-news-item="" data-park={item.park ?? ''}>
                  {item.node}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
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
    <div role="group" aria-label={filterLabel} className="mb-8 flex flex-wrap gap-2">
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
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
        pressed
          ? 'bg-primary text-primary-foreground border-transparent'
          : 'border-border bg-card text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
