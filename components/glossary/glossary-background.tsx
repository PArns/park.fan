import { getLocale } from 'next-intl/server';
import { RandomHeroImage } from '@/components/layout/hero-background';
import { BACKDROP_CREDIT_POSITION, PhotoCredit } from '@/components/media/photo-credit';
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
 * A park photo behind the head of a glossary page, server-rendered for a fast LCP, without the
 * ken-burns pan. Washed toward the page background and faded out before the content under the
 * head, so the cards, the player and the sidebar stand on the plain page.
 */
export async function GlossaryBackground() {
  const imageSrc = pickGlossaryHero();
  if (!imageSrc) return null;

  // Resolved here rather than inside the image component: `@/lib/media/text` carries six locales
  // of prose for every image and must not cross into a Client Component. This is a Server
  // Component, so only the one resolved sentence travels.
  const alt = getMediaAltBySrc(imageSrc, await getLocale());

  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 -z-10 h-[26rem] overflow-hidden select-none sm:h-[30rem]">
      <div className="relative h-full w-full">
        <RandomHeroImage imageSrc={imageSrc} noAnimation alt={alt ?? undefined} />
        {/* The wash keeps the head legible in both themes without a panel; the fade has the photo
            gone where the page's own content begins. */}
        <div className="bg-background/70 absolute inset-0" />
        <div className="via-background/60 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
        <PhotoCredit src={imageSrc} className={BACKDROP_CREDIT_POSITION} />
      </div>
    </div>
  );
}
