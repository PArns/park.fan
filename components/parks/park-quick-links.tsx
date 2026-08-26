import { getTranslations } from 'next-intl/server';
import { BookOpen, ExternalLink, Globe, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FacebookIcon, InstagramIcon, YouTubeIcon } from '@/components/common/brand-icons';
import { cn } from '@/lib/utils';
import type { ParkInfo } from '@/lib/api/types';

interface ParkQuickLinksProps {
  /** The API's `info` block. Absent until somebody has curated a fact. */
  info: ParkInfo | null | undefined;
  className?: string;
}

/**
 * The park's own website, ticket shop and Wikipedia entry — a row of links directly under the
 * intro in the page header.
 *
 * These used to be the bottom row of `ParkInfoCard`, a titled section far down the page. For most
 * parks that section is *only* these links (Phantasialand curates nothing else), so it was a
 * heading, a frame and a rule wrapped around two buttons — and the two buttons are the reason
 * somebody scrolled to it. Up here they cost no chapter of its own. `ParkInfoCard` keeps the rest
 * (address, phone, opened year, area) and now renders nothing at all for a park that had only
 * these, which is the point.
 *
 * Each link leads with its own icon rather than the shared external-link glyph: at a glance the
 * row is "world, ticket, book", which is readable before the labels are. The `ExternalLink` mark
 * stays as the trailing hint that the link leaves the site, at reduced opacity so it does not
 * compete with the leading icon.
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
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="border-border/60 hover:border-primary/50 hover:text-primary inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <Icon className="h-4 w-4 opacity-80" aria-hidden="true" />
          {label}
          <ExternalLink className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
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
          className="border-border/60 hover:border-primary/50 hover:text-primary text-muted-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
