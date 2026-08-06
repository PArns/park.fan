import { getGeoStructure } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { HeroWorldPanelGate } from './hero-world-panel-gate';

export interface WorldPanelCountry {
  slug: string;
  name: string;
  parkCount: number;
  /** SSR seed; overlaid live by useGeoLiveStats on the client. */
  initialOpenCount: number | null;
}

export interface WorldPanelContinent {
  slug: string;
  name: string;
  parkCount: number;
  countryCount: number;
  /** Top countries by park count — what the chip row shows. */
  countries: WorldPanelCountry[];
  initialOpenCount: number | null;
}

/**
 * How many country chips the panel shows per continent. High enough that every continent with
 * parks fits entirely today, so the "11 Länder" in the subtitle matches what is on screen.
 */
const PANEL_COUNTRY_LIMIT = 12;

/**
 * Server seed for the hero's world-map panel: static geo structure (24h cache) + the
 * geo-live open counts (3600s — seed only, the client polls live values). Renders nothing
 * when the structure is unavailable; the gate mounts the actual panel only on xl viewports.
 */
export async function HeroWorldPanel() {
  const [structure, live] = await Promise.all([
    catchNonFatal(getGeoStructure()),
    catchNonFatal(getGeoLiveStats(3600)),
  ]);
  if (!structure || structure.continents.length === 0) return null;

  const continents: WorldPanelContinent[] = structure.continents.map((continent) => {
    const liveContinent = live?.continents.find((c) => c.slug === continent.slug);
    // geo-live only lists what it has data for, so a continent/country missing from a
    // SUCCESSFUL response has no open parks — that's a 0, not "unknown". Only a failed
    // fetch (live === null) leaves the count unknown, and then the client fills it in.
    const seed = (open: number | undefined) => open ?? (live ? 0 : null);
    return {
      slug: continent.slug,
      name: continent.name,
      parkCount: continent.parkCount,
      countryCount: continent.countryCount,
      countries: [...continent.countries]
        .sort((a, b) => b.parkCount - a.parkCount)
        .slice(0, PANEL_COUNTRY_LIMIT)
        .map((country) => ({
          slug: country.slug,
          name: country.name,
          parkCount: country.parkCount,
          initialOpenCount: seed(
            liveContinent?.countries.find((c) => c.slug === country.slug)?.openParkCount
          ),
        })),
      initialOpenCount: seed(liveContinent?.openParkCount),
    };
  });

  return <HeroWorldPanelGate continents={continents} />;
}
