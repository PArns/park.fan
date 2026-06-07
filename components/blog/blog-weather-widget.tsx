import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { GlassCard } from '@/components/common/glass-card';
import { WeatherCard } from '@/components/parks/weather-card';
import { getParkByGeoPath } from '@/lib/api/parks';
import { getParkWeatherNowcast } from '@/lib/api/weather-nowcast';
import { parkGeoPath } from '@/lib/blog/widget-park';
import type { ResolvedPark } from '@/lib/blog/park-resolver';

interface BlogWeatherWidgetProps {
  park: ResolvedPark | null;
  slug: string;
}

/**
 * Inline live weather card used inside blog posts via:
 *   ```weather-widget slug=europa-park
 *   ```
 *
 * Reuses the park detail page's WeatherCard. The full park carries the weather
 * payload; passing the geo params enables the same live nowcast polling. Renders
 * nothing when the park has no current weather rather than an empty card.
 */
export async function BlogWeatherWidget({ park, slug }: BlogWeatherWidgetProps) {
  const tBlog = await getTranslations('blog');
  const geo = park ? parkGeoPath(park) : null;

  if (!park || !geo) {
    return (
      <GlassCard variant="light" className="not-prose my-8">
        <p className="text-muted-foreground text-sm">{tBlog('widget.parkNotFound', { slug })}</p>
      </GlassCard>
    );
  }

  // Dynamic PPR hole: weather + nowcast stream below the fold so they never
  // block the prerendered shell.
  await connection();
  const [full, nowcast] = await Promise.all([
    getParkByGeoPath(geo.continent, geo.country, geo.city, geo.parkSlug).catch(() => null),
    getParkWeatherNowcast(geo.continent, geo.country, geo.city, geo.parkSlug).catch(() => null),
  ]);
  if (!full?.weather?.current) return null;

  return (
    <div className="not-prose my-8 grid gap-3">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {tBlog('widget.weather')}
      </h3>
      <WeatherCard
        weather={full.weather}
        nowcast={nowcast}
        continent={geo.continent}
        country={geo.country}
        city={geo.city}
        parkSlug={geo.parkSlug}
      />
    </div>
  );
}
