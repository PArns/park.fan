'use client';

import { useId, useMemo, type ReactNode } from 'react';
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
  mapParks,
  schematicMap,
  type AreaWay,
  type MapBox,
} from '@/lib/trip-regions/wizard-choices';
import { Badge } from '@/components/ui/badge';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext } from '../../planner/plan-context';
import { PlanChip } from '../../planner/plan-controls';
import { useAreaName } from '../../planner/plan-place-words';
import { MoveIcon } from '../../planner/plan-stay-band';

/** The schematic map's box: 2 : 1 like the assistant's band, the room for a circle at the edge. */
const MAP_BOX: MapBox = { width: 320, height: 160, pad: 14, gap: 22 };

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
  const known = areas.filter((key) => region.hotelAreas.some((a) => a.key === key));
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
    <div className="flex flex-col gap-2.5" data-wizard-areas="cards">
      <AreaMap areas={known} parks={mapParks(region, known, parks)} value={value} />
      <WizardOptionGroup labelledBy={labelledBy}>
        {known.map((key, i) => (
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
 * The areas of a city on a schematic map from the API's coordinates, no tiles: a numbered circle per
 * area, the chosen one filled, and a mark with its code per park the city reaches
 * (`schematicMap`). A picture with a name (`role="img"`); the cards under it are what is operated,
 * their numbers the circles'. Both themes come from the tokens, and nothing is requested.
 */
function AreaMap({
  areas,
  parks,
  value,
}: {
  areas: readonly string[];
  parks: readonly string[];
  value: string | null;
}) {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const { region, config, parkBySlug, parkName, locale } = usePlanContext();
  const clipId = useId();
  const points = useMemo(() => {
    const places = [
      ...areas.flatMap((key) => {
        const area = region.hotelAreas.find((a) => a.key === key);
        return area
          ? [{ key: `area:${key}`, latitude: area.latitude, longitude: area.longitude }]
          : [];
      }),
      ...parks.flatMap((slug) => {
        const park = parkBySlug.get(slug);
        return park
          ? [{ key: `park:${slug}`, latitude: park.latitude, longitude: park.longitude }]
          : [];
      }),
    ];
    return schematicMap(places, MAP_BOX);
  }, [areas, parks, region.hotelAreas, parkBySlug]);
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });

  return (
    <svg
      role="img"
      aria-label={
        parks.length > 0
          ? t('map', { count: areas.length, parks: list.format(parks.map(parkName)) })
          : t('mapAreas', { count: areas.length })
      }
      viewBox={`0 0 ${MAP_BOX.width} ${MAP_BOX.height}`}
      className="bg-muted/40 border-border/60 aspect-[2/1] w-full rounded-xl border"
      data-wizard-area-map=""
    >
      <clipPath id={clipId}>
        <rect width={MAP_BOX.width} height={MAP_BOX.height} rx="12" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {points.map((point) => {
          if (point.key.startsWith('park:')) {
            const slug = point.key.slice(5);
            const park = parkBySlug.get(slug);
            return (
              <g key={point.key}>
                <path
                  d={`M ${point.x} ${point.y - 6} L ${point.x + 5} ${point.y + 3} L ${point.x - 5} ${point.y + 3} Z`}
                  className="fill-foreground/70"
                />
                <text
                  x={point.x}
                  y={point.y + 14}
                  textAnchor="middle"
                  className="fill-foreground text-[9px] font-semibold"
                >
                  {park ? parkLabel(park, config.parkShortNames, 'tight') : ''}
                </text>
              </g>
            );
          }
          const key = point.key.slice(5);
          const chosen = value === key;
          return (
            <g key={point.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="8.5"
                className={cn(
                  'stroke-[1.5]',
                  chosen ? 'fill-primary stroke-primary' : 'fill-background stroke-primary/60'
                )}
              />
              <text
                x={point.x}
                y={point.y + 3.5}
                textAnchor="middle"
                className={cn(
                  'text-[10px] font-semibold tabular-nums',
                  chosen ? 'fill-primary-foreground' : 'fill-primary-ink'
                )}
              >
                {areas.indexOf(key) + 1}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
