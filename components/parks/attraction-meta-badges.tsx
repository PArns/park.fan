import { Ruler, Droplets, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface AttractionMetaBadgesProps {
  minimumHeight?: number | null;
  maximumHeight?: number | null;
  mayGetWet?: boolean | null;
  /** RCDB database id — rendered as an outbound link to https://rcdb.com/{id}.htm */
  rcdbId?: number | null;
  /** Compact mode (attraction cards): min-height + wet only, no RCDB link. */
  compact?: boolean;
}

/**
 * Rider-restriction and ride-fact badges (min/max height, may-get-wet) plus an
 * outbound RCDB link. All fields are nullable — parks without metadata render
 * nothing. Server-component compatible.
 */
export function AttractionMetaBadges({
  minimumHeight,
  maximumHeight,
  mayGetWet,
  rcdbId,
  compact = false,
}: AttractionMetaBadgesProps) {
  const t = useTranslations('attractions.meta');

  const hasAny =
    minimumHeight != null ||
    (!compact && maximumHeight != null) ||
    mayGetWet ||
    (!compact && rcdbId);
  if (!hasAny) return null;

  return (
    <>
      {minimumHeight != null && (
        <Badge
          variant="outline"
          className="gap-1"
          title={t('minHeightTitle', { cm: minimumHeight })}
        >
          <Ruler className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('minHeight', { cm: minimumHeight })}
        </Badge>
      )}
      {!compact && maximumHeight != null && (
        <Badge variant="outline" className="gap-1">
          <Ruler className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('maxHeight', { cm: maximumHeight })}
        </Badge>
      )}
      {mayGetWet && (
        <Badge variant="outline" className="gap-1">
          <Droplets className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('mayGetWet')}
        </Badge>
      )}
      {!compact && rcdbId != null && (
        <a
          href={`https://rcdb.com/${rcdbId}.htm`}
          target="_blank"
          rel="noopener noreferrer"
          title={t('rcdbTitle')}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors"
        >
          RCDB
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </>
  );
}
