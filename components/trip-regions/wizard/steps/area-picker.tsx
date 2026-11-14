'use client';

import { useMemo, type ReactNode } from 'react';
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
  layoutSchematicMap,
  mapParks,
  type AreaWay,
  type MapFrame,
  type MapLayout,
  type MapPlace,
} from '@/lib/trip-regions/wizard-choices';
import { useWidth } from '@/lib/hooks/use-width';
import { Badge } from '@/components/ui/badge';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext } from '../../planner/plan-context';
import { PlanChip } from '../../planner/plan-controls';
import { useAreaName } from '../../planner/plan-place-words';
import { MoveIcon } from '../../planner/plan-stay-band';

/** The heights the schematic map keeps to and the room at its edge, in pixels. */
const MAP_FRAME: Omit<MapFrame, 'maxWidth'> = { minHeight: 150, maxHeight: 300, pad: 22 };

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
 * the picker has (`layoutSchematicMap`); one that needs much less than that stands beside the cards
 * at a desk, so the width is not spent on empty map.
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
  const layout = useMemo(() => {
    if (width === 0) return null;
    const places: MapPlace[] = [
      ...areas.flatMap((key) => {
        const area = region.hotelAreas.find((a) => a.key === key);
        const radius = key === value ? MAP_CHOSEN_RADIUS : MAP_AREA_RADIUS;
        return area
          ? [{ key: `area:${key}`, latitude: area.latitude, longitude: area.longitude, radius }]
          : [];
      }),
      ...onMap.flatMap((slug) => {
        const park = parkBySlug.get(slug);
        if (!park) return [];
        const label = mapLabelBox(parkLabel(park, config.parkShortNames, 'tight'));
        return [
          {
            key: `park:${slug}`,
            latitude: park.latitude,
            longitude: park.longitude,
            radius: MAP_PARK_RADIUS,
            label,
          },
        ];
      }),
    ];
    // The map's border takes a pixel either side of the width the picker has.
    return layoutSchematicMap(places, { ...MAP_FRAME, maxWidth: width - 2 });
  }, [width, areas, onMap, value, region.hotelAreas, parkBySlug, config.parkShortNames]);
  const side =
    layout !== null && width >= MAP_SIDE_MIN_WIDTH && layout.width <= width * MAP_SIDE_SHARE;

  return (
    <div ref={ref} className="flex flex-col gap-2.5" data-wizard-areas="cards">
      <div className={cn('flex flex-col gap-2.5', side && 'flex-row items-start')}>
        {layout ? (
          <AreaMap layout={layout} areas={areas} parks={onMap} value={value} side={side} />
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
 * The areas of a city on a schematic map from the API's coordinates, no tiles, at the size
 * `layoutSchematicMap` gives it in pixels: a numbered circle per area, the chosen one filled, larger
 * and ringed, the others quiet, and a triangle with its code per park the city reaches, each code
 * placed clear of every marker with a line back where it stands off. A legend under it says which
 * mark is which. A picture with a name (`role="img"`); the cards are what is operated, their
 * numbers the circles'. Both themes come from the tokens, and nothing is requested.
 */
function AreaMap({
  layout,
  areas,
  parks,
  value,
  side,
}: {
  layout: MapLayout;
  areas: readonly string[];
  parks: readonly string[];
  value: string | null;
  side: boolean;
}) {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const tHotel = useTranslations('tripPlanner.wizard.hotel');
  const { config, parkBySlug, parkName, locale } = usePlanContext();
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const pointOf = new Map(layout.points.map((p) => [p.key, p]));
  const code = (slug: string) => {
    const park = parkBySlug.get(slug);
    return park ? parkLabel(park, config.parkShortNames, 'tight') : '';
  };
  // The chosen area last, so it is drawn over everything near it.
  const order = [...layout.points].sort(
    (a, b) => Number(a.key === `area:${value}`) - Number(b.key === `area:${value}`)
  );

  return (
    <figure
      className={cn('flex shrink-0 flex-col gap-1.5', !side && 'self-center')}
      data-wizard-area-map=""
    >
      <div className="bg-muted/40 border-border/60 overflow-hidden rounded-xl border">
        <svg
          role="img"
          aria-label={
            parks.length > 0
              ? t('map', { count: areas.length, parks: list.format(parks.map(parkName)) })
              : t('mapAreas', { count: areas.length })
          }
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="block"
        >
          {layout.labels.map((label) => {
            const point = pointOf.get(label.key);
            if (!label.leader || !point) return null;
            const x = Math.min(
              label.x + label.width / 2,
              Math.max(label.x - label.width / 2, point.x)
            );
            const y = Math.min(
              label.y + label.height / 2,
              Math.max(label.y - label.height / 2, point.y)
            );
            return (
              <line
                key={`leader:${label.key}`}
                x1={point.x}
                y1={point.y}
                x2={x}
                y2={y}
                className="stroke-muted-foreground/70"
                strokeWidth="1"
              />
            );
          })}
          {order.map((point) => {
            if (point.key.startsWith('park:')) {
              const { x, y, radius: r } = point;
              return (
                <path
                  key={point.key}
                  d={`M ${x} ${y - r} L ${x + r} ${y + r * 0.75} L ${x - r} ${y + r * 0.75} Z`}
                  className="fill-foreground/80"
                />
              );
            }
            const key = point.key.slice(5);
            const chosen = key === value;
            return (
              <g key={point.key}>
                {chosen && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.radius + 4}
                    className="fill-primary/25"
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  strokeWidth="1.5"
                  className={
                    chosen
                      ? 'fill-primary stroke-primary'
                      : 'fill-background stroke-muted-foreground/70'
                  }
                />
                <text
                  x={point.x}
                  y={point.y + (chosen ? 4.5 : 4)}
                  textAnchor="middle"
                  className={cn(
                    'font-semibold tabular-nums',
                    chosen
                      ? 'fill-primary-foreground text-[13px]'
                      : 'fill-muted-foreground text-[11px]'
                  )}
                >
                  {areas.indexOf(key) + 1}
                </text>
              </g>
            );
          })}
          {layout.labels.map((label) => (
            <text
              key={`label:${label.key}`}
              x={label.x}
              y={label.y + 4}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-bold"
            >
              {code(label.key.slice(5))}
            </text>
          ))}
        </svg>
      </div>
      <figcaption
        aria-hidden="true"
        className="text-muted-foreground flex items-center gap-4 px-1 text-xs"
      >
        <span className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 12 12" className="size-3">
            <path d="M 6 1 L 11 10 L 1 10 Z" className="fill-foreground/80" />
          </svg>
          {tHotel('mapPark')}
        </span>
        <span className="inline-flex items-center gap-1.5">
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
      </figcaption>
    </figure>
  );
}
