'use client';

import { useTranslations } from 'next-intl';
import { DistanceBadge } from '@/components/common/distance-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDistanceTo, useNearestDistance } from '@/lib/hooks/use-distance-to';
import { formatDistance, type Coordinate } from '@/lib/utils/distance-utils';
import { cn } from '@/lib/utils';

/**
 * Placeholder holding the distance line's height while the visitor's position resolves.
 *
 * The value is client-only, so without it the line pops in and pushes whatever follows down —
 * on the geo cards that is the progress bar, on the park/ride header the whole page below once
 * the meta row wraps. Sized to a typical "12.3 km away", and it collapses (rather than pulsing
 * forever) as soon as we know no position is coming.
 */
function DistancePlaceholder({
  width,
  size,
  className,
}: {
  width: string;
  size: 'sm' | 'md';
  className?: string;
}) {
  return (
    <Skeleton
      as="span"
      aria-hidden="true"
      // Matches the badge's own line height per size (text-xs vs text-sm), so the swap from
      // placeholder to value changes nothing about the layout.
      className={cn('inline-block align-middle', size === 'sm' ? 'h-4' : 'h-5', width, className)}
    />
  );
}

/**
 * "12.3 km away" for a single park, from the visitor's current position.
 *
 * Shows a placeholder while the position resolves, then the distance — or nothing at all when no
 * position is available (denied and no geolocatable IP) or the park has no coordinates.
 * Used on the park detail page and the ride detail page, where the point of reference is the
 * park itself.
 */
export function ParkDistance({
  latitude,
  longitude,
  size = 'sm',
  className,
}: {
  latitude: number | string | null | undefined;
  longitude: number | string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const t = useTranslations('nearby');
  const { meters, pending } = useDistanceTo(latitude, longitude);

  if (pending) return <DistancePlaceholder width="w-24" size={size} className={className} />;
  // No position is coming. Both headers put this inside a `flex-wrap` meta row that is exactly
  // wide enough to wrap around it on a phone, so dropping the element there does not free up a
  // gap — it un-wraps the row, and the page below moves up a whole line (34px, ~0.106 CLS).
  // Keep the box, empty and unannounced, for as long as the row is narrow enough to care;
  // from `sm` up the row has the width to absorb the change without reflowing, so it goes.
  if (meters === null) return <DistanceGap size={size} className={className} />;

  return (
    <DistanceBadge
      distance={`${formatDistance(meters)} ${t('awayFrom')}`}
      size={size}
      className={className}
    />
  );
}

/**
 * The placeholder's box without the pulse, held below `sm` only — this is the terminal state, so
 * a shimmer would promise a value that is never going to arrive.
 */
function DistanceGap({ size, className }: { size: 'sm' | 'md'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block w-24 align-middle sm:hidden',
        size === 'sm' ? 'h-4' : 'h-5',
        className
      )}
    />
  );
}

/**
 * "12.3 km to the nearest park" for a whole region — the continent and country cards on the geo
 * hub pages, where there is no single park to measure against. Shows a placeholder while the
 * position resolves; renders nothing when none is available or the region has no geocoded park.
 */
export function NearestParkDistance({
  coordinates,
  size = 'sm',
  className,
}: {
  coordinates: readonly Coordinate[] | undefined;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const t = useTranslations('nearby');
  const { meters, pending } = useNearestDistance(coordinates);

  if (pending) return <DistancePlaceholder width="w-36" size={size} className={className} />;
  if (meters === null) return null;

  return (
    <DistanceBadge
      distance={t('nearestParkAway', { distance: formatDistance(meters) })}
      size={size}
      className={className}
    />
  );
}
