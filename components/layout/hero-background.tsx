'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function HeroBackground() {
  const [currentBackground, setCurrentBackground] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBackgrounds() {
      try {
        const response = await fetch('/api/parks/backgrounds', { signal: controller.signal });
        const data = await response.json();
        if (data.backgrounds && data.backgrounds.length > 0) {
          // Pick a random one initially
          const randomIndex = Math.floor(Math.random() * data.backgrounds.length);
          setCurrentBackground(data.backgrounds[randomIndex]);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Request was cancelled, this is expected
        }
        console.error('Failed to fetch park backgrounds:', error);
      }
    }

    fetchBackgrounds();

    return () => {
      controller.abort();
    };
  }, []);

  if (!currentBackground) return null;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <Image
        src={currentBackground}
        alt="Park Background"
        fill
        priority
        quality={85}
        className={`object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-90' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        sizes="100vw"
      />
      <div className="from-background via-background/80 to-muted/50 absolute inset-0 bg-gradient-to-br" />
      <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
    </div>
  );
}
