'use client';

import { useTranslations } from 'next-intl';
import { DistanceBadge } from '@/components/common/distance-badge';
import { useDistanceTo, useNearestDistance } from '@/lib/hooks/use-distance-to';
import { formatDistance, type Coordinate } from '@/lib/utils/distance-utils';

/**
 * "12.3 km away" for a single park, from the visitor's current position.
 *
 * Renders nothing until there is a position (no location permission, no fix yet, or the park has
 * no coordinates) — so it never reserves space it can't fill and never blocks the surrounding
 * server-rendered header. Used on the park detail page and the ride detail page, where the point
 * of reference is the park itself.
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
  const distance = useDistanceTo(latitude, longitude);

  if (distance === null) return null;

  return (
    <DistanceBadge
      distance={`${formatDistance(distance)} ${t('awayFrom')}`}
      size={size}
      className={className}
    />
  );
}

/**
 * "12.3 km to the nearest park" for a whole region — the continent and country cards on the geo
 * hub pages, where there is no single park to measure against. Renders nothing without a position
 * or when the region has no geocoded park.
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
  const distance = useNearestDistance(coordinates);

  if (distance === null) return null;

  return (
    <DistanceBadge
      distance={t('nearestParkAway', { distance: formatDistance(distance) })}
      size={size}
      className={className}
    />
  );
}
