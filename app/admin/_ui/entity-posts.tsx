'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { ExternalLink, PenLine } from 'lucide-react';
import { useAdminQuery } from '../_lib/api';
import { Chip, EmptyState, ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from './primitives';

/**
 * The posts about this park or ride.
 *
 * It is a *result*, not a setting, and the panel says so — the relation is
 * derived from the posts themselves (`ref:` links, widgets, a ride counting for
 * its park), which is how a round-up like the Halloween guide lands on ten park
 * pages without anybody maintaining a list. Changing what appears here means
 * editing the post, or its `parkLinks` / `rideLinks` frontmatter.
 *
 * Worth having in the editor anyway: it closes the triangle. From a park you
 * can reach its rides, its photos and now its coverage; from any of those, back.
 * Before this, the three were three separate tools that happened to share a
 * sidebar.
 */

interface BacklinkPost {
  translationKey: string;
  slug: string;
  title: string;
  date: string | null;
  category: string | null;
  readingTimeMinutes: number;
  isFallback: boolean;
}

export function EntityPostsPanel({
  parkSlug,
  rideSlug,
  geoPath,
  title,
}: {
  parkSlug: string | null;
  rideSlug?: string | null;
  geoPath?: string;
  title: string;
}) {
  const query = new URLSearchParams();
  if (parkSlug) query.set('park', parkSlug);
  if (rideSlug) query.set('ride', rideSlug);
  if (geoPath) query.set('geoPath', geoPath);

  const backlinks = useAdminQuery<{ total: number; posts: BacklinkPost[] }>(
    ['admin', 'backlinks', parkSlug, rideSlug],
    parkSlug ? `/api/admin/backlinks?${query.toString()}` : null,
    { staleTime: 10 * 60_000 }
  );

  const posts = backlinks.data?.posts ?? [];

  return (
    <Panel>
      <PanelHeader
        icon={PenLine}
        title="Beiträge"
        hint={`Was der Blog über ${title} schreibt — abgeleitet aus den Beiträgen selbst, nicht hier eingestellt.`}
        action={
          <Link
            href="/admin/blog-editor"
            className="border-border/60 hover:border-primary/40 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
          >
            <PenLine className="h-3.5 w-3.5" />
            Blog-Editor
          </Link>
        }
      />

      {backlinks.isError ? (
        <ErrorState message={backlinks.error.message} />
      ) : backlinks.isLoading ? (
        <SkeletonRows rows={2} />
      ) : posts.length === 0 ? (
        <PanelBody>
          <EmptyState
            icon={PenLine}
            title="Kein Beitrag erwähnt das hier"
            description="Ein Beitrag taucht hier auf, sobald er den Park oder die Bahn referenziert — oder es in seinem Frontmatter ausdrücklich sagt."
          />
        </PanelBody>
      ) : (
        <ul className="divide-border/40 divide-y">
          {posts.map((post) => (
            <li key={post.translationKey} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{post.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {[
                    post.date ? format(parseISO(post.date), 'd. MMM yyyy', { locale: de }) : null,
                    post.category,
                    `${post.readingTimeMinutes} min`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              {post.isFallback && <Chip>nur EN</Chip>}

              <Link
                href={`/admin/blog-editor?post=${encodeURIComponent(post.translationKey)}`}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1.5"
                aria-label="Im Editor öffnen"
                title="Im Editor öffnen"
              >
                <PenLine className="h-3.5 w-3.5" />
              </Link>
              <a
                href={`https://park.fan/de/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1.5"
                aria-label="Beitrag ansehen"
                title="Beitrag ansehen"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
