import { RandomHeroImage } from '@/components/layout/hero-background';
import { heroImageSrcs } from '@/lib/media/hero';

/**
 * Pick the glossary background server-side. Server-rendering is what makes the image an LCP-friendly
 * resource: passing `imageSrc` to <RandomHeroImage> renders it in the SSR HTML with `priority` +
 * `fetchPriority="high"` (next/image then preloads the optimized rendition). The old client-random
 * pick (no `imageSrc`) only chose the image in a post-hydration effect with no priority — the cause
 * of the multi-second glossary LCP.
 *
 * The pick is DETERMINISTIC (not random): on the statically-prerendered glossary pages the
 * build-time day index is baked in, so every glossary page in a deploy resolves to the same image
 * (navigating between terms no longer swaps the hero) and there is zero per-request/ISR write churn.
 */
function pickGlossaryHero(): string | null {
  const pool = heroImageSrcs();
  if (!pool.length) return null;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return pool[dayIndex % pool.length];
}

/**
 * Random park background for glossary pages — server-rendered for a fast LCP.
 * No Ken Burns animation. Fades to the page background colour over the lower third.
 */
export async function GlossaryBackground() {
  const imageSrc = pickGlossaryHero();
  if (!imageSrc) return null;

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
