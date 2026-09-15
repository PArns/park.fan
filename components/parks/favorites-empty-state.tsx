'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GlassSectionTitle } from '@/components/parks/glass-section-title';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';

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
 */
export function FavoritesEmptyState({
  textHidden = false,
  standalone = false,
}: {
  textHidden?: boolean;
  standalone?: boolean;
}) {
  const t = useTranslations('favorites');

  return (
    <section className="bg-muted/30 px-4 py-12">
      <div className="container mx-auto">
        {!standalone && (
          <GlassSectionTitle icon={Star} iconClassName="text-primary" className="mb-4">
            {t('title')}
          </GlassSectionTitle>
        )}
        {/* `inert`, not just `aria-hidden`: the box now holds a link and a button, and a
            focusable control inside an aria-hidden subtree is reachable by keyboard while being
            invisible to a screen reader — the worst of both. Before FavoritesHowTo there were
            only two paragraphs in here, so aria-hidden alone was enough. */}
        <div
          aria-hidden={textHidden || undefined}
          inert={textHidden || undefined}
          className={textHidden ? 'invisible' : undefined}
        >
          <p className="text-foreground mt-4 text-center text-base font-semibold">{t('empty')}</p>
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
