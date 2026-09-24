'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BackgroundOverlayImageProps {
  imageSrc: string;
  alt: string;
  hoverEffect?: boolean;
  /** `next/image` sizes hint. Defaults to the card layout; pass "100vw" for full-bleed use. */
  sizes?: string;
  /** Focal point as a CSS `object-position`, resolved server-side. Centre when absent. */
  objectPosition?: string;
}

/** Client leaf: manages fade-in state for the background image on load. */
export function BackgroundOverlayImage({
  imageSrc,
  alt,
  hoverEffect = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  objectPosition,
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
      sizes={sizes}
      style={objectPosition ? { objectPosition } : undefined}
      priority={false}
      onLoad={() => setIsLoaded(true)}
    />
  );
}
