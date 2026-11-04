'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { getHeroMetaBySrc, heroImageSrcs, heroObjectPosition } from '@/lib/media/hero';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { BACKGROUND_BLUR_DATA_URL } from '@/lib/utils/image-placeholder';
import { useHeroRotation } from '@/components/layout/hero-rotation-context';
import { cn } from '@/lib/utils';

// Hero sources are at most 1024 px wide, so 60vw on phones picks the largest candidate that is not
// an upscale. Desktop keeps 115vw; `backgroundImageLoader` bands the quality by painted width.
const HERO_IMAGE_SIZES = '(max-width: 768px) 60vw, 115vw';

/**
 * How many in-park layers are kept mounted around the active one: the outgoing image (still fading
 * out), the active one, and the next one (preloading behind opacity-0). Everything else in a park's
 * set stays out of the DOM — see {@link InParkHeroImages}.
 */
const PARK_LAYER_LOOKAHEAD = 1;

let clientRandomHero: string | null | undefined;

/** One random pick per page load: a store snapshot must not change between two reads. */
function randomHeroSnapshot(): string | null {
  if (clientRandomHero === undefined) {
    const pool = heroImageSrcs();
    clientRandomHero = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }
  return clientRandomHero;
}

const subscribeToNothing = () => () => {};
const noHero = () => null;

/**
 * Alt text for a hero photo when the caller passed none, composed from `HERO_META` at no bundle
 * cost. Server callers pass the authored sidecar text; this covers the client-side rotation.
 * Returns `''` (decorative) when nothing is known, rather than announcing a placeholder.
 */
function heroAltFromMeta(src: string | null | undefined): string {
  const meta = src ? getHeroMetaBySrc(src) : null;
  if (!meta) return '';
  return [meta.attractionName, meta.area, meta.parkName].filter(Boolean).join(', ');
}

interface RandomHeroImageProps {
  imageSrc?: string;
  /**
   * Authored alt for `imageSrc`, resolved server-side through `getMediaAltBySrc`. Omit it and the
   * image describes itself from {@link heroAltFromMeta} instead — correct, just not the human
   * sentence the sidecar holds in six languages.
   */
  alt?: string;
  /**
   * Tiny inline preview of THIS photo, so the first frame is a blurred version of what is about
   * to arrive rather than a generic brand gradient. Falls back to the gradient when the caller
   * has none (the client-random pick has no way to look one up).
   */
  blurDataURL?: string;
}

/**
 * When the user is detected inside a park, rotate through that park's own hero images (crossfade).
 * Driven by {@link useHeroRotation} so it stays in sync with the image attribution. Runs after the
 * nearby lookup resolves — i.e. after LCP — so it never affects the server hero image's load.
 */
function InParkHeroImages({
  onActiveImageLoad,
}: {
  /** Fires when the currently shown park image has finished loading (used by the base
      image to hold its fade-out until there are real pixels to crossfade into). */
  onActiveImageLoad?: () => void;
}) {
  const { parkImages, activeIndex } = useHeroRotation();

  if (parkImages.length === 0) return null;

  const total = parkImages.length;

  // One stacked layer per park image, crossfaded by opacity. The layer div is always mounted; the
  // <Image> inside mounts only for a small window around the active layer: every layer sits in the viewport, so
  // `loading="lazy"` would defer nothing, and the next image preloads during the current one's
  // turn.
  return (
    <>
      {parkImages.map((src, i) => {
        // Distance forward from the active layer, wrapped: 0 = on screen, 1 = up next,
        // total - 1 = the one currently fading out.
        const ahead = (i - activeIndex + total) % total;
        const isMounted = ahead <= PARK_LAYER_LOOKAHEAD || ahead === total - 1;

        return (
          <div
            key={src}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              i === activeIndex ? 'opacity-100' : 'opacity-0'
            )}
          >
            {isMounted && (
              <Image
                src={src}
                alt={heroAltFromMeta(src)}
                fill
                loader={backgroundImageLoader}
                loading="eager"
                onLoad={i === activeIndex ? onActiveImageLoad : undefined}
                className="object-cover"
                // The hero is the site's most aggressive crop — a 3:2 photo across a
                // 21:9 viewport loses most of its height — so a subject near an edge
                // disappears here first. Honour the image's focal point.
                style={{ objectPosition: heroObjectPosition(src) }}
                sizes={HERO_IMAGE_SIZES}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * The hero photo: the server-picked image (or a random one), standing still over a blurred preview,
 * crossfading into the park's own photos when the visitor is inside a park. No pan: the hero's
 * text, Parky and the card rail are motion enough.
 */
export function RandomHeroImage({ imageSrc, blurDataURL, alt }: RandomHeroImageProps) {
  // With a server pick the client snapshot is the server's, so hydration has nothing to redo.
  const randomImage = useSyncExternalStore(
    subscribeToNothing,
    imageSrc ? noHero : randomHeroSnapshot,
    noHero
  );
  const { parkImages } = useHeroRotation();
  const hasParkImages = parkImages.length > 0;

  // Hold the base image at full opacity until the first park image has loaded, or the hero
  // crossfades into an empty layer and flashes the background gradient.
  const [parkImageLoaded, setParkImageLoaded] = useState(false);
  // Reset during render (not in an effect) when the in-park images go away, so a later
  // re-entry starts from "not loaded" again.
  const [prevHasParkImages, setPrevHasParkImages] = useState(hasParkImages);
  if (prevHasParkImages !== hasParkImages) {
    setPrevHasParkImages(hasParkImages);
    if (!hasParkImages) setParkImageLoaded(false);
  }

  const finalImage = imageSrc || randomImage;
  const isServerImage = !!imageSrc;

  if (!finalImage) return null;

  return (
    <>
      {/* Base image: the server-rendered LCP hero (or a client-random fallback). Fades out once the
          in-park park images take over, so it doesn't show through their crossfade. */}
      <Image
        src={finalImage}
        alt={alt ?? heroAltFromMeta(finalImage)}
        fill
        loader={backgroundImageLoader}
        priority={isServerImage}
        fetchPriority={isServerImage ? 'high' : undefined}
        // Paint something in the first frame: a 16 px inline preview of this photo, so the
        // rendition landing reads as the same picture sharpening, or the brand gradient when the
        // caller has none. A background-image on the <img>, not an LCP candidate of its own.
        placeholder="blur"
        blurDataURL={blurDataURL ?? BACKGROUND_BLUR_DATA_URL}
        className={cn(
          'object-cover transition-opacity duration-1000',
          hasParkImages && parkImageLoaded ? 'opacity-0' : 'opacity-100'
        )}
        style={{ objectPosition: heroObjectPosition(finalImage) }}
        sizes={HERO_IMAGE_SIZES}
      />
      <InParkHeroImages onActiveImageLoad={() => setParkImageLoaded(true)} />
    </>
  );
}

interface HeroBackgroundProps {
  imageSrc?: string;
  /** Authored alt for `imageSrc` — see {@link RandomHeroImageProps.alt}. */
  alt?: string;
  /** Inline preview of `imageSrc` — see {@link RandomHeroImageProps.blurDataURL}. */
  blurDataURL?: string;
}

/**
 * The homepage hero background: the park photo, still, under the scrims the hero's text stands on.
 * When the visitor is inside a real park, that park's own photos crossfade in on top.
 */
export function HeroBackground({ imageSrc, blurDataURL, alt }: HeroBackgroundProps) {
  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      <RandomHeroImage imageSrc={imageSrc} blurDataURL={blurDataURL} alt={alt} />
      {/* The scrims the hero's text stands on, in the page's own background so the photo runs
          into the page in either theme: one under the header, one rising from the lower edge
          behind the headline and the field, and from `md`, where the text stays left, one from
          the left. */}
      <div className="from-background/70 absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent" />
      <div className="from-background via-background/80 absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t via-35% to-transparent" />
      <div className="from-background/65 via-background/15 absolute inset-0 hidden bg-gradient-to-r via-50% to-transparent md:block" />
    </div>
  );
}
