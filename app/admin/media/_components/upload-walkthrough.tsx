'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Crosshair,
  MapPin,
  SkipForward,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { FIELD_CLASS } from '../../_ui/controls';
import type { AnalyzedFile, Assignment, Vocabulary } from '../_lib/types';
import { Chip, Field, Section } from './panel-ui';

/**
 * Photos, one at a time, in the order they were dropped.
 *
 * A batch of thirty used to arrive as thirty rows of a table, which reads as
 * bookkeeping and gets treated like it: park and ride are filled in because the
 * form asks, and the fields that need someone to actually LOOK at the picture —
 * the focal point, the alt text, whether it is a night shot — are left for a
 * later pass that never happens. The photo itself was an 80 px thumbnail.
 *
 * So the batch becomes a queue. One photo, large enough to judge, with the EXIF
 * findings next to it and the ride shortlist as buttons rather than a slug field.
 * The focal point is set by clicking the picture — this is the one moment every
 * photo in the batch is guaranteed to be in front of somebody, and doing it here
 * costs a click instead of a later trip through the browser.
 *
 * Nothing is written until the whole queue has been walked; the review step is
 * what commits. Skipping is a decision the queue records, not a way out of it.
 */

/** One look for every field in the admin — see `FIELD_CLASS`. */
const INPUT = FIELD_CLASS;

interface Props {
  index: number;
  file: AnalyzedFile;
  blobUrl: string;
  assignment: Assignment;
  vocabulary: Vocabulary;
  total: number;
  doneCount: number;
  onChange: (patch: Partial<Assignment>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onPickPark: () => void;
  onPickRide: () => void;
}

export function UploadWalkthrough({
  index,
  file,
  blobUrl,
  assignment,
  vocabulary,
  total,
  doneCount,
  onChange,
  onBack,
  onNext,
  onSkip,
  onPickPark,
  onPickRide,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const isLast = index === total - 1;

  const setFocusFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect.height) return;
      onChange({
        focus: {
          x: Number(Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1).toFixed(4)),
          y: Number(Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1).toFixed(4)),
        },
      });
    },
    [onChange]
  );

  // Walking a queue is a keyboard job. Guarded on the event target so the same
  // keys still type normally inside the fields on the right.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onBack();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSkip();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNext, onBack, onSkip]);

  const marker = assignment.focus ?? { x: 0.5, y: 0.5 };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-3">
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-foreground h-full rounded-full transition-all"
            style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          {index + 1} / {total}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden">
        {/* The photo, big enough to judge, and the focal-point target in one. */}
        <div className="min-h-0 space-y-2 lg:overflow-y-auto">
          <div
            ref={frameRef}
            role="application"
            aria-label="Click to set the focal point"
            onClick={(e) => setFocusFromEvent(e.clientX, e.clientY)}
            className="border-border relative mx-auto w-fit cursor-crosshair overflow-hidden rounded-xl border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob, never optimized */}
            <img
              src={blobUrl}
              alt=""
              className="block max-h-[46vh] w-auto max-w-full select-none"
              draggable={false}
            />
            {assignment.focus && (
              <span
                className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.55)]"
                style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
              />
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
            <span className="font-mono">{file.name}</span>
            <span>
              {file.width}×{file.height}
            </span>
            {file.lowRes && (
              <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                below {vocabulary.lowResLongEdge}px
              </span>
            )}
            {file.shotAt && (
              <span className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                {file.shotAt}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {file.gps
                ? file.suggestion.park
                  ? `${file.suggestion.park.name} · ${file.suggestion.park.distanceLabel}`
                  : 'no park nearby'
                : 'no GPS'}
            </span>
            <span className="flex items-center gap-1">
              <Crosshair className="h-3 w-3" />
              {assignment.focus
                ? `${marker.x.toFixed(2)} / ${marker.y.toFixed(2)}`
                : 'click the subject to set the focal point'}
            </span>
          </div>
        </div>

        <div className="min-h-0 space-y-3 lg:overflow-y-auto lg:pr-1">
          {/* The ride shortlist is the whole point of the EXIF pass: the nearest
              attraction is right about half the time, but the right one is in the
              top eight in 95 % of cases. Buttons, not a slug field. */}
          <Section
            title="Which ride?"
            hint={
              file.suggestion.rides.length
                ? 'Nearest first. Pick one, or leave it on “park only”.'
                : 'No GPS to rank by — pick from the catalog.'
            }
          >
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={assignment.ride === null}
                onClick={() => onChange({ ride: null, area: null })}
              >
                park only
              </Chip>
              {file.suggestion.rides.map((ride) => (
                <Chip
                  key={ride.slug}
                  active={assignment.ride === ride.slug}
                  onClick={() =>
                    onChange({
                      ride: ride.slug,
                      area: ride.area,
                      park: assignment.park ?? file.suggestion.park?.slug ?? null,
                    })
                  }
                >
                  {ride.name}
                  <span className="opacity-60"> · {ride.distanceLabel}</span>
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Park">
                <div className="flex gap-1">
                  <input
                    className={INPUT}
                    placeholder="park slug"
                    value={assignment.park ?? ''}
                    onChange={(e) => onChange({ park: e.target.value || null })}
                  />
                  <button
                    type="button"
                    onClick={onPickPark}
                    className="border-border hover:bg-muted shrink-0 rounded-md border px-2 text-xs"
                  >
                    Pick…
                  </button>
                </div>
              </Field>
              <Field label="Ride">
                <div className="flex gap-1">
                  <input
                    className={INPUT}
                    placeholder="attraction slug"
                    value={assignment.ride ?? ''}
                    onChange={(e) => onChange({ ride: e.target.value || null })}
                  />
                  <button
                    type="button"
                    onClick={onPickRide}
                    className="border-border hover:bg-muted shrink-0 rounded-md border px-2 text-xs"
                  >
                    Pick…
                  </button>
                </div>
              </Field>
            </div>
          </Section>

          <Section title="Tags">
            {vocabulary.facets.map((facet) => (
              <div key={facet.id}>
                <span className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wide uppercase">
                  {facet.label}
                  {facet.exclusive && <span className="normal-case"> · pick one</span>}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {facet.tags.map((tag) => (
                    <Chip
                      key={tag}
                      active={assignment.tags.includes(tag)}
                      onClick={() => {
                        const has = assignment.tags.includes(tag);
                        if (has) {
                          onChange({ tags: assignment.tags.filter((t) => t !== tag) });
                          return;
                        }
                        // An exclusive facet replaces rather than adds — nothing is
                        // both day and night.
                        const cleaned = facet.exclusive
                          ? assignment.tags.filter((t) => !facet.tags.includes(t))
                          : assignment.tags;
                        onChange({ tags: [...cleaned, tag] });
                      }}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          <Section title="Roles" hint="A unique role can only belong to one image.">
            <div className="flex flex-wrap gap-1.5">
              {vocabulary.roles.map((role) => (
                <Chip
                  key={role}
                  active={assignment.roles.includes(role)}
                  onClick={() =>
                    onChange({
                      roles: assignment.roles.includes(role)
                        ? assignment.roles.filter((r) => r !== role)
                        : [...assignment.roles, role],
                    })
                  }
                >
                  {role}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="Filing & words">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Collection">
                <input
                  className={INPUT}
                  list="upload-collections"
                  value={assignment.collection}
                  onChange={(e) => onChange({ collection: e.target.value })}
                />
              </Field>
              <Field label="File name">
                <input
                  className={INPUT}
                  value={assignment.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Alt text (German)">
              <textarea
                className={cn(INPUT, 'min-h-[52px] resize-y')}
                placeholder="What a screen reader announces"
                value={assignment.alt}
                onChange={(e) => onChange({ alt: e.target.value })}
              />
            </Field>
          </Section>
        </div>
      </div>

      <div className="border-border/70 mt-3 flex shrink-0 items-center gap-2 border-t pt-3">
        <button
          type="button"
          onClick={onBack}
          disabled={index === 0}
          className="border-border hover:bg-muted flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm',
            assignment.skip
              ? 'border-amber-500 text-amber-500'
              : 'border-border hover:bg-muted text-muted-foreground'
          )}
        >
          <SkipForward className="h-4 w-4" />
          {assignment.skip ? 'Skipped — include it' : 'Skip this one'}
        </button>
        <span className="text-muted-foreground ml-auto hidden text-[11px] sm:block">
          ← → to move · S to skip
        </span>
        <button
          type="button"
          onClick={onNext}
          className="bg-foreground text-background flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium"
        >
          {isLast ? 'Review the batch' : 'Next'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
