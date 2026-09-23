'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import {
  CHECKED_SESSION_KEY,
  readSeen,
  unseenPosts,
  writeSeen,
  type LatestPost,
  type LatestPostsLabels,
  type LatestPostsPayload,
} from '@/lib/blog/new-posts';

// The toast pulls in framer-motion (~40 KB gzip). Only a return visit with something new ever
// loads it; every other page view pays for this file and one idle-time request per session.
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
 * Announces blog posts published since the visitor's last visit. Never on the first visit:
 * without a stored record there is no "last visit", so the current posts become the baseline.
 *
 * Once per browser session. On a blog page the posts are on screen already, so the check
 * still runs there but only updates the record.
 */
export function NewPostsWatcher({ enabled }: { enabled: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const [found, setFound] = useState<Found | null>(null);
  const onBlog = pathname === '/blog' || pathname.startsWith('/blog/');

  useEffect(() => {
    if (!enabled) return;
    try {
      if (sessionStorage.getItem(CHECKED_SESSION_KEY)) return;
    } catch {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        sessionStorage.setItem(CHECKED_SESSION_KEY, '1');
        const response = await fetch(`/api/blog-latest/${locale}`);
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as LatestPostsPayload;
        if (cancelled || payload.posts.length === 0) return;

        const seen = readSeen();
        // Shown once is seen: a reload or the next page in this visit does not repeat it.
        writeSeen(payload.posts);
        if (!seen || onBlog) return;

        const fresh = unseenPosts(seen, payload.posts);
        if (fresh.length > 0) setFound({ labels: payload.labels, posts: fresh });
      } catch {
        // Offline, blocked storage, a bad deploy: no toast is the right failure.
      }
    }, START_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Deliberately once per mount: the layout keeps this mounted across client navigations,
    // and the session flag is what stops a second check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Somebody who opens the blog on their own while the toast is up does not need it any more.
  if (!found || onBlog) return null;
  return <NewPostsToast labels={found.labels} posts={found.posts} onDone={() => setFound(null)} />;
}
