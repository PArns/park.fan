/**
 * Human-readable names for the holiday-source regions the API returns as ISO codes
 * (`{ countryCode: 'DE', regionCode: 'RP' }` → „Rheinland-Pfalz"), for the neighbouring-region
 * holidays in the park header and the crowd calendar. Region names stay in their native form in
 * every locale; regions not covered fall back to their country name via `Intl.DisplayNames`.
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
 * school holidays drive cross-border crowds. Keys use the SHORT region code the API emits.
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

const regionDisplayNames = new Map<string, Intl.DisplayNames>();

/** Localised country name for a 2-letter ISO code via `Intl.DisplayNames`, else the raw code. */
export function getCountryName(countryCode: string, locale: string): string {
  try {
    let names = regionDisplayNames.get(locale);
    if (!names) {
      names = new Intl.DisplayNames([locale], { type: 'region' });
      regionDisplayNames.set(locale, names);
    }
    return names.of(countryCode) ?? countryCode;
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
 * Localised label for a holiday-source region: German states and the mapped subdivisions keep
 * their native name; anything else becomes its country name, so a raw code never leaks.
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

/**
 * Country URL slug → ISO 3166-1 alpha-2, for the countries in the catalogue. The park payload
 * carries no country code, and fetching the continents document to draw one flag is not worth
 * it. A closed set: an unlisted slug returns null and the caller drops the flag rather than
 * showing a wrong one.
 */
const COUNTRY_SLUG_CODES: Record<string, string> = {
  australia: 'AU',
  austria: 'AT',
  belgium: 'BE',
  brazil: 'BR',
  canada: 'CA',
  china: 'CN',
  denmark: 'DK',
  france: 'FR',
  germany: 'DE',
  'hong-kong': 'HK',
  italy: 'IT',
  japan: 'JP',
  malaysia: 'MY',
  mexico: 'MX',
  netherlands: 'NL',
  poland: 'PL',
  'saudi-arabia': 'SA',
  singapore: 'SG',
  'south-korea': 'KR',
  spain: 'ES',
  sweden: 'SE',
  'united-kingdom': 'GB',
  'united-states': 'US',
};

/** ISO country code for a country URL slug, or null when the slug is not in the catalogue. */
export function countryCodeForSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return COUNTRY_SLUG_CODES[slug.toLowerCase()] ?? null;
}
