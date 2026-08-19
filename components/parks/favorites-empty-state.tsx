'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GlassSectionTitle } from '@/components/parks/glass-section-title';

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
 */
export function FavoritesEmptyState({ textHidden = false }: { textHidden?: boolean }) {
  const t = useTranslations('favorites');

  return (
    <section className="bg-muted/30 px-4 py-12">
      <div className="container mx-auto">
        <GlassSectionTitle icon={Star} iconClassName="text-primary" className="mb-4">
          {t('title')}
        </GlassSectionTitle>
        <div aria-hidden={textHidden || undefined} className={textHidden ? 'invisible' : undefined}>
          <p className="text-foreground mt-4 text-center text-base font-semibold">{t('empty')}</p>
          <p className="text-muted-foreground mt-2 text-center text-sm">{t('emptyHint')}</p>
        </div>
      </div>
    </section>
  );
}
