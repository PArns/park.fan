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
  /** Wrapper classes — the callers own the card's grid-row template. */
  className?: string;
}

/**
 * `AttractionCard` for a blog ride reference, kept live in the browser.
 *
 * Shared by the hover preview and the `?full` spotlight so both show the same state. Status and
 * wait come from the post-wide batch poll; the card also renders today's average/peak and the
 * sparkline, which the batch doesn't carry — those need the full attraction detail, so it's
 * fetched only once the card is actually on screen (a hover preview qualifies the moment it
 * opens). A post naming a dozen rides therefore loads one batch, not a dozen detail payloads.
 */
export function BlogAttractionCardLive({
  park,
  attraction,
  attractionBackgroundImage,
  parkBackgroundImage,
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
        showParkName
        timezone={currentPark.timezone}
      />
    </div>
  );
}
