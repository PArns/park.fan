import 'server-only';
import { NextResponse } from 'next/server';

import { requireAdminPass } from '@/lib/admin/verify-pass';
import { MEDIA_REVISION, searchMedia } from '@/lib/media';
import { versionedSrc } from '@/lib/media/focus';
import { getMediaAlt, getMediaCaption, getCreditLine } from '@/lib/media/text';
import type { MediaLicense, MediaRole } from '@/lib/media/types';

/**
 * The image picker's backing list, served from the media database.
 *
 * It used to walk `public/blog/images` and hand back filenames, which meant the
 * picker could only offer photos that had been uploaded *for the blog* — the
 * park and ride photography was invisible to it even though a post about Troy
 * obviously wants Troy's photo. Every image in the database is now offered, with
 * the metadata needed to choose sensibly: what it shows, who took it, how big it
 * is, and the caption already written for it in this locale.
 *
 * Supports the same filters as `/api/media`, so the picker can search rather than
 * scroll once the database grows past a few hundred images.
 */
export async function GET(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;

  const params = new URL(req.url).searchParams;
  const locale = params.get('locale') ?? 'de';

  const images = searchMedia({
    q: params.get('q') ?? undefined,
    park: params.get('park') ?? undefined,
    ride: params.get('ride') ?? undefined,
    collection: params.get('collection') ?? undefined,
    tags: params.getAll('tag'),
    role: (params.get('role') as MediaRole) || undefined,
    license: (params.get('license') as MediaLicense) || undefined,
  }).map((image) => ({
    id: image.id,
    src: versionedSrc(image),
    // The collection doubles as the picker's section label — it is what the old
    // response called `folder`, and the UI still groups by it.
    folder: image.collection,
    name: image.id.split('/').pop() ?? image.id,
    alt: getMediaAlt(image.id, locale) ?? '',
    caption: getMediaCaption(image.id, locale) ?? '',
    credit: getCreditLine(image) ?? '',
    width: image.width,
    height: image.height,
    park: image.park,
    ride: image.ride,
    tags: image.tags,
    // Newest first is what the old picker approximated with mtime; `shotAt` is
    // the real answer where the camera recorded it.
    shotAt: image.shotAt,
  }));

  // Most recently shot first, undated last — the picture you just added is the
  // one you are most likely reaching for.
  images.sort((a, b) => (b.shotAt ?? '').localeCompare(a.shotAt ?? ''));

  return NextResponse.json({ revision: MEDIA_REVISION, images });
}
