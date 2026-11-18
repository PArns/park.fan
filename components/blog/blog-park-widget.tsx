import { getTranslations } from 'next-intl/server';
import { BlogParkCardLive } from './blog-park-card-live';
import { GlassCard } from '@/components/common/glass-card';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import type { ResolvedPark } from '@/lib/blog/park-resolver';
import { BlogWidgetLabel } from '@/components/blog/blog-widget-label';
import { STANDALONE_CARD_ROWS_CLASS } from '@/components/parks/card-rows';
import { cn } from '@/lib/utils';

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
      <BlogWidgetLabel>{tBlog('widget.parkSpotlight')}</BlogWidgetLabel>
      {/* The row template sits on the card, never on this wrapper with the heading, where the
          `auto` tracks collapse against the panels' overlap and slice the name and wait time. */}
      <BlogParkCardLive
        park={park}
        backgroundImage={getParkBackgroundImage({ slug: park.slug, url: park.href })}
        objectPosition={getCardObjectPosition({ slug: park.slug, url: park.href })}
        className={cn(STANDALONE_CARD_ROWS_CLASS, 'h-full')}
      />
    </div>
  );
}
