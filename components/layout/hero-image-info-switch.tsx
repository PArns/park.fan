'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useHeroRotation } from '@/components/layout/hero-rotation-context';
import { HeroImageInfoPanel } from '@/components/layout/hero-image-info-panel';
import { HERO_IMAGE_META } from '@/lib/hero-images-meta';

/**
 * Hero image attribution that follows the rotation: when the user is in a park, it captions the
 * park image currently shown (kept in sync via {@link useHeroRotation}); otherwise it renders the
 * server-provided default caption (`children`).
 */
export function HeroImageInfoSwitch({ children }: { children: ReactNode }) {
  const { activeSrc } = useHeroRotation();
  const tGeo = useTranslations('geo');

  const meta = activeSrc ? HERO_IMAGE_META[activeSrc] : undefined;
  if (meta) {
    const country = tGeo.has(`countries.${meta.countrySlug}`)
      ? tGeo(`countries.${meta.countrySlug}` as never)
      : meta.countrySlug;
    return <HeroImageInfoPanel meta={meta} country={country} />;
  }

  return <>{children}</>;
}
