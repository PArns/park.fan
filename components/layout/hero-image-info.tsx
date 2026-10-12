import { getTranslations } from 'next-intl/server';
import type { HeroImageMeta } from '@/lib/media/hero';
import { HeroImageInfoPanel } from '@/components/layout/hero-image-info-panel';

interface HeroImageInfoProps {
  meta: HeroImageMeta;
  /** The photo being captioned, for its credit. */
  src?: string | null;
}

/**
 * Server wrapper for the hero photo caption: translates the country name and renders
 * `HeroImageInfoPanel`.
 */
export async function HeroImageInfo({ meta, src }: HeroImageInfoProps) {
  const tGeo = await getTranslations('geo');
  const country =
    (tGeo.has(`countries.${meta.countrySlug}`)
      ? tGeo(`countries.${meta.countrySlug}` as never)
      : null) ?? meta.countrySlug;

  return <HeroImageInfoPanel meta={meta} country={country} src={src} />;
}
