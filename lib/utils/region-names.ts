/**
 * Human-readable names for the German-state holiday-source regions the API returns as ISO codes
 * (e.g. `{ countryCode: 'DE', regionCode: 'RP' }` → "Rheinland-Pfalz"). Used to spell out the
 * NEIGHBOURING-region school holidays that drive a park's crowds — see <HeaderHolidayPanel>.
 *
 * German federal states are proper nouns kept in their native form across locales. Every other
 * region is named by its COUNTRY via `Intl.DisplayNames` in the component (which covers all ISO
 * codes in every locale), so no country map is needed here.
 */

/** ISO 3166-2:DE region code → German federal state name. */
export const DE_STATES: Record<string, string> = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
};
