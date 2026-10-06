import type { AccuracyBadge } from '@/lib/api/types';

/**
 * The prediction-accuracy grade (`AccuracyBadge`) in colour, for the Fancast accuracy card and the
 * ride page's accuracy badge: every face a caller needs, as full literal class strings so
 * Tailwind's scanner sees them.
 */
export interface AccuracyStyle {
  /** Tinted pill: translucent fill plus text. */
  badge: string;
  /** Solid fill, for a status dot. */
  dot: string;
  text: string;
  border: string;
  /** Coloured card shadow; none for the muted grade. */
  glow: string;
}

/** The colours per accuracy grade: excellent and good green, fair amber, poor red, no data grey. */
export const ACCURACY_STYLES: Record<AccuracyBadge, AccuracyStyle> = {
  excellent: {
    badge: 'bg-status-operating/15 text-status-operating',
    dot: 'bg-status-operating',
    text: 'text-status-operating',
    border: 'border-status-operating/40',
    glow: 'shadow-status-operating/10',
  },
  good: {
    badge: 'bg-status-operating/15 text-status-operating',
    dot: 'bg-status-operating',
    text: 'text-status-operating',
    border: 'border-status-operating/40',
    glow: 'shadow-status-operating/10',
  },
  fair: {
    badge: 'bg-status-down/15 text-status-down',
    dot: 'bg-status-down',
    text: 'text-status-down',
    border: 'border-status-down/40',
    glow: 'shadow-status-down/10',
  },
  poor: {
    badge: 'bg-destructive/15 text-destructive',
    dot: 'bg-destructive',
    text: 'text-destructive',
    border: 'border-destructive/40',
    glow: 'shadow-destructive/10',
  },
  insufficient_data: {
    badge: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    border: 'border-border',
    glow: '',
  },
};

/** The style for a grade, muted for one this map does not know (the API may add a grade). */
export function accuracyStyle(badge: AccuracyBadge): AccuracyStyle {
  return ACCURACY_STYLES[badge] ?? ACCURACY_STYLES.insufficient_data;
}
