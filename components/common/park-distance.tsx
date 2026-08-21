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
  sample,
  size,
  className,
}: {
  sample: string;
  size: 'sm' | 'md';
  className?: string;
}) {
  return (
    <DistanceReservation sample={sample} size={size} className={className}>
      <Skeleton as="span" className="absolute inset-0 rounded-md" />
    </DistanceReservation>
  );
}

/**
 * The box the resolved badge will occupy, reserved by rendering that badge
 * invisible rather than by guessing a width.
 *
 * A fixed `w-24` was measured at 412px against what actually renders: 104px in
 * French, 112px English, 128px Dutch, 131px German, 149px Italian and 158px
 * Spanish — the reservation was 62px short in the widest locale, and in a
 * `flex-wrap` row being short by any amount flips the line count and moves the
 * whole page. The label is the only thing that varies, so it sizes the box.
 *
 * `sample` uses the widest distance `formatDistance` can return, so a nearby
 * park resolving to "250 m" shrinks inside a box that never moves.
 */
function DistanceReservation({
  sample,
  size,
  className,
  children,
}: {
  sample: string;
  size: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className={cn('relative inline-flex items-center align-middle', className)}>
      <span aria-hidden="true" className="invisible">
        <DistanceBadge distance={sample} size={size} />
      </span>
      {children}
    </span>
  );
}

/**
 * `formatDistance` caps at whole kilometres above 100 km, so "20000 km" is the
 * longest number it can produce — half the planet's circumference, and the
 * widest the badge can ever get for a real position.
 */
const WIDEST_DISTANCE_SAMPLE = 20_000_000;

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

  const sample = `${formatDistance(WIDEST_DISTANCE_SAMPLE)} ${t('awayFrom')}`;

  if (pending) return <DistancePlaceholder sample={sample} size={size} className={className} />;
  // No position is coming. Both headers put this inside a `flex-wrap` meta row that is exactly
  // wide enough to wrap around it on a phone, so dropping the element there does not free up a
  // gap — it un-wraps the row, and the page below moves up a whole line (34px, ~0.106 CLS).
  // Keep the box, empty and unannounced, for as long as the row is narrow enough to care;
  // from `sm` up the row has the width to absorb the change without reflowing, so it goes.
  if (meters === null) return <DistanceGap sample={sample} size={size} className={className} />;

  // The value sits inside the same reservation the placeholder used, so the
  // three states are one box: "250 m" does not shrink it and Spanish does not
  // stretch it, and the row's line count is decided once, before first paint.
  return (
    <DistanceReservation sample={sample} size={size} className={className}>
      <span className="absolute inset-0 flex items-center">
        <DistanceBadge distance={`${formatDistance(meters)} ${t('awayFrom')}`} size={size} />
      </span>
    </DistanceReservation>
  );
}

/**
 * The placeholder's box without the pulse, held below `sm` only — this is the terminal state, so
 * a shimmer would promise a value that is never going to arrive.
 */
function DistanceGap({
  sample,
  size,
  className,
}: {
  sample: string;
  size: 'sm' | 'md';
  className?: string;
}) {
  return <DistanceReservation sample={sample} size={size} className={cn('sm:hidden', className)} />;
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

  if (pending)
    return (
      <DistancePlaceholder
        sample={t('nearestParkAway', { distance: formatDistance(WIDEST_DISTANCE_SAMPLE) })}
        size={size}
        className={className}
      />
    );
  if (meters === null) return null;

  return (
    <DistanceReservation
      sample={t('nearestParkAway', { distance: formatDistance(WIDEST_DISTANCE_SAMPLE) })}
      size={size}
      className={className}
    >
      <span className="absolute inset-0 flex items-center">
        <DistanceBadge
          distance={t('nearestParkAway', { distance: formatDistance(meters) })}
          size={size}
        />
      </span>
    </DistanceReservation>
  );
}
