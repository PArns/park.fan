/**
 * Format large numbers in compact form: k (thousands), M (millions), B (billions), T (trillions).
 * Uses one decimal when the fractional part is significant, otherwise integer.
 */
export function formatCompactNumber(value: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0';
  }
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) {
    const n = value / 1_000_000_000_000;
    return sign + (n % 1 === 0 || Math.abs((n % 1) * 10) < 1 ? n.toFixed(0) : n.toFixed(1)) + 'T';
  }
  if (abs >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return sign + (n % 1 === 0 || Math.abs((n % 1) * 10) < 1 ? n.toFixed(0) : n.toFixed(1)) + 'B';
  }
  if (abs >= 1_000_000) {
    const n = value / 1_000_000;
    return sign + (n % 1 === 0 || Math.abs((n % 1) * 10) < 1 ? n.toFixed(0) : n.toFixed(1)) + 'M';
  }
  if (abs >= 1_000) {
    const n = value / 1_000;
    return sign + (n % 1 === 0 || Math.abs((n % 1) * 10) < 1 ? n.toFixed(0) : n.toFixed(1)) + 'k';
  }
  return sign + Math.round(value).toString();
}
