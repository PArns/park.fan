'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_ID = 'instagram-embed-script';

/**
 * Official Instagram post/reel embed. Renders the provider blockquote and loads
 * embed.js once, then re-processes on mount so client navigations also hydrate.
 */
export function BlogInstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) {
      window.instgrm?.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(script);
  }, [url]);

  return (
    <div className="not-prose my-8 flex justify-center">
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
