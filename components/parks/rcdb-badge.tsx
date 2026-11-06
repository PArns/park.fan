import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GLASS_BUTTON } from '@/components/common/glass-card';

interface RcdbBadgeProps {
  /** RCDB database id — links to https://rcdb.com/{id}.htm */
  rcdbId: number;
  /** Named in the label, so the link says where it goes and what it is about. */
  attractionName: string;
}

/** The ride's entry in the Roller Coaster DataBase, as a secondary button of the title card. */
export function RcdbBadge({ rcdbId, attractionName }: RcdbBadgeProps) {
  const t = useTranslations('attractions.meta');

  return (
    <a
      href={`https://rcdb.com/${rcdbId}.htm`}
      target="_blank"
      rel="noopener noreferrer"
      title={t('rcdbTitle')}
      className={GLASS_BUTTON}
    >
      {t('rcdbLabel', { attraction: attractionName })}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}
