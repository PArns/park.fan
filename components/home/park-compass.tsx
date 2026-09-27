'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowUp, ChevronRight, Compass } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PANEL_FLAT } from '@/components/common/glass-card';
import { LiveDot } from '@/components/common/live-dot';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { ParkCompassDial, RANGE_INNER, RANGE_OUTER } from './park-compass-dial';
import { splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useCompassHeading } from '@/lib/hooks/use-compass-heading';
import { useLivePosition } from '@/lib/hooks/use-live-position';
import { useRidePositions } from '@/lib/hooks/use-ride-positions';
import { heroObjectPosition, parkHeroImageSrcs } from '@/lib/media/hero';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import {
  angleDelta,
  bearingBetween,
  dialLabel,
  niceRange,
  placeMarkers,
  relocate,
} from '@/lib/utils/compass';
import { calculateDistance, formatDistance } from '@/lib/utils/distance-utils';
import { CROWD_BADGE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { cn, stripNewPrefix } from '@/lib/utils';
import type { NearbyAttractionsData, UserLocation } from '@/types/nearby';

/**
 * Glass for the small surfaces on the panel — the bar under the dial, the list's arrow chips: a
 * pale fill, a hairline and a lit top edge. No `backdrop-filter`: the panel's photo under them is
 * already blurred (see the panel), so a translucent fill over it is what a backdrop blur would
 * have drawn, without re-blurring it on every frame the arrows turn.
 */
const GLASS_CHIP =
  'border-white/70 bg-white/45 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] dark:border-white/12 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07)]';

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
 * **A map with the reader's arrow in it.** The bezel carries the ticks and the cardinal letters,
 * north up. Inside it every headliner is a marker at its true bearing, at a radius that grows with
 * its distance, showing the current wait in the site's wait colours; two dashed rings mark half
 * and all of the range, and the outer one is labelled. In the middle is the reader: where the
 * phone has a compass, an arrow with a view cone that turns with the phone — which way they are
 * looking, the way a maps app draws it — and without one a plain dot, with the header saying north
 * is up. The bar under the dial names one ride (the one tapped, else the one straight ahead, else
 * the nearest), and the list beside it carries every ride with an arrow that points the way to go
 * from where the reader is looking.
 *
 * The first version turned the whole dial instead (heading-up), with a small mark at the top for
 * „ahead". It asked the reader to work out that up meant their own direction; an arrow that turns
 * as they turn shows it.
 *
 * Markers are not spread round the ring by bearing, and that was the first version: seven of
 * Phantasialand's ten headliners lie east of the simulation point within 35°, and spreading them
 * put Taron's marker 45° off its own arrow. Distance as the radius separates rides in one
 * direction by itself; `placeMarkers` only parts true piles.
 *
 * **Turning costs React nothing.** The heading arrives at up to 60 Hz and is written into one CSS
 * custom property, `--heading`, on the root; the reader's arrow and every list arrow rotate off it
 * in CSS. React re-renders when the ride straight ahead changes, which is a few times a minute
 * while somebody turns on the spot.
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
  demo,
  className,
}: {
  data: NearbyAttractionsData;
  /** The point the nearby answer was computed for. */
  userLocation: UserLocation;
  /**
   * `?sim=compass`: this park is a demo, laid out around wherever the device is — see
   * `resolveCompassDemo`. `anchor` is the point inside the park that stands in for the reader.
   */
  demo?: { parkName: string; anchor: { lat: number; lng: number } };
  className?: string;
}) {
  const t = useTranslations('nearby.compass');
  const tNearby = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const rootRef = useRef<HTMLDivElement>(null);
  // `useId` answers with characters (`«r1»`) a `url(#…)` reference does not survive.
  const coneId = `compass-cone-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

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

  // Under `?sim=` the park is somewhere the device is not, so the device's own fix is ignored —
  // except in the compass demo, which moves the park to the device instead.
  const simulated = useSyncExternalStore(subscribeNever, readSimulated, () => false) && !demo;
  const { permissionGranted, refresh: askForLocation } = useGeolocation();
  const live = useLivePosition(visible && !simulated, permissionGranted);
  const here = live ? { lat: live.lat, lng: live.lng } : null;
  // In the demo, with a fix, the park's anchor is put down where the device first was and every
  // ride moves with it (`relocate`), so walking through the living room walks through the park.
  // Without a fix the reader stands on the anchor, as under `?sim=in_park`.
  // The park is put down once, where the first fix lands, and stays there; every later fix moves
  // the reader through it. Anchoring it to every fix would carry the park along with the reader,
  // and no ride would ever come closer.
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  if (demo && here && !pin) setPin(here);
  const shift = demo && pin ? { from: demo.anchor, to: pin } : null;
  const origin = demo
    ? (here ?? demo.anchor)
    : !simulated && here
      ? here
      : { lat: userLocation.latitude, lng: userLocation.longitude };

  // The ride straight ahead only moves when the phone has turned far enough, and not more often
  // than AHEAD_THROTTLE_MS — see the note above.
  const [aheadHeading, setAheadHeading] = useState<number | null>(null);
  const lastAhead = useRef({ heading: -1000, at: 0 });
  const headingTextRef = useRef<HTMLSpanElement>(null);
  const onHeading = useCallback((heading: number) => {
    rootRef.current?.style.setProperty('--heading', deg(heading));
    const figure = `${Math.round(heading) % 360}°`;
    if (headingTextRef.current && headingTextRef.current.textContent !== figure) {
      headingTextRef.current.textContent = figure;
    }
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
      const stored = positions?.get(ride.slug);
      const at = stored
        ? shift
          ? (({ lat, lng }) => ({ latitude: lat, longitude: lng }))(
              relocate({ lat: stored.latitude, lng: stored.longitude }, shift.from, shift.to)
            )
          : stored
        : null;
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
    // `shift` is read through its four numbers, which is what changes; the object is new each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.rides,
    positions,
    origin.lat,
    origin.lng,
    shift?.from.lat,
    shift?.from.lng,
    shift?.to.lat,
    shift?.to.lng,
  ]);

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
  const markers = useMemo(
    () =>
      rides.flatMap((r) =>
        r.point === null
          ? []
          : [
              {
                id: r.id,
                name: dialLabel(r.name),
                wait: r.wait,
                point: r.point,
                label: [
                  r.name,
                  r.wait === null ? t('closed') : `${r.wait} ${tCommon('min')}`,
                  formatDistance(r.distance),
                ].join(', '),
              },
            ]
      ),
    [rides, t, tCommon]
  );
  // The face is the park's own photo, the one the hero above rotates first; a park without one
  // gets a plain face.
  const photo = useMemo(() => {
    const src = parkHeroImageSrcs(data.park.slug)[0];
    return src ? { src, position: heroObjectPosition(src) } : null;
  }, [data.park.slug]);

  if (rides.length === 0) return null;

  return (
    <div
      ref={rootRef}
      style={{ '--heading': '0deg' } as React.CSSProperties}
      className={cn(
        'relative rounded-3xl border p-5 sm:p-6',
        photo
          ? 'isolate overflow-hidden border-white/60 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]'
          : PANEL_FLAT,
        className
      )}
      data-park-compass=""
    >
      {/* The panel is glass over the park: the same photo as the face, blurred into colour and
          light under the site's heavy-glass fill (`HEAVY_GLASS`, one step more solid for the
          small print in the list). It is the photo that is blurred, not a `backdrop-filter`: the
          arrows on this panel turn with every sensor frame, and a moving element under a
          backdrop filter is what made „Heute im Park" flicker. Same rendition as the face, so
          one request between them. */}
      {photo && (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="128px"
            quality={50}
            className="scale-125 object-cover blur-2xl saturate-150"
            style={{ objectPosition: photo.position }}
          />
          <div className="bg-background/68 absolute inset-0 dark:bg-[oklch(0.13_0.02_241_/_0.68)]" />
        </div>
      )}
      {demo && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            {t('demo', { park: demo.parkName })}
          </span>
          {!permissionGranted && (
            <button
              type="button"
              onClick={askForLocation}
              className="inline-flex min-h-9 items-center rounded-lg border border-amber-500/50 px-3 font-semibold text-amber-800 transition-colors hover:bg-amber-500/15 max-sm:min-h-11 dark:text-amber-200"
            >
              {t('demoLocation')}
            </button>
          )}
        </div>
      )}
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
          <ParkCompassDial
            markers={markers}
            focusId={focus?.id ?? null}
            onPick={(id) => setPicked((p) => (p === id ? null : id))}
            compassOn={compassOn}
            range={range}
            photo={photo}
            coneId={coneId}
            headingRef={headingTextRef}
          />

          {/* The ride the dial is talking about: the reader's pick, the one straight ahead, or the
              nearest. One fixed height, so a different ride moving in does not move the list. */}
          {focus && (
            <div
              className={cn(
                GLASS_CHIP,
                'border-primary/40 dark:border-primary/40 mt-4 flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-2.5'
              )}
            >
              <span className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-full shadow-md">
                {focus.bearing !== null ? (
                  <ArrowUp
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={2.5}
                    style={{ transform: `rotate(calc(${deg(focus.bearing)} - var(--heading)))` }}
                  />
                ) : (
                  <Compass aria-hidden="true" className="size-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-primary block text-[10px] font-semibold tracking-[0.12em] uppercase">
                  {t(focusReason)}
                </span>
                <span className="block truncate text-base font-semibold">{focus.name}</span>
                {/* A closed ride's badge goes under the name: on the right it is twice a wait's
                    width and took the name down to „Colorado …". */}
                <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums">
                  {formatDistance(focus.distance)} {tNearby('awayFrom')}
                  {focus.wait === null && <ParkStatusBadge status={focus.status as 'CLOSED'} />}
                </span>
              </span>
              {focus.wait !== null && (
                <span
                  className={cn(
                    CROWD_BADGE_CLASS[waitTimeCrowdTier(focus.wait)],
                    'shrink-0 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums'
                  )}
                >
                  {waitLabel(focus)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── The same rides as a list, nearest first ── */}
        <ul className="divide-foreground/10 divide-y">
          {rides.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                prefetch={false}
                className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/40 dark:hover:bg-white/[0.04]"
              >
                <span
                  className={cn(
                    GLASS_CHIP,
                    'flex size-9 shrink-0 items-center justify-center rounded-full border',
                    focus?.id === r.id
                      ? 'border-primary text-primary dark:border-primary'
                      : 'text-foreground'
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
          {t('facing')}
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
