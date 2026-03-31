'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';

// Brand-matched blur placeholder: deep park-primary blue → teal → forest green → dark ground.
// Colors mirror the park.fan logo (blue orbit ring, green chart bars, dark background).
// Generated from: <svg gradient #1a3f6f → #1e5f78 → #1e5a3a → #0f1e0f>
const HERO_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PSc3Jz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB5MT0nMCcgeDI9JzAnIHkyPScxJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMWEzZjZmJy8+PHN0b3Agb2Zmc2V0PSc0MCUnIHN0b3AtY29sb3I9JyMxZTVmNzgnLz48c3RvcCBvZmZzZXQ9Jzc1JScgc3RvcC1jb2xvcj0nIzFlNWEzYScvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nIzBmMWUwZicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPScxMCcgaGVpZ2h0PSc3JyBmaWxsPSd1cmwoI2cpJy8+PC9zdmc+';

interface RandomHeroImageProps {
  imageSrc?: string;
  noAnimation?: boolean;
}

export function RandomHeroImage({ imageSrc, noAnimation }: RandomHeroImageProps) {
  const [randomImage, setRandomImage] = useState<string | null>(null);

  useEffect(() => {
    if (imageSrc) return;
    const timer = setTimeout(() => {
      setRandomImage(HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);
    }, 0);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const finalImage = imageSrc || randomImage;
  const isServerImage = !!imageSrc;

  // While the client-side random image hasn't been selected yet, show the brand blur
  if (!finalImage) {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${HERO_BLUR_DATA_URL}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(24px)',
          transform: 'scale(1.05)',
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    /*
     * placeholder="blur" keeps the image visible (as blurred brand gradient) from the very first
     * paint — LCP candidates require opacity > 0, so the previous opacity-0 → onLoad → setState
     * pattern delayed LCP by the full React re-render + CSS transition cycle.
     * Next.js handles the blur→sharp transition natively without extra state.
     */
    <Image
      src={finalImage}
      alt="Park Background"
      fill
      priority={isServerImage}
      fetchPriority={isServerImage ? 'high' : undefined}
      placeholder="blur"
      blurDataURL={HERO_BLUR_DATA_URL}
      quality={85}
      className={`object-cover opacity-90 ${noAnimation ? '' : 'will-change-transform'}`}
      style={
        noAnimation ? undefined : { animation: 'ken-burns 22s ease-in-out infinite alternate' }
      }
      sizes="(max-width: 768px) 100vw, 115vw"
    />
  );
}

interface HeroBackgroundProps {
  imageSrc?: string;
}

export function HeroBackground({ imageSrc }: HeroBackgroundProps) {
  return (
    <div className="bg-background absolute inset-0 -z-10 overflow-hidden">
      <RandomHeroImage imageSrc={imageSrc} />
      <div className="from-background via-background/20 to-muted/70 absolute inset-0 bg-gradient-to-br opacity-30 dark:opacity-100" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
