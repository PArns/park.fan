import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Direction icon for a wait-time trend string (`up`/`increasing`,
 * `down`/`decreasing`, anything else → flat) — shared by the attraction live
 * panel and the wait-time info card.
 */
export function TrendIcon({ trend, className }: { trend: string; className?: string }) {
  const t = trend.toLowerCase();
  if (t === 'down' || t === 'decreasing') return <TrendingDown className={className} />;
  if (t === 'up' || t === 'increasing') return <TrendingUp className={className} />;
  return <Minus className={className} />;
}
