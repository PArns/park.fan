'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Maximize2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type BlogImageAlign = 'center' | 'left' | 'right' | 'wide';

export type BlogImageSize = 'small' | 'medium' | 'large';

interface BlogInlineImageProps {
  src: string;
  alt?: string;
  /** Caption shown below the image and in the lightbox. */
  caption?: string;
  /**
   * In-flow placement:
   *  - center (default): block, centered, max-w-2xl
   *  - left / right: floated to ~45 %, text wraps around it (sm+ only)
   *  - wide: full content width
   */
  align?: BlogImageAlign;
  /** Optional explicit size override — narrows the figure on top of `align`. */
  size?: BlogImageSize;
}

const FIGURE_ALIGN: Record<BlogImageAlign, string> = {
  center: 'my-8 mx-auto w-full max-w-2xl',
  wide: 'my-8 w-full',
  // Floated: full width on mobile, ~45 % floated on sm+. Negative-free
  // margins keep the text gutter clean. `clear-*` avoids stacking two
  // same-side floats on top of each other.
  left: 'my-4 w-full sm:float-left sm:clear-left sm:mr-6 sm:mb-4 sm:w-[45%] sm:max-w-sm',
  right: 'my-4 w-full sm:float-right sm:clear-right sm:ml-6 sm:mb-4 sm:w-[45%] sm:max-w-sm',
};

const SIZE_OVERRIDE: Record<BlogImageSize, string> = {
  small: 'sm:max-w-[200px]',
  medium: 'sm:max-w-[440px]',
  large: 'sm:max-w-[640px]',
};

export function BlogInlineImage({
  src,
  alt = '',
  caption,
  align = 'center',
  size,
}: BlogInlineImageProps) {
  const t = useTranslations('blog');
  const [open, setOpen] = useState(false);

  return (
    <figure className={cn('not-prose', FIGURE_ALIGN[align], size && SIZE_OVERRIDE[size])}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group bg-muted focus-visible:ring-ring/40 relative block w-full overflow-hidden rounded-xl border border-black/[0.08] shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 dark:border-white/[0.08]"
        aria-label={alt || t('inlineImage.openImage')}
      >
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes={
            align === 'left' || align === 'right'
              ? '(max-width: 640px) 100vw, 400px'
              : align === 'wide'
                ? '(max-width: 1024px) 100vw, 1024px'
                : '(max-width: 768px) 100vw, 768px'
          }
          className="h-auto w-full"
        />
        <span className="bg-background/80 absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </button>
      {caption && (
        <figcaption className="text-muted-foreground mt-2 text-center text-sm">
          {caption}
        </figcaption>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[95vw] gap-0 overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{alt || t('inlineImage.openImage')}</DialogTitle>
          <DialogDescription className="sr-only">{caption ?? alt ?? ''}</DialogDescription>
          <div className="relative flex flex-col items-center">
            <div className="relative aspect-[3/2] w-full max-w-5xl">
              <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" priority />
            </div>
            {caption && (
              <p className="bg-background/90 mt-3 max-w-3xl rounded-xl px-4 py-2 text-center text-sm backdrop-blur-sm">
                {caption}
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-background/80 hover:bg-background/95 absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors"
              aria-label={t('inlineImage.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
