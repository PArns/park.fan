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
 * It lives outside `FavoritesSection` so it can also be that section's `next/dynamic` `loading`
 * fallback: `loading: () => null` is a `fallback={null}` boundary that drops the band into the
 * page late. See docs/rules/a-streamed-section-owes-the-page-its-height.md.
 *
 * `textHidden` keeps the box at full height with the text held back until the cookie is read, so
 * a visitor who has favorites is never told they have none. `standalone` is for `/favorites`,
 * whose own `<h1>` and `FavoritesHowTo` already stand around the band. `className` (the band's
 * padding) and `heading` are passed through by `FavoritesSection`, so the fallback and every
 * settled state stand in the same box.
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
        {/* `inert`, not just `aria-hidden`: the box holds a link and a button, and a focusable
            control in an aria-hidden subtree is reachable by keyboard yet invisible to a screen
            reader. */}
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
          {/* Every state of this band renders the same markup, the text held back where needed,
              so the box costs no shift. */}
          {!standalone && <FavoritesHowTo className="mx-auto mt-5 max-w-3xl" />}
        </div>
      </div>
    </section>
  );
}

/** Which `ChapterHeading` look the favorites band opens with; see {@link FavoritesHeading}. */
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
