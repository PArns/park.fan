'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

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
 * Official Instagram post/reel embed behind a button: embed.js and the post it fetches come from
 * Instagram (Meta), and scrolling past a post is not asking for that. Until the press this is the
 * blockquote's plain link, the button and a hint; the press injects the script.
 */
export function BlogInstagramEmbed({ url }: { url: string }) {
  const t = useTranslations('blog');
  const [loaded, setLoaded] = useState(false);

  // After the commit, so `process()` finds the class the press just added.
  useEffect(() => {
    if (loaded) loadAndProcess();
  }, [loaded]);

  return (
    <div className="not-prose my-8 flex flex-col items-center gap-3">
      <blockquote
        // embed.js converts every `.instagram-media` on the page, on its first run and on each
        // `process()`, so the class waits for this embed's own press.
        className={loaded ? 'instagram-media' : undefined}
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ width: '100%', maxWidth: 540, margin: 0 }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      </blockquote>
      {!loaded && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Button type="button" variant="outline" size="sm" onClick={() => setLoaded(true)}>
            {t('instagram.load')}
          </Button>
          <p className="text-muted-foreground text-xs">{t('instagram.loadHint')}</p>
        </div>
      )}
    </div>
  );
}
