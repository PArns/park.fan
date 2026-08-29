'use client';

import { useId } from 'react';
import { Camera, Check, CloudUpload, Images, Loader2, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/media/geo';
import type { RankedRide } from '@/lib/media/photo-backlog';
import { Chip } from '../../_ui/primitives';
import type { UploadState } from '../_lib/types';

/**
 * One ride, and the two ways to give it a photograph.
 *
 * Two inputs rather than one, because on iOS the `capture` attribute is the whole
 * difference between the two gestures a person actually has. With it, the tap opens
 * the camera and nothing else. Without it, the tap opens the action sheet —
 * Fotomediathek, Aufnehmen, Datei auswählen — which is the way to a picture that
 * was taken earlier and cropped or straightened in the Fotos app since. Offering
 * only the first would mean every edited photograph had to go through the desktop.
 *
 * The library input takes several files at once: picking four shots of one ride is
 * one gesture, and they are named `<slug>`, `<slug>-2`, `<slug>-3` in order.
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

function StateLine({ state }: { state: UploadState }) {
  if (state.kind === 'reading')
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" /> wird gelesen
      </span>
    );
  if (state.kind === 'uploading')
    return (
      <span className="text-primary flex items-center gap-1.5 text-xs">
        <CloudUpload className="h-3 w-3 animate-pulse" /> wird hochgeladen
      </span>
    );
  if (state.kind === 'done')
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="h-3 w-3" /> im Pull Request
      </span>
    );
  if (state.kind === 'queued')
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-400">
        <CloudUpload className="h-3 w-3" /> wartet auf Netz
      </span>
    );
  return (
    <span className="text-destructive flex items-start gap-1.5 text-xs">
      <TriangleAlert className="mt-px h-3 w-3 shrink-0" />
      <span className="min-w-0 break-words">{state.reason}</span>
    </span>
  );
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
  const id = useId();

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

      <div className="flex shrink-0 gap-2">
        {/* 44 px minimum on both, because this is operated one-handed while
            holding a phone, and a 32 px icon button is a coin toss with a thumb. */}
        <label
          htmlFor={`${id}-cam`}
          className="border-primary/40 bg-primary/15 text-primary hover:bg-primary/25 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-colors active:scale-95"
        >
          <Camera className="h-5 w-5" />
          <span className="sr-only">{ride.name} fotografieren</span>
        </label>
        <input
          id={`${id}-cam`}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            onFiles(event.target.files);
            // Cleared so photographing the same ride twice in a row fires `change`
            // again — the second file has the same name as the first.
            event.target.value = '';
          }}
        />

        <label
          htmlFor={`${id}-lib`}
          className="border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-colors active:scale-95"
        >
          <Images className="h-5 w-5" />
          <span className="sr-only">{ride.name}: Bild aus der Mediathek</span>
        </label>
        <input
          id={`${id}-lib`}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>
    </li>
  );
}
