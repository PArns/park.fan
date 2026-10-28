import { getTranslations } from 'next-intl/server';
import { BookOpen, Globe, Ticket } from 'lucide-react';
import { FacebookIcon, InstagramIcon, YouTubeIcon } from '@/components/common/brand-icons';
import { LinkBand, LinkBandLink } from '@/components/common/link-band';
import type { ComponentProps } from 'react';
import type { OutboundTarget } from '@/lib/analytics/outbound-link';
import type { ParkInfo } from '@/lib/api/types';

interface ParkQuickLinksProps {
  /** The API's `info` block. Absent until somebody has curated a fact. */
  info: ParkInfo | null | undefined;
  /** The park's UUID, the entity of an `outbound_link_clicked` on one of the links. */
  parkId?: string | null;
}

type QuickLink = Omit<ComponentProps<typeof LinkBandLink>, 'href'> & { href?: string | null };

const hasHref = (link: QuickLink): link is QuickLink & { href: string } => Boolean(link.href);

/**
 * The park's own website and ticket shop as one band, its Wikipedia entry and socials as a second,
 * in the page header's row of links. Rendered as a fragment, so each band is an item of that row
 * and wraps on its own.
 *
 * Below `sm` every link in both bands is an icon, so the two fit one line of a phone.
 */
export async function ParkQuickLinks({ info, parkId }: ParkQuickLinksProps) {
  const t = await getTranslations('parks.info');
  if (!info) return null;

  const outbound = (target: OutboundTarget) => ({ target, entity: parkId });

  const own: QuickLink[] = [
    {
      href: info.website,
      label: t('website'),
      Icon: Globe,
      hideLabel: 'phone',
      outbound: outbound('park_website'),
    },
    {
      href: info.ticketsUrl,
      label: t('tickets'),
      Icon: Ticket,
      hideLabel: 'phone',
      outbound: outbound('tickets'),
    },
  ];

  const elsewhere: QuickLink[] = [
    {
      href: info.wikipediaUrl,
      label: 'Wikipedia',
      Icon: BookOpen,
      hideLabel: 'phone',
      outbound: outbound('other'),
    },
    {
      href: info.instagramUrl,
      label: 'Instagram',
      Icon: InstagramIcon,
      hideLabel: 'always',
      outbound: outbound('other'),
    },
    {
      href: info.facebookUrl,
      label: 'Facebook',
      Icon: FacebookIcon,
      hideLabel: 'always',
      outbound: outbound('other'),
    },
    {
      href: info.youtubeUrl,
      label: 'YouTube',
      Icon: YouTubeIcon,
      hideLabel: 'always',
      outbound: outbound('other'),
    },
  ];

  return (
    <>
      {[own.filter(hasHref), elsewhere.filter(hasHref)].map(
        (band) =>
          band.length > 0 && (
            <LinkBand key={band[0].label}>
              {band.map((link) => (
                <LinkBandLink key={link.label} {...link} />
              ))}
            </LinkBand>
          )
      )}
    </>
  );
}
