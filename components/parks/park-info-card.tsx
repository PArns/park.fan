import { getTranslations } from 'next-intl/server';
import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { parkMapsLinks } from '@/lib/parks/maps-links';
import { cn } from '@/lib/utils';
import type { ParkInfo } from '@/lib/api/types';

interface ParkInfoCardProps {
  /** The API's `info` block. Absent until somebody has curated a fact. */
  info: ParkInfo | null | undefined;
  city?: string | null;
  country?: string | null;
  /** The park's own coordinates, already parsed by `withParkCoordinates`. */
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

/**
 * The things a visitor asks that no wait-time feed answers.
 *
 * Every value here is hand-written in the admin — the park's own site, where
 * tickets are sold, the street the navigation system needs, the year it opened.
 * None of the three upstream sources carries any of it, which is why the park
 * page had a map, a forecast and a weather chart but could not say where the
 * park is or what its website is.
 *
 * A Server Component on purpose: nothing here reacts to anything, and shipping
 * a client bundle for eleven strings would be the whole card's weight again.
 * It renders inline in the first HTML, so it costs no layout shift, and it
 * renders nothing at all for a park with nothing to say rather than an empty
 * frame — about the same shape as the school-holiday warning, and for the same
 * reason: the alternative is 200 parks showing a box that says nothing.
 *
 * The two map links are the exception to "hand-written in the admin": they are
 * built from the park's coordinates, which every feed carries, so they show up
 * for parks whose `info` block is empty or absent — a box with a working route
 * to the gate is not a box that says nothing.
 */
export async function ParkInfoCard({
  info,
  city,
  country,
  latitude,
  longitude,
  className,
}: ParkInfoCardProps) {
  const t = await getTranslations('parks.info');

  const maps = parkMapsLinks(latitude, longitude);

  const addressLines = [
    info?.streetAddress,
    [info?.postalCode, city].filter(Boolean).join(' ') || null,
    country,
  ].filter((line): line is string => Boolean(line && line.trim()));

  // The street is what makes an address worth printing. Without it the card
  // would repeat the city that already sits under the park's name in the
  // header, which is noise dressed as information.
  const showAddress = Boolean(info?.streetAddress) && addressLines.length > 0;

  // Website, ticket shop, Wikipedia and the socials are NOT here any more — they are
  // <ParkQuickLinks>, a row under the intro in the page header. On most parks they were the only
  // thing this section had, so it was a heading and a frame around two buttons; the guard below
  // now correctly renders nothing for exactly those parks.

  const facts = [
    info?.openedYear ? { label: t('opened'), value: String(info.openedYear) } : null,
    info?.areaHectares ? { label: t('area'), value: `${info.areaHectares} ha` } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  const hasSomething = showAddress || Boolean(info?.phone) || facts.length > 0 || maps !== null;
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
                className="hover:text-primary mt-1 block text-sm break-words transition-colors"
              >
                {info.phone}
              </a>
            </div>
          </div>
        )}

        {/* Both map apps rather than one: the link that opens the app a visitor already uses is
          worth two pills, and neither vendor's URL can detect the other's platform. The brand
          names stay untranslated — the label above them carries the six languages. */}
        {maps && (
          <div className="flex items-start gap-2.5">
            <Navigation
              className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t('directions')}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <a
                  href={maps.google}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border-border/60 hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  Google Maps
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
                <a
                  href={maps.apple}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border-border/60 hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  Apple Maps
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
              </div>
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
