'use client';

import { Search, Star, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';

/**
 * What to do when the favorites list is empty — three steps, not a sentence.
 *
 * The star that creates favorites lives on cards and detail pages, never on the surface that
 * reports them, so the empty state is the one place the feature can explain itself. Step 2 draws
 * an inert copy of `FavoriteStar`'s chip rather than saying where it sits, which differs per
 * surface. Shared by the homepage band and the header's favorites band; the burger sheet shows
 * `FavoritesMenuPanel`'s two lines instead, because three stacked steps would fill a phone's menu.
 */
export function FavoritesHowTo({
  className,
  cta = true,
}: {
  className?: string;
  /** The homepage band has room for the "Explore Parks" button; a narrower host does not. */
  cta?: boolean;
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
      <ol className="grid gap-4 sm:grid-cols-3">
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
