import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface RcdbBadgeProps {
  /** RCDB database id — links to https://rcdb.com/{id}.htm */
  rcdbId: number;
  /** Named in the label, so the link says where it goes and what it is about. */
  attractionName: string;
}

/**
 * Outbound link to the ride's Roller Coaster DataBase record, naming the ride („Taron on RCDB") so
 * the link says what is on the other end. Kept apart from `AttractionMetaBadges`, the
 * rider-restriction set, because it belongs after the ride's facts.
 */
export function RcdbBadge({ rcdbId, attractionName }: RcdbBadgeProps) {
  const t = useTranslations('attractions.meta');

  return (
    <Badge asChild variant="outline" className="gap-1">
      <a
        href={`https://rcdb.com/${rcdbId}.htm`}
        target="_blank"
        rel="noopener noreferrer"
        title={t('rcdbTitle')}
      >
        {t('rcdbLabel', { attraction: attractionName })}
        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
      </a>
    </Badge>
  );
}
