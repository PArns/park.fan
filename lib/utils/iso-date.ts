const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether `value` has the shape `YYYY-MM-DD`; it does not check that the day exists. In a module
 * without imports, so the proxy and a stored-value parser can ask without pulling a date library.
 */
export function isIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value);
}
