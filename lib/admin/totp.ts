/** The digits of an authenticator code, in every admin form that asks for one. */
export const TOTP_CODE_LENGTH = 6;

/**
 * What a code field keeps of what was typed or filled in: the digits, cut to a code's length. A
 * password manager writes the whole code in one event, so this has to take all six characters.
 */
export function normalizeTotpCode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, TOTP_CODE_LENGTH);
}
