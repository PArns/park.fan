import { getTranslations } from 'next-intl/server';
import { BookOpen, ExternalLink, Globe, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FacebookIcon, InstagramIcon, YouTubeIcon } from '@/components/common/brand-icons';
import { cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import type { ParkInfo } from '@/lib/api/types';

interface ParkQuickLinksProps {
  /** The API's `info` block. Absent until somebody has curated a fact. */
  info: ParkInfo | null | undefined;
  className?: string;
}

/**
 * The park's own website, ticket shop and Wikipedia entry, as a row of links under the intro in the
 * page header. Each leads with its own icon so the row reads before its labels; the trailing
 * `ExternalLink` mark is dimmed so it does not compete.
 *
 * Below `sm` the labelled links are 36 px icon squares like the socials, so all six fit one row.
 * The label stays as `sr-only` text, so the accessible name and the crawled anchor text do not
 * change, and `title` gives it back to a pointer.
 */
export async function ParkQuickLinks({ info, className }: ParkQuickLinksProps) {
  const t = await getTranslations('parks.info');
  if (!info) return null;

  const links: { href: string; label: string; Icon: LucideIcon }[] = [
    { href: info.website, label: t('website'), Icon: Globe },
    { href: info.ticketsUrl, label: t('tickets'), Icon: Ticket },
    { href: info.wikipediaUrl, label: 'Wikipedia', Icon: BookOpen },
  ].filter((link): link is { href: string; label: string; Icon: LucideIcon } => Boolean(link.href));

  const socials = [
    { href: info.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { href: info.facebookUrl, label: 'Facebook', Icon: FacebookIcon },
    { href: info.youtubeUrl, label: 'YouTube', Icon: YouTubeIcon },
  ].filter((social): social is { href: string; label: string; Icon: typeof InstagramIcon } =>
    Boolean(social.href)
  );

  if (links.length === 0 && socials.length === 0) return null;

  return (
    // 36 px squares 8 px apart: a 44 px target on each (`PHONE_HIT_AREA`) meets its neighbour's
    // edge to edge, across a wrapped row as well, and never overlaps it.
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          title={label}
          className={cn(
            'border-border/60 hover:border-primary/50 hover:text-primary inline-flex items-center gap-2 rounded-lg border text-sm font-medium transition-colors max-sm:h-9 max-sm:w-9 max-sm:justify-center sm:px-3 sm:py-1.5',
            PHONE_HIT_AREA
          )}
        >
          <Icon className="h-4 w-4 opacity-80" aria-hidden="true" />
          <span className="max-sm:sr-only">{label}</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-50 max-sm:hidden" aria-hidden="true" />
        </a>
      ))}
      {socials.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={label}
          title={label}
          className={cn(
            'border-border/60 hover:border-primary/50 hover:text-primary text-muted-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            PHONE_HIT_AREA
          )}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
