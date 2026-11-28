const whole = new Intl.NumberFormat('de-DE');
const oneDecimal = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * A count with the German thousands separator. Takes a string too, because the API sends a bigint
 * as one.
 */
export function formatCount(value: number | string): string {
  return whole.format(Number(value));
}

/** A float with one decimal, `2,4`. */
export function formatDecimal(value: number): string {
  return oneDecimal.format(value);
}
