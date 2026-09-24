'use client';

import { useState, type ReactNode } from 'react';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn } from '@/lib/utils';

export interface NewsStreamItem {
  key: string;
  /** The item's park slug, or `null` when it has none (it then shows only unfiltered). */
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
  slug: string;
  name: string;
  count: number;
}

/** The query parameter the park filter lives in. `/news?park=europa-park` */
const PARK_PARAM = 'park';

/**
 * The news overview's stream, newest day first, with a filter by park.
 *
 * Every entry is rendered on the server and passed in as a node, so the full list is in the
 * first HTML and in the static page. The filter is a query parameter on the one `/news` page,
 * not a URL of its own: the route stays static, and its canonical stays `/news` whatever the
 * parameter says. Clicks write it with `history.replaceState`, so a filtered view can be shared
 * without adding one history entry per click.
 *
 * The filtering itself is CSS, not a re-render: the stream carries `data-news-filter`, and one
 * rule per park hides the other notes and the days left empty. That is what lets a shared
 * `?park=` link arrive filtered. A static page cannot know the parameter on the server, and
 * reading it after hydration drew the full list first and then took most of it away, which
 * moved everything below. The inline script sets the attribute while the HTML is parsed, before
 * the notes are painted. A slug with no rule (an old link, a typo) matches nothing and shows
 * everything. Browsers without `:has()` keep the heading of a day with no match.
 *
 * A pill press only changes that one attribute, so no list is rebuilt in the interaction's
 * commit (`docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md`).
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
  // `undefined` until the reader picks a pill; until then the URL decides, once mounted.
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const mounted = useMounted();
  const fromUrl = mounted ? new URLSearchParams(window.location.search).get(PARK_PARAM) : null;
  const park =
    chosen !== undefined ? chosen : parks.some((p) => p.slug === fromUrl) ? fromUrl : null;

  const choose = (next: string | null) => {
    setChosen(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(PARK_PARAM, next);
    else url.searchParams.delete(PARK_PARAM);
    window.history.replaceState(window.history.state, '', url);
  };

  // Slugs are `[a-z0-9-]`; anything else is dropped rather than escaped into a selector.
  const rules = parks
    .filter((p) => /^[a-z0-9-]+$/.test(p.slug))
    .map(
      ({ slug }) =>
        `[data-news-filter="${slug}"] [data-news-item]:not([data-park="${slug}"]),` +
        `[data-news-filter="${slug}"] [data-news-day]:not(:has([data-park="${slug}"])){display:none}`
    )
    .join('');

  return (
    // `suppressHydrationWarning`: the script below may already have set the attribute from the
    // URL when React hydrates; the state takes it over after mount.
    <div data-news-filter={park ?? ''} suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(s){try{var p=new URLSearchParams(location.search).get(${JSON.stringify(PARK_PARAM)});if(p)s.parentElement.setAttribute("data-news-filter",p)}catch(e){}})(document.currentScript)`,
        }}
      />
      {rules && <style>{rules}</style>}

      {parks.length > 1 && (
        <div role="group" aria-label={filterLabel} className="mb-8 flex flex-wrap gap-2">
          <FilterPill pressed={park === null} onClick={() => choose(null)}>
            {allLabel}
          </FilterPill>
          {parks.map((p) => (
            <FilterPill key={p.slug} pressed={park === p.slug} onClick={() => choose(p.slug)}>
              {p.name}
              <span className="tabular-nums opacity-70">{p.count}</span>
            </FilterPill>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {groups.map((group) => (
          <section
            key={group.key}
            data-news-day=""
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
