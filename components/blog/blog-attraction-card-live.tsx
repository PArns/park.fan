'use client';

import { AttractionCard } from '@/components/parks/attraction-card';
import { buildAttractionPayload } from '@/lib/blog/attraction-payload';
import { useLiveBlogRide } from '@/lib/blog/use-blog-live';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';
import type { ResolvedAttraction, ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogAttractionCardLiveProps {
  park: ResolvedPark;
  attraction: ResolvedAttraction;
  attractionBackgroundImage?: string | null;
  parkBackgroundImage?: string | null;
  /**
   * Focal point for whichever of the two photos is used, resolved by the server
   * wrapper. `getCardObjectPosition` walks the same ride-then-park fallback, so
   * the point always belongs to the picture that ends up on the card.
   */
  objectPosition?: string;
  /** Wrapper classes — the callers own the card's grid-row template. */
  className?: string;
}

/**
 * `AttractionCard` for a blog ride reference, kept live in the browser, shared by the hover
 * preview and the `?full` spotlight. Status and wait come from the post-wide batch poll; today's
 * figures and the sparkline need the full detail, fetched only once the card is on screen, so a
 * post naming a dozen rides loads one batch, not a dozen payloads.
 */
export function BlogAttractionCardLive({
  park,
  attraction,
  attractionBackgroundImage,
  parkBackgroundImage,
  objectPosition,
  className,
}: BlogAttractionCardLiveProps) {
  const { ref, active } = useActiveOnScreen();
  const { park: livePark, attraction: liveAttraction } = useLiveBlogRide(park, attraction, {
    withDetail: active,
  });

  const currentPark = livePark ?? park;
  const currentAttraction = liveAttraction ?? attraction;

  return (
    <div ref={ref} className={className}>
      <AttractionCard
        attraction={buildAttractionPayload(currentPark, currentAttraction)}
        parkPath={currentPark.href}
        parkStatus={currentPark.status}
        backgroundImage={attractionBackgroundImage ?? parkBackgroundImage ?? undefined}
        objectPosition={objectPosition}
        showParkName
        timezone={currentPark.timezone}
        closedPermanently={currentAttraction.closedPermanently}
      />
    </div>
  );
}
