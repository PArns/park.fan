'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Responsive 16:9 YouTube embed (privacy-enhanced nocookie host), behind a facade.
 *
 * `loading="lazy"` defers the fetch, it does not shrink it: the moment an `<iframe
 * src="…youtube-nocookie.com/embed/…">` nears the viewport it pulls the whole player, roughly
 * 500–900 KB for the first one and ~250 KB for each one after. `walibi-holland-untamed-hard-gaan`
 * carries FOUR of them, and 71 embed URLs exist across the six locales — so a reader who scrolls
 * that post to the end downloaded about 1.5–2 MB of player for videos they may never start.
 *
 * So nothing loads until somebody asks for it. Until the tap this is a poster frame and a play
 * button; after it, the same iframe as before plus `autoplay=1`, because a person who has already
 * pressed play should not have to press it again.
 *
 * Two things are deliberate. The poster goes through **our** optimizer (`i.ytimg.com` is in
 * `images.remotePatterns`) rather than being pointed at directly — a direct `<img>` would restore
 * exactly the third-party request on page load that the facade exists to remove, and this way the
 * browser gets AVIF at the width it draws instead of a 480×360 JPEG. And it is `hqdefault.jpg`,
 * which YouTube has for every video; `maxresdefault` is sharper and 404s on anything the uploader
 * never gave an HD thumbnail. `hqdefault` is 4:3 with black bars, so `object-cover` crops them —
 * the visible area is 480×270, soft on a wide desktop column and right on a phone.
 *
 * The geometry is unchanged: `aspect-video` reserved the box before and reserves it now, so the
 * swap costs no layout shift.
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
