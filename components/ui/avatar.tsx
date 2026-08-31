'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );
}

/**
 * The photo inside the circle.
 *
 * `object-cover object-top` is load-bearing, not decoration. The box is square
 * and an `<img>` with no `object-fit` STRETCHES to fill it, so a portrait comes
 * out squashed — which is what the blog byline did with Patrick's 729 × 1100
 * cut-out. `cover` alone then swings the other way: it crops to the middle of a
 * tall picture, and the middle of a person is their chest. `top` is where a face
 * is in any portrait, and for a square source the two are identical, so nothing
 * that already looked right can move.
 */
function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover object-top', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
