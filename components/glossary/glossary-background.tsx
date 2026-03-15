'use client';

import { RandomHeroImage } from '@/components/layout/hero-background';

/**
 * Random park background for glossary pages.
 * Picks a random image from HERO_IMAGES on every client load.
 * No Ken Burns animation — image stays static.
 * Fades to the page background colour over the lower third.
 */
export function GlossaryBackground() {
  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 -z-10 h-[calc(90vh+4rem)] max-h-[1100px] overflow-hidden select-none">
      <div className="relative h-full w-full">
        <RandomHeroImage noAnimation />
        {/* First pass: gentle fade starts at mid-image */}
        <div className="via-background/20 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
        {/* Second pass: stronger fade over the lower third */}
        <div className="via-background/60 to-background absolute inset-0 translate-y-1/2 bg-gradient-to-b from-transparent" />
      </div>
    </div>
  );
}
