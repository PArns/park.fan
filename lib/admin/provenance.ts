/** The backend takes `reason` up to 2,000 characters and `sourceUrl` as an http(s) URL. */
export const REASON_MAX_LENGTH = 2000;

/** Whether a text is an absolute `http:` or `https:` address, the API's check on a source link. */
export function isHttpUrl(text: string): boolean {
  try {
    const { protocol } = new URL(text);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * The optional provenance of an admin write, ready for the request body: empty fields are left
 * out, and a value the backend would answer with a 400 is reported before the request instead.
 */
export function provenanceBody(
  reason: string,
  sourceUrl: string
): { body: { reason?: string; sourceUrl?: string } } | { error: string } {
  const trimmedReason = reason.trim();
  const trimmedUrl = sourceUrl.trim();
  if (trimmedReason.length > REASON_MAX_LENGTH) {
    return { error: `Der Grund darf höchstens ${REASON_MAX_LENGTH} Zeichen lang sein.` };
  }
  if (trimmedUrl && !isHttpUrl(trimmedUrl)) {
    return { error: 'Die Quelle muss eine URL mit http:// oder https:// sein.' };
  }
  return {
    body: {
      ...(trimmedReason ? { reason: trimmedReason } : {}),
      ...(trimmedUrl ? { sourceUrl: trimmedUrl } : {}),
    },
  };
}
