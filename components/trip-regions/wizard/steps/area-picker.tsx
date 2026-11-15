'use client';

import { useMemo, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { MapPin, Route, Sunrise } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDuration } from '@/lib/utils/duration';
import { getListFormat } from '@/lib/utils/intl-format';
import { shortGroupName } from '@/lib/trip-regions/hub-data';
import { earlyPerk } from '@/lib/trip-regions/plan-copy';
import { parkLabel } from '@/lib/trip-regions/plan-week';
import {
  AREA_CHIPS_MAX,
  areaWays,
  mapBoxSize,
  mapParks,
  type AreaWay,
  type MapFrame,
} from '@/lib/trip-regions/wizard-choices';
import { useWidth } from '@/lib/hooks/use-width';
import { Badge } from '@/components/ui/badge';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext } from '../../planner/plan-context';
import { PlanChip } from '../../planner/plan-controls';
import { useAreaName } from '../../planner/plan-place-words';
import { MoveIcon } from '../../planner/plan-stay-band';
import type { AreaMapPlace } from './area-map-tiles';

// Leaflet touches `window` on import, and only the Hotel and Hotels steps draw a map, so its chunk
// loads on the client when one of them opens; the box is reserved meanwhile.
const AreaMapTiles = dynamic(() => import('./area-map-tiles').then((mod) => mod.AreaMapTiles), {
  ssr: false,
  loading: () => <div className="bg-muted/40 size-full" />,
});

/** The heights the area map keeps to and the room at its edge, in pixels. */
const MAP_FRAME: Omit<MapFrame, 'maxWidth'> = { minHeight: 150, maxHeight: 420, pad: 22 };

/** A hotel area's circle, and the chosen one's, which is larger; a park's mark; in pixels. */
const MAP_AREA_RADIUS = 10;
const MAP_CHOSEN_RADIUS = 13;
const MAP_PARK_RADIUS = 7;

/** A park code's box at the map's 11 px bold: about 7 px a letter, a little room either side. */
const mapLabelBox = (text: string) => ({ width: text.length * 7 + 6, height: 14 });

/**
 * At or above this width, a map that needs less than {@link MAP_SIDE_SHARE} of it stands beside
 * the cards instead of over them (Orlando at a desk).
 */
const MAP_SIDE_MIN_WIDTH = 560;
const MAP_SIDE_SHARE = 0.6;

/**
 * Where to sleep, as the Hotel and Hotels steps ask it: a card per hotel area with its number, the
 * early slot its hotels get (`hotelAreas[].perks`) and the ways to the trip's parks
 * (`travel.legs`, `areaWays`), under a schematic map whose circles carry the same numbers. A city
 * with few areas (`AREA_CHIPS_MAX`) gets chips instead, with the chosen area's ways under them.
 * "Not decided yet" is always an answer (`value` `null`); `openHint` says what the plan does then.
 */
export function AreaPicker({
  areas,
  parks,
  value,
  onChoose,
  labelledBy,
  openHint,
}: {
  /** The areas to offer, by the API's key, in the order the cards number them. */
  areas: readonly string[];
  /** The trip's parks, which the ways measure to. */
  parks: readonly string[];
  value: string | null;
  onChoose: (area: string | null) => void;
  /** The id of the heading or of Parky's question that asks it. */
  labelledBy: string;
  openHint: ReactNode;
}) {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const tParks = useTranslations('tripPlanner.parks');
  const { region } = usePlanContext();
  const areaName = useAreaName();
  const known = useMemo(
    () => areas.filter((key) => region.hotelAreas.some((a) => a.key === key)),
    [areas, region.hotelAreas]
  );
  const drives = known.some((area) =>
    areaWays(region, area, parks).some((way) => way.mode === 'drive')
  );
  const attribution = drives && region.travel.attribution && (
    <p className="text-muted-foreground text-[11px]">
      {tParks('driveSource', { source: region.travel.attribution })}
    </p>
  );

  if (known.length <= AREA_CHIPS_MAX) {
    return (
      <div className="flex flex-col gap-2" data-wizard-areas="chips">
        <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
          {known.map((key) => (
            <PlanChip
              key={key}
              check
              selected={value === key}
              onClick={() => onChoose(key)}
              label={areaName(key)}
              data-wizard-area={key}
            />
          ))}
          <PlanChip
            check
            selected={value === null}
            onClick={() => onChoose(null)}
            label={t('open')}
          />
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed" aria-live="polite">
          {value ? (
            <>
              {areaName(value)}: <AreaWayList area={value} parks={parks} />
            </>
          ) : (
            openHint
          )}
        </p>
        {attribution}
      </div>
    );
  }

  return (
    <AreaCards
      areas={known}
      parks={parks}
      value={value}
      onChoose={onChoose}
      labelledBy={labelledBy}
      openHint={openHint}
      attribution={attribution}
    />
  );
}

/**
 * The cards of a city with many areas under or beside its map. The map is laid out for the width
 * the picker has (`mapBoxSize`); one that needs much less than that stands beside the cards at a
 * desk, so the width is not spent on empty map.
 */
function AreaCards({
  areas,
  parks,
  value,
  onChoose,
  labelledBy,
  openHint,
  attribution,
}: {
  areas: readonly string[];
  parks: readonly string[];
  value: string | null;
  onChoose: (area: string | null) => void;
  labelledBy: string;
  openHint: ReactNode;
  attribution: ReactNode;
}) {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const { region, config, parkBySlug } = usePlanContext();
  const [ref, width] = useWidth<HTMLDivElement>();
  const onMap = useMemo(() => mapParks(region, areas, parks), [region, areas, parks]);
  const places = useMemo(
    (): AreaMapPlace[] => [
      ...areas.flatMap((key, i): AreaMapPlace[] => {
        const area = region.hotelAreas.find((a) => a.key === key);
        if (!area) return [];
        const radius = key === value ? MAP_CHOSEN_RADIUS : MAP_AREA_RADIUS;
        const { latitude, longitude } = area;
        return [
          { key: `area:${key}`, kind: 'area', latitude, longitude, radius, text: `${i + 1}` },
        ];
      }),
      ...onMap.flatMap((slug): AreaMapPlace[] => {
        const park = parkBySlug.get(slug);
        if (!park) return [];
        const text = parkLabel(park, config.parkShortNames, 'tight');
        const { latitude, longitude } = park;
        return [
          {
            key: `park:${slug}`,
            kind: 'park',
            latitude,
            longitude,
            radius: MAP_PARK_RADIUS,
            text,
            label: mapLabelBox(text),
          },
        ];
      }),
    ],
    [areas, onMap, value, region.hotelAreas, parkBySlug, config.parkShortNames]
  );
  // The map's border takes a pixel either side of the width the picker has.
  const box = width > 0 ? mapBoxSize(places, { ...MAP_FRAME, maxWidth: width - 2 }) : null;
  const side = box !== null && width >= MAP_SIDE_MIN_WIDTH && box.width <= width * MAP_SIDE_SHARE;

  return (
    <div ref={ref} className="flex flex-col gap-2.5" data-wizard-areas="cards">
      <div className={cn('flex flex-col gap-2.5', side && 'flex-row items-start')}>
        {box ? (
          <AreaMap
            box={box}
            places={places}
            areas={areas}
            parks={onMap}
            value={value}
            onChoose={onChoose}
            side={side}
          />
        ) : (
          <div aria-hidden="true" style={{ height: MAP_FRAME.minHeight }} />
        )}
        <WizardOptionGroup
          labelledBy={labelledBy}
          className={side ? 'min-w-0 flex-1' : 'sm:grid-cols-2'}
        >
          {areas.map((key, i) => (
            <WizardOptionCard
              key={key}
              checked={value === key}
              onSelect={() => onChoose(key)}
              title={<AreaTitle number={i + 1} area={key} checked={value === key} />}
              hint={<AreaWayList area={key} parks={parks} />}
              data-wizard-area={key}
            />
          ))}
          <WizardOptionCard
            dashed
            icon={MapPin}
            checked={value === null}
            onSelect={() => onChoose(null)}
            title={t('open')}
            hint={openHint}
          />
        </WizardOptionGroup>
      </div>
      {attribution}
    </div>
  );
}

/** An area card's title: its number on the map, its name and the early slot its hotels get. */
function AreaTitle({ number, area, checked }: { number: number; area: string; checked: boolean }) {
  const tMarker = useTranslations('tripPlanner.marker');
  const { region } = usePlanContext();
  const areaName = useAreaName();
  const perk = earlyPerk(region.hotelAreas.find((a) => a.key === area)?.perks);
  const perkKey = `early.${perk}`;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <AreaNumber number={number} checked={checked} />
      <span>{areaName(area)}</span>
      {perk && tMarker.has(perkKey) && (
        <Badge variant="outline" className="border-primary/40 text-primary-ink font-normal">
          <Sunrise aria-hidden="true" />
          {tMarker(perkKey)}
        </Badge>
      )}
    </span>
  );
}

/** The number an area has on the list and on the map, filled where it is chosen. */
function AreaNumber({ number, checked }: { number: number; checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums',
        checked
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-border text-muted-foreground'
      )}
    >
      {number}
    </span>
  );
}

/** The ways from an area to the trip's parks, nearest first: mode, park or resort, minutes. */
function AreaWayList({ area, parks }: { area: string; parks: readonly string[] }) {
  const tWay = useTranslations('tripPlanner.parks.way');
  const { region, locale, parkName, groupByKey } = usePlanContext();
  const ways = areaWays(region, area, parks);
  const duration = (way: AreaWay) =>
    way.maxMinutes === way.minutes
      ? formatShortDuration(way.minutes, locale)
      : `${way.maxMinutes < 60 ? way.minutes : formatShortDuration(way.minutes, locale)}–${formatShortDuration(way.maxMinutes, locale)}`;
  if (ways.length === 0) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
      {ways.map((way) => {
        const name = way.group
          ? shortGroupName(groupByKey.get(way.to)?.name ?? way.to)
          : parkName(way.to);
        const said =
          way.mode && !way.group
            ? tWay(tWay.has(way.mode) ? way.mode : 'other', { minutes: way.minutes })
            : null;
        return (
          <span key={way.to} className="inline-flex items-center gap-1 whitespace-nowrap">
            {way.mode ? (
              <MoveIcon mode={way.mode} className="size-3.5 shrink-0" />
            ) : (
              <Route className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{name}</span>
            <span className="tabular-nums" aria-hidden={said ? true : undefined}>
              {duration(way)}
            </span>
            {said && <span className="sr-only">{said}</span>}
          </span>
        );
      })}
    </span>
  );
}

/**
 * The areas of a city on CARTO's tiles in the box `mapBoxSize` reserved (`AreaMapTiles`, loaded on
 * the client): a numbered circle per area, the chosen one filled, larger and ringed, and a
 * triangle with its code per park the city reaches. A legend under it says which mark is which, and
 * the tiles' credit stands beside it. A picture with a name (`role="img"`); the cards are what is
 * operated, their numbers the circles', and a click on a circle does what its card does.
 */
function AreaMap({
  box,
  places,
  areas,
  parks,
  value,
  onChoose,
  side,
}: {
  box: { width: number; height: number };
  places: readonly AreaMapPlace[];
  areas: readonly string[];
  parks: readonly string[];
  value: string | null;
  onChoose: (area: string) => void;
  side: boolean;
}) {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const tHotel = useTranslations('tripPlanner.wizard.hotel');
  const { parkName, locale } = usePlanContext();
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });

  return (
    <figure
      className={cn('flex shrink-0 flex-col gap-1.5', !side && 'self-center')}
      style={{ width: box.width + 2 }}
      data-wizard-area-map=""
    >
      <div
        role="img"
        aria-label={
          parks.length > 0
            ? t('map', { count: areas.length, parks: list.format(parks.map(parkName)) })
            : t('mapAreas', { count: areas.length })
        }
        className="border-border/60 overflow-hidden rounded-xl border"
        style={{ width: box.width + 2, height: box.height + 2 }}
      >
        <AreaMapTiles
          width={box.width}
          height={box.height}
          places={places}
          value={value}
          onChoose={onChoose}
        />
      </div>
      <figcaption className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs">
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 12 12" className="size-3">
            <path d="M 6 1 L 11 10 L 1 10 Z" className="fill-foreground/80" />
          </svg>
          {tHotel('mapPark')}
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" className="size-4">
            <circle
              cx="8"
              cy="8"
              r="7"
              strokeWidth="1.5"
              className="fill-background stroke-muted-foreground/70"
            />
            <text
              x="8"
              y="11.5"
              textAnchor="middle"
              className="fill-muted-foreground text-[9px] font-semibold"
            >
              1
            </text>
          </svg>
          {tHotel('mapArea')}
        </span>
        <span className="ml-auto text-[11px]">
          ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="underline-offset-2 hover:underline"
          >
            OpenStreetMap
          </a>{' '}
          contributors ©{' '}
          <a href="https://carto.com/attributions" className="underline-offset-2 hover:underline">
            CARTO
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
