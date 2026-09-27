'use client';

import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CircleDashed, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CROWD_BADGE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { placeLabels } from '@/lib/utils/compass';
import { formatDistance } from '@/lib/utils/distance-utils';

/**
 * The dial's radii, in units of a 100-wide drawing. The dial is a size container, so a unit is
 * also 1 `cqw` and the HTML markers share the SVG's coordinates. From the rim in: the bezel (the
 * „Lünette", 40–49.5) with its ticks at the inner edge and its numerals at 45.4, then the face,
 * with the radar's outer range ring at 34 and the radius a ride at 0 m would sit at, 8, just
 * outside the reader's arrow.
 */
export const RANGE_OUTER = 34;
export const RANGE_INNER = 8;
const FACE = 40;
const RIM = 49.5;
const NUMERALS = 45.4;

/**
 * A name label's type, in px: 10 px semibold, whose widest letters run to about 5.9 px, plus 4 px
 * of padding a side, 15 px tall. The layout works from this estimate rather than from measuring
 * each label, and it errs wide, so a label drawn centred in its box never reaches the marker.
 */
const LABEL_CHAR_PX = 5.9;
const LABEL_PAD_PX = 8;
const LABEL_HEIGHT_PX = 15;
/** The markers are 30 px across. */
const MARKER_RADIUS_PX = 15;

/** A marker on the face: where it sits (cqw from the centre) and what it says. */
export interface DialMarker {
  id: string;
  /** The short name drawn next to the marker (`dialLabel`). */
  name: string;
  /** The marker's accessible name: ride, wait, distance. */
  label: string;
  wait: number | null;
  point: { x: number; y: number };
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
 * The compass itself: a bezel with its degrees, a face cut out of the park's own photo, a faint
 * rose, the rides as markers, and the reader in the middle.
 *
 * **It is an instrument, not a radar.** The first version was a flat disc with ticks; it read as
 * any radar widget on any site. What makes this one the park's: the face is the park photo the
 * hero above it just showed (blurred and dimmed under the markers, so it tints rather than
 * competes), and the bezel is drawn the way a real one is, 5° ticks, numerals every 30° set along
 * the ring (turned over in its lower half), north marked with a triangle. The bezel is glass like
 * the panel it sits on: a translucent fill over the panel's blurred photo, a sheen, a lit edge.
 *
 * **What turns with the phone** sits in one layer rotated by `--heading`: the view cone on the
 * face, the lit arc on the bezel, the arrow. The heading readout rides the bezel at the same angle
 * and stays upright (rotate, push out, rotate back), and its figure is written by the caller
 * through `headingRef`, so none of it re-renders React.
 *
 * **The route.** The ride the bar under the dial names gets a dashed line from the reader to it,
 * so a tap on a marker, or turning towards one, shows the way in the drawing too.
 *
 * **Every marker says which ride it is**, where there is room: a short name beside it, placed the
 * way a map labels its pins (`placeLabels`), with a hairline to its marker. The ride in focus
 * chooses first, then the nearest; a label with no free place is left out rather than laid over
 * another. The
 * layout is in the drawing's units, so it needs the dial's width to turn the labels' pixels into
 * them, and it is re-run when the width changes.
 *
 * Layers from the bottom: the bezel's body, the photo, the rose and rings with the route, the
 * turning layer, the bezel's ticks and numerals, the markers, the readout. The numerals are over
 * the lit arc, which is why the bezel is drawn in two halves.
 */
export function ParkCompassDial({
  markers,
  focusId,
  pinnedId,
  onPick,
  compassOn,
  range,
  photo,
  coneId,
  headingRef,
}: {
  markers: readonly DialMarker[];
  focusId: string | null;
  /** The ride a tap has pinned, or `null` while the bar follows the heading. */
  pinnedId: string | null;
  /** A tap on a marker: pins it, or lets go when it is the pinned one. */
  onPick: (id: string) => void;
  compassOn: boolean;
  /** The outer range ring's distance, in metres. */
  range: number;
  /** The park's photo for the face, or `null` for a plain one. */
  photo: { src: string; position: string } | null;
  /** A document-unique id for the cone's gradient. */
  coneId: string;
  /** The readout's figure; the caller writes the heading into it. */
  headingRef: Ref<HTMLSpanElement>;
}) {
  const t = useTranslations('nearby.compass');
  const focus = markers.find((m) => m.id === focusId) ?? null;
  const bevelId = `${coneId}-bevel`;
  const glowId = `${coneId}-glow`;

  const cardinals = [
    { key: 'n', angle: 0 },
    { key: 'e', angle: 90 },
    { key: 's', angle: 180 },
    { key: 'w', angle: 270 },
  ] as const;
  const numerals = [30, 60, 120, 150, 210, 240, 300, 330];

  // The dial's width in px, to turn the labels' px into the drawing's units. 320 until measured:
  // a phone's dial is 290–340 px, and the first layout is redone as soon as the real width lands.
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

  const labels = useMemo(() => {
    const unit = (px: number) => (px / width) * 100;
    const focusIndex = markers.findIndex((m) => m.id === focusId);
    const order = markers.map((_, i) => i);
    if (focusIndex > 0) order.unshift(...order.splice(focusIndex, 1));
    return placeLabels(
      markers.map((m) => ({
        x: m.point.x,
        y: m.point.y,
        width: unit(m.name.length * LABEL_CHAR_PX + LABEL_PAD_PX),
      })),
      order,
      {
        markerRadius: unit(MARKER_RADIUS_PX + 1),
        height: unit(LABEL_HEIGHT_PX),
        gap: unit(2),
        reach: unit(12),
        // Out to the rim, not only the face: the crowded side of a park is its outer ring, and a
        // name laid over a numeral says more than the numeral.
        face: RIM - 0.8,
        centre: unit(20),
      }
    );
  }, [markers, focusId, width]);

  return (
    <div
      ref={boxRef}
      className="relative aspect-square w-full"
      style={{ containerType: 'inline-size' }}
    >
      {/* The bezel's body and a plain face under the photo. */}
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
        {/* The bezel is a ring of glass: a translucent fill over the panel's blurred photo, a
            sheen across it, a lit edge at the top left. */}
        <circle cx="50" cy="50" r={RIM} className="fill-background/55" />
        <circle cx="50" cy="50" r={RIM} fill={`url(#${bevelId})`} />
        <circle cx="50" cy="50" r={FACE} className="fill-background" />
        {/* A park without a photo still gets a face with some depth to it. */}
        {!photo && <circle cx="50" cy="50" r={FACE} fill={`url(#${glowId})`} />}
      </svg>

      {photo && (
        <div className="absolute inset-[10%] overflow-hidden rounded-full" aria-hidden="true">
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="128px"
            quality={50}
            className="scale-125 object-cover blur-[3px] saturate-150"
            style={{ objectPosition: photo.position }}
          />
          <div className="bg-background/62 absolute inset-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,var(--background)_0%,transparent_35%,transparent_70%,var(--background)_100%)] opacity-80" />
        </div>
      )}

      {/* The rose, the range rings, and the route to the ride in focus. */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      >
        {[45, 135, 225, 315].map((a) => {
          const ray = roseRay(a, 17, 3.2);
          return (
            <g key={a}>
              <path d={ray.lit} className="fill-foreground/10" />
              <path d={ray.shade} className="fill-foreground/5" />
            </g>
          );
        })}
        {[0, 90, 180, 270].map((a) => {
          const ray = roseRay(a, 29, 4.2);
          return (
            <g key={a}>
              <path d={ray.lit} className={a === 0 ? 'fill-primary/45' : 'fill-foreground/15'} />
              <path d={ray.shade} className={a === 0 ? 'fill-primary/25' : 'fill-foreground/7'} />
            </g>
          );
        })}
        {[0.5, 1].map((share) => (
          <circle
            key={share}
            cx="50"
            cy="50"
            r={RANGE_INNER + (RANGE_OUTER - RANGE_INNER) * share}
            className="stroke-foreground/25 fill-none"
            strokeWidth="0.35"
            strokeDasharray="0.8 1.4"
          />
        ))}
        {focus && (
          <line
            x1="50"
            y1="50"
            x2={50 + focus.point.x}
            y2={50 + focus.point.y}
            className="stroke-primary"
            strokeWidth="0.7"
            strokeDasharray="1.6 1.2"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* What turns with the phone: the cone, the lit arc on the bezel, the arrow. Without a
          compass the reader is a dot and nothing turns. */}
      {compassOn ? (
        <div
          aria-hidden="true"
          data-compass-facing=""
          className="pointer-events-none absolute inset-0"
          style={{ transform: 'rotate(var(--heading))' }}
        >
          <svg viewBox="0 0 100 100" className="size-full">
            <defs>
              <radialGradient id={coneId} cx="50" cy="50" r={FACE} gradientUnits="userSpaceOnUse">
                <stop offset="0" className="[stop-color:var(--primary)]" stopOpacity="0.55" />
                <stop offset="1" className="[stop-color:var(--primary)]" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d={annulusSector(0.01, FACE, -26, 26)} fill={`url(#${coneId})`} />
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
      {/* „You are here" breathes, so the eye finds the middle; still under reduced motion. */}
      <span
        aria-hidden="true"
        className="bg-primary/35 pointer-events-none absolute top-1/2 left-1/2 size-[7cqw] -translate-1/2 rounded-full motion-safe:animate-ping"
      />

      {/* The bezel's ticks and numerals, over the lit arc. */}
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
        <path
          d={`M${polar(RIM - 0.9, 285).x} ${polar(RIM - 0.9, 285).y} A${RIM - 0.9} ${RIM - 0.9} 0 0 1 ${polar(RIM - 0.9, 15).x} ${polar(RIM - 0.9, 15).y}`}
          className="fill-none stroke-white/40"
          strokeWidth="0.6"
          strokeLinecap="round"
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
          // The cardinals carry a letter instead; north a triangle.
          if (angle % 90 === 0) return null;
          const major = angle % 30 === 0;
          const mid = !major && angle % 10 === 0;
          return (
            <line
              key={angle}
              x1="50"
              y1={50 - FACE - 0.9}
              x2="50"
              y2={50 - FACE - (major ? 3.4 : mid ? 2.4 : 1.7)}
              transform={`rotate(${angle} 50 50)`}
              className={major ? 'stroke-foreground/70' : 'stroke-foreground/35'}
              strokeWidth={major ? 0.6 : 0.4}
              strokeLinecap="round"
            />
          );
        })}
        {/* North: a triangle where its tick would be. */}
        <polygon
          points={`48.3,${50 - FACE - 0.6} 51.7,${50 - FACE - 0.6} 50,${50 - FACE - 3.8}`}
          className="fill-primary"
        />
        {numerals.map((a) => (
          <text
            key={a}
            x="50"
            y={50 - NUMERALS}
            // Along the ring, and turned over in its lower half so none stands on its head.
            transform={
              a > 90 && a < 270
                ? `rotate(${a} 50 50) rotate(180 50 ${50 - NUMERALS})`
                : `rotate(${a} 50 50)`
            }
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground font-medium tabular-nums"
            fontSize="3.3"
          >
            {a}
          </text>
        ))}
        {/* The letters stand upright: they are read, not admired, and a W on its side is not one. */}
        {cardinals.map(({ key, angle }) => (
          <text
            key={key}
            x={polar(NUMERALS, angle).x}
            y={polar(NUMERALS, angle).y}
            textAnchor="middle"
            dominantBaseline="central"
            className={cn('font-bold', key === 'n' ? 'fill-primary' : 'fill-foreground')}
            fontSize="4.8"
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
        {markers.map((m, i) => {
          const box = labels[i];
          if (!box) return null;
          const nx = Math.max(box.x, Math.min(m.point.x, box.x + box.width));
          const ny = Math.max(box.y, Math.min(m.point.y, box.y + box.height));
          return (
            <line
              key={m.id}
              x1={50 + m.point.x}
              y1={50 + m.point.y}
              x2={50 + nx}
              y2={50 + ny}
              className={focusId === m.id ? 'stroke-primary' : 'stroke-foreground/60'}
              strokeWidth="0.35"
            />
          );
        })}
      </svg>

      {/* The names, under the markers in the stack; they never overlap one, by construction. */}
      {markers.map((m, i) => {
        const box = labels[i];
        if (!box) return null;
        return (
          <span
            key={`${m.id}-label`}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute flex items-center justify-center rounded px-1 text-[10px] leading-none font-semibold whitespace-nowrap shadow-sm',
              focusId === m.id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground border border-white/70 bg-white/80 dark:border-white/15 dark:bg-[oklch(0.13_0.02_241_/_0.78)]'
            )}
            style={{
              left: `calc(50% + ${box.x + box.width / 2}cqw)`,
              top: `calc(50% + ${box.y + box.height / 2}cqw)`,
              height: `${LABEL_HEIGHT_PX}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {m.name}
          </span>
        );
      })}

      {/* One marker per headliner: its direction and, by the radius, its distance. */}
      {markers.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onPick(m.id)}
          aria-pressed={pinnedId === m.id}
          aria-label={m.label}
          className={cn(
            'absolute flex size-[30px] items-center justify-center rounded-full border text-xs font-bold tabular-nums shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_0_0_2px_var(--background),0_4px_10px_-2px_rgb(0_0_0/0.45)] transition-[box-shadow,scale]',
            m.wait === null
              ? 'bg-muted text-muted-foreground border-border'
              : cn(CROWD_BADGE_CLASS[waitTimeCrowdTier(m.wait)], 'border-transparent'),
            focusId === m.id &&
              'ring-primary ring-offset-background z-10 scale-115 ring-2 ring-offset-2'
          )}
          style={{
            left: `calc(50% + ${m.point.x}cqw)`,
            top: `calc(50% + ${m.point.y}cqw)`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {m.wait ?? '–'}
          {pinnedId === m.id && (
            <span className="bg-primary text-primary-foreground ring-background absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full ring-2">
              <Pin className="size-2.5" aria-hidden="true" />
            </span>
          )}
        </button>
      ))}

      {/* The heading as a figure, riding the bezel where the reader looks and standing upright:
          turn to the heading, push out to the numerals, turn back. */}
      {compassOn && (
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground pointer-events-none absolute top-1/2 left-1/2 rounded-full px-1.5 py-px text-[11px] leading-4 font-bold tabular-nums shadow-md"
          style={{
            transform: `translate(-50%, -50%) rotate(var(--heading)) translateY(-${NUMERALS}cqw) rotate(calc(var(--heading) * -1))`,
          }}
        >
          <span ref={headingRef}>0°</span>
        </span>
      )}

      {/* The outer ring's distance, where no marker can hide it: the corner outside the bezel. */}
      <span className="text-muted-foreground absolute right-0 bottom-0 flex items-center gap-1 text-[10px] tabular-nums">
        <CircleDashed className="size-3" aria-hidden="true" />
        {formatDistance(range)}
      </span>
    </div>
  );
}
