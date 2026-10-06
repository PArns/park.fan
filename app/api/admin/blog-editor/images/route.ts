import 'server-only';
import { NextResponse } from 'next/server';

import { denyUnlessAdmin } from '@/lib/admin/session';
import { MEDIA_REVISION, searchMedia } from '@/lib/media';
import { versionedSrc } from '@/lib/media/focus';
import { getMediaAlt, getMediaCaption, getCreditLine } from '@/lib/media/text';
import type { MediaLicense, MediaRole } from '@/lib/media/types';

/**
 * The image picker's backing list: every image in the media database, with what it shows, who
 * took it, its size and its caption in this locale. Takes the same filters as `/api/media`.
 */
export async function GET(req: Request) {
  const unauthorized = await denyUnlessAdmin(req);
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
    // The collection doubles as the picker's section label, which the UI groups by.
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
    shotAt: image.shotAt,
  }));

  // Most recently shot first, undated last — the picture you just added is the
  // one you are most likely reaching for.
  images.sort((a, b) => (b.shotAt ?? '').localeCompare(a.shotAt ?? ''));

  return NextResponse.json({ revision: MEDIA_REVISION, images });
}
