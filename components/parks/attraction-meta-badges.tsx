import { Ruler, Droplets } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { RiderHeight } from '@/components/common/unit-display';

interface AttractionMetaBadgesProps {
  minimumHeight?: number | null;
  maximumHeight?: number | null;
  mayGetWet?: boolean | null;
  /** Compact mode (attraction cards): min-height + wet only. */
  compact?: boolean;
}

/**
 * Rider-restriction badges: how tall you must be, how tall you may be, whether
 * you get wet. All fields are nullable — rides without metadata render nothing.
 * Server-component compatible.
 *
 * The heights render in the visitor's unit system (the site-wide C/F choice),
 * which is why the label and the value are separate: the unit used to live
 * inside the translated string, and "Ab {cm} cm" cannot become inches. Every
 * locale puts the label in front, so a prefix plus a value is enough — no rich
 * text needed.
 *
 * The RCDB link used to live here too; it moved to {@link RcdbBadge} because it
 * is an outbound reference, not a restriction, and on the ride page it belongs
 * after the ride's facts rather than among the height limits.
 */
export function AttractionMetaBadges({
  minimumHeight,
  maximumHeight,
  mayGetWet,
  compact = false,
}: AttractionMetaBadgesProps) {
  const t = useTranslations('attractions.meta');

  const hasAny = minimumHeight != null || (!compact && maximumHeight != null) || mayGetWet;
  if (!hasAny) return null;

  return (
    <>
      {minimumHeight != null && (
        <Badge variant="outline" className="gap-1">
          <Ruler className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('minHeightLabel')} <RiderHeight cm={minimumHeight} />
        </Badge>
      )}
      {!compact && maximumHeight != null && (
        <Badge variant="outline" className="gap-1">
          <Ruler className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('maxHeightLabel')} <RiderHeight cm={maximumHeight} />
        </Badge>
      )}
      {mayGetWet && (
        <Badge variant="outline" className="gap-1">
          <Droplets className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('mayGetWet')}
        </Badge>
      )}
    </>
  );
}
