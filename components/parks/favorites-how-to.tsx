'use client';

import { Search, Star, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';

/**
 * What to do when the favorites list is empty — three steps, not a sentence.
 *
 * The empty state used to be one line ("click the star to save something here"), which names the
 * control without saying where a visitor would ever meet one. Favorites are the only piece of
 * state this site keeps about a person, and the star that creates them lives on cards and detail
 * pages — never on the surface that reports them. So the empty state is the only place the
 * feature can explain itself, and it is also the state almost every visitor sees.
 *
 * Step 2 draws the real control rather than describing it: an inert copy of `FavoriteStar`'s
 * chip, so the thing to look for is on screen at the size it actually appears. No position is
 * claimed for it — a card's star sits in a corner, a park page's does not, and copy that says
 * where to look is wrong on one of them and on every phone.
 *
 * Shared by the homepage band and the header's favorites menu, which is what keeps the two
 * answers identical; it is also why the geometry has to survive both a 300 px sheet column and a
 * full-width band, hence a grid that stacks rather than a fixed row.
 */
export function FavoritesHowTo({
  className,
  cta = true,
  layout = 'auto',
}: {
  className?: string;
  /** The homepage band has room for the "Explore Parks" button; the sheet column does not. */
  cta?: boolean;
  /**
   * `auto` goes three-across from `sm` up. `stack` stays one column at every width, for the
   * places where the box is narrow while the VIEWPORT is not — a sidebar rail, the mobile
   * sheet. Tailwind's `sm:` is a viewport query and knows nothing about the 19 rem column it
   * is sitting in, so three columns there came out one word wide.
   */
  layout?: 'auto' | 'stack';
}) {
  const t = useTranslations('favorites');
  const tNav = useTranslations('navigation');

  const steps = [
    { icon: Search, title: t('howTo.findTitle'), text: t('howTo.findText') },
    { icon: Star, title: t('howTo.starTitle'), text: t('howTo.starText') },
    { icon: Check, title: t('howTo.thenTitle'), text: t('howTo.thenText') },
  ];

  return (
    <div className={className}>
      <ol className={`grid gap-4 ${layout === 'auto' ? 'sm:grid-cols-3' : ''}`}>
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                i === 1
                  ? 'bg-primary/15 text-primary ring-primary/25 ring-1'
                  : 'bg-muted text-muted-foreground'
              }`}
              aria-hidden="true"
            >
              <step.icon className={`h-4 w-4 ${i === 1 ? 'fill-primary' : ''}`} />
            </span>
            <span className="min-w-0">
              <span className="text-foreground block text-sm font-semibold">{step.title}</span>
              <span className="text-muted-foreground block text-xs leading-relaxed">
                {step.text}
              </span>
            </span>
          </li>
        ))}
      </ol>

      {cta && (
        <div className="mt-5 flex justify-center">
          <Link
            href="/parks"
            prefetch={false}
            {...buttonLinkProps({ variant: 'outline', size: 'sm' })}
          >
            {tNav('explore')}
          </Link>
        </div>
      )}
    </div>
  );
}
