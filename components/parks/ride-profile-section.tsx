import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Wrench, CalendarDays, RefreshCcw, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/common/glass-card';
import { SectionHeading } from '@/components/common/section-heading';
import { getGlossaryTerms } from '@/lib/glossary/translations';
import { buildGlossaryTermHref } from '@/lib/glossary/segments';
import { hasCoasterElement } from '@/lib/three/coaster/elements';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

interface ResolvedTerm {
  id: string;
  name: string;
  href: string;
  hasPlayer: boolean;
}

interface RideProfileSectionProps {
  profile: RideProfile;
  locale: Locale;
}

/**
 * The ride → glossary half of the link: what this ride is and what it does,
 * with every figure, type and builder linking into the glossary.
 *
 * The API stores only glossary term ids. Anything it sends that this app has no
 * term for is dropped rather than rendered raw — the API can legitimately be
 * seeded with a term before the glossary entry lands here.
 */
export async function RideProfileSection({ profile, locale }: RideProfileSectionProps) {
  const t = await getTranslations('attraction.rideProfile');
  const terms = await getGlossaryTerms(locale);
  const byId = new Map(terms.map((term) => [term.id, term]));

  const resolve = (id: string): ResolvedTerm | null => {
    const term = byId.get(id);
    if (!term) return null;
    return {
      id,
      name: term.name,
      href: buildGlossaryTermHref(locale, term.slug),
      hasPlayer: Boolean(term.player?.element) && hasCoasterElement(term.player!.element),
    };
  };

  // Order is the ride order and repeats are meaningful, so this is NOT deduped.
  const elements = profile.elements.map(resolve).filter((x): x is ResolvedTerm => x !== null);
  const types = profile.types.map(resolve).filter((x): x is ResolvedTerm => x !== null);
  const manufacturerTerm = profile.manufacturerTermId ? resolve(profile.manufacturerTermId) : null;

  const hasFacts =
    Boolean(profile.manufacturer) || profile.openedYear !== null || profile.inversions !== null;

  if (elements.length === 0 && types.length === 0 && !hasFacts) return null;

  return (
    <section className="space-y-4">
      <SectionHeading icon={Boxes} title={t('title')} />

      <GlassCard className="space-y-6 p-5 sm:p-6">
        {types.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('typeLabel')}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {types.map((term) => (
                <li key={term.id}>
                  <Link href={term.href}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary/15 hover:text-primary transition-colors"
                    >
                      {term.name}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {elements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('elementsLabel')}
            </h3>
            <p className="text-muted-foreground text-sm">{t('elementsHint')}</p>
            {/* Numbered because the list is the layout walkthrough in ride order —
                a repeated figure (two corkscrews in a row) has to read as two steps. */}
            <ol className="divide-border/60 divide-y">
              {elements.map((term, index) => (
                <li key={`${term.id}-${index}`}>
                  <Link
                    href={term.href}
                    className="hover:bg-primary/5 group flex items-center gap-3 rounded-md px-1 py-2 transition-colors"
                  >
                    <span className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <span className="group-hover:text-primary text-sm font-medium transition-colors">
                      {term.name}
                    </span>
                    {term.hasPlayer && (
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {t('has3d')}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        {hasFacts && (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {profile.manufacturer && (
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Wrench className="h-3.5 w-3.5" />
                  {t('manufacturer')}
                </dt>
                <dd className="text-sm font-semibold">
                  {manufacturerTerm ? (
                    <Link
                      href={manufacturerTerm.href}
                      className="hover:text-primary transition-colors"
                    >
                      {profile.manufacturer}
                    </Link>
                  ) : (
                    profile.manufacturer
                  )}
                  {profile.model && (
                    <span className="text-muted-foreground block text-xs font-normal">
                      {profile.model}
                    </span>
                  )}
                </dd>
              </div>
            )}

            {profile.openedYear !== null && (
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('opened')}
                </dt>
                <dd className="text-sm font-semibold tabular-nums">{profile.openedYear}</dd>
              </div>
            )}

            {profile.inversions !== null && (
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  {t('inversions')}
                </dt>
                <dd className="text-sm font-semibold tabular-nums">{profile.inversions}</dd>
              </div>
            )}
          </dl>
        )}
      </GlassCard>
    </section>
  );
}
