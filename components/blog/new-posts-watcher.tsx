'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import {
  claimCheck,
  readSeen,
  unseenPosts,
  writeSeen,
  type LatestPost,
  type LatestPostsLabels,
  type LatestPostsPayload,
} from '@/lib/blog/new-posts';

// The toast pulls in framer-motion (~40 KB gzip). Only a return visit with something new ever
// loads it; every other page view pays for this file and one idle-time request per interval.
const NewPostsToast = dynamic(() =>
  import('@/components/blog/new-posts-toast').then((m) => m.NewPostsToast)
);

/** Let the page finish before asking — this never competes with LCP or the live data. */
const START_DELAY_MS = 2500;

interface Found {
  labels: LatestPostsLabels;
  posts: LatestPost[];
}

/**
 * Announces blog posts, news included, published since the visitor's last visit. Never on the
 * first visit: without a stored record there is no "last visit", so the current posts become
 * the baseline.
 *
 * Asks after the first page of a visit, after every client navigation and whenever a tab comes
 * back from the background — the last is what a browser restoring its tabs, or an installed app
 * resumed from the background, does instead of loading a page. `claimCheck` turns all of that
 * into at most one request per ten minutes, across tabs. On a blog page the posts are on screen
 * already, so the check still runs there but only updates the record.
 */
export function NewPostsWatcher({ enabled }: { enabled: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const [found, setFound] = useState<Found | null>(null);
  const onBlog = pathname === '/blog' || pathname.startsWith('/blog/');

  // Somebody who opens the blog on their own while the toast is up does not need it any more —
  // not now, and not again on the way out of the blog.
  if (found && onBlog) setFound(null);

  // Effect Events read the render that is current when they are CALLED, so the answer gets one
  // of its own: a check that went out on the homepage and comes back after a click into the blog
  // has to see the blog.
  const onAnswer = useEffectEvent((payload: LatestPostsPayload) => {
    if (payload.posts.length === 0) return;
    const seen = readSeen();
    // Shown once is seen: a reload or the next page in this visit does not repeat it.
    writeSeen(payload.posts);
    if (!seen || onBlog) return;

    const fresh = unseenPosts(seen, payload.posts);
    if (fresh.length > 0) setFound({ labels: payload.labels, posts: fresh });
  });

  const ask = useEffectEvent(() => {
    // While a toast is up, its posts are already recorded as seen; the next check can wait.
    if (!enabled || found || !claimCheck()) return;
    fetch(`/api/blog-latest/${locale}`)
      .then((response) => (response.ok ? (response.json() as Promise<LatestPostsPayload>) : null))
      .then((payload) => {
        if (payload) onAnswer(payload);
      })
      .catch(() => {
        // Offline, blocked storage, a bad deploy: no toast is the right failure.
      });
  });

  // The first page of a visit and every client navigation after it.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => ask(), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, pathname]);

  // A tab that comes back to the front: nothing loads, so nothing else would ask.
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onVisibility = () => {
      clearTimeout(timer);
      if (document.visibilityState === 'visible') timer = setTimeout(() => ask(), START_DELAY_MS);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  if (!found || onBlog) return null;
  return <NewPostsToast labels={found.labels} posts={found.posts} onDone={() => setFound(null)} />;
}
