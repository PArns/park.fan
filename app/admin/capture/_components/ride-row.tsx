'use client';

import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/media/geo';
import type { RankedRide } from '@/lib/media/photo-backlog';
import { Chip } from '../../_ui/primitives';
import type { UploadState } from '../_lib/types';
import { PhotoInputs, StateLine } from './photo-inputs';

/**
 * One ride, why it sits where it does, and the two ways to give it a photograph.
 *
 * The inputs and the upload states are in `photo-inputs.tsx`, because the park row
 * needs both and neither is about rides.
 */

/** Why this ride sits where it does, in words rather than a score. */
function ReasonChip({ ride }: { ride: RankedRide }) {
  const { reason } = ride;
  if (reason.kind === 'stats-rank') {
    return (
      <Chip tone="primary">
        Rang {reason.value}
        {ride.p90 !== null && <span className="opacity-70">· P90 {ride.p90} Min.</span>}
      </Chip>
    );
  }
  if (reason.kind === 'headliner') {
    return (
      <Chip tone="primary">
        Headliner
        {reason.value !== null && <span className="opacity-70">· P90 {reason.value} Min.</span>}
      </Chip>
    );
  }
  if (reason.kind === 'wait') return <Chip tone="muted">{reason.value} Min. heute</Chip>;
  return null;
}

interface RideRowProps {
  ride: RankedRide;
  /** Metres from the device, when both the phone and the ride have coordinates. */
  distanceM: number | null;
  /** Uploads currently attached to this ride, newest last. */
  states: UploadState[];
  onFiles: (files: FileList | null) => void;
  /** The one row the screen wants the thumb on: bigger, and camera-first. */
  featured?: boolean;
}

export function RideRow({ ride, distanceM, states, onFiles, featured }: RideRowProps) {
  return (
    <li
      className={cn(
        'border-border/40 flex items-center gap-3 border-b px-4 py-3 last:border-0',
        featured && 'bg-primary/5'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', featured ? 'text-base' : 'text-sm')}>
          {ride.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <ReasonChip ride={ride} />
          {ride.land && <span className="text-muted-foreground text-xs">{ride.land}</span>}
          {distanceM !== null && (
            <span className="text-muted-foreground text-xs">· {formatDistance(distanceM)}</span>
          )}
        </div>
        {states.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {states.map((state, index) => (
              <StateLine key={index} state={state} />
            ))}
          </div>
        )}
      </div>

      <PhotoInputs subject={ride.name} onFiles={onFiles} />
    </li>
  );
}
