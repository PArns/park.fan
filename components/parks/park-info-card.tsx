import { getTranslations } from 'next-intl/server';
import { MapPin, Phone } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import type { ParkInfo } from '@/lib/api/types';

interface ParkInfoCardProps {
  /** The API's `info` block. Absent until somebody has curated a fact. */
  info: ParkInfo | null | undefined;
  city?: string | null;
  country?: string | null;
  className?: string;
}

/**
 * The things a visitor asks that no wait-time feed answers, each hand-written in the admin: the
 * park's site, the street address, the year it opened. A Server Component in the first HTML,
 * rendering nothing at all for a park with nothing to say. The map links are in the page header
 * (`ParkTitleHeader`), next to the park's other links.
 */
export async function ParkInfoCard({ info, city, country, className }: ParkInfoCardProps) {
  const t = await getTranslations('parks.info');

  const addressLines = [
    info?.streetAddress,
    [info?.postalCode, city].filter(Boolean).join(' ') || null,
    country,
  ].filter((line): line is string => Boolean(line && line.trim()));

  // The street is what makes an address worth printing; without it the card would repeat the city
  // from the header.
  const showAddress = Boolean(info?.streetAddress) && addressLines.length > 0;

  // Website, ticket shop, Wikipedia and socials live in <ParkQuickLinks> in the page header, not
  // here.

  const facts = [
    info?.openedYear ? { label: t('opened'), value: String(info.openedYear) } : null,
    info?.areaHectares ? { label: t('area'), value: `${info.areaHectares} ha` } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  const hasSomething = showAddress || Boolean(info?.phone) || facts.length > 0;
  if (!hasSomething) return null;

  return (
    <GlassCard variant="medium" className={cn('mb-8', className)}>
      <h2 className="mb-4 text-lg font-semibold">{t('title')}</h2>

      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {showAddress && (
          <div className="flex items-start gap-2.5">
            <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t('address')}
              </p>
              <address className="mt-1 text-sm leading-relaxed not-italic">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>
        )}

        {info?.phone && (
          <div className="flex items-start gap-2.5">
            <Phone className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t('phone')}
              </p>
              <a
                href={`tel:${info.phone.replace(/[^\d+]/g, '')}`}
                className={cn(
                  'hover:text-primary mt-1 block text-sm break-words transition-colors',
                  PHONE_HIT_AREA
                )}
              >
                {info.phone}
              </a>
            </div>
          </div>
        )}

        {facts.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3 sm:col-span-2">
            {facts.map((fact) => (
              <div key={fact.label}>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {fact.label}
                </p>
                <p className="mt-1 text-sm font-semibold">{fact.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
