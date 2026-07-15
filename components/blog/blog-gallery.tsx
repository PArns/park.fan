'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { BlogImage } from '@/lib/blog/types';

interface BlogGalleryProps {
  images: BlogImage[];
  className?: string;
  /** Section heading. Defaults to the translation `blog.gallery.title`. */
  heading?: string;
}

export function BlogGallery({ images, className, heading }: BlogGalleryProps) {
  const t = useTranslations('blog');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, next, prev]);

  if (images.length === 0) return null;

  const active = openIndex !== null ? images[openIndex] : null;

  return (
    <section className={cn('not-prose my-12', className)}>
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        {heading ?? t('gallery.title')}
      </h2>
      <div
        className={cn(
          '[column-gap:0.75rem]',
          images.length === 1
            ? 'columns-1'
            : images.length === 2
              ? 'columns-1 sm:columns-2'
              : 'columns-1 sm:columns-2 lg:columns-3'
        )}
      >
        {images.map((img, i) => (
          <figure key={`${img.src}-${i}`} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group bg-muted focus-visible:ring-ring/40 relative block w-full overflow-hidden rounded-xl border border-black/[0.08] shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 dark:border-white/[0.08]"
              aria-label={t('gallery.openImage', { index: i + 1, total: images.length })}
            >
              <Image
                src={img.src}
                alt={img.alt ?? ''}
                width={0}
                height={0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="bg-background/80 absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
            {img.caption && (
              <figcaption className="text-muted-foreground mt-2 text-sm leading-snug">
                {img.caption}
                {img.credit && <span className="text-muted-foreground/70"> © {img.credit}</span>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent
          className="max-w-[95vw] gap-0 overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{t('gallery.title')}</DialogTitle>
          <DialogDescription className="sr-only">
            {active?.alt ?? t('gallery.title')}
          </DialogDescription>
          {active && (
            <div className="relative flex flex-col items-center">
              <div className="relative w-full max-w-5xl">
                <div className="relative aspect-[3/2] w-full">
                  <Image
                    src={active.src}
                    alt={active.alt ?? ''}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="bg-background/90 mt-3 w-full max-w-5xl rounded-xl px-4 py-3 text-sm backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {active.caption && (
                      <p className="text-foreground line-clamp-3">{active.caption}</p>
                    )}
                    {active.credit && (
                      <p className="text-muted-foreground mt-1 text-xs">© {active.credit}</p>
                    )}
                  </div>
                  <div className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {openIndex !== null && `${openIndex + 1} / ${images.length}`}
                  </div>
                </div>
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="bg-background/80 hover:bg-background/95 absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-colors"
                    aria-label={t('gallery.previous')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="bg-background/80 hover:bg-background/95 absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-colors"
                    aria-label={t('gallery.next')}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={close}
                className="bg-background/80 hover:bg-background/95 absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors"
                aria-label={t('gallery.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
