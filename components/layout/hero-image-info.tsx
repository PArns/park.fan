import { getTranslations } from 'next-intl/server';
import type { HeroImageMeta } from '@/lib/hero-images-meta';

interface HeroImageInfoProps {
  meta: HeroImageMeta;
}

export async function HeroImageInfo({ meta }: HeroImageInfoProps) {
  const tGeo = await getTranslations('geo');
  const country =
    (tGeo.has(`countries.${meta.countrySlug}`)
      ? tGeo(`countries.${meta.countrySlug}` as never)
      : null) ?? meta.countrySlug;

  const titleParts = [meta.attractionName, meta.area].filter(Boolean);
  const subtitleParts = [meta.parkName, meta.city, country]
    .filter(Boolean)
    .map((s) => s.toUpperCase());

  return (
    <div className="pointer-events-none absolute bottom-14 left-4 hidden select-none lg:block">
      <div className="rounded-lg bg-white/20 px-3 py-2 shadow-lg backdrop-blur-sm dark:bg-black/30">
        {titleParts.length > 0 && (
          <p className="mb-0.5 text-lg leading-tight font-bold text-black/90 dark:text-white">
            {titleParts.join(' · ')}
          </p>
        )}
        <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-black/55 uppercase dark:text-white/70">
          {subtitleParts.join(' · ')}
        </p>
      </div>
    </div>
  );
}
