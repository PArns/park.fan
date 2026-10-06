'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Responsive 16:9 YouTube embed (privacy-enhanced nocookie host), behind a facade:
 * `loading="lazy"` defers the player but does not shrink it, and a post can carry several. Until
 * the tap this is a poster and a play button; after it, the iframe with `autoplay=1`. The poster
 * goes through our optimizer (`i.ytimg.com` is in `images.remotePatterns`), so page load makes no
 * third-party request, and it is `hqdefault.jpg`, which every video has (`maxresdefault` can 404);
 * `object-cover` crops its 4:3 letterbox. `aspect-video` reserves the box either way.
 */
export function BlogYouTubeEmbed({
  id,
  start,
  title,
}: {
  id: string;
  start?: number;
  title?: string;
}) {
  const t = useTranslations('blog');
  const [playing, setPlaying] = useState(false);

  const params = new URLSearchParams({ autoplay: '1' });
  if (start) params.set('start', String(start));
  const src = `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;

  return (
    <figure className="not-prose my-8">
      <div className="border-border/60 relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        {playing ? (
          <iframe
            src={src}
            title={title ?? 'YouTube video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={title ? `${t('video.play')}: ${title}` : t('video.play')}
            className="group focus-visible:ring-primary absolute inset-0 h-full w-full cursor-pointer focus-visible:ring-2 focus-visible:outline-none"
          >
            <Image
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-black/60 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
                <Play className="size-7 translate-x-0.5 fill-white text-white" />
              </span>
            </span>
          </button>
        )}
      </div>
      {title && (
        <figcaption className="text-muted-foreground mt-2 text-center text-sm">{title}</figcaption>
      )}
    </figure>
  );
}
