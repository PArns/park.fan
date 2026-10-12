'use client';

import { useId, useState } from 'react';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Suno song player behind a facade, like `BlogYouTubeEmbed`: the iframe is a whole suno.com page,
 * and `loading="lazy"` still loads it, with its requests to Suno, as soon as it scrolls near. Until
 * the tap this is a play button in a box of the player's height, then the iframe with
 * `autoplay=1`, which the embed reads; the caption comes from the link text.
 */
export function BlogSunoEmbed({ id, title }: { id: string; title?: string }) {
  const t = useTranslations('blog');
  const [playing, setPlaying] = useState(false);
  const hintId = useId();
  const songPath = `suno.com/song/${id}`;

  return (
    <figure className="not-prose my-8">
      <div className="border-border/60 relative h-[240px] w-full overflow-hidden rounded-xl border bg-black">
        {playing ? (
          <iframe
            src={`https://suno.com/embed/${id}?autoplay=1`}
            title={title ?? 'Suno player'}
            allow="autoplay"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={title ? `${t('audio.play')}: ${title}` : t('audio.play')}
              aria-describedby={hintId}
              className="group focus-visible:ring-primary absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 px-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-white/15 shadow-lg transition-transform group-hover:scale-110"
              >
                <Play className="size-7 translate-x-0.5 fill-white text-white" />
              </span>
              <span id={hintId} className="text-center text-xs text-white/70">
                {t('audio.playHint')}
              </span>
            </button>
            <a
              href={`https://${songPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 left-1/2 max-w-[calc(100%-2rem)] -translate-x-1/2 truncate text-xs text-white/60 underline underline-offset-2 hover:text-white"
            >
              {songPath}
            </a>
          </>
        )}
      </div>
      {title && (
        <figcaption className="text-muted-foreground mt-2 text-center text-sm">{title}</figcaption>
      )}
    </figure>
  );
}
