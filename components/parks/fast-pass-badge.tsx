'use client';

import { Ticket } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import type { FastPass } from '@/lib/api/types';

/**
 * "QuickPass: 12 €" — the queue-jump product a ride sells.
 *
 * Its own component rather than part of {@link AttractionMetaBadges}, for the
 * same reason {@link RcdbBadge} is: those badges are rider restrictions, facts
 * about who may ride. This one is something you can buy.
 *
 * The API sends `{ name, price, currency }` and never a finished string,
 * because the finished string is different in every locale — 12 € here, €12 in
 * English — and only this side knows which one is being read.
 *
 * **Rendered only when the object is there.** An absent `fastPass` means either
 * that nobody has checked this ride or that the park sells no such product, and
 * the payload does not distinguish them on purpose. A "kein Fastpass" badge
 * would turn the first case — which is most of the catalogue — into a claim
 * about the park.
 */
export function FastPassBadge({
  fastPass,
  /** Inside a card's own <Link>: a tooltip instead of a nested anchor. */
  insideLink = false,
}: {
  fastPass?: FastPass | null;
  insideLink?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations('attractions.meta');

  if (!fastPass?.name) return null;

  const label = formatFastPass(fastPass, locale, {
    free: t('fastPassFree'),
    from: t('fastPassFrom'),
  });

  return (
    <Badge variant="outline" className="gap-1">
      <Ticket className="h-3 w-3 shrink-0" aria-hidden="true" />
      {fastPass.termId ? (
        <GlossaryTermLink
          termId={fastPass.termId}
          tooltipOnly={insideLink}
          className="font-[inherit]"
        >
          {label}
        </GlossaryTermLink>
      ) : (
        label
      )}
    </Badge>
  );
}

/**
 * The readings of a price, in one place.
 *
 * `0` is free and says so in words — a formatted "0,00 €" reads as a broken
 * price rather than as an included one. A per-ride price is exact and joins the
 * name with a colon. `priceFrom` is the normal case, because nearly every park
 * sells one pass for the visit rather than one per ride, and it is rendered
 * "ab 25 €" — never as a flat price, because the tiers above it cost more.
 * Nothing at all leaves the bare name, which is the honest output for the
 * products priced per day (Disney, Universal).
 *
 * The API withholds a number it has no currency for, so `currency` is present
 * whenever a positive one is.
 */
export function formatFastPass(
  fastPass: FastPass,
  locale: string,
  labels: { free: string; from: string }
): string {
  const { name, price, priceFrom, currency } = fastPass;

  if (price === 0) return `${name} (${labels.free})`;

  const amount = price ?? priceFrom;
  if (amount === null || amount === undefined || !currency) return name;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // A pass costs 12 €, not 12,00 € — but 12,50 € keeps its cents.
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return price != null ? `${name}: ${formatted}` : `${name}: ${labels.from} ${formatted}`;
}
