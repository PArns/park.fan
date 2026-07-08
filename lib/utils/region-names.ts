/**
 * Human-readable names for the holiday-source regions the API returns as ISO codes
 * (e.g. `{ countryCode: 'DE', regionCode: 'RP' }` → "Rheinland-Pfalz"). Used to spell out the
 * NEIGHBOURING-region school holidays that drive a park's crowds — see <HeaderHolidayPanel>.
 *
 * German federal states are proper nouns kept in their native form across locales; foreign
 * countries are localised through the existing `geo.countries.<slug>` translations, so only an
 * ISO→slug bridge lives here.
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

/** ISO 3166-1 alpha-2 country code → `geo.countries` slug (for localised country names). */
export const COUNTRY_CODE_TO_SLUG: Record<string, string> = {
  DE: 'germany',
  NL: 'netherlands',
  BE: 'belgium',
  FR: 'france',
  LU: 'luxembourg',
  AT: 'austria',
  CH: 'switzerland',
  DK: 'denmark',
  PL: 'poland',
  CZ: 'czechia',
  GB: 'united-kingdom',
  IE: 'ireland',
  IT: 'italy',
  ES: 'spain',
};
