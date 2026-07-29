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
      {/* A Badge like its neighbours, not bare grey text: sitting between outlined
          badges the plain link read as a disabled label rather than a way out to
          the ride's technical record. */}
      {!compact && rcdbId != null && (
        <Badge asChild variant="outline" className="gap-1">
          <a
            href={`https://rcdb.com/${rcdbId}.htm`}
            target="_blank"
            rel="noopener noreferrer"
            title={t('rcdbTitle')}
          >
            RCDB
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
          </a>
        </Badge>
      )}
    </>
  );
}
