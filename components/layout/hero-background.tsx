'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { getHeroMetaBySrc, heroImageSrcs, heroObjectPosition } from '@/lib/media/hero';
import { backgroundImageLoader } from '@/lib/utils/image-loader';
import { BACKGROUND_BLUR_DATA_URL } from '@/lib/utils/image-placeholder';
import { useHeroRotation } from '@/components/layout/hero-rotation-context';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { HERO_ENTRANCE_MS } from '@/components/home/hero-entrance-gate';
import { HERO_3D_ENABLED } from '@/lib/config/features';
import { cn } from '@/lib/utils';

// The three.js amusement-park scene pulls in the whole three.js runtime, so it's
// code-split and loaded client-only AFTER first paint. Until it's ready — and as
// a permanent fallback when WebGL is unavailable — the CSS gradient sky below
// stands in. ssr:false keeps three.js out of the SSR payload and the hero's LCP.
const HeroThreePark = nextDynamic(
  () => import('@/components/layout/hero-three-park').then((m) => m.HeroThreePark),
  { ssr: false, loading: () => null }
);

/** Class, not an inline animation — see `.hero-ken-burns` in globals.css for why. */
const KEN_BURNS_CLASS = 'hero-ken-burns';

/**
 * Set on the wrapper while the hero is off screen or the tab is in the background: it parks the
 * pan (see `.hero-motion-paused` in globals.css) rather than unmounting anything, so it picks up
 * where it left off instead of snapping back to `scale(1)`.
 */
const PAUSED_CLASS = 'hero-motion-paused';

/**
 * When the ken-burns pan may start: after load, idle and the entrance window. The pan transforms
 * the backdrop both glass panels blur, which then has to be re-filtered every frame, so it waits
 * until nothing else in the hero is still arriving. Its first keyframe is the identity transform,
 * so a late start is invisible. See docs/features/homepage-hero.md.
 */
function useHeroPanAllowed(): boolean {
  const afterLoad = useAfterLoad();
  const [entranceOver, setEntranceOver] = useState(false);

  useEffect(() => {
    // The same clock the entrance runs on. On a slow link hydration lands after the window has
    // closed, and the clamp fires the timer on the next tick.
    const remaining = Math.max(0, HERO_ENTRANCE_MS - performance.now());
    const id = setTimeout(() => setEntranceOver(true), remaining);
    return () => clearTimeout(id);
  }, []);

  return afterLoad && entranceOver;
}

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
  noAnimation?: boolean;
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
  noAnimation,
  onActiveImageLoad,
}: {
  noAnimation?: boolean;
  /** Fires when the currently shown park image has finished loading (used by the base
      image to hold its fade-out until there are real pixels to crossfade into). */
  onActiveImageLoad?: () => void;
}) {
  const { parkImages, activeIndex } = useHeroRotation();

  if (parkImages.length === 0) return null;

  const total = parkImages.length;

  // One stacked layer per park image, crossfaded by opacity. The layer div is always mounted and
  // carries the ken-burns animation, so every layer's clock stays in phase. The <Image> inside
  // mounts only for a small window around the active layer: every layer sits in the viewport, so
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
              i === activeIndex ? 'opacity-100' : 'opacity-0',
              !noAnimation && KEN_BURNS_CLASS
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
 * The hero photo: the server-picked image (or a random one), with a blurred preview and a ken-burns
 * pan once loaded, crossfading into the park's own photos when the visitor is inside a park.
 */
export function RandomHeroImage({ imageSrc, noAnimation, blurDataURL, alt }: RandomHeroImageProps) {
  // With a server pick the client snapshot is the server's, so hydration has nothing to redo.
  const randomImage = useSyncExternalStore(
    subscribeToNothing,
    imageSrc ? noHero : randomHeroSnapshot,
    noHero
  );
  // The ken-burns pan waits for two things. First the image itself: transforming the LCP element
  // during its initial render is a known LCP-delay anti-pattern, so it paints static and this
  // flips on load. Then the rest of the hero — see useHeroPanAllowed for why the photo must not
  // be moving while everything over it is still arriving.
  const [loaded, setLoaded] = useState(false);
  const panAllowed = useHeroPanAllowed();
  const animate = loaded && panAllowed;

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

  const animating = !noAnimation && animate;

  return (
    <>
      {/* Base image: the server-rendered LCP hero (or a client-random fallback). Fades out once the
          in-park park images take over, so it doesn't show through their crossfade. It keeps
          animating while fading so the ken-burns transform never snaps back. */}
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
        onLoad={noAnimation ? undefined : () => setLoaded(true)}
        className={cn(
          'object-cover transition-opacity duration-1000',
          hasParkImages && parkImageLoaded ? 'opacity-0' : 'opacity-100',
          animating ? `will-change-transform ${KEN_BURNS_CLASS}` : ''
        )}
        style={{ objectPosition: heroObjectPosition(finalImage) }}
        sizes={HERO_IMAGE_SIZES}
      />
      <InParkHeroImages
        noAnimation={noAnimation}
        onActiveImageLoad={() => setParkImageLoaded(true)}
      />
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
 * The homepage hero background, behind the {@link HERO_3D_ENABLED} feature flag
 * (default OFF): when off it's the classic rotating park photo; when on it's the
 * animated three.js park the camera flies through. Either way, when the visitor
 * is inside a real park that park's own photos crossfade in on top.
 */
export function HeroBackground({ imageSrc, blurDataURL, alt }: HeroBackgroundProps) {
  return HERO_3D_ENABLED ? (
    <HeroBackground3D />
  ) : (
    <HeroBackgroundClassic imageSrc={imageSrc} blurDataURL={blurDataURL} alt={alt} />
  );
}

/** Classic hero: a rotating, ken-burns park photo under a branded overlay. */
function HeroBackgroundClassic({ imageSrc, blurDataURL, alt }: HeroBackgroundProps) {
  // Park the pan while the hero is scrolled away or the tab is in the background. It is a
  // 22 s infinite animation over a backdrop two glass panels are filtering, so left to itself it
  // keeps a full-viewport composited layer alive — and keeps the header's own blur invalidating —
  // for a photo nobody can see.
  const { ref, active } = useActiveOnScreen('0px');

  return (
    <div
      ref={ref}
      className={cn(
        'bg-background absolute inset-0 -z-10 overflow-hidden',
        !active && PAUSED_CLASS
      )}
    >
      <RandomHeroImage imageSrc={imageSrc} blurDataURL={blurDataURL} alt={alt} />
      {/* Light mode only tints the top for the header, since the panels carry their own glass.
          Dark mode keeps its heavier gradient, which makes the night photos read as night. */}
      <div className="from-background/25 to-muted/20 dark:from-background dark:via-background/20 dark:to-muted/70 absolute inset-0 bg-gradient-to-br via-transparent" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}

/**
 * The animated three.js RollerCoaster-Tycoon-style park (entrance arch, coaster,
 * Ferris wheel, carousel, stalls, peeps…) that the camera flies through. A CSS
 * gradient sky paints instantly underneath — the pre-load placeholder and the
 * no-WebGL fallback — with a bright daytime variant and a night variant for dark
 * mode, matching the scene's own day/night look so the canvas fades in seamlessly.
 */
function HeroBackground3D() {
  // `sceneReady` flips when the 3D park signals it's loaded. The loader lives
  // HERE (always mounted) rather than inside HeroThreePark, so it's visible
  // during the three.js chunk download too — not only after it has mounted.
  const [sceneReady, setSceneReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const onReady = useCallback(() => {
    setSceneReady(true);
    setProgress(1);
  }, []);
  // Real asset-load progress (textures/logos) maps to [0, 0.9]; the bar only
  // reaches 100% on ready (onLoad). Never let it go backwards.
  const onProgress = useCallback((p: number) => {
    setProgress((prev) => Math.max(prev, p * 0.9));
  }, []);
  // While loading, ease the bar forward so it always feels alive even before the
  // first real progress event (the three.js chunk download isn't tracked). Plus
  // a safety net that reveals the scene if nothing ever signals ready.
  useEffect(() => {
    if (sceneReady) return;
    const id = setInterval(() => {
      setProgress((p) => (p < 0.9 ? p + (0.9 - p) * 0.05 : p));
    }, 120);
    const safety = setTimeout(() => {
      setSceneReady(true);
      setProgress(1);
    }, 8000);
    return () => {
      clearInterval(id);
      clearTimeout(safety);
    };
  }, [sceneReady]);

  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      {/* Instant gradient sky — bright by day, deep blue at night (dark mode),
          matching the 3D sky so the canvas fades in seamlessly. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#3b8fe3_0%,#7fc2f3_55%,#cdeeff_100%)] dark:bg-[linear-gradient(to_bottom,#070b1e_0%,#142150_55%,#33508c_100%)]" />
      <HeroThreePark onReady={onReady} onProgress={onProgress} />
      <InParkHeroImages />
      {/* Only a very light tint for depth/legibility — kept subtle and
          theme-independent so the bright, colorful scene always shows through. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />
      {/* Loader chip near the bottom (clear of the centred content card), fading
          out once the 3D park is ready. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-6 flex justify-center transition-opacity duration-500',
          sceneReady ? 'opacity-0' : 'opacity-100'
        )}
      >
        <span className="bg-background/55 inline-flex flex-col items-center gap-1.5 rounded-2xl px-4 py-2.5 shadow-sm backdrop-blur-md">
          <span className="text-foreground/80 inline-flex items-center gap-2 text-xs font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading 3D park… {Math.round(progress * 100)}%
          </span>
          <span className="bg-foreground/15 block h-1.5 w-44 overflow-hidden rounded-full">
            <span
              className="bg-foreground/70 block h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
        </span>
      </div>
    </div>
  );
}
