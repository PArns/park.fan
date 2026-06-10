'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_ID = 'instagram-embed-script';

function loadAndProcess() {
  if (document.getElementById(SCRIPT_ID)) {
    window.instgrm?.Embeds.process();
    return;
  }
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = 'https://www.instagram.com/embed.js';
  document.body.appendChild(script);
}

/**
 * Official Instagram post/reel embed. The provider blockquote renders
 * immediately (with a plain link fallback), but the ~50 KB embed.js is only
 * loaded once the embed scrolls near the viewport — readers who never reach
 * it never pay for the third-party script.
 */
export function BlogInstagramEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Script already present (e.g. second embed or client navigation):
    // just re-process so the new blockquote hydrates.
    if (document.getElementById(SCRIPT_ID)) {
      window.instgrm?.Embeds.process();
      return;
    }

    const observer = new IntersectionObserver(
      (observedEntries) => {
        if (observedEntries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadAndProcess();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [url]);

  return (
    <div ref={ref} className="not-prose my-8 flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ width: '100%', maxWidth: 540, margin: 0 }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      </blockquote>
    </div>
  );
}
