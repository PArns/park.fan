'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { TAG_FACETS } from '@/lib/media/tags.mjs';
import type { UploadState } from '../_lib/types';
import { PhotoInputs, StateLine } from './photo-inputs';

/**
 * The park itself, for the photographs that belong to no ride.
 *
 * An entrance, a parade, the Halloween dressing of a path: the media database has
 * carried these since it had a park-only level (`getParkOnlyImages`), and the field
 * screen was the one way in that could not produce one, because every input on it
 * hung off a ride.
 *
 * The tags are the other half. A photograph committed from here is `review: true`
 * and gets its subject, weather and light in the evening — but which event a park
 * was dressed for is the one thing the evening cannot recover from the picture
 * alone with any certainty, and it is exactly what makes the photo findable for a
 * post six months later. So this row offers that one facet and nothing else: the
 * full vocabulary is 49 tags across six facets, which is a desk's worth of chips
 * on a screen built for a thumb.
 */

/** The `season` facet of the shared vocabulary — the same list the browser offers. */
const SEASON = TAG_FACETS.find((facet) => facet.id === 'season');

interface ParkRowProps {
  parkName: string;
  /** Uploads not attached to a ride, newest last. */
  states: UploadState[];
  onFiles: (files: FileList | null, tags: string[]) => void;
}

export function ParkRow({ parkName, states, onFiles }: ParkRowProps) {
  // Held here rather than by the page: the selection outlives one upload on
  // purpose — an evening at a Halloween event is a dozen photographs, not one —
  // and nothing outside this row reads it.
  const [tags, setTags] = useState<string[]>([]);

  const toggle = (tag: string) =>
    setTags((current) => {
      if (current.includes(tag)) return current.filter((entry) => entry !== tag);
      // An exclusive facet replaces rather than adds. `season` is not one today,
      // and this row must not be the reason that stops being true silently.
      const cleaned = SEASON?.exclusive
        ? current.filter((entry) => !SEASON.tags.includes(entry))
        : current;
      return [...cleaned, tag];
    });

  return (
    <li className="border-border/40 flex flex-col gap-3 border-b px-4 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{parkName}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Eingang, Deko, Parade — alles, was zu keiner Bahn gehört
          </p>
          {states.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {states.map((state, index) => (
                <StateLine key={index} state={state} />
              ))}
            </div>
          )}
        </div>

        <PhotoInputs subject={parkName} onFiles={(files) => onFiles(files, tags)} />
      </div>

      {SEASON && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-0.5 text-[11px] font-medium tracking-wide uppercase">
            Anlass
          </span>
          {SEASON.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={tags.includes(tag)}
              onClick={() => toggle(tag)}
              className={cn(
                'min-h-9 rounded-lg border px-3 text-xs font-medium transition-colors',
                tags.includes(tag)
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
