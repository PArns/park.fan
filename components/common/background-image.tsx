'use client';

import Image, { type ImageProps } from 'next/image';
import { backgroundImageLoader } from '@/lib/utils/image-loader';

/**
 * `next/image` with `backgroundImageLoader`, for a Server Component. A loader is a function and
 * cannot cross into a Client Component as a prop, so a Server Component that passed it directly
 * answered 500 the moment it rendered.
 */
export function BackgroundImage({ alt, ...props }: Omit<ImageProps, 'loader'>) {
  return <Image alt={alt} {...props} loader={backgroundImageLoader} />;
}
