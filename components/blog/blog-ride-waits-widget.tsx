import { getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { RideWaitTable, type RideWaitTableLabels } from '@/components/parks/ride-wait-table';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { RideWaitPark, RideWaitTarget } from '@/lib/hooks/use-ride-wait-stats';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

type Column = 'park' | 'land' | 'type' | 'peak' | 'days';
const COLUMNS: readonly Column[] = ['park', 'land', 'type', 'peak', 'days'];

interface BlogRideWaitsWidgetProps {
  /** Pre-resolved parks, keyed by the slug written in the fence. */
  parks: ReadonlyMap<string, ResolvedPark | null>;
  /** `park=` — one park, top of its ranking. Mutually exclusive with `rides`. */
  parkSlug?: string;
  /** `top=` — how many rides in park mode. */
  top?: string;
  /**
   * `rides=` — a SEMICOLON-separated list of `parkSlug/rideSlug`, each optionally carrying a
   * display label and a ride type: `phantasialand/taron|Taron|Multi-Launch, Stahl`.
   *
   * Semicolons rather than commas because the type routinely contains one ("Dive Coaster, Stahl"
   * is how three of the replaced tables wrote it), and a separator a value can hold is not a
   * separator. The `|` fields are positional and both optional.
   *
   * The label and type are author-supplied because they are stable facts: a coaster's layout does
   * not change between two page loads. The MINUTES are what drifts, and they never appear here.
   */
  rides?: string;
  /** `columns=` — comma-separated subset of park,land,type,peak,days. */
  columns?: string;
  /** `highlight=` — `parkSlug/rideSlug` in rides mode, a bare ride slug in park mode. Rendered bold. */
  highlight?: string;
}

function parseColumns(raw: string | undefined): Column[] | undefined {
  if (!raw) return undefined;
  const picked = raw
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter((c): c is Column => (COLUMNS as readonly string[]).includes(c));
  // An attribute naming nothing valid is a typo in the post, not a request for a one-column
  // table — fall back to the default rather than rendering a bare list of names.
  return picked.length > 0 ? picked : undefined;
}

/** `parkSlug/rideSlug|Label|Type` — the pipe segments are optional and positional. */
function parseRide(
  raw: string
): { parkSlug: string; rideSlug: string; label?: string; type?: string } | null {
  const [ref, label, type] = raw.split('|').map((part) => part.trim());
  const [parkSlug, rideSlug] = (ref ?? '').split('/').map((part) => part.trim());
  if (!parkSlug || !rideSlug) return null;
  return {
    parkSlug,
    rideSlug,
    ...(label ? { label } : {}),
    ...(type ? { type } : {}),
  };
}

function toRideWaitPark(park: ResolvedPark): RideWaitPark | null {
  const geo = parkGeoPath(park);
  if (!geo) return null;
  // `href` is `/parks/<continent>/<country>/<city>/<park>`, which is both the park page and the
  // prefix a ride page hangs off — one value, named twice so neither call site rebuilds it.
  return { ...geo, name: park.name, href: park.href, basePath: park.href };
}

/**
 * Wait-time tables inside a blog post, in the two shapes posts actually write:
 *
 *   ```ride-waits-widget park=efteling top=10 columns=land,peak,days
 *   ```
 *
 *   ```ride-waits-widget rides=attractiepark-toverland/troy|Troy|Holz;efteling/joris-en-de-draak columns=park,type,peak highlight=attractiepark-toverland/troy
 *   ```
 *
 * Replaces twenty-two hand-maintained markdown tables across four posts and six locales. They had
 * already drifted: the Efteling post quoted 34 minutes for Joris en de Draak against 35 on the
 * park page, and the two Toverland tables in one post disagreed with each other by a minute
 * because they were typed a week apart. Nothing detected either — a stale number in markdown looks
 * exactly like a fresh one.
 *
 * Both modes read the CDN-cached `/api/parks/.../stats`, the same payload the `stats-widget` and
 * the park-comparison table use, so two tables in one post share a fetch and agree by construction.
 */
export async function BlogRideWaitsWidget({
  parks,
  parkSlug,
  top,
  rides,
  columns,
  highlight,
}: BlogRideWaitsWidgetProps) {
  const [t, tOverview, tBlog] = await Promise.all([
    getTranslations('parks.stats'),
    getTranslations('parks.overview'),
    getTranslations('blog'),
  ]);

  const labels: RideWaitTableLabels = {
    title: t('rideWaitsTitle'),
    ride: t('rideWaitsRide'),
    park: t('comparisonPark'),
    land: t('rideWaitsLand'),
    type: t('rideWaitsType'),
    typical: t('typicalWait'),
    peak: t('peakWait'),
    sampleDays: t('rideWaitsSampleDays'),
    minutes: tOverview('minutesUnit'),
  };

  const notFound = (slug: string) => (
    <GlassCard variant="light" className="not-prose clear-both my-8">
      <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
    </GlassCard>
  );

  if (rides) {
    // Semicolons, not commas: a ride type routinely holds a comma ("Dive Coaster, Stahl" is how
    // three of the replaced tables wrote it), and a separator a value can contain is not one.
    const parsed = rides
      .split(';')
      .map(parseRide)
      .filter((r) => r !== null);
    const resolved: RideWaitPark[] = [];
    const targets: RideWaitTarget[] = [];
    const missing = new Set<string>();
    const highlighted = (highlight ?? '').trim();

    for (const ride of parsed) {
      const park = parks.get(ride.parkSlug) ?? null;
      const entry = park ? toRideWaitPark(park) : null;
      if (!entry) {
        missing.add(ride.parkSlug);
        continue;
      }
      // One fetch per park however many of its rides the table names.
      if (!resolved.some((p) => p.parkSlug === entry.parkSlug)) resolved.push(entry);
      targets.push({
        parkSlug: entry.parkSlug,
        rideSlug: ride.rideSlug,
        ...(ride.label ? { label: ride.label } : {}),
        ...(ride.type ? { type: ride.type } : {}),
        highlight: highlighted === `${ride.parkSlug}/${ride.rideSlug}`,
      });
    }

    if (targets.length === 0) return notFound([...missing].join(', ') || rides);

    return (
      <div className="not-prose clear-both my-8">
        <RideWaitTable
          parks={resolved}
          labels={labels}
          options={{ mode: 'rides', targets }}
          {...(parseColumns(columns) ? { columns: parseColumns(columns) } : {})}
        />
        {missing.size > 0 && (
          <p className="text-muted-foreground/60 mt-2 text-xs">
            {tBlog('widget.parkNotFound', { slug: [...missing].join(', ') })}
          </p>
        )}
      </div>
    );
  }

  if (!parkSlug) return null;
  const park = parks.get(parkSlug) ?? null;
  const entry = park ? toRideWaitPark(park) : null;
  if (!entry) return notFound(parkSlug);

  // Ten is what every replaced table showed; the API caps the default ranking at ten too, so a
  // larger number here would silently return fewer rows than asked for.
  const limit = Math.min(Math.max(Number(top) || 10, 1), 10);

  return (
    <div className="not-prose clear-both my-8">
      <RideWaitTable
        parks={[entry]}
        labels={labels}
        options={{ mode: 'park', limit, ...(highlight ? { highlight: highlight.trim() } : {}) }}
        {...(parseColumns(columns) ? { columns: parseColumns(columns) } : {})}
      />
    </div>
  );
}
