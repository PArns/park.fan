import { getTranslations } from 'next-intl/server';
import { BlogParkCardLive } from './blog-park-card-live';
import { GlassCard } from '@/components/common/glass-card';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogParkWidgetProps {
  park: ResolvedPark | null;
  slug: string;
  /** When placed in a multi-card row, fill the grid cell instead of sm:w-1/2. */
  inRow?: boolean;
}

/**
 * Inline embeddable park card used inside blog posts via:
 *   ```park-widget slug=disney-magic-kingdom
 *   ```
 *
 * Falls back gracefully when the park can't be resolved (e.g. typo in slug
 * or geo data unavailable at render time).
 */
export async function BlogParkWidget({ park, slug, inRow = false }: BlogParkWidgetProps) {
  const tBlog = await getTranslations('blog');

  if (!park) {
    return (
      <GlassCard variant="light" className="not-prose my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  return (
    <div
      className={
        inRow
          ? 'not-prose grid h-full w-full [grid-template-rows:auto_1fr] gap-3'
          : // The fraction is of the article column, whose width follows the page, not the
            // window, while the trip planner is open. `sm:` stays: below it nothing is inset.
            'not-prose clear-both mx-auto my-8 grid w-full [grid-template-rows:auto_1fr] gap-3 sm:w-1/2 @min-[1024px]/page:w-1/3'
      }
    >
      <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {tBlog('widget.parkSpotlight')}
      </h3>
      {/*
        The card's three sections inherit their row tracks via subgrid, so the template sits on the
        card itself, never on this wrapper with the heading: `auto` tracks collapse against the
        panels' `-mb-4`/`-mt-4` overlap and slice the name and wait time. `minmax(220px, 1fr)`
        keeps image-less cards at full height; below `sm` the middle track absorbs the panels'
        16 px overlap. See docs/rules/blog-spotlight-cards.md.
      */}
      <BlogParkCardLive
        park={park}
        backgroundImage={getParkBackgroundImage(park.slug)}
        objectPosition={getCardObjectPosition(park.slug)}
        className="grid h-full [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]"
      />
    </div>
  );
}
