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
          : 'not-prose clear-both mx-auto my-8 grid w-full [grid-template-rows:auto_1fr] gap-3 sm:w-1/2 lg:w-1/3'
      }
    >
      <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {tBlog('widget.parkSpotlight')}
      </h3>
      {/*
        The card's three sections inherit their row tracks via subgrid, so the
        template has to sit on the card itself — not on this wrapper together
        with the heading. Folding both into one `auto auto 1fr auto` grid gave
        the panels `auto` tracks, which collapse against their `-mb-4`/`-mt-4`
        overlap (12px for a header that needs ~78px), slicing the name and the
        wait time in half. Same shape the hover preview and the reference grid
        use; `minmax(220px, 1fr)` also keeps image-less cards at full height.
        Below `sm` the photo is hidden, so the middle track only has to absorb
        the two panels' 16px overlap — `0px` there let them collide and put the
        wait time on top of the status badges.
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
