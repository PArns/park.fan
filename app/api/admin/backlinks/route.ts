import 'server-only';
import { NextResponse } from 'next/server';
import { getPostsForPark, getPostsForRide } from '@/lib/blog/backlinks';
import { requireAdmin } from '@/lib/admin/session';

export const runtime = 'nodejs';

/**
 * Which blog posts are about this park or ride, from the index the public pages use, in German
 * like the admin. The relation is derived from the posts, so it changes by editing the post. See
 * docs/rules/parkride-page-and-blog-link.md.
 */
export async function GET(request: Request) {
  const { response } = await requireAdmin(request, 'viewer');
  if (response) return response;

  const url = new URL(request.url);
  const parkSlug = url.searchParams.get('park');
  const rideSlug = url.searchParams.get('ride');
  const geoPath = url.searchParams.get('geoPath') ?? undefined;

  if (!parkSlug) {
    return NextResponse.json({ error: 'park is required' }, { status: 400 });
  }

  const posts = rideSlug
    ? getPostsForRide('de', parkSlug, rideSlug, { geoPath })
    : getPostsForPark('de', parkSlug, { geoPath });

  return NextResponse.json(
    {
      total: posts.length,
      posts: posts.map((post) => ({
        translationKey: post.translationKey,
        slug: post.slug,
        title: post.frontmatter.title,
        date: post.frontmatter.date ?? null,
        category: post.frontmatter.category ?? null,
        readingTimeMinutes: post.readingTimeMinutes,
        isFallback: post.isFallback,
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
