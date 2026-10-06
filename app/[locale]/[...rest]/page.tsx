import { notFound } from 'next/navigation';
import { notFoundMetadata } from '@/lib/seo/not-found-metadata';
import type { Metadata } from 'next';

/**
 * Any path under a locale that no route matches (`/en/nonexistent`). Without this segment Next
 * answers with the root `app/not-found.tsx`, a bare document with no title, chrome or links;
 * throwing here renders the locale's own `not-found.tsx` with the same 404 status. Every real
 * route is more specific than a catch-all, so none is shadowed.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return notFoundMetadata(locale);
}

export default function UnmatchedLocalePath() {
  notFound();
}
