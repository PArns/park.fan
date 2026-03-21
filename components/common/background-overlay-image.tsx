'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BackgroundOverlayImageProps {
  imageSrc: string;
  alt: string;
  hoverEffect?: boolean;
}

/** Client leaf: manages fade-in state for the background image on load. */
export function BackgroundOverlayImage({
  imageSrc,
  alt,
  hoverEffect = false,
}: BackgroundOverlayImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className={cn(
        'object-cover transition-opacity duration-700',
        isLoaded ? 'opacity-40' : 'opacity-0',
        hoverEffect && 'group-hover:opacity-70'
      )}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      priority={false}
      onLoad={() => setIsLoaded(true)}
    />
  );
}
