import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getParkByGeoPath, getAttractionByGeoPath } from '@/lib/api/parks';
import { getGeoStructure } from '@/lib/api/discovery';
import { getParkBackgroundImage, getAttractionBackgroundImage } from '@/lib/utils/park-assets';
import { HERO_IMAGES } from '@/lib/hero-images';
import { ParkAttraction, QueueDataItem } from '@/lib/api/types';
import { locales, isValidLocale } from '@/i18n/config';

export const runtime = 'nodejs';

// OG Image dimensions
const WIDTH = 800;
const HEIGHT = 420;
const DESIGN_WIDTH = 1200;
const DESIGN_HEIGHT = 630;
const SCALE = WIDTH / DESIGN_WIDTH;

// Helper to generate sparkline path (StepAfter algorithm matching WaitTimeSparkline)
function generateSparklinePath(
  history: Array<{ timestamp: string; waitTime: number }>,
  width: number,
  height: number
): string {
  if (history.length === 0) return '';

  // Process data
  const points = history.map((point) => ({
    time: new Date(point.timestamp).getTime(),
    value: point.waitTime,
  }));

  const maxWait = Math.max(...points.map((d) => d.value), 10);
  const minTime = points[0].time;
  const maxTime = points[points.length - 1].time;
  const timeRange = maxTime - minTime;

  const getX = (time: number) => (timeRange === 0 ? 0 : ((time - minTime) / timeRange) * width);
  const getY = (value: number) => height - (value / maxWait) * height;

  let pathD = '';
  points.forEach((p, i) => {
    const x = getX(p.time);
    const y = getY(p.value);

    if (i === 0) {
      pathD += `M ${x},${y}`;
    } else {
      // StepAfter: Horizontal from prev point to current X, then vertical to current Y
      const prevP = points[i - 1];
      const prevY = getY(prevP.value);
      // Horizontal move to current X with PREVIOUS Y
      pathD += ` L ${x},${prevY}`;
      // Vertical move to current Y
      pathD += ` L ${x},${y}`;
    }
  });

  // Extend horizontal line to right edge (shows current stable time)
  pathD += ` L ${width},${getY(points[points.length - 1].value)}`;

  return pathD;
}

// Helper to get crowd level color
function getCrowdLevelColor(level: string): string {
  const colors: Record<string, string> = {
    very_low: '#059669', // emerald-600
    low: '#10b981', // emerald-500
    normal: '#2563eb', // blue-600 (modified to match moderate usually) - checking config: moderate is blue-600
    moderate: '#2563eb', // blue-600
    higher: '#ea580c', // orange-600 (high is orange-600)
    high: '#ea580c', // orange-600
    very_high: '#e11d48', // rose-600
    extreme: '#b91c1c', // red-700
    full: '#dc2626', // red-600
    closed: '#94a3b8', // slate-400
  };
  return colors[level] || '#6b7280';
}

// Helper to get status color
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPERATING: '#059669', // emerald-600
    CLOSED: '#dc2626', // red-600
    DOWN: '#ea580c', // orange-600
    REFURBISHMENT: '#7c3aed', // violet-600
  };
  return colors[status] || '#6b7280';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    // Parse path: locale/continent/country/city/park or locale/continent/country/city/park/attraction
    // New: Allow locale (1), locale/continent (2), ...
    if (path.length < 1) {
      return new Response('Invalid path. Expected at least: locale', { status: 400 });
    }

    // Generic pages configuration
    const genericPages = {
      search: { namespace: 'common', key: 'search' },
      datenschutz: { namespace: 'datenschutz', key: 'title' },
      privacy: { namespace: 'datenschutz', key: 'title' },
      impressum: { namespace: 'impressum', key: 'title' },
      imprint: { namespace: 'impressum', key: 'title' },
      parks: { namespace: 'explore', key: 'parksTitle' },
    };

    const [localeParam, secondSegment] = path;
    const locale = isValidLocale(localeParam) ? localeParam : 'en';
    const isGeneric = secondSegment && Object.keys(genericPages).includes(secondSegment);

    // Aliases for path segments to match existing logic
    const continent = path[1];
    const country = path[2];
    const city = path[3];
    const parkSlug = path[4];
    const attractionSlug = path[5];

    // Determine type based on path length and content
    const type =
      path.length === 1
        ? 'HOME'
        : isGeneric
          ? 'GENERIC'
          : path.length === 2
            ? 'CONTINENT'
            : path.length === 3
              ? 'COUNTRY'
              : path.length === 4
                ? 'CITY'
                : path.length >= 6 && path[5] // attractionSlug
                  ? 'ATTRACTION'
                  : 'PARK';

    // Fetch translations
    const tCommon = await getTranslations({ locale, namespace: 'common' });
    const tGeo = await getTranslations({ locale, namespace: 'geo' });
    const tParks = await getTranslations({ locale, namespace: 'parks' });
    const tAttractions = await getTranslations({ locale, namespace: 'attractions' });
    const tHomepage = await getTranslations({ locale, namespace: 'homepage' });

    // Dynamic translations for generic pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tGeneric: any = null;
    if (type === 'GENERIC') {
      const config = genericPages[secondSegment as keyof typeof genericPages];
      tGeneric = await getTranslations({ locale, namespace: config.namespace });
    }

    let name = '';
    let backgroundImagePath: string | null = null;
    let status = '';
    let statusLabel = '';
    let statusColor = '';
    let crowdLabel: string | null = null;
    let crowdColor: string | null = null;
    let crowdLevel: string | undefined;
    let waitTime: number | null = null;
    let sparklineHistory: Array<{ timestamp: string; waitTime: number }> | undefined;
    let peakWaitToday: number | undefined;
    let operatingAttractionsCount = 0;

    // Regional aggregates
    let totalParks = 0;
    let openParksCount = 0;

    let geoSvg = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let park: any = null;

    // Fetch GeoStructure for ALL types to get correct names (e.g. City Name "Brühl" vs slug "bruehl")
    const geo = await getGeoStructure();

    const continentNode = continent ? geo.continents.find((c) => c.slug === continent) : null;
    const countryNode = country ? continentNode?.countries.find((c) => c.slug === country) : null;
    const cityNode = city ? countryNode?.cities.find((c) => c.slug === city) : null;

    if (type === 'HOME') {
      name = tHomepage('features.title'); // "Plane deinen perfekten Besuch"
      totalParks = geo.parkCount;
      // Calculate total open parks by summing up continents
      openParksCount = geo.continents.reduce((sum, c) => sum + (c.openParkCount || 0), 0);

      // Random Background from Hero Images
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      backgroundImagePath = HERO_IMAGES[randomIndex];

      statusLabel = `${openParksCount} ${tCommon('open')}`;
      statusColor = openParksCount > 0 ? getStatusColor('OPERATING') : getStatusColor('CLOSED');
    } else if (type === 'GENERIC') {
      const config = genericPages[secondSegment as keyof typeof genericPages];
      name = tGeneric(config.key);

      // For 'parks' generic page, we can show stats
      if (secondSegment === 'parks') {
        totalParks = geo.parkCount;
        openParksCount = geo.continents.reduce((sum, c) => sum + (c.openParkCount || 0), 0);
        statusLabel = `${openParksCount} ${tCommon('open')}`;
        statusColor = openParksCount > 0 ? getStatusColor('OPERATING') : getStatusColor('CLOSED');
      }

      // Use a random hero image for visuals if no specific one
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      backgroundImagePath = HERO_IMAGES[randomIndex];
    } else if (['CONTINENT', 'COUNTRY', 'CITY'].includes(type)) {
      // Resolve Name & Stats based on Type
      if (type === 'CONTINENT' && continentNode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name = tGeo(`continents.${continent}` as any);
        if (name === `continents.${continent}`) name = continentNode.name;
        totalParks = continentNode.parkCount;
        openParksCount = continentNode.openParkCount;

        // Get all country codes and names for the continent
        // EXCLUDE Russia (RU) for Europe visuals because it's too wide and shrinks the rest of Europe
        const identifiers = continentNode.countries
          .filter((c) => continent !== 'europe' || c.code !== 'RU')
          .flatMap((c) => [c.code, c.name].filter(Boolean));

        const { getRegionGeoSVG } = await import('@/lib/utils/geo-svg');
        geoSvg = getRegionGeoSVG(identifiers);
      } else if (type === 'COUNTRY' && countryNode) {
        const normalizedCountry = country.toLowerCase().replace(/\s+/g, '-');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name = tGeo(`countries.${normalizedCountry}` as any);
        if (name === `countries.${normalizedCountry}`) name = countryNode.name;
        totalParks = countryNode.parkCount;
        openParksCount = countryNode.openParkCount;

        const { getRegionGeoSVG } = await import('@/lib/utils/geo-svg');
        geoSvg = getRegionGeoSVG([countryNode.code, countryNode.name]);
      } else if (type === 'CITY' && cityNode) {
        name = cityNode.name;
        totalParks = cityNode.parkCount;
        openParksCount = cityNode.openParkCount;

        // For city, prevent showing the entire country if it's huge?
        // Ideally we'd have city shape or point, but for now showing the Country context is safer via map
        // OR fallback to the park background if we prefer not to show the whole country.
        // Let's reuse the country map for context, maybe highlights?
        // For now: Country Map.
        if (countryNode) {
          const { getRegionGeoSVG } = await import('@/lib/utils/geo-svg');
          geoSvg = getRegionGeoSVG([countryNode.code, countryNode.name]);
        }
      }

      statusLabel = `${openParksCount} ${tCommon('open')}`;
      statusColor = openParksCount > 0 ? getStatusColor('OPERATING') : getStatusColor('CLOSED');
    } else if (type === 'PARK' || type === 'ATTRACTION') {
      // ... Original Logic for Park/Attraction ...
      park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

      if (!park) {
        return new Response('Park not found', { status: 404 });
      }

      let attraction = null;

      // Determine operating attractions count for park view
      const operatingAttractionsList =
        park.attractions?.filter((a: ParkAttraction) => {
          const queue = a.queues?.find((q) => q.queueType === 'STANDBY');
          return queue && 'waitTime' in queue && queue.waitTime !== null;
        }) || [];
      operatingAttractionsCount = operatingAttractionsList.length;

      if (type === 'ATTRACTION') {
        // Find attraction logic
        attraction = park.attractions?.find((a: ParkAttraction) => a.slug === attractionSlug);
        if (!attraction) {
          const fullAttraction = await getAttractionByGeoPath(
            continent,
            country,
            city,
            parkSlug,
            attractionSlug
          ).catch(() => null);
          if (fullAttraction) attraction = fullAttraction;
        }

        if (!attraction) return new Response('Attraction not found', { status: 404 });

        name = attraction.name;
        backgroundImagePath =
          getAttractionBackgroundImage(parkSlug, attractionSlug) ??
          getParkBackgroundImage(parkSlug);

        const standbyQueue = attraction.queues?.find(
          (q: QueueDataItem) => q.queueType === 'STANDBY'
        );
        if (standbyQueue && 'waitTime' in standbyQueue) waitTime = standbyQueue.waitTime ?? null;

        status =
          park.status !== 'OPERATING'
            ? 'CLOSED'
            : (standbyQueue as { status?: string })?.status || attraction.status || 'CLOSED';
        crowdLevel =
          'crowdLevel' in attraction
            ? (attraction.crowdLevel as string)
            : attraction.currentLoad?.crowdLevel;
        sparklineHistory = attraction.statistics?.history;
        peakWaitToday = attraction.statistics?.peakWaitToday ?? undefined;
      } else {
        // Park logic
        name = park.name;
        backgroundImagePath = getParkBackgroundImage(parkSlug);
        status = park.status || 'CLOSED';
        crowdLevel = park.currentLoad?.crowdLevel;

        if (operatingAttractionsCount > 0) {
          const totalWait = operatingAttractionsList.reduce((sum: number, a: ParkAttraction) => {
            const queue = a.queues?.find((q: QueueDataItem) => q.queueType === 'STANDBY');
            return sum + ((queue && 'waitTime' in queue ? queue.waitTime : 0) || 0);
          }, 0);
          waitTime = Math.round(totalWait / operatingAttractionsCount);
        }
      }

      // Set standard badges for Park/Attraction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      statusLabel = tParks(`status.${status}` as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      crowdLabel = crowdLevel ? tParks(`crowdLevels.${crowdLevel}` as any) : null;
      statusColor = getStatusColor(status);
      crowdColor = crowdLevel ? getCrowdLevelColor(crowdLevel) : null;
    }

    // Build absolute URL for background image
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://park.fan';
    const backgroundUrl = backgroundImagePath ? `${baseUrl}${backgroundImagePath}` : null;

    // Location string logic
    // For Continent/Country/City we might display "Explore Parks" or similar?
    // Let's keep it simple.

    // For Park/Attraction we need city/country names
    let locationString = '';
    if (type === 'PARK' || type === 'ATTRACTION') {
      // Priority: Park City (Source of Truth) > CityNode Name > Slug Fallback
      // We prioritize park.city because the detailed park record usually has the correct formatted name (e.g. "Brühl"),
      // whereas cityNode might just be derived from the slug ("Bruehl").
      const cityName =
        (park && park.city) ||
        cityNode?.name ||
        city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

      const normalizedCountry = country.toLowerCase().replace(/\s+/g, '-');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let countryName = tGeo(`countries.${normalizedCountry}` as any);
      if (countryName === `countries.${normalizedCountry}`)
        countryName = countryNode?.name || country.charAt(0).toUpperCase() + country.slice(1);

      // Use park data if available (it was fetched in the block above, need to access it outside?)
      // Refactoring issue: 'park' variable is scoped inside the block.
      // Quick fix: Re-use the params for formatting since we don't have the park object in outer scope easily without more refactor.
      // Actually, let's move the park fetch up? No, regions don't need distinct park fetch.
      // Let's rely on params for generic location string if park object isn't available, OR just handle it in the render block.

      const parkName =
        park?.name ||
        parkSlug
          .split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
      locationString =
        type === 'ATTRACTION'
          ? `${parkName} • ${cityName}, ${countryName}`
          : `${cityName}, ${countryName}`;

      // Wait, for Attraction we need Park Name. 'parkSlug' is available.
      // We can just format parkSlug roughly or fetch it.
      // Let's use a simpler approach: Just "City, Country" for both for now to avoid re-fetching or scoping issues,
      // OR better: Move the logic variable definition up.
    }

    // Load fonts or use system fonts.
    // Since we can't easily load custom fonts here without more setup, we'll stick to system-ui but making it look good.

    // Pre-calculate translations to avoid lint errors with dynamic keys in JSX
    const localizedCountryName = country
      ? tGeo(`countries.${country.toLowerCase().replace(/\s+/g, '-')}` as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      : '';
    const localizedContinentName = continent
      ? tGeo(`continents.${continent}` as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      : '';

    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          backgroundColor: '#0f172a',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: `${DESIGN_HEIGHT}px`,
            width: `${DESIGN_WIDTH}px`,
            transform: `scale(${SCALE})`,
            transformOrigin: '0 0',
            flexDirection: 'column',
            backgroundColor: '#0f172a', // Slate 900 base
            color: 'white',
            fontFamily: '"Inter"',
            position: 'relative',
          }}
        >
          {/* Background Layer */}
          {geoSvg ? (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.3, // Increased opacity for better visibility
              }}
            >
              <svg
                viewBox={geoSvg.viewBox}
                width="1200" // Scale to fill roughly
                height="630"
                preserveAspectRatio="xMaxYMid meet" // Align Right, Fit Height
                style={{
                  // We don't strictly set width/height here to allow aspect ratio preservation via viewBox
                  // But satori needs some hints.
                  width: '100%',
                  height: '100%',
                }}
              >
                <defs>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {geoSvg.paths.map((p: any) => (
                  <path
                    key={p.id}
                    d={p.d}
                    fill="url(#mapGradient)"
                    stroke="#7dd3fc"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>
          ) : (
            backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={backgroundUrl}
                alt="Background"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.4,
                }}
              />
            )
          )}

          {/* Gradient Overlay for Readability */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9))',
            }}
          />

          {/* Content Container */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
            }}
          >
            {type === 'HOME' ? (
              // HOME LAYOUT: Explicit Wrapper for Centering
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '48px', // Gap between Title Group and Badges
                  padding: '56px',
                }}
              >
                {/* Centered Main Content Group */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                  }}
                >
                  <h1
                    style={{
                      fontSize: '140px',
                      fontWeight: 900,
                      color: 'white',
                      margin: 0,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      textShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      textAlign: 'center',
                    }}
                  >
                    park.fan
                  </h1>

                  <h2
                    style={{
                      fontSize: '48px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.9)',
                      margin: 0,
                      maxWidth: '900px',
                      textAlign: 'center',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    }}
                  >
                    {tHomepage('features.title')}
                  </h2>
                </div>

                {/* Footer Badges Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    // marginTop: 'auto' // Not needed if parent is flex column space-between, but explicitly handling it cleanly
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue
                      color: 'white',
                      padding: '12px 28px',
                      borderRadius: '9999px',
                      fontSize: '28px',
                      fontWeight: 600,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    ⏱️ {tHomepage('features.realtime.title')}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'rgba(168, 85, 247, 0.8)', // purple
                      color: 'white',
                      padding: '12px 28px',
                      borderRadius: '9999px',
                      fontSize: '28px',
                      fontWeight: 600,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    🧠 {tHomepage('features.predictions.title')}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      padding: '12px 28px',
                      borderRadius: '9999px',
                      fontSize: '28px',
                      fontWeight: 600,
                    }}
                  >
                    🌍 {totalParks} Parks
                  </div>

                  {openParksCount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'rgba(5, 150, 105, 0.8)', // emerald
                        color: 'white',
                        padding: '12px 28px',
                        borderRadius: '9999px',
                        fontSize: '28px',
                        fontWeight: 600,
                      }}
                    >
                      ✅ {openParksCount} {tCommon('open')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // STANDARD LAYOUT (Regional & Parks)
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  justifyContent: 'space-between',
                  textAlign: 'left', // Ensure standard layout overrides root centering
                  position: 'relative', // Context for absolute sparkline
                  padding: '56px',
                }}
              >
                {/* Top Bar: Location & park.fan branding */}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p
                      style={{
                        fontSize: '32px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.9)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      {/* Location Iconish text */}
                      {['CONTINENT', 'COUNTRY', 'CITY'].includes(type) ? (
                        <>
                          {type === 'CITY' && (
                            <>
                              📍 {localizedCountryName} • {localizedContinentName}
                            </>
                          )}
                          {type === 'COUNTRY' && <>🌍 {localizedContinentName}</>}
                          {type === 'CONTINENT' && <>🌍 {tGeo('exploreByRegion')}</>}
                        </>
                      ) : type === 'GENERIC' ? (
                        <>� park.fan</>
                      ) : (
                        <>�📍 {locationString}</>
                      )}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      fontSize: '48px',
                      fontWeight: 800,
                      color: '#3b82f6', // blue-500
                      letterSpacing: '-0.02em',
                    }}
                  >
                    park.fan
                  </div>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Title */}
                  <h1
                    style={{
                      display: 'flex',
                      fontSize: '72px',
                      fontWeight: 800,
                      color: 'white',
                      margin: 0,
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      maxWidth: '90%',
                    }}
                  >
                    {name}
                  </h1>

                  {/* Status Badges Row - REGIONAL */}
                  {['CONTINENT', 'COUNTRY', 'CITY'].includes(type) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: '#0f172a', // slate-900
                          border: '2px solid rgba(255,255,255,0.2)',
                          color: 'white',
                          padding: '12px 28px',
                          borderRadius: '9999px',
                          fontSize: '32px',
                          fontWeight: 700,
                        }}
                      >
                        🎢 {totalParks} {tCommon('parks')}
                      </div>

                      {openParksCount > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: '#059669', // emerald-600
                            color: 'white',
                            padding: '12px 28px',
                            borderRadius: '9999px',
                            fontSize: '32px',
                            fontWeight: 700,
                          }}
                        >
                          🕒 {openParksCount} {tCommon('open')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Badges Row - GENERIC */}
                  {type === 'GENERIC' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: '#3b82f6', // blue-500
                          color: 'white',
                          padding: '12px 28px',
                          borderRadius: '9999px',
                          fontSize: '32px',
                          fontWeight: 700,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        👉 {tHomepage('hero.searchPlaceholder') || 'Discover more'}
                      </div>
                    </div>
                  )}

                  {/* Status Badges Row - PARK/ATTRACTION */}
                  {!['CONTINENT', 'COUNTRY', 'CITY', 'GENERIC'].includes(type) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      {/* Operating Status Badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: statusColor,
                          color: 'white',
                          padding: '12px 28px',
                          borderRadius: '9999px',
                          fontSize: '32px',
                          fontWeight: 700,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {/* Icon based on status */}
                        {status === 'OPERATING' ? (
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : status === 'CLOSED' ? (
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        ) : (
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                          </svg>
                        )}
                        {statusLabel}
                      </div>

                      {/* Crowd Level Badge - Hide if Closed to avoid redundancy */}
                      {crowdLabel &&
                        crowdColor &&
                        status !== 'CLOSED' &&
                        crowdLevel !== 'closed' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: crowdColor,
                              color: 'white',
                              padding: '12px 28px',
                              borderRadius: '9999px',
                              fontSize: '32px',
                              fontWeight: 700,
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            {crowdLabel}
                          </div>
                        )}

                      {/* Operating Attractions (Park only) */}
                      {type !== 'ATTRACTION' &&
                        status !== 'CLOSED' &&
                        operatingAttractionsCount > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '2px solid rgba(255,255,255,0.2)',
                              color: 'white',
                              padding: '10px 28px',
                              borderRadius: '9999px',
                              fontSize: '32px',
                              fontWeight: 600,
                            }}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M6 19v-3" />
                              <path d="M10 19v-3" />
                              <path d="M14 19v-3" />
                              <path d="M18 19v-3" />
                              <path d="M8 11V9" />
                              <path d="M16 11V9" />
                              <path d="M12 11V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2" />
                              <path d="M4 16c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3" />
                            </svg>
                            {operatingAttractionsCount} {tCommon('operating')}
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Bottom Section: Wait Time, Peak, Sparkline */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: '24px',
                    borderTop: '2px solid rgba(255,255,255,0.15)',
                    paddingTop: '24px',
                  }}
                >
                  {/* Left: Wait Time Info / Regional Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!['CONTINENT', 'COUNTRY', 'CITY'].includes(type) ? (
                      <>
                        {status === 'OPERATING' && waitTime !== null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                              <span style={{ fontSize: '96px', fontWeight: 800, lineHeight: 1 }}>
                                {waitTime}
                              </span>
                              <span
                                style={{
                                  fontSize: '48px',
                                  fontWeight: 500,
                                  color: 'rgba(255,255,255,0.8)',
                                }}
                              >
                                {tCommon('minutes')}
                              </span>
                            </div>
                            {peakWaitToday !== undefined && peakWaitToday !== null && (
                              <div
                                style={{
                                  fontSize: '32px',
                                  color: 'rgba(255,255,255,0.6)',
                                  fontWeight: 500,
                                }}
                              >
                                {tAttractions('peak', { time: peakWaitToday })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '48px',
                              fontWeight: 500,
                              color: 'rgba(255,255,255,0.6)',
                            }}
                          >
                            {type === 'ATTRACTION'
                              ? tAttractions('status.closed')
                              : tParks('status.CLOSED')}
                          </span>
                        )}

                        {type !== 'ATTRACTION' && status === 'OPERATING' && waitTime !== null && (
                          <div
                            style={{
                              display: 'flex',
                              fontSize: '32px',
                              color: 'rgba(255,255,255,0.6)',
                              fontWeight: 500,
                            }}
                          >
                            {tParks('avgWaitTime')}
                          </div>
                        )}
                      </>
                    ) : (
                      // Regional Footer Info
                      <div
                        style={{
                          display: 'flex',
                          fontSize: '32px',
                          color: 'rgba(255,255,255,0.6)',
                          fontWeight: 500,
                        }}
                      >
                        <>
                          {tGeo('parkCount', { count: totalParks })} • {tCommon('discover')}
                        </>
                      </div>
                    )}
                  </div>

                  {/* Right: park.fan branding only (if no sparkline or just always?)
                      User removed duplicate branding previously.
                      So this Right column effectively becomes empty or just for branding if desired?
                      If Sparkline is absolute, we don't need this right column unless we want park.fan fallback.
                      User wanted duplicate removed.
                   */}
                  {/* Empty right side effectively, or maybe we don't need justify-between anymore?
                       Let's keep structure for safety, but empty. */}
                </div>
              </div>
            )}
          </div>

          {/* Full Width Sparkline Overlay - Positioned Absolute at Bottom of Root Container */}
          {sparklineHistory && sparklineHistory.length > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: '150px',
                display: 'flex',
                alignItems: 'flex-end',
                zIndex: 0,
                opacity: 0.4,
              }}
            >
              <svg
                width={WIDTH}
                height="150"
                viewBox={`0 0 ${WIDTH} 150`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%' }}
              >
                <path
                  d={generateSparklinePath(
                    // Add current wait time as the last point if available
                    waitTime !== null
                      ? [...sparklineHistory, { timestamp: new Date().toISOString(), waitTime }]
                      : sparklineHistory,
                    WIDTH,
                    150
                  )}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>,
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[OG Image] Error generating image:', error);
    return new Response(`Error generating image: ${error}`, { status: 500 });
  }
}
