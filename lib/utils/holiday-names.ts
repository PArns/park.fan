import type { Locale } from '@/i18n/config';

/**
 * Localized holiday names.
 *
 * The API answers in English and only in English. `Holiday.localName` exists in its schema and
 * never reaches this app; the school-holiday importer picks `name.find(n => n.language === 'EN')`
 * out of the OpenHolidays name array and throws the other five away. So a German reader looking
 * at Phantasialand on a German page was told the park was in "Summer Holidays" — the one string
 * in that whole header that had not been translated.
 *
 * `localName` would not fix it either, and that is the reason this table is here rather than a
 * passthrough: it is the name in the HOLIDAY'S language, not the reader's. It answers "Koningsdag"
 * to a German reading about Efteling, when what that reader needs is "Königstag". A holiday name
 * has to be translated into the language of the person reading it, and only this side knows which
 * that is.
 *
 * Two vocabularies, handled differently because they behave differently:
 *
 * **School breaks are seasonal and compositional.** Across DE/AT/CH/BE/NL/FR/IT/ES/PL/LU the
 * OpenHolidays feed yields about seventy distinct English strings, and nearly all of them are one
 * of a dozen seasons wearing a different suffix and a different capitalisation — `Summer
 * Holidays`, `Summer holidays`, `summer holidays`, `Easter break`, `Christmas Break`. So the
 * lookup normalises (lowercase, collapse whitespace, drop a trailing holiday/holidays/break/
 * vacation/vacations) and matches what is left against {@link SEASONS}. Twelve keys cover the
 * seventy strings, and the next spelling variant the feed invents costs nothing.
 *
 * The composed form is written out per locale rather than assembled at runtime from a season word
 * and a word for "holidays". Both halves inflect — German glues ("Sommerferien"), Dutch glues but
 * changes the noun ("zomervakantie"), French takes an elided preposition before a vowel
 * ("vacances d'été") and a plain one otherwise ("vacances de printemps), Italian turns the season
 * into an adjective that agrees ("vacanze estive"). A template would get four of the six wrong.
 *
 * **Public holidays are names and are not compositional**, so they are a literal table — of the
 * ~172 distinct names Nager.Date returns for the 23 countries in the catalogue, this covers the
 * ones that recur across Europe plus each country's own national day. Everything else falls
 * through to {@link translateHolidayName}'s passthrough, which returns the API's English string
 * unchanged: an untranslated "Gold Cup Parade Day" is a worse chip than a translated one and a far
 * better chip than an empty one.
 *
 * Locale order in every tuple is fixed: **de, en, nl, fr, es, it**.
 */

type Names = readonly [de: string, en: string, nl: string, fr: string, es: string, it: string];

const LOCALE_INDEX: Record<Locale, number> = { de: 0, en: 1, nl: 2, fr: 3, es: 4, it: 5 };

/** Season → the whole break's name in each locale. Keys are already normalized. */
const SEASONS: Record<string, Names> = {
  summer: [
    'Sommerferien',
    'Summer holidays',
    'zomervakantie',
    "vacances d'été",
    'vacaciones de verano',
    'vacanze estive',
  ],
  autumn: [
    'Herbstferien',
    'Autumn holidays',
    'herfstvakantie',
    "vacances d'automne",
    'vacaciones de otoño',
    'vacanze autunnali',
  ],
  fall: [
    'Herbstferien',
    'Autumn holidays',
    'herfstvakantie',
    "vacances d'automne",
    'vacaciones de otoño',
    'vacanze autunnali',
  ],
  winter: [
    'Winterferien',
    'Winter holidays',
    'wintervakantie',
    "vacances d'hiver",
    'vacaciones de invierno',
    'vacanze invernali',
  ],
  spring: [
    'Frühjahrsferien',
    'Spring holidays',
    'voorjaarsvakantie',
    'vacances de printemps',
    'vacaciones de primavera',
    'vacanze primaverili',
  ],
  easter: [
    'Osterferien',
    'Easter holidays',
    'paasvakantie',
    'vacances de Pâques',
    'vacaciones de Semana Santa',
    'vacanze di Pasqua',
  ],
  christmas: [
    'Weihnachtsferien',
    'Christmas holidays',
    'kerstvakantie',
    'vacances de Noël',
    'vacaciones de Navidad',
    'vacanze di Natale',
  ],
  carnival: [
    'Karnevalsferien',
    'Carnival holidays',
    'carnavalsvakantie',
    'vacances de carnaval',
    'vacaciones de Carnaval',
    'vacanze di Carnevale',
  ],
  carnivals: [
    'Karnevalsferien',
    'Carnival holidays',
    'carnavalsvakantie',
    'vacances de carnaval',
    'vacaciones de Carnaval',
    'vacanze di Carnevale',
  ],
  pentecost: [
    'Pfingstferien',
    'Whitsun holidays',
    'pinkstervakantie',
    'vacances de Pentecôte',
    'vacaciones de Pentecostés',
    'vacanze di Pentecoste',
  ],
  whitsun: [
    'Pfingstferien',
    'Whitsun holidays',
    'pinkstervakantie',
    'vacances de Pentecôte',
    'vacaciones de Pentecostés',
    'vacanze di Pentecoste',
  ],
  'all saints': [
    'Allerheiligenferien',
    'All Saints holidays',
    'herfstvakantie',
    'vacances de la Toussaint',
    'vacaciones de Todos los Santos',
    'vacanze di Ognissanti',
  ],
  "all saints'": [
    'Allerheiligenferien',
    'All Saints holidays',
    'herfstvakantie',
    'vacances de la Toussaint',
    'vacaciones de Todos los Santos',
    'vacanze di Ognissanti',
  ],
  'all saints day': [
    'Allerheiligenferien',
    'All Saints holidays',
    'herfstvakantie',
    'vacances de la Toussaint',
    'vacaciones de Todos los Santos',
    'vacanze di Ognissanti',
  ],
  february: [
    'Februarferien',
    'February holidays',
    'krokusvakantie',
    'vacances de février',
    'vacaciones de febrero',
    'vacanze di febbraio',
  ],
  'february week': [
    'Februarferien',
    'February holidays',
    'krokusvakantie',
    'vacances de février',
    'vacaciones de febrero',
    'vacanze di febbraio',
  ],
  may: [
    'Maiferien',
    'May holidays',
    'meivakantie',
    'vacances de mai',
    'vacaciones de mayo',
    'vacanze di maggio',
  ],
  'week in may': [
    'Maiferien',
    'May holidays',
    'meivakantie',
    'vacances de mai',
    'vacaciones de mayo',
    'vacanze di maggio',
  ],
  semester: [
    'Semesterferien',
    'Semester holidays',
    'semestervakantie',
    'vacances de semestre',
    'vacaciones de semestre',
    'vacanze semestrali',
  ],
  'mid-year': [
    'Halbjahresferien',
    'Mid-year holidays',
    'halfjaarvakantie',
    'vacances de mi-année',
    'vacaciones de mitad de curso',
    'vacanze di metà anno',
  ],
  sport: [
    'Sportferien',
    'Sports holidays',
    'sportvakantie',
    'vacances de sport',
    'vacaciones de deporte',
    'vacanze sportive',
  ],
  sports: [
    'Sportferien',
    'Sports holidays',
    'sportvakantie',
    'vacances de sport',
    'vacaciones de deporte',
    'vacanze sportive',
  ],
  school: [
    'Schulferien',
    'School holidays',
    'schoolvakantie',
    'vacances scolaires',
    'vacaciones escolares',
    'vacanze scolastiche',
  ],
};

/** Public holidays, keyed on the normalized English name Nager.Date sends. */
const PUBLIC_HOLIDAYS: Record<string, Names> = {
  "new year's day": [
    'Neujahr',
    "New Year's Day",
    'nieuwjaarsdag',
    'Jour de l’An',
    'Año Nuevo',
    'Capodanno',
  ],
  "new year's eve": [
    'Silvester',
    "New Year's Eve",
    'oudejaarsdag',
    'Saint-Sylvestre',
    'Nochevieja',
    'San Silvestro',
  ],
  epiphany: [
    'Heilige Drei Könige',
    'Epiphany',
    'Driekoningen',
    'Épiphanie',
    'Epifanía',
    'Epifania',
  ],
  'good friday': [
    'Karfreitag',
    'Good Friday',
    'Goede Vrijdag',
    'Vendredi saint',
    'Viernes Santo',
    'Venerdì Santo',
  ],
  'maundy thursday': [
    'Gründonnerstag',
    'Maundy Thursday',
    'Witte Donderdag',
    'Jeudi saint',
    'Jueves Santo',
    'Giovedì Santo',
  ],
  'holy saturday': [
    'Karsamstag',
    'Holy Saturday',
    'Stille Zaterdag',
    'Samedi saint',
    'Sábado Santo',
    'Sabato Santo',
  ],
  'easter sunday': [
    'Ostersonntag',
    'Easter Sunday',
    'eerste paasdag',
    'Dimanche de Pâques',
    'Domingo de Pascua',
    'Pasqua',
  ],
  'easter monday': [
    'Ostermontag',
    'Easter Monday',
    'tweede paasdag',
    'Lundi de Pâques',
    'Lunes de Pascua',
    "Lunedì dell'Angelo",
  ],
  'ascension day': [
    'Christi Himmelfahrt',
    'Ascension Day',
    'Hemelvaartsdag',
    'Ascension',
    'Ascensión',
    'Ascensione',
  ],
  pentecost: ['Pfingsten', 'Pentecost', 'Pinksteren', 'Pentecôte', 'Pentecostés', 'Pentecoste'],
  'whit monday': [
    'Pfingstmontag',
    'Whit Monday',
    'tweede pinksterdag',
    'Lundi de Pentecôte',
    'Lunes de Pentecostés',
    'Lunedì di Pentecoste',
  ],
  'corpus christi': [
    'Fronleichnam',
    'Corpus Christi',
    'Sacramentsdag',
    'Fête-Dieu',
    'Corpus Christi',
    'Corpus Domini',
  ],
  'labour day': [
    'Tag der Arbeit',
    'Labour Day',
    'Dag van de Arbeid',
    'Fête du Travail',
    'Día del Trabajo',
    'Festa del Lavoro',
  ],
  'may day': [
    'Tag der Arbeit',
    'May Day',
    'Dag van de Arbeid',
    'Fête du Travail',
    'Día del Trabajo',
    'Festa del Lavoro',
  ],
  'international workers day': [
    'Tag der Arbeit',
    "International Workers' Day",
    'Dag van de Arbeid',
    'Fête du Travail',
    'Día del Trabajo',
    'Festa del Lavoro',
  ],
  "international workers' day": [
    'Tag der Arbeit',
    "International Workers' Day",
    'Dag van de Arbeid',
    'Fête du Travail',
    'Día del Trabajo',
    'Festa del Lavoro',
  ],
  'assumption day': [
    'Mariä Himmelfahrt',
    'Assumption Day',
    'Maria-Tenhemelopneming',
    'Assomption',
    'Asunción',
    'Ferragosto',
  ],
  assumption: [
    'Mariä Himmelfahrt',
    'Assumption Day',
    'Maria-Tenhemelopneming',
    'Assomption',
    'Asunción',
    'Ferragosto',
  ],
  'assumption of the virgin mary': [
    'Mariä Himmelfahrt',
    'Assumption Day',
    'Maria-Tenhemelopneming',
    'Assomption',
    'Asunción',
    'Ferragosto',
  ],
  "all saints' day": [
    'Allerheiligen',
    "All Saints' Day",
    'Allerheiligen',
    'Toussaint',
    'Todos los Santos',
    'Ognissanti',
  ],
  'all saints day': [
    'Allerheiligen',
    "All Saints' Day",
    'Allerheiligen',
    'Toussaint',
    'Todos los Santos',
    'Ognissanti',
  ],
  "all souls' day": [
    'Allerseelen',
    "All Souls' Day",
    'Allerzielen',
    'Jour des Morts',
    'Día de los Difuntos',
    'Commemorazione dei defunti',
  ],
  'immaculate conception': [
    'Mariä Empfängnis',
    'Immaculate Conception',
    'Onbevlekte Ontvangenis',
    'Immaculée Conception',
    'Inmaculada Concepción',
    'Immacolata Concezione',
  ],
  'christmas eve': [
    'Heiligabend',
    'Christmas Eve',
    'kerstavond',
    'Réveillon de Noël',
    'Nochebuena',
    'Vigilia di Natale',
  ],
  'christmas day': ['Weihnachten', 'Christmas Day', 'eerste kerstdag', 'Noël', 'Navidad', 'Natale'],
  "st. stephen's day": [
    'Zweiter Weihnachtsfeiertag',
    "St. Stephen's Day",
    'tweede kerstdag',
    'Saint-Étienne',
    'San Esteban',
    'Santo Stefano',
  ],
  'boxing day': [
    'Zweiter Weihnachtsfeiertag',
    'Boxing Day',
    'tweede kerstdag',
    'Saint-Étienne',
    'San Esteban',
    'Santo Stefano',
  ],
  'reformation day': [
    'Reformationstag',
    'Reformation Day',
    'Hervormingsdag',
    'Jour de la Réformation',
    'Día de la Reforma',
    'Giorno della Riforma',
  ],
  'repentance and prayer day': [
    'Buß- und Bettag',
    'Repentance and Prayer Day',
    'Boete- en Bededag',
    'Jour de pénitence et de prière',
    'Día de Penitencia y Oración',
    'Giorno di penitenza e preghiera',
  ],
  'german unity day': [
    'Tag der Deutschen Einheit',
    'German Unity Day',
    'Dag van de Duitse Eenheid',
    "Jour de l'Unité allemande",
    'Día de la Unidad Alemana',
    "Giorno dell'Unità tedesca",
  ],
  "king's day": [
    'Königstag',
    "King's Day",
    'Koningsdag',
    'Jour du Roi',
    'Día del Rey',
    'Giorno del Re',
  ],
  'liberation day': [
    'Befreiungstag',
    'Liberation Day',
    'Bevrijdingsdag',
    'Jour de la Libération',
    'Día de la Liberación',
    'Festa della Liberazione',
  ],
  'bastille day': [
    'Französischer Nationalfeiertag',
    'Bastille Day',
    'Quatorze Juillet',
    'Fête nationale',
    'Fiesta Nacional de Francia',
    'Festa nazionale francese',
  ],
  'armistice day': [
    'Waffenstillstandstag',
    'Armistice Day',
    'Wapenstilstandsdag',
    'Armistice',
    'Día del Armisticio',
    "Giorno dell'Armistizio",
  ],
  'belgian national day': [
    'Belgischer Nationalfeiertag',
    'Belgian National Day',
    'Nationale feestdag',
    'Fête nationale belge',
    'Fiesta Nacional de Bélgica',
    'Festa nazionale belga',
  ],
  'national holiday': [
    'Nationalfeiertag',
    'National Holiday',
    'nationale feestdag',
    'Fête nationale',
    'Fiesta Nacional',
    'Festa nazionale',
  ],
  'national day of spain': [
    'Spanischer Nationalfeiertag',
    'National Day of Spain',
    'Nationale feestdag van Spanje',
    'Fête nationale espagnole',
    'Fiesta Nacional de España',
    'Festa nazionale spagnola',
  ],
  'republic day': [
    'Tag der Republik',
    'Republic Day',
    'Dag van de Republiek',
    'Fête de la République',
    'Día de la República',
    'Festa della Repubblica',
  ],
  'constitution day': [
    'Tag der Verfassung',
    'Constitution Day',
    'Dag van de Grondwet',
    'Jour de la Constitution',
    'Día de la Constitución',
    'Giorno della Costituzione',
  ],
  'independence day': [
    'Unabhängigkeitstag',
    'Independence Day',
    'Onafhankelijkheidsdag',
    "Jour de l'Indépendance",
    'Día de la Independencia',
    "Giorno dell'Indipendenza",
  ],
  'federal day of thanksgiving': [
    'Eidgenössischer Dank-, Buss- und Bettag',
    'Federal Day of Thanksgiving',
    'Eidgenössischer Dank-, Buss- und Bettag',
    'Jeûne fédéral',
    'Día Federal de Acción de Gracias',
    'Digiuno federale',
  ],
  'early may bank holiday': [
    'Feiertag im Mai',
    'Early May Bank Holiday',
    'meifeestdag',
    'Jour férié de mai',
    'Festivo de mayo',
    'Festivo di maggio',
  ],
  'spring bank holiday': [
    'Frühlingsfeiertag',
    'Spring Bank Holiday',
    'voorjaarsfeestdag',
    'Jour férié de printemps',
    'Festivo de primavera',
    'Festivo di primavera',
  ],
  'summer bank holiday': [
    'Sommerfeiertag',
    'Summer Bank Holiday',
    'zomerfeestdag',
    "Jour férié d'été",
    'Festivo de verano',
    "Festivo d'estate",
  ],
  carnival: ['Karneval', 'Carnival', 'carnaval', 'Carnaval', 'Carnaval', 'Carnevale'],
  "international women's day": [
    'Internationaler Frauentag',
    "International Women's Day",
    'Internationale Vrouwendag',
    'Journée internationale des femmes',
    'Día Internacional de la Mujer',
    'Giornata internazionale della donna',
  ],
  thanksgiving: [
    'Thanksgiving',
    'Thanksgiving',
    'Thanksgiving',
    'Action de grâce',
    'Acción de Gracias',
    'Giorno del Ringraziamento',
  ],
  'thanksgiving day': [
    'Thanksgiving',
    'Thanksgiving Day',
    'Thanksgiving',
    'Action de grâce',
    'Acción de Gracias',
    'Giorno del Ringraziamento',
  ],
  'memorial day': [
    'Memorial Day',
    'Memorial Day',
    'Memorial Day',
    'Memorial Day',
    'Memorial Day',
    'Memorial Day',
  ],
};

/**
 * Lowercase, collapse whitespace and drop trailing punctuation. Combined with {@link TRAILING} at
 * the call site, `Summer Holidays`, `Summer holidays` and `summer break` all reduce to `summer`.
 */
function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!]+$/, '');
}

const TRAILING = /\s+(holidays?|breaks?|vacations?|recess)$/;

/**
 * The API's English holiday name in the reader's language, or the name unchanged when it is not
 * in either table.
 *
 * Never returns an empty string, and never throws on an unknown name — a holiday nobody has
 * translated is still a fact about the day, and the chip that carries it stays useful in English.
 */
export function translateHolidayName(
  name: string | null | undefined,
  locale: Locale | string
): string {
  if (!name) return '';
  const index = LOCALE_INDEX[locale as Locale] ?? LOCALE_INDEX.en;
  const key = normalize(name);

  const exact = PUBLIC_HOLIDAYS[key];
  if (exact) return exact[index];

  // School breaks: try the whole string first (`february week`, `week in may`), then the stem
  // left after the trailing holiday word (`summer holidays` → `summer`).
  const season = SEASONS[key] ?? SEASONS[key.replace(TRAILING, '')];
  if (season) return season[index];

  return name;
}

/**
 * What a holiday chip should say when the feed gives a flag but no name — `isSchoolVacation`
 * without a `holidayName`, which is most non-German parks. Callers pass their own translated
 * fallback; this exists so the "school holidays" wording is the same string whether it arrived
 * as a name or as a boolean.
 */
export function genericSchoolHolidayName(locale: Locale | string): string {
  return SEASONS.school[LOCALE_INDEX[locale as Locale] ?? LOCALE_INDEX.en];
}
