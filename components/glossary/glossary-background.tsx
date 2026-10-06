import { getLocale } from 'next-intl/server';
import { RandomHeroImage } from '@/components/layout/hero-background';
import { heroImageSrcs } from '@/lib/media/hero';
import { getMediaAltBySrc } from '@/lib/media/text';

/**
 * Picks the glossary background on the server, so the image is in the SSR HTML with `priority`
 * and preloaded, which keeps LCP fast. Deterministic, not random: the prerendered pages bake in
 * the build-time day index, so every glossary page in a deploy shows the same image and nothing
 * changes per request.
 */
function pickGlossaryHero(): string | null {
  const pool = heroImageSrcs();
  if (!pool.length) return null;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return pool[dayIndex % pool.length];
}

/**
 * Park background for glossary pages, server-rendered for a fast LCP, without the ken-burns pan,
 * fading to the page background over the lower third.
 */
export async function GlossaryBackground({
  headTint = false,
}: {
  /**
   * A theme-aware tint over the top of the photo, for a page whose head sits on it as bare text
   * — the overview's compact `LandingHero`. The term pages keep their head in a glass panel and
   * do not need it. Light tint in light mode, dark in dark, as on the hub heroes.
   */
  headTint?: boolean;
} = {}) {
  const imageSrc = pickGlossaryHero();
  if (!imageSrc) return null;

  // Resolved here rather than inside the image component: `@/lib/media/text` carries six locales
  // of prose for every image and must not cross into a Client Component. This is a Server
  // Component, so only the one resolved sentence travels.
  const alt = getMediaAltBySrc(imageSrc, await getLocale());

  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 -z-10 h-[calc(90vh+4rem)] max-h-[1100px] overflow-hidden select-none">
      <div className="relative h-full w-full">
        <RandomHeroImage imageSrc={imageSrc} noAnimation alt={alt ?? undefined} />
        {/* First pass: gentle fade starts at mid-image */}
        <div className="via-background/20 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
        {/* Second pass: stronger fade over the lower third */}
        <div className="via-background/60 to-background absolute inset-0 translate-y-1/2 bg-gradient-to-b from-transparent" />
        {headTint && (
          <div className="from-background/85 via-background/60 absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b to-transparent" />
        )}
      </div>
    </div>
  );
}
