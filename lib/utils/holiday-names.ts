import type { Locale } from '@/i18n/config';

/**
 * Localized holiday names. The API answers in English only, and its `localName` would be the
 * holiday's own language („Koningsdag"), not the reader's („Königstag"), so the translation lives
 * here.
 *
 * School breaks are seasonal: the feed's many spellings („Summer Holidays", „summer break") are
 * normalized and matched against {@link SEASONS}, written out per locale because both halves
 * inflect differently in each language. Public holidays are a literal table of the names that
 * recur across Europe plus each national day; anything else passes through in English, which
 * beats an empty chip.
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
 * The API's English holiday name in the reader's language, or the name unchanged when it is not in
 * either table: an untranslated holiday is still a fact about the day.
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

  // School breaks: the whole string first (`february week`), then the stem left after the trailing
  // holiday word (`summer holidays` → `summer`).
  const season = SEASONS[key] ?? SEASONS[key.replace(TRAILING, '')];
  if (season) return season[index];

  return name;
}

/**
 * The generic „school holidays" name, for a chip whose feed gives `isSchoolVacation` without a
 * `holidayName`, so the wording matches a break that arrived with a name.
 */
export function genericSchoolHolidayName(locale: Locale | string): string {
  return SEASONS.school[LOCALE_INDEX[locale as Locale] ?? LOCALE_INDEX.en];
}
