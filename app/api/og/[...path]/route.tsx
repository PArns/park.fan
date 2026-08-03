import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getParkByGeoPath, getAttractionByGeoPath } from '@/lib/api/parks';
import { getGeoStructure } from '@/lib/api/discovery';
import { getParkBackgroundImage, getAttractionBackgroundImage } from '@/lib/utils/park-assets';
import { stripNewPrefix } from '@/lib/utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { HERO_IMAGES } from '@/lib/hero-images';
import { ParkAttraction, GeoStructure } from '@/lib/api/types';
import { isValidLocale, type Locale } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { OgBrandLockup } from '@/lib/og/brand-mark';
import { ogBackgroundSrc } from '@/lib/og/background-photo';
import { ogAsJpeg } from '@/lib/og/jpeg';
import {
  FlagDE,
  FlagGB,
  FlagNL,
  FlagFR,
  FlagES,
  FlagHK,
  FlagUS,
  FlagJP,
  FlagCN,
  FlagAT,
  FlagBE,
  FlagDK,
  FlagIT,
  FlagPL,
  FlagSE,
  FlagCA,
  FlagMX,
  FlagKR,
  FlagAU,
  FlagBR,
} from '@/components/common/icons/flags'; // Added generic icon import if needed, but imported specifically here

// OG Image dimensions
const WIDTH = 1200;
const HEIGHT = 630;

// Flag mapping
const FLAGS: Record<string, React.ComponentType<React.ComponentProps<'svg'>>> = {
  germany: FlagDE,
  'united-kingdom': FlagGB,
  netherlands: FlagNL,
  france: FlagFR,
  spain: FlagES,
  'hong-kong': FlagHK,
  'united-states': FlagUS,
  japan: FlagJP,
  china: FlagCN,
  austria: FlagAT,
  belgium: FlagBE,
  denmark: FlagDK,
  italy: FlagIT,
  poland: FlagPL,
  sweden: FlagSE,
  canada: FlagCA,
  mexico: FlagMX,
  'south-korea': FlagKR,
  australia: FlagAU,
  brazil: FlagBR,
};

type OgPageType = 'HOME' | 'GENERIC' | 'CONTINENT' | 'COUNTRY' | 'CITY' | 'PARK' | 'ATTRACTION';

function determineOgPageType(path: string[], isGeneric: boolean): OgPageType {
  if (path.length === 1) return 'HOME';
  if (isGeneric) return 'GENERIC';
  if (path.length === 2) return 'CONTINENT';
  if (path.length === 3) return 'COUNTRY';
  if (path.length === 4) return 'CITY';
  if (path.length >= 6 && path[5]) return 'ATTRACTION';
  return 'PARK';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: rawPath } = await params;

    // Remove optional .png extension (fake extension for social media crawlers)
    let path = rawPath;
    if (path.length > 0 && path[path.length - 1] === 'og.png') {
      path = path.slice(0, -1);
    }

    // Parse path: locale/continent/country/city/park or locale/continent/country/city/park/attraction
    // New: Allow locale (1), locale/continent (2), ...
    if (path.length < 1) {
      return new Response('Invalid path. Expected at least: locale', { status: 400 });
    }

    // Blog branch — `<locale>/blog/...` (index / post / category / tag) is
    // handled by a dedicated, simpler renderer. Falls through to the
    // existing flow when the second segment isn't `blog`.
    if (path.length >= 2 && path[1] === 'blog' && isValidLocale(path[0])) {
      const { renderBlogOg } = await import('@/lib/og/blog-og');
      return renderBlogOg({
        locale: path[0] as Locale,
        segments: path.slice(2),
      });
    }

    // Glossary TERM branch — `<locale>/<glossarySegment>/<termSlug>` (length 3).
    // The overview (length 2) still uses the generic card on purpose; only a
    // real term slug gets a dedicated name + definition card. Unknown slugs
    // fall through to the generic handler below.
    if (path.length === 3 && isValidLocale(path[0])) {
      const termLocale = path[0] as Locale;
      if (path[1] === GLOSSARY_SEGMENTS[termLocale]) {
        const { getTermBySlug } = await import('@/lib/glossary/translations');
        const term = await getTermBySlug(termLocale, path[2]);
        if (term) {
          const { renderGlossaryTermOg } = await import('@/lib/og/glossary-og');
          return renderGlossaryTermOg({ locale: termLocale, term });
        }
      }
    }

    // Generic pages configuration
    const glossaryEntries = Object.fromEntries(
      Object.values(GLOSSARY_SEGMENTS).map((seg) => [
        seg,
        { namespace: 'glossary', key: 'overviewTitle' },
      ])
    );
    const genericPages = {
      search: { namespace: 'common', key: 'search' },
      datenschutz: { namespace: 'datenschutz', key: 'title' },
      privacy: { namespace: 'datenschutz', key: 'title' },
      impressum: { namespace: 'impressum', key: 'title' },
      imprint: { namespace: 'impressum', key: 'title' },
      parks: { namespace: 'explore', key: 'parksTitle' },
      howto: { namespace: 'howto', key: 'title' },
      fancast: { namespace: 'fancast', key: 'title' },
      'best-time-to-visit': { namespace: 'bestTime', key: 'title' },
      ...glossaryEntries,
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
    const type = determineOgPageType(path, Boolean(isGeneric));

    // Fetch translations
    const [tCommon, tGeo, tHomepage] = await Promise.all([
      getTranslations({ locale, namespace: 'common' }),
      getTranslations({ locale, namespace: 'geo' }),
      getTranslations({ locale, namespace: 'homepage' }),
    ]);

    // Dynamic translations for generic pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tGeneric: any = null;
    if (type === 'GENERIC') {
      const config = genericPages[secondSegment as keyof typeof genericPages];
      tGeneric = await getTranslations({ locale, namespace: config.namespace });
    }

    let name = '';
    let backgroundImagePath: string | null = null;

    // Regional aggregates. Only the *total* park count survives here: it barely moves,
    // whereas the former "N open" figure was live data and would have gone stale behind
    // the 30-day cache these cards now use.
    let totalParks = 0;

    let geoSvg = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let park: any = null;

    // GeoStructure is a 159 KB document, and it used to be fetched (and JSON-parsed) on EVERY
    // render for EVERY card type. The geo cards genuinely need it — they read `parkCount` and the
    // country list that seeds the map SVG. Place cards (PARK / ATTRACTION) do not: `park.city` is
    // the preferred city name and wins over `cityNode`, and the country name comes from the `geo`
    // messages, with `countryNode` only a fallback for a country that has no translation.
    //
    // So it is resolved lazily now. Awaiting it stays a single call per render — `getGeoStructure`
    // is a cached `fetch`, and the promise is memoized here so the two nodes below can't fetch
    // twice.
    let geoPromise: Promise<GeoStructure> | null = null;
    const loadGeo = () => (geoPromise ??= getGeoStructure());
    // Only the region cards need the node tree up front; HOME/GENERIC take just `parkCount` and
    // place cards usually take nothing at all, so both reach for `loadGeo()` where they need it.
    const needsGeoTree = type === 'CONTINENT' || type === 'COUNTRY' || type === 'CITY';
    const geo = needsGeoTree ? await loadGeo() : null;

    const continentNode =
      continent && geo ? geo.continents.find((c) => c.slug === continent) : null;
    const countryNode = country ? continentNode?.countries.find((c) => c.slug === country) : null;
    const cityNode = city ? countryNode?.cities.find((c) => c.slug === city) : null;

    if (type === 'HOME') {
      name = tHomepage('features.title'); // OG home subtitle, e.g. "Plan Your Perfect Theme Park Visit"
      totalParks = (await loadGeo()).parkCount;

      // Random Background from Hero Images
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      backgroundImagePath = HERO_IMAGES[randomIndex];
    } else if (type === 'GENERIC') {
      const config = genericPages[secondSegment as keyof typeof genericPages];
      // Legal pages carry an SEO site-name suffix ("… - park.fan"); strip it
      // from the OG headline so the brand appears once (the corner lockup).
      // A trailing separator is required, so integral names ("Cos'è park.fan?")
      // are left untouched.
      name = tGeneric(config.key).replace(/\s*[-–—·|]\s*park\.fan\s*$/i, '');

      // For 'parks' generic page, we can show stats
      if (secondSegment === 'parks') {
        totalParks = (await loadGeo()).parkCount;
      }

      // Use a random hero image for visuals if no specific one
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      backgroundImagePath = HERO_IMAGES[randomIndex];
    } else if (['CONTINENT', 'COUNTRY', 'CITY'].includes(type)) {
      const { getRegionGeoSVG } = await import('@/lib/utils/geo-svg');
      // Resolve Name & Stats based on Type
      if (type === 'CONTINENT' && continentNode) {
        name = translateGeoSlug(tGeo, 'continents', continent, continentNode.name);
        totalParks = continentNode.parkCount;

        // Get all country codes and names for the continent
        // EXCLUDE Russia (RU) for Europe visuals because it's too wide and shrinks the rest of Europe
        const identifiers = continentNode.countries
          .filter((c) => continent !== 'europe' || c.code !== 'RU')
          .flatMap((c) => [c.code, c.name].filter(Boolean));

        geoSvg = getRegionGeoSVG(identifiers);
      } else if (type === 'COUNTRY' && countryNode) {
        const normalizedCountry = country.toLowerCase().replace(/\s+/g, '-');
        name = translateGeoSlug(tGeo, 'countries', normalizedCountry, countryNode.name);
        totalParks = countryNode.parkCount;

        geoSvg = getRegionGeoSVG([countryNode.code, countryNode.name]);
      } else if (type === 'CITY' && cityNode) {
        name = cityNode.name;
        totalParks = cityNode.parkCount;

        // For city, prevent showing the entire country if it's huge?
        // Ideally we'd have city shape or point, but for now showing the Country context is safer via map
        // OR fallback to the park background if we prefer not to show the whole country.
        // Let's reuse the country map for context, maybe highlights?
        // For now: Country Map.
        if (countryNode) {
          geoSvg = getRegionGeoSVG([countryNode.code, countryNode.name]);
        }
      }
    } else if (type === 'PARK' || type === 'ATTRACTION') {
      // ... Original Logic for Park/Attraction ...
      park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);

      if (!park) {
        return new Response('Park not found', { status: 404 });
      }

      let attraction = null;

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

        name = stripNewPrefix(attraction.name);
        backgroundImagePath =
          getAttractionBackgroundImage(parkSlug, attractionSlug) ??
          getParkBackgroundImage(parkSlug);
      } else {
        // Park logic
        name = stripNewPrefix(park.name);
        backgroundImagePath = getParkBackgroundImage(parkSlug);
      }
      // No status, crowd level or wait time is read here any more — that live data is
      // what pinned these cards to a 5-minute cache, and a social platform re-shows a
      // cached OG image for days, so the figures were usually wrong by the time anyone
      // saw them. The park lookup stays: it supplies the name and the background photo.
    }

    // Park & attraction cards ("place cards") get the centred, large-headline treatment:
    // they carry no badge row any more, so the name and location own the composition.
    const isPlaceCard = !['CONTINENT', 'COUNTRY', 'CITY', 'GENERIC', 'HOME'].includes(type);

    // Background photo, inlined off the deployment's own disk rather than fetched over the public
    // internet on every render — see lib/og/background-photo.ts for the measurements. Falls back
    // to the absolute URL when the file isn't in the bundle, so behaviour never regresses.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://park.fan';
    const backgroundUrl = ogBackgroundSrc(backgroundImagePath, baseUrl);

    // Location string logic
    // For Continent/Country/City we might display "Explore Parks" or similar?
    // Let's keep it simple.

    // For Park/Attraction we need city/country names
    let locationString = '';
    if (type === 'PARK' || type === 'ATTRACTION') {
      // Place cards skipped the geo document above, so the two `…Node` fallbacks below have to
      // reach for it themselves — and only when they are actually needed. In practice they never
      // are: `park.city` is set for every park the API resolves, and every country in the catalog
      // has a `geo.countries.*` message. This keeps the fallback honest without paying 159 KB for
      // it on the happy path.
      const geoNodes = async () => {
        const g = await loadGeo();
        const cn = g.continents.find((c) => c.slug === continent);
        const con = cn?.countries.find((c) => c.slug === country);
        return { countryNode: con, cityNode: con?.cities.find((c) => c.slug === city) };
      };

      // Priority: Park City (Source of Truth) > CityNode Name > Slug Fallback
      // We prioritize park.city because the detailed park record usually has the correct formatted name (e.g. "Brühl"),
      // whereas cityNode might just be derived from the slug ("Bruehl").
      const cityName =
        (park && park.city) ||
        (await geoNodes()).cityNode?.name ||
        city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

      const normalizedCountry = country.toLowerCase().replace(/\s+/g, '-');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let countryName = tGeo(`countries.${normalizedCountry}` as any);
      if (countryName === `countries.${normalizedCountry}`)
        countryName =
          (await geoNodes()).countryNode?.name ||
          country.charAt(0).toUpperCase() + country.slice(1);

      const parkName = park?.name
        ? stripNewPrefix(park.name)
        : parkSlug
            .split('-')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');

      locationString =
        type === 'ATTRACTION'
          ? `${parkName} • ${cityName}, ${countryName}`
          : `${cityName}, ${countryName}`;
    }

    // Load fonts or use system fonts.
    // Since we can't easily load custom fonts here without more setup, we'll stick to system-ui but making it look good.

    // Pre-calculate translations to avoid lint errors with dynamic keys in JSX
    // Only translate for geographic pages (CONTINENT, COUNTRY, CITY, PARK, ATTRACTION)
    const needsGeoTranslations = ['CONTINENT', 'COUNTRY', 'CITY', 'PARK', 'ATTRACTION'].includes(
      type
    );
    const localizedCountryName =
      country && needsGeoTranslations
        ? tGeo(`countries.${country.toLowerCase().replace(/\s+/g, '-')}` as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        : '';
    const localizedContinentName =
      continent && needsGeoTranslations
        ? tGeo(`continents.${continent}` as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        : '';

    return ogAsJpeg(
      new ImageResponse(
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            backgroundColor: '#0f172a', // Slate 900 base
            color: 'white',
            fontFamily: '"Inter"',
            position: 'relative',
            overflow: 'hidden',
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
                // Explicit intrinsic size, like the brand lockup already does. Without it Satori has
                // to derive the dimensions from the image itself before it can lay anything out —
                // the step that fails with "Image size cannot be determined" when the source can't
                // be read. The card frame IS 1200×630 and the inlined asset is the 16:9 crop, so
                // `cover` is an exact fit and nothing is cropped away.
                width={WIDTH}
                height={HEIGHT}
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
                  {/* Brand lockup: marker icon + park.fan wordmark asset (dark-bg
                    variant), mirroring the site header's logo. */}
                  <OgBrandLockup markerHeight={150} />

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
                      {
                        ['CONTINENT', 'COUNTRY', 'CITY'].includes(type) ? (
                          <>
                            {type === 'CITY' && (
                              <>
                                📍 {localizedCountryName} • {localizedContinentName}
                              </>
                            )}
                            {type === 'COUNTRY' && <>🌍 {localizedContinentName}</>}
                            {type === 'CONTINENT' && <>🌍 {tGeo('exploreByRegion')}</>}
                          </>
                        ) : null /* No kicker for GENERIC or place cards — park and
                        attraction cards show their location centred under the
                        headline instead of repeating it up here. */
                      }
                    </p>
                  </div>

                  <OgBrandLockup markerHeight={84} />
                </div>

                {/* Main Content Area. Place cards (park/attraction) centre their headline
                  and carry the location directly beneath it — with the live badges gone
                  the name gets that room instead. */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    ...(isPlaceCard ? { alignItems: 'center', width: '100%' } : {}),
                  }}
                >
                  {/* Title */}
                  <h1
                    style={{
                      display: 'flex',
                      fontSize: isPlaceCard ? '104px' : '72px',
                      fontWeight: 800,
                      color: 'white',
                      margin: 0,
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      maxWidth: '90%',
                      ...(isPlaceCard ? { textAlign: 'center', justifyContent: 'center' } : {}),
                    }}
                  >
                    {name}
                  </h1>

                  {/* Location, centred under the headline. Place cards only — the regional
                    layouts keep their kicker in the top bar. */}
                  {isPlaceCard && locationString && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '14px',
                        fontSize: '38px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.85)',
                        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      {FLAGS[country.toLowerCase().replace(/\s+/g, '-')] ? (
                        (() => {
                          const Flag = FLAGS[country.toLowerCase().replace(/\s+/g, '-')];
                          return (
                            <Flag
                              width="56"
                              height="40"
                              style={{ borderRadius: '4px', objectFit: 'cover' }}
                            />
                          );
                        })()
                      ) : (
                        <span>📍</span>
                      )}
                      {locationString}
                    </div>
                  )}

                  {/* No badge row for the regional cards any more: it held a live "N open"
                    count (dropped — it would go stale behind the 30-day cache) next to a
                    park-count badge that just repeated the footer line below. */}

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
                </div>

                {/* Bottom Section: regional stats only. Park/attraction cards used to
                  show the current wait time here; that is exactly the data which forced
                  a 5-minute cache, so it is gone — see the Cache-Control note below. */}
                {['CONTINENT', 'COUNTRY', 'CITY'].includes(type) && (
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
                    <div
                      style={{
                        display: 'flex',
                        fontSize: '32px',
                        color: 'rgba(255,255,255,0.6)',
                        fontWeight: 500,
                      }}
                    >
                      {tGeo('parkCount', { count: totalParks })} • {tCommon('discover')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        {
          width: WIDTH,
          height: HEIGHT,
          headers: {
            // 30 days. The card carries no live data any more (no status, wait time,
            // crowd level or sparkline), so there is nothing left to go stale — and at
            // ~9.2k distinct OG URLs hit roughly once a day each, the previous 5-minute
            // window expired long before a URL was requested again, giving a ~0% hit
            // rate and one full Satori render (plus a background-image fetch) per
            // request. A 30-day window turns ~9.5k renders/day into ~300.
            'Cache-Control':
              'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
          },
        }
      )
    );
  } catch (error) {
    console.error('[OG Image] Error generating image:', error);
    return new Response(`Error generating image: ${error}`, { status: 500 });
  }
}
