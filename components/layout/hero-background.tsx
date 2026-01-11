'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';

interface RandomHeroImageProps {
  imageSrc?: string;
}

export function RandomHeroImage({ imageSrc }: RandomHeroImageProps) {
  // Pick random image on client-side mount for true randomization
  const [randomImage, setRandomImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (imageSrc) return; // Don't randomize if provided

    // Random selection happens once on mount
    // Use setTimeout to avoid synchronous state updates in effect
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      setRandomImage(HERO_IMAGES[randomIndex]);
    }, 0);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const finalImage = imageSrc || randomImage;

  if (!finalImage) {
    return null;
  }

  // If provided from server (imageSrc), we can load with priority and no fade-in
  const isServerImage = !!imageSrc;

  return (
    <Image
      src={finalImage}
      alt="Park Background"
      fill
      priority={isServerImage}
      fetchPriority={isServerImage ? 'high' : undefined}
      quality={75}
      className={`object-cover transition-opacity duration-1000 ${
        isServerImage || isLoaded ? 'opacity-90' : 'opacity-0'
      }`}
      onLoad={() => setIsLoaded(true)}
      sizes="100vw"
    />
  );
}

interface HeroBackgroundProps {
  imageSrc?: string;
}

export function HeroBackground({ imageSrc }: HeroBackgroundProps) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <RandomHeroImage imageSrc={imageSrc} />
      <div className="from-background via-background/80 to-muted/50 absolute inset-0 bg-gradient-to-br" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
