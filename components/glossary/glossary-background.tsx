import { cacheLife } from 'next/cache';
import { RandomHeroImage } from '@/components/layout/hero-background';
import { HERO_IMAGES } from '@/lib/hero-images';

/**
 * Pick the glossary background server-side (rotates every ~5 min via the data cache), exactly like
 * the homepage hero. This is what makes the image an LCP-friendly resource: passing `imageSrc` to
 * <RandomHeroImage> renders it in the SSR HTML with `priority` + `fetchPriority="high"` (next/image
 * then preloads the optimized rendition). The old client-random pick (no `imageSrc`) only chose the
 * image in a post-hydration effect with no priority, so the largest element didn't even start
 * loading until the JS had run — the cause of the multi-second glossary LCP.
 */
async function pickGlossaryHero(): Promise<string> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 900 });
  return HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
}

/**
 * Random park background for glossary pages — server-rendered for a fast LCP.
 * No Ken Burns animation. Fades to the page background colour over the lower third.
 */
export async function GlossaryBackground() {
  const imageSrc = await pickGlossaryHero();

  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 -z-10 h-[calc(90vh+4rem)] max-h-[1100px] overflow-hidden select-none">
      <div className="relative h-full w-full">
        <RandomHeroImage imageSrc={imageSrc} noAnimation />
        {/* First pass: gentle fade starts at mid-image */}
        <div className="via-background/20 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
        {/* Second pass: stronger fade over the lower third */}
        <div className="via-background/60 to-background absolute inset-0 translate-y-1/2 bg-gradient-to-b from-transparent" />
      </div>
    </div>
  );
}
