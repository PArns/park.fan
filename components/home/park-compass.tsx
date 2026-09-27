'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, ChevronRight, CircleDashed, Compass } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PANEL_FLAT } from '@/components/common/glass-card';
import { LiveDot } from '@/components/common/live-dot';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useCompassHeading } from '@/lib/hooks/use-compass-heading';
import { useLivePosition } from '@/lib/hooks/use-live-position';
import { useRidePositions } from '@/lib/hooks/use-ride-positions';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { angleDelta, bearingBetween, niceRange, placeMarkers } from '@/lib/utils/compass';
import { calculateDistance, formatDistance } from '@/lib/utils/distance-utils';
import { CROWD_BADGE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { cn, stripNewPrefix } from '@/lib/utils';
import type { NearbyAttractionsData, UserLocation } from '@/types/nearby';

/**
 * The dial's radii, in `cqw` of the dial itself (it is a size container, so these are shares of
 * its width and the drawing is the same at 280 px and at 340 px). Outermost in: the bezel's ticks
 * (45–48), the cardinal letters (40), the radar's outer range ring (34), and the radius a ride at
 * 0 m would sit at (8), just outside the reader's own dot.
 */
const LETTER_RADIUS = 40;
const RANGE_OUTER = 34;
const RANGE_INNER = 8;
/** A 30 px marker is ~9.4 cqw on a 320 px dial; this keeps a hair of space between two. */
const MARKER_GAP = 10;
/** A fix worse than this makes the arrows a guess, and the header says so. */
const COARSE_FIX_M = 40;
/** The "ahead" ride is re-chosen when the phone has turned this far, and no more often than… */
const AHEAD_STEP_DEG = 8;
/** …this. The ring itself turns on every frame; only the text in its middle waits. */
const AHEAD_THROTTLE_MS = 400;

interface CompassRide {
  id: string;
  slug: string;
  name: string;
  href: string;
  /** Minutes, or `null` when the ride is not running. */
  wait: number | null;
  status: string;
  /** Metres from where the reader stands. */
  distance: number;
  /** True bearing from the reader, degrees clockwise from north; `null` without coordinates. */
  bearing: number | null;
  /** Its marker's centre on the north-up radar, in cqw from the dial's centre; `null` without
   *  coordinates. */
  point: { x: number; y: number } | null;
}

const subscribeNever = () => () => {};
const readSimulated = () => new URLSearchParams(window.location.search).has('sim');

/** Degrees as a CSS angle. */
const deg = (value: number) => `${value}deg`;

/**
 * The headliners around somebody standing in a park, inside a compass bezel: which way each one
 * is, how far, and what its queue costs right now.
 *
 * **A bezel, turned by the phone, around a radar.** The bezel carries the ticks and the cardinal
 * letters. Inside it every headliner is a marker at its true bearing, at a radius that grows with
 * its distance, showing the current wait in the site's wait colours; two dashed rings mark half
 * and all of the range, and the outer one is labelled. Where the phone has a compass, the whole
 * drawing turns so that up is the way the reader is facing, and the bar under the dial names the
 * ride straight ahead; without one it stays north-up, which is a map like any other, and says so.
 * The list beside it carries the same rides with an arrow each, and every arrow turns with it.
 *
 * Markers are not spread round the ring by bearing, and that was the first version: seven of
 * Phantasialand's ten headliners lie east of the simulation point within 35°, and spreading them
 * put Taron's marker 45° off its own arrow. Distance as the radius separates rides in one
 * direction by itself; `placeMarkers` only parts true piles.
 *
 * **Turning costs React nothing.** The heading arrives at up to 60 Hz and is written into one CSS
 * custom property, `--heading`, on the root; the bezel, the letters, the markers and the arrows
 * all rotate off it in CSS. React re-renders when the ride straight ahead changes, which is a few
 * times a minute while somebody turns on the spot.
 *
 * **Where the reader stands** is, in order: a high-accuracy fix this component watches while it is
 * on screen (`useLivePosition`), then the point `/api/nearby` answered for. Under `?sim=` only the
 * second, because the simulated park is not where the device is.
 *
 * **Where the rides stand** is `/api/parks/<geo>/<park>/positions`: the nearby answer has each
 * ride's distance and wait and no coordinates. Until it lands — and for a ride it has no
 * coordinates for — the ride is in the list with the API's distance and without an arrow.
 *
 * No `backdrop-filter` anywhere in here: this is the one thing on the page that moves
 * continuously, and a moving element under a backdrop filter is what made „Heute im Park" flicker.
 */
export function ParkCompass({
  data,
  userLocation,
  className,
}: {
  data: NearbyAttractionsData;
  /** The point the nearby answer was computed for. */
  userLocation: UserLocation;
  className?: string;
}) {
  const t = useTranslations('nearby.compass');
  const tNearby = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const rootRef = useRef<HTMLDivElement>(null);

  // On screen and in front — the two conditions every sensor in here runs under.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let inView = false;
    const update = () => setVisible(inView && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  // Under `?sim=` the park is somewhere the device is not, so the device's own fix is ignored.
  const simulated = useSyncExternalStore(subscribeNever, readSimulated, () => false);
  const { permissionGranted } = useGeolocation();
  const live = useLivePosition(visible && !simulated, permissionGranted);
  const origin =
    !simulated && live
      ? { lat: live.lat, lng: live.lng }
      : { lat: userLocation.latitude, lng: userLocation.longitude };

  // The ride straight ahead only moves when the phone has turned far enough, and not more often
  // than AHEAD_THROTTLE_MS — see the note above.
  const [aheadHeading, setAheadHeading] = useState<number | null>(null);
  const lastAhead = useRef({ heading: -1000, at: 0 });
  const onHeading = useCallback((heading: number) => {
    rootRef.current?.style.setProperty('--heading', deg(heading));
    const now = performance.now();
    const last = lastAhead.current;
    if (
      Math.abs(angleDelta(last.heading, heading)) >= AHEAD_STEP_DEG &&
      now - last.at >= AHEAD_THROTTLE_MS
    ) {
      lastAhead.current = { heading, at: now };
      setAheadHeading(heading);
    }
  }, []);
  const { status, enable } = useCompassHeading(onHeading, visible);
  const compassOn = status === 'active';
  // A compass that stopped (denied, or the tab went away and came back without one) leaves the
  // ring where it was; north-up is the honest resting state.
  useEffect(() => {
    if (!compassOn) rootRef.current?.style.setProperty('--heading', '0deg');
  }, [compassOn]);

  const geo = useMemo(
    () =>
      data.rides.reduce<ReturnType<typeof parkGeoFromUrl>>(
        (g, r) => g ?? parkGeoFromUrl(r.url),
        null
      ),
    [data.rides]
  );
  const { data: positions } = useRidePositions(geo, data.park.slug);

  const { range, list: rides } = useMemo((): { range: number; list: CompassRide[] } => {
    const { headliners } = splitInParkRides(data.rides);
    const base = headliners.map((ride) => {
      const at = positions?.get(ride.slug);
      return {
        id: ride.id,
        slug: ride.slug,
        name: stripNewPrefix(ride.name),
        href: convertApiUrlToFrontendUrl(ride.url),
        wait:
          ride.status === 'OPERATING' && typeof ride.waitTime === 'number' ? ride.waitTime : null,
        status: ride.status,
        distance: at
          ? calculateDistance(origin.lat, origin.lng, at.latitude, at.longitude)
          : ride.distance,
        bearing: at ? bearingBetween(origin.lat, origin.lng, at.latitude, at.longitude) : null,
      };
    });
    const placed = base.filter((r) => r.bearing !== null);
    const range = niceRange(Math.max(1, ...placed.map((r) => r.distance)));
    const points = placeMarkers(
      placed.map((r) => ({ bearing: r.bearing as number, distance: r.distance })),
      { range, inner: RANGE_INNER, outer: RANGE_OUTER, minGap: MARKER_GAP }
    );
    const pointOf = new Map(placed.map((r, i) => [r.id, points[i]]));
    return {
      range,
      list: base
        .map((r) => ({ ...r, point: pointOf.get(r.id) ?? null }))
        .sort((a, b) => a.distance - b.distance),
    };
  }, [data.rides, positions, origin.lat, origin.lng]);

  // What the middle of the dial talks about: the reader's pick, else the ride straight ahead, else
  // the nearest one.
  const [picked, setPicked] = useState<string | null>(null);
  const ahead = useMemo(() => {
    if (!compassOn || aheadHeading === null) return null;
    let best: CompassRide | null = null;
    for (const r of rides) {
      if (r.bearing === null) continue;
      if (
        !best ||
        Math.abs(angleDelta(aheadHeading, r.bearing)) <
          Math.abs(angleDelta(aheadHeading, best.bearing!))
      )
        best = r;
    }
    return best;
  }, [compassOn, aheadHeading, rides]);
  const focus = rides.find((r) => r.id === picked) ?? ahead ?? rides[0] ?? null;
  const focusReason = focus && focus.id === picked ? 'picked' : ahead ? 'ahead' : 'nearest';

  const waitLabel = (r: CompassRide) => (r.wait === null ? null : `${r.wait} ${tCommon('min')}`);
  const cardinals = [
    { key: 'n', angle: 0 },
    { key: 'e', angle: 90 },
    { key: 's', angle: 180 },
    { key: 'w', angle: 270 },
  ] as const;

  if (rides.length === 0) return null;

  return (
    <div
      ref={rootRef}
      style={{ '--heading': '0deg' } as React.CSSProperties}
      className={cn(PANEL_FLAT, 'rounded-3xl border p-5 sm:p-6', className)}
      data-park-compass=""
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Compass className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-semibold">{t('title')}</h2>
        </div>
        <CompassStatusLine
          status={status}
          onEnable={enable}
          coarse={
            !simulated && live !== null && live.accuracy > COARSE_FIX_M
              ? Math.round(live.accuracy)
              : null
          }
        />
      </div>

      {/* `grid-cols-1` and not a bare `grid`: an implicit column is as wide as its widest row's
          max-content, and a long ride name pushed the whole panel past a phone's edge. */}
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* ── The dial ── */}
        <div className="mx-auto w-full max-w-[340px]">
          <div className="relative aspect-square w-full" style={{ containerType: 'inline-size' }}>
            <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full">
              <circle
                cx="50"
                cy="50"
                r="49"
                className="fill-background stroke-border"
                strokeWidth="0.6"
              />
              {/* Range rings: half the range and the whole of it. Circles, so they need not turn. */}
              {[0.5, 1].map((share) => (
                <circle
                  key={share}
                  cx="50"
                  cy="50"
                  r={RANGE_INNER + (RANGE_OUTER - RANGE_INNER) * share}
                  className="stroke-border fill-none"
                  strokeWidth="0.4"
                  strokeDasharray="1 1.6"
                />
              ))}
              {/* The reader's view, fixed upward while the bezel turns under it. */}
              {compassOn && (
                <path d="M50 50 L41 17 A34 34 0 0 1 59 17 Z" className="fill-primary/10" />
              )}
              <circle
                cx="50"
                cy="50"
                r="2.4"
                className="fill-primary stroke-background"
                strokeWidth="1"
              />
            </svg>

            {/* What turns with the phone: the bezel, its letters and the markers. */}
            <div
              className="absolute inset-0"
              style={{ transform: 'rotate(calc(var(--heading) * -1))' }}
            >
              <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full">
                {Array.from({ length: 36 }, (_, i) => {
                  const major = i % 3 === 0;
                  return (
                    <line
                      key={i}
                      x1="50"
                      y1={major ? 2.2 : 2.6}
                      x2="50"
                      y2={major ? 5.2 : 4.2}
                      transform={`rotate(${i * 10} 50 50)`}
                      className={major ? 'stroke-foreground/50' : 'stroke-foreground/25'}
                      strokeWidth={major ? 0.7 : 0.45}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {cardinals.map(({ key, angle }) => (
                <span
                  key={key}
                  aria-hidden="true"
                  className={cn(
                    'absolute text-xs font-bold',
                    key === 'n' ? 'text-primary' : 'text-muted-foreground'
                  )}
                  style={{
                    left: `calc(50% + ${LETTER_RADIUS * Math.sin((angle * Math.PI) / 180)}cqw)`,
                    top: `calc(50% - ${LETTER_RADIUS * Math.cos((angle * Math.PI) / 180)}cqw)`,
                    transform: 'translate(-50%, -50%) rotate(var(--heading))',
                  }}
                >
                  {t(key)}
                </span>
              ))}

              {/* One marker per headliner: its direction and, by the radius, its distance. */}
              {rides.map((r) =>
                r.point === null ? null : (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setPicked((p) => (p === r.id ? null : r.id))}
                    aria-pressed={focus?.id === r.id}
                    aria-label={[
                      r.name,
                      waitLabel(r) ?? t('closed'),
                      formatDistance(r.distance),
                    ].join(', ')}
                    className={cn(
                      'absolute flex size-[30px] items-center justify-center rounded-full border text-xs font-bold tabular-nums shadow-sm transition-[box-shadow,scale]',
                      r.wait === null
                        ? 'bg-muted text-muted-foreground border-border'
                        : cn(CROWD_BADGE_CLASS[waitTimeCrowdTier(r.wait)], 'border-transparent'),
                      focus?.id === r.id &&
                        'ring-primary ring-offset-background z-10 scale-110 ring-2 ring-offset-2'
                    )}
                    style={{
                      left: `calc(50% + ${r.point.x}cqw)`,
                      top: `calc(50% + ${r.point.y}cqw)`,
                      transform: 'translate(-50%, -50%) rotate(var(--heading))',
                    }}
                  >
                    {r.wait ?? '–'}
                  </button>
                )
              )}
            </div>

            {/* The outer ring's distance, where no marker can hide it: the bottom right, off the
                ring, and it does not turn. */}
            <span className="text-muted-foreground absolute right-[2%] bottom-[2%] flex items-center gap-1 text-[10px] tabular-nums">
              <CircleDashed className="size-3" aria-hidden="true" />
              {formatDistance(range)}
            </span>
          </div>

          {/* The ride the dial is talking about: the reader's pick, the one straight ahead, or the
              nearest. One fixed height, so a different ride moving in does not move the list. */}
          {focus && (
            <div className="border-border/60 mt-3 flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2">
              <span className="border-primary text-primary flex size-9 shrink-0 items-center justify-center rounded-full border">
                {focus.bearing !== null ? (
                  <ArrowUp
                    aria-hidden="true"
                    className="size-4"
                    style={{ transform: `rotate(calc(${deg(focus.bearing)} - var(--heading)))` }}
                  />
                ) : (
                  <Compass aria-hidden="true" className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[10px] font-semibold tracking-[0.12em] uppercase">
                  {t(focusReason)}
                </span>
                <span className="block truncate font-semibold">{focus.name}</span>
              </span>
              <span className="text-muted-foreground shrink-0 text-right text-xs tabular-nums">
                {formatDistance(focus.distance)}
                {waitLabel(focus) && (
                  <span className="text-foreground block text-sm font-bold">
                    {waitLabel(focus)}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* ── The same rides as a list, nearest first ── */}
        <ul className="divide-border/60 divide-y">
          {rides.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                prefetch={false}
                className="group hover:bg-muted/40 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border',
                    focus?.id === r.id ? 'border-primary text-primary' : 'text-foreground'
                  )}
                >
                  {r.bearing !== null ? (
                    <ArrowUp
                      aria-hidden="true"
                      className="size-4"
                      style={{ transform: `rotate(calc(${deg(r.bearing)} - var(--heading)))` }}
                    />
                  ) : (
                    <Compass aria-hidden="true" className="text-muted-foreground size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="group-hover:text-primary block truncate font-medium transition-colors">
                    {r.name}
                  </span>
                  <span className="text-muted-foreground block text-xs tabular-nums">
                    {formatDistance(r.distance)} {tNearby('awayFrom')}
                  </span>
                </span>
                {r.wait !== null ? (
                  <span
                    className={cn(
                      CROWD_BADGE_CLASS[waitTimeCrowdTier(r.wait)],
                      'shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums'
                    )}
                  >
                    {waitLabel(r)}
                  </span>
                ) : (
                  <ParkStatusBadge status={r.status as 'CLOSED'} />
                )}
                <ChevronRight
                  aria-hidden="true"
                  className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** What the compass is doing, and the one button iOS needs before it does anything. */
function CompassStatusLine({
  status,
  onEnable,
  coarse,
}: {
  status: ReturnType<typeof useCompassHeading>['status'];
  onEnable: () => void;
  /** The fix's radius in metres when it is too coarse to trust the arrows, else `null`. */
  coarse: number | null;
}) {
  const t = useTranslations('nearby.compass');
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {status === 'active' ? (
        <span className="flex items-center gap-2">
          <LiveDot variant="pulse" color="bg-status-operating" />
          {t('turnsWithPhone')}
        </span>
      ) : status === 'needs-permission' ? (
        <button
          type="button"
          onClick={onEnable}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors max-sm:min-h-11"
        >
          <Compass className="size-4" aria-hidden="true" />
          {t('enable')}
        </button>
      ) : (
        <span>{status === 'denied' ? t('denied') : t('northUp')}</span>
      )}
      {coarse !== null && <span>{t('coarse', { meters: coarse })}</span>}
    </div>
  );
}
