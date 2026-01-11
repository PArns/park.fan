'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HERO_IMAGES } from '@/lib/hero-images';

export function RandomHeroImage() {
  // Pick random image on client-side mount for true randomization
  const [randomImage, setRandomImage] = useState<string>(HERO_IMAGES[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Random selection happens once on mount
    // Use setTimeout to avoid synchronous state updates in effect
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
      setRandomImage(HERO_IMAGES[randomIndex]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Image
      src={randomImage}
      alt="Park Background"
      fill
      priority
      fetchPriority="high"
      quality={75}
      className={`object-cover transition-opacity duration-1000 ${
        isLoaded ? 'opacity-90' : 'opacity-0'
      }`}
      onLoad={() => setIsLoaded(true)}
      sizes="100vw"
    />
  );
}

export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <RandomHeroImage />
      <div className="from-background via-background/80 to-muted/50 absolute inset-0 bg-gradient-to-br" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
