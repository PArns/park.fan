import { notFound } from 'next/navigation';
import { notFoundMetadata } from '@/lib/seo/not-found-metadata';
import type { Metadata } from 'next';

/**
 * Any path under a locale that no route matches (`/en/nonexistent`). Without this segment Next
 * answered those with the root `app/not-found.tsx`: a bare document with no `<title>`, no site
 * chrome and no internal links (SEO run, 2026-10-03). Throwing here renders the locale's own
 * `not-found.tsx` inside the `[locale]` layout instead, with the same 404 status. Every real
 * route is more specific than a catch-all, so none of them is shadowed.
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
