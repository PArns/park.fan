'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';
import { cn } from '@/lib/utils';

/**
 * The favorites band as it looks for a visitor who has none — which is almost everyone
 * who lands on the homepage, a blog post or a glossary term.
 *
 * It lives outside `FavoritesSection` so it can also be that section's `next/dynamic`
 * `loading` fallback. `next/dynamic` is `React.lazy` + `<Suspense>` under the hood, so
 * `loading: () => null` was a `fallback={null}` boundary in disguise: the whole section
 * shipped inside a `<div hidden id="S:…">` at the end of the document and got grafted in
 * afterwards, dropping a 232 px band into the page under whatever the reader was looking
 * at. Reserving it only inside the component was not enough — the component itself is
 * what arrives late.
 *
 * `textHidden` keeps the box at full height with the two lines held back, for the phase
 * where the cookie has not been read yet: a visitor who DOES have favorites should not be
 * told for a beat that they have none.
 *
 * `standalone` is for `/favorites`, where this band IS the page rather than one chapter of
 * one: the page's own `<h1>` already says "Favorites" and its own `FavoritesHowTo` block
 * already stands under the band in every state, so drawing either here would be the same
 * heading twice and the same three steps twice.
 *
 * `className` goes onto the band and is for its padding: the homepage gives it the
 * story's rhythm, and whatever `FavoritesSection` receives it passes on here, so the
 * fallback and every settled state stand in the same box. `heading` is the same kind of
 * hand-me-down: see {@link FavoritesHeading}.
 */
export function FavoritesEmptyState({
  textHidden = false,
  standalone = false,
  heading = 'watermark',
  className,
}: {
  textHidden?: boolean;
  standalone?: boolean;
  heading?: FavoritesHeadingVariant;
  className?: string;
}) {
  const t = useTranslations('favorites');

  return (
    <section className={cn('bg-muted/30 px-4 py-12', className)}>
      <div className="container mx-auto">
        {!standalone && <FavoritesHeading variant={heading} />}
        {/* `inert`, not just `aria-hidden`: the box now holds a link and a button, and a
            focusable control inside an aria-hidden subtree is reachable by keyboard while being
            invisible to a screen reader — the worst of both. Before FavoritesHowTo there were
            only two paragraphs in here, so aria-hidden alone was enough. */}
        <div
          aria-hidden={textHidden || undefined}
          inert={textHidden || undefined}
          className={textHidden ? 'invisible' : undefined}
        >
          {/* `mt-4` only on `/favorites`, where no heading stands above: elsewhere the
              heading's own bottom margin is the gap. */}
          <p
            className={cn(
              'text-foreground text-center text-base font-semibold',
              standalone && 'mt-4'
            )}
          >
            {t('empty')}
          </p>
          {/* The one-line hint this replaced named the star and nothing else — see
              FavoritesHowTo. Every state of this band renders the same component, so the box
              growing costs no shift: the pre-mount copy, the dynamic-import fallback and the
              settled empty state are the same markup with the text held back. */}
          {!standalone && <FavoritesHowTo className="mx-auto mt-5 max-w-3xl" />}
        </div>
      </div>
    </section>
  );
}

export type FavoritesHeadingVariant = 'watermark' | 'tile';

/**
 * The band's chapter heading, in every state of it — the empty state, the skeleton and the list
 * — so whatever replaces what stands in the same box. `tile` on the homepage, where every chapter
 * opens with the plate; `watermark` under blog, news and glossary pages, on the plain background
 * their own chapters stand on. `count` only once the list is known.
 */
export function FavoritesHeading({
  variant,
  count,
}: {
  variant: FavoritesHeadingVariant;
  count?: number;
}) {
  const t = useTranslations('favorites');
  return (
    <ChapterHeading
      variant={variant}
      icon={Star}
      title={count === undefined ? t('title') : `${t('title')} (${count})`}
    />
  );
}
