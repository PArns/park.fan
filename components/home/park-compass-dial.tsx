'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Pin, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CROWD_SOLID_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { placeLabels, placeMarkers } from '@/lib/utils/compass';
import { formatDistance } from '@/lib/utils/distance-utils';

/**
 * The dial's radii, in units of a 100-wide drawing. The dial is a size container, so a unit is
 * also 1 `cqw` and the HTML markers share the SVG's coordinates. From the rim in: the bezel (the
 * „Lünette", 43–49.5) with its ticks at the inner edge and the four letters in its middle, then
 * the face, with the radar's outer range ring at 37.5 and the radius a ride at 0 m would sit at,
 * 8, just outside the reader's arrow.
 *
 * The first bezel ran 40–49.5 and carried numerals every 30° and the heading as a figure. The
 * rides then had a circle of 34 units — 194 px across on a 360 px phone — and at that size 13
 * pairs of Phantasialand's markers sat closer than they are wide. Nobody in a park acts on „120"
 * or „100°"; they act on the ride. The bezel lost the numerals and gave the face the room.
 */
const RANGE_OUTER = 37.5;
const RANGE_INNER = 8;
const FACE = 43;
const RIM = 49.5;
const LETTERS = (FACE + RIM) / 2;
/**
 * Half the view cone, degrees. `rideAhead` looks a little wider than this (30°), so the ride the
 * bar calls „vor dir" is one the cone is on or just touching.
 */
export const CONE_HALF_ANGLE = 26;

/** Marker sizes, px: a ride with something to say, and a closed one, which is a small ring. */
const MARKER_PX = 30;
const CLOSED_PX = 16;
/** Two markers' centres at least this far apart, px: 30 px discs, a 2 px halo each, a hair. */
const MARKER_SPACING_PX = 34;

/**
 * A name label's type, in px: 11 px semibold, whose widest letters run to about 6.5 px, plus 5 px
 * of padding a side, 17 px tall. The layout works from this estimate rather than measuring each
 * label, and it errs wide, so a label drawn centred in its box never reaches the marker.
 */
const LABEL_CHAR_PX = 6.5;
const LABEL_PAD_PX = 10;
const LABEL_HEIGHT_PX = 17;

/** What a marker has to say, which decides how it is drawn. */
export type DialRideKind = 'wait' | 'open' | 'down' | 'refurb' | 'closed';

/** A ride on the dial: where it is and what it says. Only rides with coordinates come here. */
export interface DialRide {
  id: string;
  /** The short name beside the marker (`dialLabel`). */
  name: string;
  /** The marker's accessible name: ride, status or wait, distance, direction. */
  label: string;
  kind: DialRideKind;
  /** Minutes, for `kind: 'wait'`. */
  wait: number | null;
  /** True bearing from the reader, degrees. */
  bearing: number;
  /** Metres from the reader. */
  distance: number;
}

const polar = (radius: number, degrees: number) => {
  const a = (degrees * Math.PI) / 180;
  return { x: 50 + radius * Math.sin(a), y: 50 - radius * Math.cos(a) };
};

/** A ring segment between two radii, `from`–`to` degrees clockwise from north, as a path. */
function annulusSector(inner: number, outer: number, from: number, to: number): string {
  const o1 = polar(outer, from);
  const o2 = polar(outer, to);
  const i2 = polar(inner, to);
  const i1 = polar(inner, from);
  const large = to - from > 180 ? 1 : 0;
  return [
    `M${o1.x} ${o1.y}`,
    `A${outer} ${outer} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L${i2.x} ${i2.y}`,
    `A${inner} ${inner} 0 ${large} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ');
}

/**
 * One ray of the compass rose, split down its middle into a lit and a shaded half the way a
 * printed rose is drawn. `length` is the tip's radius, `base` the radius its shoulders sit at.
 */
function roseRay(angle: number, length: number, base: number) {
  const tip = polar(length, angle);
  const left = polar(base, angle - 45);
  const right = polar(base, angle + 45);
  return {
    lit: `M50 50 L${left.x} ${left.y} L${tip.x} ${tip.y} Z`,
    shade: `M50 50 L${tip.x} ${tip.y} L${right.x} ${right.y} Z`,
  };
}

/**
 * The compass itself: a bezel with its ticks and letters, a face cut out of the park's own photo,
 * a faint rose, the rides as markers with their names, and the reader in the middle.
 *
 * **An instrument, and the rides first.** The face is the park photo the hero above it just
 * showed, blurred and dimmed so it tints rather than competes, with a faint rose; the bezel is a
 * ring of glass with 5° ticks and the four letters (a north triangle under the N covered the
 * letter once the bezel narrowed, and the letter says it). Blue means one thing on it: the reader and
 * the way to the ride in focus. North is drawn in the foreground colour; when it was blue too, a
 * reader facing north saw two blue spikes leave the centre.
 *
 * **A marker says what the ride is doing.** A wait is the number on an opaque disc in the wait
 * colours (`CROWD_SOLID_CLASS`: the 60 % badge fill measured 2.1–3.2 : 1 in the light theme); a
 * breakdown is an orange ring with a warning sign, a refurbishment a wrench, a ride open without
 * a posted wait a green ring. A closed ride is a small hollow ring with nothing in it: ten grey
 * discs with a dash each were ten times the same non-information, and the room they took was
 * room the names needed. Every marker's hit area is 44 px whatever it draws.
 *
 * **What turns with the phone** sits in one layer rotated by `--heading`: the view cone on the
 * face, the lit arc on the bezel, the arrow. `ParkCompass` writes the heading onto that layer
 * directly (`data-heading`), so turning re-renders nothing and restyles nothing else.
 *
 * **Every marker says which ride it is**, where there is room: a short name placed the way a map
 * labels its pins (`placeLabels`), with a hairline to its marker. The pinned ride chooses first,
 * then the nearest; the order does not follow the ride ahead, which reshuffled one or two names
 * every time the reader turned. A label with no free place is left out rather than laid over
 * another. Marker spacing and labels are worked out in px from the measured width: the 10-unit gap
 * the first version used is less than a marker on any dial under 340 px.
 */
export function ParkCompassDial({
  rides,
  range,
  focusId,
  pinnedId,
  onPick,
  compassOn,
  photo,
  coneId,
}: {
  rides: readonly DialRide[];
  /** The outer range ring's distance, in metres. */
  range: number;
  focusId: string | null;
  /** The ride a tap has pinned, or `null` while the bar follows the heading. */
  pinnedId: string | null;
  /** A tap on a marker: pins it, or lets go when it is the pinned one. */
  onPick: (id: string) => void;
  compassOn: boolean;
  /** The park's photo for the face, or `null` for a plain one. */
  photo: { src: string; position: string } | null;
  /** A document-unique id for the SVG gradients. */
  coneId: string;
}) {
  const t = useTranslations('nearby.compass');
  const bevelId = `${coneId}-bevel`;
  const glowId = `${coneId}-glow`;

  // The dial's width in px, to turn px into the drawing's units. 320 until measured: a phone's
  // dial is 290–340 px, and the first layout is redone as soon as the real width lands.
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(
    () =>
      placeMarkers(
        rides.map((r) => ({ bearing: r.bearing, distance: r.distance })),
        {
          range,
          inner: RANGE_INNER,
          outer: RANGE_OUTER,
          minGap: (MARKER_SPACING_PX / width) * 100,
        }
      ),
    [rides, range, width]
  );

  const labels = useMemo(() => {
    const px = (v: number) => (v / width) * 100;
    const order = rides.map((_, i) => i);
    const pinnedIndex = rides.findIndex((r) => r.id === pinnedId);
    if (pinnedIndex > 0) order.unshift(...order.splice(pinnedIndex, 1));
    return placeLabels(
      rides.map((r, i) => ({
        x: points[i].x,
        y: points[i].y,
        width: px(r.name.length * LABEL_CHAR_PX + LABEL_PAD_PX),
        radius: px((r.kind === 'closed' ? CLOSED_PX : MARKER_PX) / 2 + 2),
      })),
      order,
      {
        markerRadius: px(MARKER_PX / 2 + 2),
        height: px(LABEL_HEIGHT_PX),
        gap: px(3),
        reach: px(12),
        // Out to the rim, not only the face: the crowded side of a park is its outer ring, and
        // a name laid over the ticks says more than the ticks.
        face: RIM - 0.8,
        centre: px(20),
      }
    );
  }, [rides, points, pinnedId, width]);

  const focusIndex = rides.findIndex((r) => r.id === focusId);
  const focusPoint = focusIndex >= 0 ? points[focusIndex] : null;

  const cardinals = [
    { key: 'n', angle: 0 },
    { key: 'e', angle: 90 },
    { key: 's', angle: 180 },
    { key: 'w', angle: 270 },
  ] as const;
  const rangeLabel = polar((RANGE_OUTER + FACE) / 2, 135);

  return (
    <div
      ref={boxRef}
      role="group"
      aria-label={t('dialGroup')}
      className="relative aspect-square w-full"
      style={{ containerType: 'inline-size' }}
    >
      {/* The bezel's body, and a plain face under the photo. */}
      <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id={bevelId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.02" />
            <stop offset="1" stopColor="white" stopOpacity="0.07" />
          </linearGradient>
          <radialGradient id={glowId} cx="50" cy="50" r={FACE} gradientUnits="userSpaceOnUse">
            <stop offset="0" className="[stop-color:var(--primary)]" stopOpacity="0.16" />
            <stop offset="1" className="[stop-color:var(--primary)]" stopOpacity="0.02" />
          </radialGradient>
        </defs>
        {/* A ring of glass: a translucent fill over the panel's blurred photo and a sheen. */}
        <circle cx="50" cy="50" r={RIM} className="fill-background/55" />
        <circle cx="50" cy="50" r={RIM} fill={`url(#${bevelId})`} />
        <circle cx="50" cy="50" r={FACE} className="fill-background" />
        {/* A park without a photo still gets a face with some depth to it. */}
        {!photo && <circle cx="50" cy="50" r={FACE} fill={`url(#${glowId})`} />}
      </svg>

      {photo && (
        <div
          className="absolute overflow-hidden rounded-full"
          style={{ inset: `${50 - FACE}%` }}
          aria-hidden="true"
        >
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="128px"
            quality={50}
            className="scale-125 object-cover blur-[3px] dark:saturate-150"
            style={{ objectPosition: photo.position }}
          />
          <div className="bg-background/62 absolute inset-0" />
        </div>
      )}

      {/* The rose, the range rings and their distance, and the route to the ride in focus. */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      >
        {[45, 135, 225, 315].map((a) => {
          const ray = roseRay(a, 13, 2.6);
          return (
            <g key={a}>
              <path d={ray.lit} className="fill-foreground/8" />
              <path d={ray.shade} className="fill-foreground/4" />
            </g>
          );
        })}
        {[0, 90, 180, 270].map((a) => {
          const ray = roseRay(a, 22, 3.6);
          return (
            <g key={a}>
              <path d={ray.lit} className="fill-foreground/14" />
              <path d={ray.shade} className="fill-foreground/7" />
            </g>
          );
        })}
        {[0.5, 1].map((share) => (
          <circle
            key={share}
            cx="50"
            cy="50"
            r={RANGE_INNER + (RANGE_OUTER - RANGE_INNER) * share}
            className="stroke-foreground/35 fill-none"
            strokeWidth="0.5"
            strokeDasharray="0.8 1.4"
          />
        ))}
        {/* The outer ring's distance sits on the band between that ring and the bezel, where it
            reads as the ring's own; a halo keeps it legible over the photo. */}
        <text
          x={rangeLabel.x}
          y={rangeLabel.y}
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(-45 ${rangeLabel.x} ${rangeLabel.y})`}
          className="fill-foreground/80 stroke-background font-semibold tabular-nums"
          strokeWidth="0.8"
          paintOrder="stroke"
          fontSize="3"
        >
          {formatDistance(range)}
        </text>
        {focusPoint && (
          <line
            key={focusId}
            x1="50"
            y1="50"
            x2={50 + focusPoint.x}
            y2={50 + focusPoint.y}
            className="stroke-primary transition-opacity duration-200 starting:opacity-0"
            strokeWidth="0.7"
            strokeDasharray="1.6 1.2"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* „You are here" breathes three times, so the eye finds the middle, then keeps still:
          an endless ping under the arrow was motion with nothing left to say. */}
      <span
        aria-hidden="true"
        className="bg-primary/35 pointer-events-none absolute top-1/2 left-1/2 size-[7cqw] -translate-1/2 rounded-full motion-safe:animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_3_forwards] motion-reduce:hidden"
      />

      {/* What turns with the phone: the cone, the lit arc on the bezel, the arrow. `data-heading`
          is where `ParkCompass` writes the heading; `will-change` gives the layer its own
          compositing, so turning it repaints nothing under it. Without a compass the reader is
          a dot and nothing turns. */}
      {compassOn ? (
        <div
          aria-hidden="true"
          data-compass-facing=""
          data-heading=""
          className="pointer-events-none absolute inset-0 will-change-transform"
          style={{ transform: 'rotate(var(--heading, 0deg))' }}
        >
          <svg viewBox="0 0 100 100" className="size-full">
            <defs>
              <radialGradient id={coneId} cx="50" cy="50" r={FACE} gradientUnits="userSpaceOnUse">
                <stop offset="0" className="[stop-color:var(--primary)]" stopOpacity="0.55" />
                <stop offset="1" className="[stop-color:var(--primary)]" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d={annulusSector(0.01, FACE, -CONE_HALF_ANGLE, CONE_HALF_ANGLE)}
              fill={`url(#${coneId})`}
            />
            <path d={annulusSector(FACE, RIM, -16, 16)} className="fill-primary/30" />
            <polygon
              points="50,41.5 56.5,57 50,53.2 43.5,57"
              className="fill-primary stroke-background"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            cx="50"
            cy="50"
            r="3"
            className="fill-primary stroke-background"
            strokeWidth="1.3"
          />
        </svg>
      )}

      {/* The bezel's ticks and letters, over the lit arc. */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <circle
          cx="50"
          cy="50"
          r={RIM - 0.3}
          className="stroke-foreground/20 fill-none"
          strokeWidth="0.6"
        />
        <circle
          cx="50"
          cy="50"
          r={FACE}
          className="stroke-foreground/30 fill-none"
          strokeWidth="0.5"
        />
        {Array.from({ length: 72 }, (_, i) => {
          const angle = i * 5;
          // The cardinals carry a letter instead.
          if (angle % 90 === 0) return null;
          const major = angle % 30 === 0;
          return (
            <line
              key={angle}
              x1="50"
              y1={50 - FACE - 0.6}
              x2="50"
              y2={50 - FACE - (major ? 2.2 : 1.3)}
              transform={`rotate(${angle} 50 50)`}
              className={major ? 'stroke-foreground/60' : 'stroke-foreground/30'}
              strokeWidth={major ? 0.55 : 0.4}
              strokeLinecap="round"
            />
          );
        })}
        {/* Upright: letters are read, not admired, and a W on its side is not one. */}
        {cardinals.map(({ key, angle }) => (
          <text
            key={key}
            x={polar(LETTERS, angle).x}
            y={polar(LETTERS, angle).y + (angle === 0 ? 0.6 : 0)}
            textAnchor="middle"
            dominantBaseline="central"
            className={cn('font-bold', key === 'n' ? 'fill-foreground' : 'fill-foreground/60')}
            fontSize="4.2"
          >
            {t(key)}
          </text>
        ))}
      </svg>

      {/* A hairline from each marker to its name: a label that had to go diagonally, into a
          cluster, is otherwise a guess as to whose it is. Under the markers, so it starts at
          their edge. */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      >
        {rides.map((r, i) => {
          const box = labels[i];
          if (!box) return null;
          const p = points[i];
          const nx = Math.max(box.x, Math.min(p.x, box.x + box.width));
          const ny = Math.max(box.y, Math.min(p.y, box.y + box.height));
          return (
            <line
              key={r.id}
              x1={50 + p.x}
              y1={50 + p.y}
              x2={50 + nx}
              y2={50 + ny}
              className={focusId === r.id ? 'stroke-primary' : 'stroke-foreground/50'}
              strokeWidth="0.35"
            />
          );
        })}
      </svg>

      {/* The names, under the markers in the stack; they never overlap one, by construction. */}
      {rides.map((r, i) => {
        const box = labels[i];
        if (!box) return null;
        return (
          <span
            key={`${r.id}-label`}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute flex items-center justify-center rounded border px-[5px] text-[11px] leading-none font-semibold whitespace-nowrap shadow-sm transition-colors duration-200',
              focusId === r.id
                ? 'bg-background text-foreground border-primary ring-primary ring-1'
                : 'text-foreground border-white/70 bg-white/85 dark:border-white/15 dark:bg-[oklch(0.13_0.02_241_/_0.82)]'
            )}
            style={{
              left: `calc(50% + ${box.x + box.width / 2}cqw)`,
              top: `calc(50% + ${box.y + box.height / 2}cqw)`,
              height: `${LABEL_HEIGHT_PX}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {r.name}
          </span>
        );
      })}

      {/* One marker per headliner: its direction and, by the radius, its distance. */}
      {rides.map((r, i) => {
        const p = points[i];
        const closed = r.kind === 'closed';
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onPick(r.id)}
            aria-pressed={pinnedId === r.id}
            aria-label={r.label}
            className={cn(
              // The 44 px hit area is the `::after`, centred on whatever the marker draws.
              "focus-visible:ring-ring absolute flex items-center justify-center rounded-full text-xs font-bold tabular-nums transition-shadow after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2 after:rounded-full after:content-[''] focus-visible:ring-2 focus-visible:outline-none",
              closed
                ? 'border-foreground/45 bg-background size-4 border-2 shadow-[0_0_0_2px_var(--background)]'
                : 'size-[30px] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_0_0_2px_var(--background),0_4px_10px_-2px_rgb(0_0_0/0.45)]',
              r.kind === 'wait' && r.wait !== null && CROWD_SOLID_CLASS[waitTimeCrowdTier(r.wait)],
              r.kind === 'open' && 'border-status-operating bg-background border-2',
              r.kind === 'down' && 'border-status-down text-status-down bg-background border-2',
              r.kind === 'refurb' &&
                'border-status-refurbishment text-status-refurbishment bg-background border-2',
              focusId === r.id && 'ring-primary z-10 ring-2'
            )}
            style={{
              left: `calc(50% + ${p.x}cqw)`,
              top: `calc(50% + ${p.y}cqw)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {r.kind === 'wait' && r.wait}
            {r.kind === 'open' && (
              <span aria-hidden="true" className="bg-status-operating size-2 rounded-full" />
            )}
            {r.kind === 'down' && <AlertTriangle className="size-3.5" aria-hidden="true" />}
            {r.kind === 'refurb' && <Wrench className="size-3.5" aria-hidden="true" />}
            {pinnedId === r.id && (
              // Off the corner of whatever the marker draws: on a closed ride's 16 px ring a
              // badge at the 30 px disc's offset covered the ring it was pinning.
              <span
                className={cn(
                  'bg-primary text-primary-foreground ring-background absolute flex items-center justify-center rounded-full ring-2',
                  closed ? '-top-3 -right-3 size-3.5' : '-top-1.5 -right-1.5 size-4'
                )}
              >
                <Pin className={closed ? 'size-2' : 'size-2.5'} aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
