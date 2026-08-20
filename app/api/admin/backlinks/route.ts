import 'server-only';
import { NextResponse } from 'next/server';
import { getPostsForPark, getPostsForRide } from '@/lib/blog/backlinks';
import { requireAdmin } from '@/lib/admin/session';

export const runtime = 'nodejs';

/**
 * Which blog posts are about this park or this ride.
 *
 * The same index the public park and ride pages use, exposed to the admin so a
 * curation session can see the other half of the relation. That relation is
 * **derived from the posts themselves** — a `ref:` in the body, a widget, a
 * ride counting for its park — which is why a round-up like the Halloween guide
 * lands on ten park pages without anybody listing them. The consequence for an
 * editor is that this list is a *result*, not a setting: to change it you edit
 * the post, or its `parkLinks` / `rideLinks` frontmatter.
 *
 * German, because the admin is. The public pages resolve per visitor locale.
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
