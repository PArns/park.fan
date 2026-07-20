/**
 * Human-readable names for the holiday-source regions the API returns as ISO codes
 * (e.g. `{ countryCode: 'DE', regionCode: 'RP' }` → "Rheinland-Pfalz"). Used to spell out the
 * NEIGHBOURING-region holidays that drive a park's crowds — the header panel and the crowd calendar.
 *
 * Region names are proper nouns kept in their native/local form across locales (like the German
 * states). Regions not covered here fall back to their COUNTRY name via `Intl.DisplayNames`.
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

/**
 * `${countryCode}-${shortRegionCode}` → native region name, for the European neighbours whose
 * school holidays realistically drive cross-border crowds. Key uses the SHORT region code the API
 * emits (e.g. NL-LI → key "NL-LI"). Anything not listed falls back to the country name.
 */
export const SUBDIVISION_NAMES: Record<string, string> = {
  // Netherlands (provinces)
  'NL-DR': 'Drenthe',
  'NL-FR': 'Friesland',
  'NL-GE': 'Gelderland',
  'NL-GR': 'Groningen',
  'NL-LI': 'Limburg',
  'NL-NB': 'Noord-Brabant',
  'NL-NH': 'Noord-Holland',
  'NL-OV': 'Overijssel',
  'NL-UT': 'Utrecht',
  'NL-ZE': 'Zeeland',
  'NL-ZH': 'Zuid-Holland',
  // Austria (Bundesländer)
  'AT-BL': 'Burgenland',
  'AT-KÄ': 'Kärnten',
  'AT-NÖ': 'Niederösterreich',
  'AT-OÖ': 'Oberösterreich',
  'AT-SB': 'Salzburg',
  'AT-SM': 'Steiermark',
  'AT-TI': 'Tirol',
  'AT-VA': 'Vorarlberg',
  'AT-WI': 'Wien',
  // Switzerland (Kantone)
  'CH-AG': 'Aargau',
  'CH-BL': 'Basel-Landschaft',
  'CH-BS': 'Basel-Stadt',
  'CH-GE': 'Genève',
  'CH-GR': 'Graubünden',
  // France (régions)
  'FR-BF': 'Bourgogne-Franche-Comté',
  'FR-CV': 'Centre-Val de Loire',
  'FR-GE': 'Grand Est',
  'FR-HF': 'Hauts-de-France',
  'FR-IF': 'Île-de-France',
  'FR-NO': 'Normandie',
  'FR-OC': 'Occitanie',
  'FR-PC': 'Provence-Alpes-Côte d’Azur',
  // Czechia (kraje)
  'CZ-JC': 'Jihočeský',
  'CZ-JM': 'Jihomoravský',
  'CZ-KR': 'Karlovarský',
  'CZ-PL': 'Plzeňský',
  'CZ-US': 'Ústecký',
  // Poland (województwa)
  'PL-DS': 'Dolnośląskie',
  'PL-LB': 'Lubuskie',
  'PL-PD': 'Podkarpackie',
  'PL-SK': 'Świętokrzyskie',
  'PL-SL': 'Śląskie',
  'PL-ZP': 'Zachodniopomorskie',
  // Denmark (regioner)
  'DK-81': 'Nordjylland',
  'DK-82': 'Midtjylland',
  'DK-83': 'Syddanmark',
  'DK-84': 'Sjælland',
};

/**
 * Localised country name for a 2-letter ISO code via `Intl.DisplayNames`
 * (falls back to the raw code). Covers every locale the app ships.
 */
export function getCountryName(countryCode: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

/** Flag emoji (regional-indicator letters) for a 2-letter ISO country code; '' if invalid. */
export function countryFlagEmoji(countryCode: string): string {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) return '';
  const base = 0x1f1e6; // 🇦
  const cc = countryCode.toUpperCase();
  return (
    String.fromCodePoint(base + (cc.charCodeAt(0) - 65)) +
    String.fromCodePoint(base + (cc.charCodeAt(1) - 65))
  );
}

/**
 * Localised label for a holiday-source region: German federal states and the
 * mapped European subdivisions keep their native name; anything else collapses
 * to its COUNTRY name (so an unmapped region never leaks a raw code).
 */
export function getRegionLabel(
  countryCode: string,
  regionCode: string | null | undefined,
  locale: string
): string {
  if (countryCode === 'DE' && regionCode && DE_STATES[regionCode]) {
    return DE_STATES[regionCode];
  }
  if (regionCode) {
    const sub = SUBDIVISION_NAMES[`${countryCode}-${regionCode}`];
    if (sub) return sub;
  }
  return getCountryName(countryCode, locale);
}
