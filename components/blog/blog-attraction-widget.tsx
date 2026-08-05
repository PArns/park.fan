import { getTranslations } from 'next-intl/server';
import { BlogAttractionCardLive } from './blog-attraction-card-live';
import { GlassCard } from '@/components/common/glass-card';
import {
  getAttractionBackgroundImage,
  getCardObjectPosition,
  getParkBackgroundImage,
} from '@/lib/utils/park-assets';
import type { ResolvedAttraction, ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogAttractionWidgetProps {
  park: ResolvedPark | null;
  attraction: ResolvedAttraction | null;
  parkSlug: string;
  attractionSlug: string;
  /** When placed in a multi-card row, fill the grid cell instead of sm:w-1/2. */
  inRow?: boolean;
}

/**
 * Inline embeddable attraction card used inside blog posts via:
 *   ```attraction-widget parkSlug=phantasialand slug=taron
 *   ```
 *
 * Mirrors BlogParkWidget — same "Park spotlight"-style intro, falls back
 * gracefully when the API can't resolve the attraction.
 */
export async function BlogAttractionWidget({
  park,
  attraction,
  parkSlug,
  attractionSlug,
  inRow = false,
}: BlogAttractionWidgetProps) {
  const tBlog = await getTranslations('blog');

  if (!park || !attraction) {
    return (
      <GlassCard variant="light" className="not-prose my-8">
        <p className="text-muted-foreground text-sm">
          {tBlog('widget.attractionNotFound', { slug: `${parkSlug}/${attractionSlug}` })}
        </p>
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
        {tBlog('widget.attractionSpotlight')}
      </h3>
      {/* Row template belongs on the card, not on this wrapper — see BlogParkWidget. */}
      <BlogAttractionCardLive
        park={park}
        attraction={attraction}
        attractionBackgroundImage={getAttractionBackgroundImage(
          park.slug,
          attraction.attractionSlug
        )}
        parkBackgroundImage={getParkBackgroundImage(park.slug)}
        objectPosition={getCardObjectPosition(park.slug, attraction.attractionSlug)}
        className="grid h-full [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]"
      />
    </div>
  );
}
