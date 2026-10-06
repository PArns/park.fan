import { getTranslations } from 'next-intl/server';
import type { HeroImageMeta } from '@/lib/media/hero';
import { HeroImageInfoPanel } from '@/components/layout/hero-image-info-panel';

interface HeroImageInfoProps {
  meta: HeroImageMeta;
}

/**
 * Server wrapper for the hero photo caption: translates the country name and renders
 * `HeroImageInfoPanel`.
 */
export async function HeroImageInfo({ meta }: HeroImageInfoProps) {
  const tGeo = await getTranslations('geo');
  const country =
    (tGeo.has(`countries.${meta.countrySlug}`)
      ? tGeo(`countries.${meta.countrySlug}` as never)
      : null) ?? meta.countrySlug;

  return <HeroImageInfoPanel meta={meta} country={country} />;
}
