'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, ChevronRight, Compass, MapPin, Pin, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { PANEL_FLAT, PHOTO_GLASS_FILL } from '@/components/common/glass-card';
import { LiveDot } from '@/components/common/live-dot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { ParkCompassDial, type DialRide, type DialRideKind } from './park-compass-dial';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useCompassHeading } from '@/lib/hooks/use-compass-heading';
import { useInViewAndFront } from '@/lib/hooks/use-in-view-and-front';
import { useLivePosition, type LivePosition } from '@/lib/hooks/use-live-position';
import { useRidePositions } from '@/lib/hooks/use-ride-positions';
import { heroObjectPosition, parkHeroImageSrcs } from '@/lib/media/hero';
import { resolveSimLocation } from '@/lib/nearby-simulation';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import {
  angleDelta,
  bearingBetween,
  compassPoint,
  dialLabel,
  normalizeDegrees,
  relocate,
  rideAhead,
  stableOrder,
  stableRange,
} from '@/lib/utils/compass';
import { CROWD_SOLID_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { calculateDistance, formatDistance } from '@/lib/utils/distance-utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
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

/** A fix worse than this makes the arrows a guess, and the header says so. */
const COARSE_FIX_M = 40;
/** The compass demo puts its park down for good at the first fix this accurate (see `placed`). */
const DEMO_SETTLED_M = 25;
/**
 * The ride ahead changes only once the new one has stayed ahead this long. A phone carried while
 * walking sways a few degrees either way, and Disneyland's east side has four headliners within
 * 10°: without a wait the bar changed ten times in five seconds of simulated sway.
 */
const AHEAD_DWELL_MS = 300;
/** Heading changes smaller than this are not written to the page; the sensor's noise is finer. */
const HEADING_EPSILON_DEG = 0.25;

interface CompassRide {
  id: string;
  name: string;
  href: string;
  /** Minutes, or `null` when the ride posts no wait. */
  wait: number | null;
  status: string;
  kind: DialRideKind;
  /** Metres from where the reader stands. */
  distance: number;
  /** True bearing from the reader, degrees clockwise from north; `null` without coordinates. */
  bearing: number | null;
}

const subscribeNever = () => () => {};
/**
 * Whether the SERVER placed the reader (`?sim=in_park` and friends): then the device's own fix
 * says nothing about where they are in this park. Any other `sim` — the compass demo, a typo — is
 * not one, and must not switch off a real visitor's GPS.
 */
const readServerSim = () =>
  resolveSimLocation(new URLSearchParams(window.location.search).get('sim')) !== null;

/** Degrees as a CSS angle. */
const deg = (value: number) => `${value}deg`;

function rideKind(status: string, wait: number | null): DialRideKind {
  if (status === 'OPERATING') return wait !== null ? 'wait' : 'open';
  if (status === 'DOWN') return 'down';
  if (status === 'REFURBISHMENT') return 'refurb';
  return 'closed';
}

/** The colour a status is written in, where a ride's status is text rather than a badge. */
const STATUS_TEXT: Record<DialRideKind, string> = {
  wait: '',
  open: 'text-status-operating',
  down: 'text-status-down',
  refurb: 'text-status-refurbishment',
  closed: '',
};

/**
 * The headliners around somebody standing in a park, inside a compass bezel: which way each one
 * is, how far, and what its queue costs right now.
 *
 * **A map with the reader's arrow in it** (`ParkCompassDial`): north up, every headliner a
 * marker at its true bearing and at a radius that grows with its distance, and in the middle the
 * reader, an arrow with a view cone that turns with the phone. The bar under the dial names one
 * ride and links to it; the list carries every ride with an arrow that points the way to go from
 * where the reader is looking.
 *
 * **The bar follows the reader's eyes.** With a compass it names the ride inside the view cone
 * (`rideAhead`: within 30° of the heading, held against jitter, taken only after it has stayed
 * ahead AHEAD_DWELL_MS); with nothing in the cone, the nearest. A tap on a marker pins that ride
 * until it is tapped again, or the ✕ in the bar; a tap on another pins that one.
 *
 * **Without a compass nothing pretends to be one.** The dial is north up and says so, and the
 * list and the bar write the direction („Richtung Südwesten", „SW" in the chip) instead of an
 * arrow: an arrow drawn north-up reads as „go this way" to anybody holding the phone, and sends
 * them the wrong way.
 *
 * **Turning costs React nothing, and the page little.** The heading arrives at up to 60 Hz. It is
 * written into `--heading` on exactly the elements that turn (`data-heading`, collected after
 * every commit), each on its own compositing layer, and not written at all for changes under a
 * quarter degree. It used to go onto the panel root, which restyled all 387 elements under it and
 * repainted the blurred photos on every frame: 45 fps, measured, even on a phone held still.
 *
 * **The heading is true north.** A phone's compass is magnetic; the bearings to the rides are
 * not. `/positions` sends the park's declination, and it is added to every reading.
 *
 * **Where the reader stands** is a high-accuracy fix this component watches while on screen
 * (`useLivePosition`), taken only when it moved more than max(3 m, a third of its accuracy) —
 * every fix used to re-render the whole panel — else the point `/api/nearby` answered for. Under
 * a server `?sim=` only the second. In the `?sim=compass` demo the park is laid around the device.
 *
 * **Held still while walking.** The list only reorders when a ride is nearer by more than
 * max(15 m, half the fix's accuracy) (`stableOrder`), and the range ring only grows at once and
 * shrinks with a margin (`stableRange`): both flipped every few fixes on a simulated walk.
 *
 * No `backdrop-filter` anywhere in here: the arrows move on every sensor frame, and a moving
 * element under a backdrop filter is what made „Heute im Park" flicker. The panel's glass is the
 * park photo blurred as an image under `PHOTO_GLASS_FILL`.
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
  const tStatus = useTranslations('parks.status');
  const tParks = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  // `useId` answers with characters (`«r1»`) a `url(#…)` reference does not survive.
  const coneId = `compass-cone-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const headliners = useMemo(() => splitInParkRides(data.rides).headliners, [data.rides]);
  const visible = useInViewAndFront(rootRef, headliners.length > 0);

  const simulated = useSyncExternalStore(subscribeNever, readServerSim, () => false) && !demo;
  const { permissionGranted, permissionDenied, refresh: askForLocation } = useGeolocation();
  const live = useLivePosition(visible && !simulated, permissionGranted);

  // The reader's position, moved only when the fix has clearly moved: a high-accuracy watch
  // fires about once a second, and each fix re-ran the marker and label layouts for a metre of
  // GPS noise. A much better fix is taken at once.
  const [here, setHere] = useState<LivePosition | null>(null);
  if (
    live &&
    (!here ||
      live.accuracy < here.accuracy * 0.5 ||
      calculateDistance(here.lat, here.lng, live.lat, live.lng) > Math.max(3, live.accuracy / 3))
  ) {
    setHere(live);
  }

  // In the demo the park is put down under the device and then stays there; every later fix
  // moves the reader through it. Anchoring it to every fix would carry the park along and no ride
  // would ever come closer. A phone's first fix is usually a Wi-Fi or cell estimate, tens or
  // hundreds of metres out, and the GPS fix after it "moved" the reader by the gap without a step
  // taken, so while the fix is worse than DEMO_SETTLED_M each clearly better one puts the park
  // down again; the first one within it pins it.
  const [placed, setPlaced] = useState<LivePosition | null>(null);
  if (
    demo &&
    live &&
    (!placed || (placed.accuracy > DEMO_SETTLED_M && live.accuracy < placed.accuracy * 0.8))
  ) {
    setPlaced(live);
  }
  const shift = useMemo(
    () => (demo && placed ? { from: demo.anchor, to: { lat: placed.lat, lng: placed.lng } } : null),
    [demo, placed]
  );
  const origin = demo
    ? here
      ? { lat: here.lat, lng: here.lng }
      : demo.anchor
    : !simulated && here
      ? { lat: here.lat, lng: here.lng }
      : { lat: userLocation.latitude, lng: userLocation.longitude };

  const geo = useMemo(
    () =>
      data.rides.reduce<ReturnType<typeof parkGeoFromUrl>>(
        (g, r) => g ?? parkGeoFromUrl(r.url),
        null
      ),
    [data.rides]
  );
  const { data: positions } = useRidePositions(geo, data.park.slug);
  const declination = positions?.declination ?? 0;

  const built = useMemo(
    (): CompassRide[] =>
      headliners.map((ride) => {
        const stored = positions?.bySlug.get(ride.slug);
        const at = stored
          ? shift
            ? relocate({ lat: stored.latitude, lng: stored.longitude }, shift.from, shift.to)
            : { lat: stored.latitude, lng: stored.longitude }
          : null;
        const wait =
          ride.status === 'OPERATING' && typeof ride.waitTime === 'number' ? ride.waitTime : null;
        return {
          id: ride.id,
          name: stripNewPrefix(ride.name),
          href: convertApiUrlToFrontendUrl(ride.url),
          wait,
          status: ride.status,
          kind: rideKind(ride.status, wait),
          distance: at ? calculateDistance(origin.lat, origin.lng, at.lat, at.lng) : ride.distance,
          bearing: at ? bearingBetween(origin.lat, origin.lng, at.lat, at.lng) : null,
        };
      }),
    [headliners, positions, shift, origin.lat, origin.lng]
  );

  // Nearest first, reordered only past a margin — see `stableOrder`.
  const [order, setOrder] = useState<readonly string[]>([]);
  const tolerance = Math.max(15, (here?.accuracy ?? 30) / 2);
  const rides = useMemo(() => stableOrder(built, order, tolerance), [built, order, tolerance]);
  if (rides.map((r) => r.id).join('|') !== order.join('|')) setOrder(rides.map((r) => r.id));

  const onDial = rides.filter((r) => r.bearing !== null);
  const [range, setRange] = useState<number | null>(null);
  const nextRange = stableRange(range, Math.max(1, ...onDial.map((r) => r.distance)));
  if (nextRange !== range) setRange(nextRange);

  // What the bar talks about — see the note above.
  const [aheadId, setAheadId] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  if (pinned !== null && !rides.some((r) => r.id === pinned)) setPinned(null);
  const pendingAhead = useRef<{ id: string | null; since: number } | null>(null);

  // The elements that turn, collected after every commit, and the heading last written to them,
  // which a freshly mounted one is brought up to at once.
  const headingTargets = useRef<HTMLElement[]>([]);
  const headingNow = useRef(0);
  useLayoutEffect(() => {
    headingTargets.current = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[data-heading]') ?? []
    );
    const value = deg(headingNow.current);
    for (const el of headingTargets.current) el.style.setProperty('--heading', value);
  });

  // Called through `useEffectEvent` inside the hook, so it always sees this render's rides.
  const onHeading = (magnetic: number) => {
    const heading = normalizeDegrees(magnetic + declination);
    if (Math.abs(angleDelta(headingNow.current, heading)) >= HEADING_EPSILON_DEG) {
      headingNow.current = heading;
      const value = deg(heading);
      for (const el of headingTargets.current) el.style.setProperty('--heading', value);
    }
    const next = rideAhead(rides, heading, aheadId);
    if (next === aheadId) {
      pendingAhead.current = null;
      return;
    }
    const now = performance.now();
    const pending = pendingAhead.current;
    if (!pending || pending.id !== next) pendingAhead.current = { id: next, since: now };
    else if (now - pending.since >= AHEAD_DWELL_MS) {
      pendingAhead.current = null;
      setAheadId(next);
    }
  };
  const { status, enable, unreliable } = useCompassHeading(onHeading, visible);
  const compassOn = status === 'active';
  // A compass that stopped (denied, gone silent) leaves the arrows where they were; north-up is
  // the honest resting state.
  useEffect(() => {
    if (compassOn) return;
    headingNow.current = 0;
    for (const el of headingTargets.current) el.style.setProperty('--heading', '0deg');
  }, [compassOn]);

  const ahead = compassOn ? (rides.find((r) => r.id === aheadId) ?? null) : null;
  const pinnedRide = rides.find((r) => r.id === pinned) ?? null;
  const focus = pinnedRide ?? ahead ?? rides[0] ?? null;
  const focusReason = pinnedRide ? 'picked' : ahead ? 'ahead' : 'nearest';
  const togglePin = (id: string) => setPinned((p) => (p === id ? null : id));

  const toward = (bearing: number) => t('toward', { point: t(`points.${compassPoint(bearing)}`) });
  const dialRides = useMemo(
    (): DialRide[] =>
      rides.flatMap((r) =>
        r.bearing === null
          ? []
          : [
              {
                id: r.id,
                name: dialLabel(r.name),
                label: [
                  r.name,
                  r.wait !== null ? `${r.wait} ${tCommon('min')}` : tStatus(r.status),
                  formatDistance(r.distance),
                  t('toward', { point: t(`points.${compassPoint(r.bearing)}`) }),
                ].join(', '),
                kind: r.kind,
                wait: r.wait,
                bearing: r.bearing,
                distance: r.distance,
              },
            ]
      ),
    [rides, t, tCommon, tStatus]
  );

  // The face and the panel's glass are the park's own photo, the one the hero above rotates first;
  // a park without one gets a plain face and the flat panel.
  const photo = useMemo(() => {
    const src = parkHeroImageSrcs(data.park.slug)[0];
    return src ? { src, position: heroObjectPosition(src) } : null;
  }, [data.park.slug]);

  const allClosed = rides.length > 0 && rides.every((r) => r.kind === 'closed');
  const reopens = data.park.nextSchedule?.openingTime
    ? `${tParks('opensOn')} ${getDateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: data.park.timezone,
      }).format(new Date(data.park.nextSchedule.openingTime))}`
    : null;
  // Standing at the ride: an arrow at 10 m with a fix good to 12 m points anywhere.
  const arrived = (r: CompassRide) =>
    here !== null && r.bearing !== null && r.distance < Math.max(20, here.accuracy);

  if (rides.length === 0 || range === null) return null;

  /** The second line of a ride: distance, direction without a compass, status without a wait. */
  const meta = (r: CompassRide) => (
    <>
      {arrived(r) ? t('here') : formatDistance(r.distance)}
      {!compassOn && r.bearing !== null && !arrived(r) && <> · {toward(r.bearing)}</>}
      {r.wait === null && (
        <>
          {' · '}
          <span className={STATUS_TEXT[r.kind]}>{tStatus(r.status)}</span>
        </>
      )}
    </>
  );

  /** What a ride's chip shows: the way to go, or where it is, or that the reader is there. */
  const direction = (r: CompassRide, size: 'sm' | 'lg') => {
    const icon = size === 'lg' ? 'size-5' : 'size-4';
    if (arrived(r)) return <MapPin aria-hidden="true" className={icon} />;
    if (r.bearing === null)
      return <Compass aria-hidden="true" className={cn(icon, 'opacity-60')} />;
    if (!compassOn) {
      return (
        <span aria-hidden="true" className="text-[11px] leading-none font-bold">
          {t(`pointsShort.${compassPoint(r.bearing)}`)}
        </span>
      );
    }
    return (
      <ArrowUp
        aria-hidden="true"
        data-heading=""
        className={cn(icon, 'will-change-transform')}
        strokeWidth={size === 'lg' ? 2.5 : 2}
        style={{ transform: `rotate(calc(${deg(r.bearing)} - var(--heading, 0deg)))` }}
      />
    );
  };

  const wait = (minutes: number) => (
    <Badge
      className={cn(
        CROWD_SOLID_CLASS[waitTimeCrowdTier(minutes)],
        'border-transparent px-2.5 py-1 font-bold tabular-nums'
      )}
    >
      {minutes} {tCommon('min')}
    </Badge>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative rounded-3xl border p-5 sm:p-6',
        photo
          ? 'isolate overflow-hidden border-white/60 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]'
          : PANEL_FLAT,
        className
      )}
      data-park-compass=""
    >
      {/* The panel is glass over the park: the face's photo, blurred into colour and light under
          the tile glass's fill. The photo is blurred, not the backdrop — see the note above. Same
          rendition as the face, so one request between them. */}
      {photo && (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="128px"
            quality={50}
            className="scale-125 object-cover blur-2xl dark:saturate-150"
            style={{ objectPosition: photo.position }}
          />
          <div className={cn(PHOTO_GLASS_FILL, 'absolute inset-0')} />
        </div>
      )}

      {demo && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 font-semibold text-amber-800 dark:text-amber-200">
            {t('demo', { park: demo.parkName })}
            {permissionDenied && <span className="block font-normal">{t('demoNoLocation')}</span>}
          </span>
          {!permissionGranted && !permissionDenied && (
            <Button size="sm" variant="outline" onClick={askForLocation}>
              {t('demoLocation')}
            </Button>
          )}
          <Link
            href={pathname as '/'}
            className="font-semibold text-amber-800 underline underline-offset-2 dark:text-amber-200"
          >
            {t('demoEnd')}
          </Link>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Compass className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-bold">{t('title')}</h2>
        </div>
        <CompassStatusLine
          status={status}
          onEnable={enable}
          unreliable={unreliable}
          position={
            simulated || !permissionGranted
              ? null
              : live === null
                ? 'locating'
                : live.accuracy > COARSE_FIX_M
                  ? Math.round(live.accuracy)
                  : null
          }
        />
        {allClosed && (
          <p className="text-foreground/80 text-sm">
            {t('allClosed')}
            {reopens && ` ${reopens}.`}
          </p>
        )}
      </div>

      {/* `grid-cols-1` and not a bare `grid`: an implicit column is as wide as its widest row's
          max-content, and a long ride name pushed the whole panel past a phone's edge. On a wide
          page the dial stays in view beside a list that runs longer than it. */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
        <div className="mx-auto w-full max-w-[340px] md:sticky md:top-20">
          <ParkCompassDial
            rides={dialRides}
            range={range}
            focusId={focus?.id ?? null}
            pinnedId={pinned}
            onPick={togglePin}
            compassOn={compassOn}
            photo={photo}
            coneId={coneId}
          />

          {/* The ride the dial is talking about, as a link to it. One fixed height and every line
              truncated, so a different ride moving in does not move the list under it. */}
          {focus && (
            <>
              <div
                className={cn(
                  GLASS_CHIP,
                  'border-primary/40 dark:border-primary/40 mt-4 flex h-[4.75rem] items-center gap-1 rounded-2xl border pr-2'
                )}
              >
                <Link
                  href={focus.href}
                  prefetch={false}
                  className="group flex h-full min-w-0 flex-1 items-center gap-3 rounded-2xl pl-3"
                >
                  <span className="bg-primary/15 text-primary ring-primary/40 flex size-11 shrink-0 items-center justify-center rounded-full ring-1">
                    {direction(focus, 'lg')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground/70 flex items-center gap-1 text-xs font-semibold tracking-widest uppercase">
                      {pinnedRide && <Pin className="size-3" aria-hidden="true" />}
                      {t(focusReason)}
                    </span>
                    <span className="group-hover:text-primary block truncate text-base font-semibold transition-colors">
                      {focus.name}
                    </span>
                    <span className="text-foreground/70 block truncate text-xs tabular-nums">
                      {meta(focus)}
                    </span>
                  </span>
                  {focus.wait !== null && wait(focus.wait)}
                  <ChevronRight
                    aria-hidden="true"
                    className="text-foreground/60 group-hover:text-primary size-4 shrink-0 transition-colors"
                  />
                </Link>
                {pinnedRide && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPinned(null)}
                    aria-label={t('unpin')}
                  >
                    <X aria-hidden="true" />
                  </Button>
                )}
              </div>
              {/* Always the line, so the markers arriving with the ride positions do not
                  push the list down by it. */}
              <p className="text-foreground/70 mt-2 min-h-4 text-xs">
                {dialRides.length === 0 ? '' : pinnedRide ? t('unpinHint') : t('tapHint')}
              </p>
            </>
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
                  {direction(r, 'sm')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="group-hover:text-primary block truncate font-medium transition-colors">
                    {r.name}
                  </span>
                  <span className="text-foreground/70 block truncate text-xs tabular-nums">
                    {meta(r)}
                    {/* With a compass the way is an arrow, and a screen reader hears nothing of
                        it; the point of the compass says it, and does not change as the phone
                        turns. */}
                    {compassOn && r.bearing !== null && (
                      <span className="sr-only">, {toward(r.bearing)}</span>
                    )}
                  </span>
                </span>
                {r.wait !== null && wait(r.wait)}
                <ChevronRight
                  aria-hidden="true"
                  className="text-foreground/60 group-hover:text-primary size-4 shrink-0 transition-colors max-sm:hidden"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * What the compass is doing and how far to trust it, and the one button iOS needs before it does
 * anything.
 */
function CompassStatusLine({
  status,
  onEnable,
  unreliable,
  position,
}: {
  status: ReturnType<typeof useCompassHeading>['status'];
  onEnable: () => void;
  /** The magnetometer says it is off (Safari's own accuracy). */
  unreliable: boolean;
  /** `'locating'` until a fix arrives, the fix's radius in metres while it is too coarse. */
  position: 'locating' | number | null;
}) {
  const t = useTranslations('nearby.compass');
  return (
    <div className="text-foreground/70 flex flex-col gap-1.5 text-sm">
      {status === 'active' ? (
        <span className="flex items-center gap-2">
          <LiveDot variant="pulse" color="bg-status-operating" />
          {t('facing')}
        </span>
      ) : status === 'needs-permission' ? (
        <>
          <Button size="sm" onClick={onEnable} className="self-start">
            <Compass aria-hidden="true" />
            {t('enable')}
          </Button>
          <span>{t('enableHint')}</span>
        </>
      ) : status === 'denied' ? (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {t('denied')}
          <Button size="sm" variant="outline" onClick={onEnable}>
            {t('retry')}
          </Button>
        </span>
      ) : (
        <span>{t('northUp')}</span>
      )}
      {/* One line, always there, whether or not it has anything to say: the fix arrives a
          second or two after the compass does, and a line that appeared or went away with it
          moved the whole list under the reader. */}
      <span className={cn('min-h-5 truncate', unreliable && 'text-status-down')}>
        {unreliable
          ? t('calibrate')
          : position === 'locating'
            ? t('locating')
            : position !== null
              ? t('coarse', { meters: position })
              : ''}
      </span>
    </div>
  );
}
