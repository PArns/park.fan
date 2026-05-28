'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';
import { backgroundImageLoader } from '@/lib/utils/image-loader';

interface RandomHeroImageProps {
  imageSrc?: string;
  noAnimation?: boolean;
}

export function RandomHeroImage({ imageSrc, noAnimation }: RandomHeroImageProps) {
  const [randomImage, setRandomImage] = useState<string | null>(null);
  // Defer the ken-burns transform until the image has painted. Animating (transforming)
  // the LCP element during its initial render is a known LCP-delay anti-pattern, so we
  // render it static first and start the effect on load.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (imageSrc) return;
    const timer = setTimeout(() => {
      setRandomImage(HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);
    }, 0);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const finalImage = imageSrc || randomImage;
  const isServerImage = !!imageSrc;

  if (!finalImage) return null;

  const animating = !noAnimation && animate;

  return (
    <Image
      src={finalImage}
      alt="Park Background"
      fill
      loader={backgroundImageLoader}
      priority={isServerImage}
      fetchPriority={isServerImage ? 'high' : undefined}
      onLoad={noAnimation ? undefined : () => setAnimate(true)}
      className={`object-cover opacity-90 ${animating ? 'will-change-transform' : ''}`}
      style={animating ? { animation: 'ken-burns 22s ease-in-out infinite alternate' } : undefined}
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
      {/* Branded overlay — from-background is navy in dark mode, near-white in light mode */}
      <div className="from-background/60 via-background/10 to-muted/40 dark:from-background dark:via-background/20 dark:to-muted/70 absolute inset-0 bg-gradient-to-br" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
