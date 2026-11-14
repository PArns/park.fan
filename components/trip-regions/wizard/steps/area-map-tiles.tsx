'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type L from 'leaflet';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { cartoTileUrl } from '@/lib/utils/carto-tile-url';
import { declutterMap, type MapMarker, type MapPlace } from '@/lib/trip-regions/wizard-choices';
import 'leaflet/dist/leaflet.css';

/** A place on the area map with what its marker shows: an area's number or a park's code. */
export interface AreaMapPlace extends MapPlace {
  kind: 'area' | 'park';
  /** Half the marker's size in pixels. */
  radius: number;
  /** The area's number in its circle, or the park's code beside its triangle. */
  text: string;
  /** A park's code box, which the declutter places clear of the markers. */
  label?: { width: number; height: number };
}

/** The room between the places' bounds and the map's edge, so a marker and its code fit. */
const FIT_PADDING: [number, number] = [26, 26];

/**
 * The hotel areas and parks of a city on CARTO's tiles (`cartoTileUrl`), light or dark with the
 * site's theme, the view fitted once to every place with `FIT_PADDING`: at that zoom the motorways
 * (I-4 through Orlando, the rail lines across Tokyo), the water and the parks' grounds read, and so
 * does where Disney, Universal and International Drive lie. The map is a still picture: no
 * dragging, no zoom, no animation, no keyboard stop, since the cards beside it are the control. The
 * markers sit on top as SVG in the map's own pixels, kept apart and their codes placed
 * (`declutterMap`); a click on an area's circle chooses it, as its card does. Loaded only on the
 * client and only with the Hotel or Hotels step (`AreaPicker`), so no other page pays for Leaflet.
 */
export function AreaMapTiles({
  width,
  height,
  places,
  value,
  onChoose,
}: {
  width: number;
  height: number;
  places: readonly AreaMapPlace[];
  value: string | null;
  onChoose: (area: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const url = cartoTileUrl(resolvedTheme === 'dark' ? 'dark_all' : 'rastertiles/voyager');
  const bounds = useMemo(
    () => places.map((p): [number, number] => [p.latitude, p.longitude]),
    [places]
  );
  const [map, setMap] = useState<L.Map | null>(null);
  const [fitted, setFitted] = useState(0);
  const onFit = useCallback((fittedMap: L.Map) => {
    setMap(fittedMap);
    setFitted((n) => n + 1);
  }, []);
  const layout = useMemo(() => {
    if (!map || fitted === 0) return null;
    const markers: MapMarker[] = places.map((p) => {
      const at = map.latLngToContainerPoint([p.latitude, p.longitude]);
      return { key: p.key, x: at.x, y: at.y, radius: p.radius, ...(p.label && { label: p.label }) };
    });
    return declutterMap(markers, width, height);
  }, [map, fitted, places, width, height]);
  const byKey = new Map(places.map((p) => [p.key, p]));
  const pointOf = new Map(layout?.points.map((p) => [p.key, p]));
  const chosenKey = value ? `area:${value}` : null;
  // The chosen area last, so it is drawn over everything near it.
  const order = [...(layout?.points ?? [])].sort(
    (a, b) => Number(a.key === chosenKey) - Number(b.key === chosenKey)
  );
  const halo = 'stroke-background [paint-order:stroke]';

  return (
    <div className="relative size-full">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: FIT_PADDING }}
        zoomSnap={0.25}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        className="bg-muted/40 size-full"
      >
        <TileLayer key={url} url={url} />
        <FitView bounds={bounds} width={width} height={height} onFit={onFit} />
      </MapContainer>
      {layout && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="pointer-events-none absolute inset-0 z-[450] block"
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
                className="stroke-foreground/70"
                strokeWidth="1.5"
              />
            );
          })}
          {order.map((point) => {
            const place = byKey.get(point.key);
            if (!place) return null;
            if (place.kind === 'park') {
              const { x, y, radius: r } = point;
              return (
                <path
                  key={point.key}
                  d={`M ${x} ${y - r} L ${x + r} ${y + r * 0.75} L ${x - r} ${y + r * 0.75} Z`}
                  strokeWidth="2"
                  className={cn('fill-foreground', halo)}
                />
              );
            }
            const chosen = point.key === chosenKey;
            return (
              <g
                key={point.key}
                className="pointer-events-auto cursor-pointer"
                onClick={() => onChoose(point.key.slice(5))}
              >
                {chosen && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.radius + 4}
                    className="fill-primary/30"
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  strokeWidth="2"
                  className={
                    chosen
                      ? 'fill-primary stroke-background'
                      : 'fill-background stroke-foreground/60'
                  }
                />
                <text
                  x={point.x}
                  y={point.y + (chosen ? 4.5 : 4)}
                  textAnchor="middle"
                  className={cn(
                    'font-semibold tabular-nums',
                    chosen ? 'fill-primary-foreground text-[13px]' : 'fill-foreground text-[11px]'
                  )}
                >
                  {place.text}
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
              strokeWidth="3"
              className={cn('fill-foreground text-[11px] font-bold', halo)}
            >
              {byKey.get(label.key)?.text}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

/**
 * Fits the view to the places at the map's size, without animation, and hands the map back once
 * it is fitted, so the markers are projected at the zoom the tiles show. Runs again when the box
 * or the places change.
 */
function FitView({
  bounds,
  width,
  height,
  onFit,
}: {
  bounds: Array<[number, number]>;
  width: number;
  height: number;
  onFit: (map: L.Map) => void;
}) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize({ animate: false });
    map.fitBounds(bounds, { padding: FIT_PADDING, animate: false });
    onFit(map);
  }, [map, bounds, width, height, onFit]);
  return null;
}
