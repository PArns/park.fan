'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import type { AdminParkListItem } from '../../_lib/types';
import 'leaflet/dist/leaflet.css';

/**
 * The catalogue on a map.
 *
 * Not decoration. Coordinates are synced, occasionally wrong, and wrong in a
 * way no table can show: a park at 0,0 or in the wrong hemisphere reads as a
 * perfectly ordinary row and as an obvious mistake on a map. The same view
 * answers the question a list cannot — "which parks are near this one" — which
 * is how a curation session for a region gets planned.
 *
 * Loaded only when this mode is chosen (the parent imports it dynamically):
 * leaflet plus its CSS is not worth shipping to somebody editing a ride's
 * height.
 */

const CURATED_COLOR = 'oklch(0.628 0.137 241.275)';
const PLAIN_COLOR = 'oklch(0.556 0 0)';

type LocatedPark = AdminParkListItem & { latitude: number; longitude: number };

function dotIcon(curated: boolean): L.DivIcon {
  const color = curated ? CURATED_COLOR : PLAIN_COLOR;
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:12px;height:12px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px rgba(0,0,0,.45)"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export default function ParksMap({ parks }: { parks: AdminParkListItem[] }) {
  const router = useRouter();

  const located = useMemo(
    () =>
      parks.filter(
        (park): park is LocatedPark =>
          typeof park.latitude === 'number' && typeof park.longitude === 'number'
      ),
    [parks]
  );

  const center = useMemo<[number, number]>(() => {
    if (located.length === 0) return [48, 8];
    const sum = located.reduce<[number, number]>(
      (acc, park) => [acc[0] + park.latitude, acc[1] + park.longitude],
      [0, 0]
    );
    return [sum[0] / located.length, sum[1] / located.length];
  }, [located]);

  if (located.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-8 text-center text-sm">
        Keiner der gefilterten Parks hat Koordinaten — auf der Karte wäre nichts zu sehen. Das ist
        selbst ein Befund: ohne Koordinaten fehlt dem Park auch das Wetter und die Umkreissuche.
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={located.length > 30 ? 3 : 5}
      scrollWheelZoom
      className="h-full w-full"
      // The admin is dark and the default tiles are not. This keeps the map
      // from being the one blinding rectangle on the page.
      style={{ background: 'oklch(0.145 0 0)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {located.map((park) => (
        <Marker
          key={park.id}
          position={[park.latitude, park.longitude]}
          icon={dotIcon(park.curatedFieldCount > 0)}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{park.name}</p>
              <p className="text-xs">{[park.city, park.country].filter(Boolean).join(', ')}</p>
              <p className="text-xs">
                {park.attractionCount} Fahrgeschäfte · {park.seasonCount} Saisons
              </p>
              <button
                type="button"
                onClick={() => router.push(`/admin/parks/${park.id}`)}
                className="text-xs font-semibold underline"
              >
                Bearbeiten
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
