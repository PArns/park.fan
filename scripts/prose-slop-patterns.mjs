/**
 * The patterns the critic found in the guides of 2026-10-13 (1 to 20 in the twelve open ones, 22 to
 * 38 in the 27 older ones) and in the thank-you post of 2026-10-19 (40 to 47), the date-line regex
 * and the sentence splitter they share with `scripts/check-prose.mjs` (docs/blog.md §2.20).
 *
 * Every pattern below is a **warning** except the date-opens-a-line rule, which has been an error
 * since 2026-10-11. Published posts must not turn `main` red, and each of these is a shape a
 * writer may use once; it is the repetition that reads generated. The thresholds (`min`) say how
 * often.
 *
 * Wordlists exist for German and English. Dutch, French, Spanish and Italian get the patterns that
 * do not need one (`heading-triple`, `name-colon-subheading`, `widget-announcement`) and the four
 * whose wording is a short fixed formula (`double-attribution`, `range-before-enumeration`,
 * `definition-before-glossary`, `source-silence-close`). Every rule says which locales it covers
 * in `locales`; a pattern that is not listed for a language is left to the critic (docs/blog.md
 * §7.2), not skipped by accident. Of the 22 to 38 batch, 23, 32 and 37 to 38 differ from the
 * rest only in what their `locales` list says; read the list, not this paragraph.
 *
 * `pnpm test:prose-rules` holds one positive and one negative case per rule, with the sentences
 * the critic quoted as fixtures.
 */

/* ------------------------------------------------------------------ shared helpers */

/**
 * A German date that opens a line becomes a numbered list (§4.4): CommonMark lets `1.` interrupt
 * a paragraph, so a paragraph wrapped before `1. November` renders the rest as list item one,
 * and Prettier then indents it as one. The Alton Towers guide and the Adventure in Batavia post
 * shipped that way until 2026-10-11. Any other day number after a blank line does the same. The
 * cure is a no-break space between the day and the month, which this pattern does not match.
 */
export const DATE_LINE_START =
  /^[ \t]*\d{1,2}\.[ \t]+(?:Januar|Jänner|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\b.*$/gm;

/*
 * A German ordinal ends in a full stop that ends no sentence: `27. September`, `am 5. und am
 * 11. Juli`, `auf einem geteilten 41. Platz`. Until 2026-09-30 every date in a post was split
 * into two or three "sentences" of one word, which fed the burstiness figure fragments and made
 * every event calendar read as staccato.
 */
const ORDINAL_FOLLOWERS =
  'Januar|Jänner|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Jahrhundert|Platz|Mal|Geburtstag|Stock|Klasse';
const ORDINAL = new RegExp(
  `\\b(\\d{1,4})\\.(?=,|\\s+(?:[a-zäöü(–-]|(?:${ORDINAL_FOLLOWERS})\\b))`,
  'g'
);

/** Sentences of a plain-text passage; a German ordinal, an initial or `z. B.` does not end one. */
export function splitSentences(text) {
  const t = text
    .replace(/\s+/g, ' ')
    .replace(/(\d)\.(\d)/g, '$1_$2')
    .replace(ORDINAL, '$1_')
    // Weekday abbreviations in a French, Spanish or Italian date list: `sam. 17, sáb. 24`.
    .replace(/\b(lun|mar|mer|jeu|ven|sam|dim|mié|jue|vie|sáb|dom|gio|sab)\.(?=\s*\d)/gi, '$1')
    .replace(/\b([A-ZÄÖÜ])\./g, '$1_')
    .replace(/\b(z\. ?B|u\. ?a|ca|bzw|evtl|inkl|ggf|Nr|St|Mr|Mrs|Dr|vs|etc)\./gi, '$1');
  return t.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
}

/** Markdown inline syntax gone: links keep their text, images and emphasis marks go. */
const plain = (s) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The post as a flat list of blocks: `heading`, `para`, `list`, `quote`, `table` and `fence` (a
 * widget or code fence, `info` is its first line). Frontmatter and comments are gone. Two blocks
 * are neighbours when nothing sits between them, which is what the widget rules ask about. `raw`
 * keeps the markdown that `text` strips, for the rules that ask about bold or an internal link.
 * A table also carries `rows`, its cells as plain text, header row first.
 */
export function blocks(raw) {
  const lines = raw
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n');
  const out = [];
  let cur = null;
  const flush = () => {
    if (cur) out.push({ ...cur, text: plain(cur.lines.join(' ')), raw: cur.lines.join(' ') });
    if (cur?.kind === 'table')
      out.at(-1).rows = cur.src
        .filter((l) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(l))
        .map((l) =>
          l
            .trim()
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((c) => plain(c))
        );
    cur = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      flush();
      while (i + 1 < lines.length && !/^```\s*$/.test(lines[i + 1])) i++;
      i++;
      out.push({ kind: 'fence', info: fence[1].trim(), text: '' });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      out.push({ kind: 'heading', level: heading[1].length, text: plain(heading[2]) });
      continue;
    }
    const kind = /^\s*\|/.test(line)
      ? 'table'
      : /^\s*(?:[-*+]|\d+\.)\s/.test(line)
        ? 'list'
        : /^\s*>/.test(line)
          ? 'quote'
          : 'para';
    // A wrapped list item arrives as an indented line of the paragraph kind and stays in its list.
    if (cur && cur.kind !== kind && !(cur.kind === 'list' && kind === 'para' && /^\s/.test(line)))
      flush();
    cur ??= { kind, lines: [], src: [] };
    cur.src.push(line);
    cur.lines.push(kind === 'table' ? line.replace(/\|/g, ' ') : line.replace(/^\s*>\s?/, ''));
  }
  flush();
  return out;
}

const isWidget = (b, name) =>
  b?.kind === 'fence' && (name ? b.info.startsWith(name) : /-widget\b/.test(b.info));
const lastSentence = (text) => splitSentences(text).at(-1) ?? '';
const firstSentence = (text) => splitSentences(text)[0] ?? '';
const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const paragraphs = (bs) => bs.filter((b) => b.kind === 'para');

/*
 * The word for "and" in each locale. One shared list read the Spanish and French `en` ("in") as
 * the Dutch "and", so `Altura mínima y acompañante en las atracciones` counted as three items. A
 * decimal comma (`5,2 g`) separates nothing.
 */
const HEADING_AND = { de: 'und', en: 'and', nl: 'en', fr: 'et', es: 'y|e', it: 'e|ed' };

/** A bold lead-in that opens with one of these is a label for the paragraph, not a maxim. */
const LABEL_PREPOSITION =
  /^(?:mit|ohne|per|by|with|without|met|zonder|en|avec|par|sans|con|sin|in|senza)\s/i;

/**
 * German spelling from before the 1996 reform: `ß` after a short vowel (`daß`, `muß`, `läßt`,
 * `Schluß`). An error, because there is no post, string or caption it belongs in. An explicit
 * list with its inflections; the nouns that compound (`Anschluß`, `Wildwasserfluß`) match as a
 * word ending. `Fuß`, `Spaß`, `Gruß`, `groß` and `Maß` have a long vowel and stay correct.
 */
const OLD_ORTHOGRAPHY =
  /(?<!\p{L})(?:daß|muß|mußt|mußte[nst]?|müßt|müßte[nst]?|wußte[nst]?|wüßte[nst]?|läßt|paßt|paßte[nt]?|faßt|faßte[nt]?|ißt|mißt|vergißt|bißchen|häßlich\p{L}*|naß|Haß|\p{L}*(?:schluß|fluß|schloß|genuß|prozeß|schuß|kuß|biß|faß))(?!\p{L})/giu;

/** Place names that keep the old spelling, and a quotation, which keeps its source's spelling. */
const OLD_SPELLING_EXEMPT =
  /Schloß (?:Holte-Stukenbrock|Holte|Dankern|Thurn)|^>\s*\[!QUOTE\][^\n]*(?:\n>.*)*/gm;
/** The old spellings of a text. */
export function oldSpellings(text) {
  return text.replace(OLD_SPELLING_EXEMPT, ' ').match(OLD_ORTHOGRAPHY) ?? [];
}

/**
 * `Werktag` means Monday to Saturday in German, `feriale` the same in Italian and `laborable` in
 * Spanish
 * (docs/rules/werktags-is-monday-to-saturday.md). A sentence that spells the span out or sets
 * the word against the weekend is fine; any other one is read in the legal sense.
 */
const WERKTAG = {
  de: {
    word: /(?<!\p{L})(?:werktag(?:e|s|en)?|werktäglich\p{L}*)(?!\p{L})/iu,
    span: /(?<!\p{L})(?:Montag(?:s)? bis (?:Freitag|Samstag)(?:s)?|Mo(?:ntag)?\.?\s*[–-]\s*(?:Fr|Sa)|Wochenend\p{L}*|Samstag(?:e|en)? und Sonntag(?:e|en)?|samstags und sonntags|Sonn- und Feiertag\p{L}*|unter der Woche)(?!\p{L})/iu,
    defines:
      /(?<!\p{L})(?:also|d\.\s?h\.|heißt|hei[ßs]en|meint|meinen|bedeutet|gemeint|zählen wir|zählt)(?!\p{L})/iu,
  },
  it: {
    word: /(?<!\p{L})(?:feriale|feriali)(?!\p{L})/iu,
    span: /(?:(?:dal )?luned[iì]\s*(?:[–-]|al?|a)\s*(?:venerd[iì]|sabato)|lun\s*[–-]\s*(?:ven|sab)|fine settimana|fine-settimana|weekend|(?:(?:il|i) )?sabat[oi] e (?:(?:la|le) )?domenic(?:a|he)|in settimana)/iu,
    defines: /(?<!\p{L})(?:cioè|ossia|ovvero|intendiamo|intendo|significa)(?!\p{L})/iu,
  },
  // A `día laborable` is Monday to Saturday too.
  es: {
    word: /(?<!\p{L})(?:días? laborables?|laborables)(?!\p{L})/iu,
    span: /(?<!\p{L})(?:(?:de )?lunes a viernes|lun\.?\s*[–-]\s*vie|entre semana|fin(?:es)? de semana|sábados? y domingos?)(?!\p{L})/iu,
    defines: /(?<!\p{L})(?:es decir|o sea|entendemos)(?!\p{L})/iu,
  },
};
const DAY_LIST = /(?:\d{1,2}[._]?(?:,|\s+(?:und|e|y|et|en|and))\s*){2,}\d{1,2}/u;
/**
 * The sentences of a text that say `Werktag` or `feriale` without the span. A text that defines
 * the word once (`Werktage, also Montag bis Freitag ohne Feiertag`) has said what it means.
 */
export function werktagSentences(text, locale) {
  const rule = WERKTAG[locale];
  if (!rule) return [];
  const sentences = splitSentences(text.replace(/```[\s\S]*?```/g, ' ')).filter((s) =>
    rule.word.test(s)
  );
  if (sentences.some((s) => rule.span.test(s) && rule.defines.test(s))) return [];
  // `14., 15., 19., 20. und 21. Oktober, alles Werktage`: the days are named one by one.
  return sentences.filter((s) => !rule.span.test(s) && !DAY_LIST.test(s));
}

/* ------------------------------------------------------------------ the rules */

/** Sentence-level wordlists. German and English first; a language that is missing is not covered. */
const RETRIEVAL = {
  de: /(?:konnten? wir nicht (?:abrufen|bestätigen|öffnen|prüfen)|nicht (?:abrufen|bestätigen)|fehlt die Angabe bei \d+ von \d+|ließ sich nicht (?:bestätigen|abrufen|belegen))/i,
  en: /(?:could(?: not|n['’]t) (?:be )?(?:retrieve|confirm|open|verify|find)|(?:is|are) missing (?:for|from|at) \d+ of \d+|we (?:could not|couldn['’]t) (?:retrieve|confirm))/i,
};

const HANDOFF = {
  de: [
    /^(?:Den|Die|Das|Welche[nrs]?)\s[^.]{3,90}?\s(?:nennt|nennen|zeigt|zeigen|beschreibt|beschreiben|erklärt|erklären|behandelt|behandeln|vergleicht|liefert|verrät|führt|listet)\s+(?:der|die|das|unser\w*|dieser|diese)\s(?:Park|Betreiber|Parkseite|Webseite|Seite|Guide|Beitrag|Artikel|Ratgeber|Überblick|Übersicht|Kalender|Ticketshop|Buchungsablauf|App|Rezeption|Kasse|Hotline)\b/iu,
    /^(?:Der|Die|Das|Unser\w*|Dieser|Diese)\s+[\p{L}-]*(?:Überblick|Guide|Beitrag|Artikel|Ratgeber|Übersicht|Vergleich|Ranking|Rangliste|Kalender)\s[^.]{0,30}?\b(?:vergleicht|zeigt|nennt|beschreibt|erklärt|behandelt|zählt|führt|listet|rechnet|stellt)/iu,
  ],
  en: [
    /\b(?:is|are) (?:described|covered|explained|listed|compared|discussed) in (?:the|our|this) \w+/i,
    /^The [\w -]{0,30}?(?:guide|overview|post|article|calendar|comparison|ranking)\b[^.]{0,30}?\b(?:compares|covers|lists|shows|explains|describes|discusses)\b/i,
  ],
};

const INDIRECT_QUESTION = {
  de: /^(?:Welche[rsmn]?|Wie|Wann|Wo|Was|Wer|Wie ?viel\w*)\s[^.?!]{3,100}?,?\s(?:steht|stehen|findest du|findet man|zeigt|zeigen|nennt|nennen|liest du)\s+(?:\p{L}+\s+)?(?:im|in der|in den|auf der|auf|bei|beim)\s/iu,
  en: /^(?:Which|What|When|How|Where|Who|Whether)\s[^.?!]{3,100}?\s(?:is|are) (?:in|on|listed in|shown in|given in|answered in|covered in)\s/i,
};

const CONDITIONAL = { de: /^Wer\s/, en: /^(?:If you|Anyone who|Whoever)\b/i };

const CATALOG = {
  // Since PAR-987 the ranking connectors too: `Nach X kommen`, `Danach kommt`, `Knapp dahinter liegt`.
  de: /^(?:Dazu kommt|Dazu kommen|Hinzu kommt|Hinzu kommen|Und es gibt|Außerdem gibt es|Außerdem kommt|Außerdem kommen|Und dann gibt es|Danach (?:kommt|kommen|folgt|folgen)|(?:Knapp |Dicht )?[Dd]ahinter (?:liegt|liegen|folgt|folgen|kommt|kommen)|Nach \p{Lu}[^,.]{0,40}?\s(?:kommt|kommen|folgt|folgen))(?!\p{L})/u,
  en: /^(?:There(?:['’]s| is| are) also|Then there(?:['’]s| is| are)|And there(?:['’]s| is| are)|Also there|(?:Just |Close )?[Bb]ehind (?:it|them|that) (?:is|are|comes?)|After (?:it|that|them) (?:comes?|is|are))\b/iu,
};

const ATTRIBUTION_OPENER = {
  de: /^(?:Laut (?:dem )?(?:Park|Betreiber|Parkseite)|Der Park (?:nennt|gibt|sagt|beschreibt|bezeichnet|führt|spricht)|Nach Angaben des (?:Parks|Betreibers)|Nach Parkangabe)\b/,
  // Since PAR-989 `According to the parks` and `According to Heide Park` too.
  en: /^(?:According to (?:the )?(?:parks?|operators?|\p{Lu}[\p{L}-]+(?: \p{Lu}[\p{L}-]+)*)|The park (?:calls|says|gives|lists|describes|states|names|quotes|puts|claims|notes))(?!\p{L})/u,
};

const TRAVEL_IMPERATIVE = {
  de: /^Prüfe\b.*(?:vor der (?:Fahrt|Anreise|Reise|Abfahrt)|bevor du (?:fährst|losfährst|anreist|losgehst|buchst|aufbrichst)|vor deiner (?:Anreise|Fahrt|Reise)|vor dem (?:Besuch|Ausflug))/,
  en: /^Check\b.*(?:before you (?:travel|go|visit|leave|set off|head out|drive|book)|before your (?:trip|visit|journey|drive)|ahead of (?:your|the) (?:trip|visit))/i,
};

/** Shared words that prove nothing: auxiliaries, particles and the like. */
const BECAUSE_STOP = new Set(
  [
    'werden',
    'können',
    'müssen',
    'sollen',
    'wollen',
    'dürfen',
    'haben',
    'wurde',
    'wurden',
    'worden',
    'nicht',
    'auch',
    'dann',
    'damit',
    'wenn',
    'immer',
    'schon',
    'noch',
    'mehr',
    'viel',
    'about',
    'there',
    'which',
    'their',
    'would',
    'these',
    'those',
    'other',
    'while',
    'where',
    'before',
    'after',
    'still',
    'could',
    'should',
    'because',
    'every',
    'being',
    'often',
    'being',
  ].map((w) => w.toLowerCase())
);

const ANNOUNCES_POST = {
  de: /^(?:Hier (?:steht|stehen|findest|erfährst|lesen)|Dieser (?:Beitrag|Guide|Artikel|Ratgeber|Überblick|Text)|Dieses Kapitel|In diesem (?:Beitrag|Guide|Artikel|Ratgeber)|Der (?:Beitrag|Guide|Artikel) (?:zählt|zeigt|erklärt|beschreibt|behandelt|vergleicht)|Dazu kommen?\b|Wir (?:zeigen|erklären|zählen|vergleichen|beschreiben))/i,
  en: /^(?:Here(?:['’]s| is| are| you(?:['’]ll| will) find)|This (?:guide|post|article|overview|page|piece|text)|In this (?:guide|post|article)|The (?:guide|post|article) (?:covers|lists|explains|shows|compares)|Also covered|We (?:cover|list|explain|show|compare))\b/i,
};

/** A number in front of a unit is a measurement (`um neun Uhr`), not a count of things. */
const MEASURE_WORD =
  /\b(?:Uhr|Minuten?|Stunden?|Sekunden?|Euro|Meter|Kilometer[ns]?|Personen|Jahre[ns]?|Tage[ns]?|Wochen?|Monate[ns]?|minutes?|hours?|seconds?|euros?|metres?|meters?|kilometres?|kilometers?|people|persons|years?|days?|weeks?|months?|o['’]clock)\b/i;

/** `Um zehn gehst du …` names a time of day, not a count. */
const CLOCK_TIME =
  /(?<!\p{L})(?:um|ab|bis|gegen|at|by|until|around)\s+(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?!\p{L})/iu;

const COUNT_WORD = {
  de: /(?<!\p{L})(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:two|three|four|five|six(?!\s+Flags)|seven|eight|nine|ten|eleven|twelve)(?!\p{L})/iu,
};

const CAVEAT_CLOSE = {
  de: /(?:zu wenige?s? (?:für|um|Messtage|Daten|Tage|Werte)|reicht (?:nur |gerade )?für eine (?:grobe|erste)|zu dünn|nicht belastbar|keine belastbare|kaum aussagekräftig|mehr als eine Tendenz|nur eine (?:Tendenz|grobe)|eine grobe Richtung)/i,
  en: /(?:too few to|too little to|too thin|not enough to (?:say|tell|conclude)|enough for (?:only )?a rough|a rough (?:direction|idea|indication)|only a rough|not reliable|hardly (?:conclusive|reliable)|more than a trend)/i,
};
const MEASURED_DAYS =
  /\b\d+\s+(?:Messtage\w*|Tage\w*|Tagen|Messungen|Wochen|Beobachtungstage|days|weeks|measurement days|observations)\b/i;

const ATTRIBUTION = {
  de: /(?:nach Parkangabe|nach Angaben des (?:Parks|Betreibers)|laut (?:dem )?(?:Park|Betreiber)|laut Parkangabe|der Park (?:nennt|gibt|sagt))/i,
  en: /(?:according to the (?:park|operator)|per the park|the park (?:says|lists|gives|states|calls|names|describes))/i,
  nl: /(?:volgens het park|het park (?:noemt|geeft|zegt))/i,
  fr: /(?:selon le parc|d['’]après le parc|le parc (?:indique|précise|annonce))/i,
  es: /(?:según el parque|el parque (?:indica|dice|cita))/i,
  it: /(?:secondo il parco|il parco (?:indica|dice|riporta))/i,
};

const RANGE = {
  de: /zwischen\s+([\d.,]+)\s*(?:[^\s\d]{1,4}\s+)?und\s+([\d.,]+)/gi,
  en: /between\s+[£$€]?\s*([\d.,]+)\s*(?:[^\s\d]{1,4}\s+)?and\s+[£$€]?\s*([\d.,]+)/gi,
  nl: /tussen\s+([\d.,]+)\s*(?:[^\s\d]{1,4}\s+)?en\s+([\d.,]+)/gi,
  fr: /entre\s+([\d.,]+)\s*(?:[^\s\d]{1,4}\s+)?et\s+([\d.,]+)/gi,
  es: /entre\s+([\d.,]+)\s*(?:[^\s\d]{1,4}\s+)?y\s+([\d.,]+)/gi,
  it: /(?:tra|fra)\s+([\d.,]+)\s*(?:[^\s\d]{1,4}\s+)?e\s+([\d.,]+)/gi,
};

/** `heißt, dass …`, `means that …`: a definition. `seit 2024 heißt sie Nemesis Reborn` names a ride. */
const DEFINES =
  /\b(?:(?:heißt|bedeutet|bezeichnet),?\s+(?:dass|wenn|wer|man|du)|nennt man|means|is when|stands for|betekent|signifie|veut dire|significa|vuol dire)\b/i;

const SOURCE_SILENCE = {
  de: [
    /(?:nennt|nennen|gibt|geben|verrät|sagt|macht) (?:der Park|die Parkseite|der Betreiber|das Haus|die Seite|der Hersteller)(?: dazu| darüber| dafür)? (?:keine?\w* \p{L}+|nicht)(?: an)?[.]?$/iu,
    /(?:steht )?nicht auf der Seite des Parks[.]?$/i,
  ],
  en: [
    /(?:the park|the operator|the site|the page) (?:does(?: not|n['’]t)|doesn['’]t) (?:say|name|list|state|give|specify|publish)(?: this| that| it| a \w+| anything)?[.]?$/i,
    /not (?:named |listed |stated )?on the park['’]s (?:page|site|website)[.]?$/i,
  ],
  nl: [/het park (?:noemt|geeft) (?:dat |dit |het )?niet(?: op)?[.]?$/i],
  fr: [/le parc ne (?:le |la |les )?(?:précise|donne|mentionne|indique) pas[.]?$/i],
  es: [/el parque no (?:lo |la )?(?:indica|menciona|precisa|da)[.]?$/i],
  it: [/il parco non (?:lo |la )?(?:indica|cita|precisa|riporta|dice|specifica)[.]?$/i],
};

const CAPTION_AFTER = {
  de: /^(?:In der Tabelle|Im Kalender|In der Grafik|Im Diagramm|Auf der Karte|(?:Die Tabelle|Der Kalender|Die Grafik|Das Diagramm|Das Widget|Die Karte)\s+(?:zeigt|listet|enthält|fasst|nennt|vergleicht))\b/,
  en: /^(?:The table|The calendar|The chart|The graph|The widget|The map|In the table|In the calendar|In the chart|On the map)\b/i,
};

const TABLE_SUMMARY = {
  de: /^(?:Die (?:folgende |nachstehende )?Tabelle|Der Kalender|Die Grafik|Das Diagramm|Die Übersicht)(?: unten)?\s+(?:fasst|zeigt|listet|enthält|vergleicht|nennt|führt|stellt)/i,
  en: /^The (?:following |below )?(?:table|calendar|chart|overview)\s+(?:summari[sz]es|shows|lists|compares|contains|gives|sets)/i,
};

/**
 * The words of a clause that read as a verb: German third-person forms end in `-t` (`lohnt`,
 * `steht`, `kostet`), English ones in `-s`, `-ed` or `-ing` and do not follow a determiner. A
 * shared noun or adjective (`eigenen`, `queue`) is repetition but not the tautology of §2.20 (11).
 */
function finiteVerbs(clause, locale) {
  const tokens = clause.match(/[\p{L}'’-]+/gu) ?? [];
  return tokens
    .map((word, i) => ({ w: word.toLowerCase(), word, prev: (tokens[i - 1] ?? '').toLowerCase() }))
    .filter(({ w, word, prev }) => {
      if (w.length < 5 || BECAUSE_STOP.has(w)) return false;
      // German nouns are capitalised, so a lower-case `-t` word is a verb or a participle.
      if (locale === 'de')
        return word[0] === w[0] && /t$/.test(w) && !/^ge/.test(w) && !ADVERB_T.has(w);
      return /s$/.test(w) && SUBJECT.has(prev);
    })
    .map(({ w }) => w);
}
/** German adverbs and adjectives that end in `-t` like a verb. */
const ADVERB_T = new Set(
  'zuerst zuletzt jetzt leicht meist nicht selbst erst bereits besonders breit hart kurz nächst'.split(
    ' '
  )
);
/** An English `-s` word counts as a verb only right after one of these. */
const SUBJECT = new Set('it he she this that which everything nothing one who park'.split(' '));

/* ---- 22 to 38 ---- */

const BET = {
  de: /(?<!\p{L})(?:ist|sind|bleibt|bleiben|wird|war)\s+(?:\p{L}+\s+){0,2}?eine Wette(?!\p{L})/iu,
  en: /(?<!\p{L})(?:is|are|remains?|was)\s+(?:\w+\s+){0,2}?a bet(?!\p{L})/iu,
  nl: /(?<!\p{L})is een gok(?!\p{L})/iu,
  fr: /(?<!\p{L})est un pari(?!\p{L})/iu,
  es: /(?<!\p{L})es una apuesta(?!\p{L})/iu,
  it: /(?<!\p{L})è una scommessa(?!\p{L})/iu,
};

const GOOD_WHEN = {
  de: /(?<!\p{L})(?:ist|sind)\s+(?:dann\s+|meist\s+|nur\s+)?gut,?\s+wenn(?!\p{L})/iu,
  en: /(?<!\p{L})is\s+(?:then\s+|usually\s+)?good,?\s+when(?!\p{L})/iu,
};
const BAD_WHEN = {
  de: /(?<!\p{L})(?:ist|sind)\s+(?:dann\s+|meist\s+)?schlecht,?\s+wenn(?!\p{L})/iu,
  en: /(?<!\p{L})is\s+(?:then\s+|usually\s+)?bad,?\s+when(?!\p{L})/iu,
};

/** What may follow the appended clause: a few words, then the end of the sentence. */
const CLAUSE_END = String.raw`(?:\s[^.!?]{0,60})?[.!]?$`;
const APPENDED_REASON = {
  de: new RegExp(String.raw`,\s+und das ist (?:genau |eben )?der Grund${CLAUSE_END}`, 'iu'),
  en: new RegExp(String.raw`,\s+which is (?:exactly |precisely )?the reason${CLAUSE_END}`, 'iu'),
  nl: new RegExp(String.raw`,\s+en dat is (?:precies )?de reden${CLAUSE_END}`, 'iu'),
  fr: new RegExp(
    String.raw`,\s+et c['’]est (?:exactement |précisément )?la raison${CLAUSE_END}`,
    'iu'
  ),
  es: new RegExp(String.raw`,\s+y esa es la razón${CLAUSE_END}`, 'iu'),
  it: new RegExp(String.raw`,\s+ed è (?:proprio )?questo il motivo${CLAUSE_END}`, 'iu'),
};
const APPENDED_ADVICE = {
  de: new RegExp(
    String.raw`,\s+was man sich\s(?:\p{L}+\s){0,3}überlegen sollte${CLAUSE_END}`,
    'iu'
  ),
  en: new RegExp(String.raw`,\s+which is worth (?:thinking about|considering)${CLAUSE_END}`, 'iu'),
  fr: new RegExp(
    String.raw`,\s+ce qui mérite (?:réflexion|d['’]être (?:pesé|considéré))${CLAUSE_END}`,
    'iu'
  ),
  it: new RegExp(String.raw`,\s+cosa da valutare${CLAUSE_END}`, 'iu'),
};

/** The sentence that says where the answer is: `steht im`, `is in the`. */
const POINTS_TO = {
  de: /(?<!\p{L})steht (?:im|in der|in den)(?!\p{L})/iu,
  en: /(?<!\p{L})is in the(?!\p{L})/iu,
  nl: /(?<!\p{L})staat in de(?!\p{L})/iu,
  fr: /(?<!\p{L})est dans le(?!\p{L})/iu,
  es: /(?<!\p{L})está en la(?!\p{L})/iu,
  it: /(?<!\p{L})sta nella(?!\p{L})/iu,
};
const BLOG_LINK = /\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\)/;
/** A paragraph that is nothing but one internal link. */
const LINK_ONLY = /^\[[^\]]+\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\)\.?$/;
/*
 * The same pointer with the link moved to the front: `Im [Efteling-Guide](/blog/…) steht, wie …`,
 * `Unser [Halloween-Guide](/blog/…) beschreibt, was …`. Rewording the sentence end to dodge the
 * series above left fourteen of these in one post on 2026-10-14.
 */
const LINK_LEADS = {
  de: /^(?:\S+\s+){0,2}\[[^\]]+\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\),?\s+(?:\S+\s+)?(?:steht|stehen|findest|erklärt|beschreibt|zeigt|vergleicht)(?!\p{L})/iu,
  en: /^(?:\S+\s+){0,2}\[[^\]]+\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\),?\s+(?:\S+\s+)?(?:has|lists|covers|explains|describes|shows|compares|you['’]ll find)(?!\p{L})/iu,
  nl: /^(?:\S+\s+){0,2}\[[^\]]+\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\),?\s+(?:\S+\s+)?(?:staat|staan|lees|vind|legt|beschrijft|vergelijkt)(?!\p{L})/iu,
  fr: /^(?:\S+\s+){0,2}\[[^\]]+\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\),?\s+(?:\S+\s+)?(?:trouveras|explique|décrit|recense|présente|compare)(?!\p{L})/iu,
  es: /^(?:\S+\s+){0,2}\[[^\]]+\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\),?\s+(?:\S+\s+)?(?:está|están|encontrarás|explica|describe|cuenta|compara)(?!\p{L})/iu,
  it: /^(?:\S+\s+){0,2}\[[^\]]+\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\),?\s+(?:\S+\s+)?(?:trovi|spiega|descrive|racconta|confronta|elenca)(?!\p{L})/iu,
};
const ENDS_ON_LINK = /\]\(\/(?:[a-z]{2}\/)?(?:blog|news)\/[^)\s]+\)\.$/;

const WIDGET_SHOWS = {
  de: /(?<!\p{L})Das Widget zeigt/iu,
  en: /(?<!\p{L})The widget shows/iu,
  nl: /(?<!\p{L})De widget toont/iu,
  fr: /(?<!\p{L})Le widget montre/iu,
  es: /(?<!\p{L})El widget muestra/iu,
  it: /(?<!\p{L})Il widget mostra/iu,
};
const PICKS_FROM = {
  de: /^(?:Zwischen|Aus) diesen\s[^.]{0,40}?\s(?:würde ich|würden wir)(?!\p{L})/iu,
  en: /^(?:These|Those) are the\s[^.]{0,40}?\s(?:I['’]d|I would|we['’]d)(?!\p{L})/iu,
};

const HOW_TEASER = {
  de: /^Wie\s[^.?!]{3,120}?,\s(?:zeigte sich|zeigt sich|sieht man|lässt sich|sieht das aus|erfährst du)(?!\p{L})/iu,
  en: /^(?:Just how\b[^.?!]*\b(?:became|becomes|is|was) (?:clear|obvious|apparent|visible)|How\s[^.?!]{3,120}?,\s(?:you can see|you see|it (?:became|becomes) clear|one can see))(?!\p{L})/iu,
  nl: /^Hoe\s[^.?!]{3,120}?,\s(?:bleek|blijkt|zie je|kun je zien)(?!\p{L})/iu,
  fr: /^Comment\s[^.?!]{3,120}?,\s(?:on le voit|cela se voit|il apparaît)(?!\p{L})/iu,
};

const STEP_LABEL =
  /^\*\*(?:Zuerst|Dann|Danach|Zum Schluss|First|Then|Finally|Eerst|Dan|D['’]abord|Ensuite|Enfin|Primero|Luego|Prima|Poi)\b[^*]*\*\*/iu;

const OWN_POST_AS_PROOF = {
  de: /(?<!\p{L})wie\b[^.]{0,40}?(?<!\p{L})(?:unserem|unserer|unseren|unser)\b[^.]{0,30}?(?<!\p{L})(?:Beitrag|Guide|Artikel)\b[^.]{0,40}?(?<!\p{L})(?:steht|schreiben|zeigt|beschrieben)(?!\p{L})/iu,
  en: /(?<!\p{L})as\b[^.]{0,40}?(?<!\p{L})our\b[^.]{0,30}?(?<!\p{L})(?:post|guide|article)\b[^.]{0,40}?(?<!\p{L})(?:says|writes|shows|describes|puts it)(?!\p{L})/iu,
  nl: /(?<!\p{L})zoals\b[^.]{0,40}?(?<!\p{L})(?:ons|onze)\b[^.]{0,30}?(?<!\p{L})(?:artikel|gids|bericht)\b[^.]{0,40}?(?<!\p{L})(?:staat|schrijft|laat zien)(?!\p{L})/iu,
  fr: /(?<!\p{L})comme\b[^.]{0,40}?(?<!\p{L})(?:notre|nos)\b[^.]{0,30}?(?<!\p{L})(?:article|guide)\b[^.]{0,40}?(?<!\p{L})(?:indique|explique|écrit|dit)(?!\p{L})/iu,
  es: /(?<!\p{L})como\b[^.]{0,40}?(?<!\p{L})(?:nuestro|nuestra)\b[^.]{0,30}?(?<!\p{L})(?:artículo|guía)\b[^.]{0,40}?(?<!\p{L})(?:cuenta|dice|explica|indica)(?!\p{L})/iu,
  it: /(?<!\p{L})come\b[^.]{0,40}?(?<!\p{L})(?:nostro|nostra)\b[^.]{0,30}?(?<!\p{L})(?:articolo|guida)\b[^.]{0,40}?(?<!\p{L})(?:racconta|dice|spiega|indica)(?!\p{L})/iu,
};

const ADVICE_WHO = {
  de: /^Wer\s[^,.?!]{2,90},\s(?:fährt|geht|kann|sollte|nimmt|kommt|wählt|startet)(?!\p{L})/iu,
  en: /^If you\s[^,.?!]{2,90},\s(?:go|take|pick|choose|start|visit|head|arrive|come|book|ride|skip|plan)(?!\p{L})/iu,
  nl: /^Wie\s[^,.?!]{2,90},\s(?:gaat|neemt|kan|moet|kiest|rijdt)(?!\p{L})/iu,
};

const NOT_FOUND_CLOSE = {
  de: /(?:nicht gefunden|nicht ablesen|nicht ablesbar)[.]?$/iu,
  en: /(?:couldn['’]t find|could not find|didn['’]t find|did not find)\b[^.]{0,40}[.]?$/iu,
};

const DAY_NIGHT = {
  de: /(?<!\p{L})tagsüber(?!\p{L})[^.]*(?<!\p{L})(?:abends|nachts|am Abend)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:by day|during the day)(?!\p{L})[^.]*(?<!\p{L})(?:in the evening|at night|by night)(?!\p{L})/iu,
  nl: /(?<!\p{L})overdag(?!\p{L})[^.]*(?:['’]s avonds|['’]s nachts)/iu,
  es: /(?<!\p{L})de día(?!\p{L})[^.]*(?<!\p{L})de noche(?!\p{L})/iu,
  it: /(?<!\p{L})di giorno(?!\p{L})[^.]*(?<!\p{L})di (?:sera|notte)(?!\p{L})/iu,
};

const LOOKS_DIFFERENT = {
  de: /(?<!\p{L})(?:sieht (?:das )?anders aus|ist (?:eine )?(?:ganz )?andere (?:Geschichte|Sache)|liegt (?:das )?anders)\s?:/iu,
  en: /(?<!\p{L})(?:is (?:quite )?(?:another|a different) (?:matter|story|thing)|looks different)\s?:/iu,
  nl: /(?<!\p{L})ligt dat anders\s?:/iu,
  fr: /(?<!\p{L})c['’]est autre chose\s?:/iu,
  es: /(?<!\p{L})es otra historia\s?:/iu,
  it: /(?<!\p{L})è un['’]altra storia\s?:/iu,
};

const RIDDLE_FRACTION = {
  de: /(?<!\p{L})(?:zur Hälfte|halb)(?!\p{L})/iu,
  en: /(?<!\p{L})half of(?!\p{L})/iu,
  fr: /(?<!\p{L})à moitié(?!\p{L})/iu,
  es: /(?<!\p{L})medio récord(?!\p{L})/iu,
  it: /(?<!\p{L})per metà(?!\p{L})/iu,
};

const ASKS_BEFOREHAND = {
  de: /(?<!\p{L})will vorher wissen(?!\p{L})/iu,
  en: /(?<!\p{L})wants? to know beforehand(?!\p{L})/iu,
  nl: /(?<!\p{L})wil vooraf weten(?!\p{L})/iu,
  fr: /(?<!\p{L})tu veux savoir(?!\p{L})/iu,
  es: /(?<!\p{L})conviene saber(?!\p{L})/iu,
  it: /(?<!\p{L})vuole sapere prima(?!\p{L})/iu,
};
/** The word that opens each member of the list: `ob`, `whether`, `of`, `si`, `se`. */
const WHETHER = {
  de: /(?<!\p{L})ob(?!\p{L})/giu,
  en: /(?<!\p{L})whether(?!\p{L})/giu,
  nl: /(?<!\p{L})of(?!\p{L})/giu,
  fr: /(?<!\p{L})si(?!\p{L})/giu,
  es: /(?<!\p{L})si(?!\p{L})/giu,
  it: /(?<!\p{L})se(?!\p{L})/giu,
};

/** A bare yes or no is an answer; the rule is about the answer that says nothing. */
const YES_NO = /^(?:ja|nein|yes|no|nee|oui|non|sí|si|sì)(?!\p{L})/iu;
const EMPTY_ANSWER_END = {
  de: /verschieden[.!]?$/iu,
  en: /varies[.!]?$/iu,
  nl: /verschilt[.!]?$/iu,
  es: /depende[.!]?$/iu,
  it: /dipende[.!]?$/iu,
};

/* ---- 40 to 47 ---- */

/** `wo das alles angefangen hat`: the start of the story brought back to close a circle. */
const WHERE_IT_BEGAN = {
  de: /(?<!\p{L})(?:wo|wie|womit) (?:das |es )?alles (?:angefangen|begonnen) hat(?!\p{L})/iu,
  en: /(?<!\p{L})where it all (?:began|started)(?!\p{L})/iu,
  nl: /(?<!\p{L})waar (?:het )?allemaal (?:begon|is begonnen)(?!\p{L})/iu,
  fr: /(?<!\p{L})où tout a commencé(?!\p{L})/iu,
  es: /(?<!\p{L})donde (?:todo )?(?:empezó|comenzó)(?: todo)?(?!\p{L})/iu,
  it: /(?<!\p{L})dove tutto (?:è )?(?:cominciato|iniziato|cominciò|iniziò)(?!\p{L})/iu,
};
/** The verb of beginning. `Anfang Oktober` is a date and `beginnt` a timetable, so neither counts. */
const BEGAN = {
  de: /(?<!\p{L})(?:angefangen|anfangen|anfing|begann|begonnen)(?!\p{L})/giu,
  en: /(?<!\p{L})(?:began|begun|started)(?!\p{L})/giu,
};

const THANKS_EITHER_OR = {
  de: /(?<!\p{L})Danke(?!\p{L})(?:[^.!?]|\.(?=\S)){0,40},\s+ob (?:ihr|du|Sie)\s(?:[^.!?]|\.(?=\S))+?\soder\s/iu,
  en: /(?<!\p{L})Thank(?:s| you)(?!\p{L})(?:[^.!?]|\.(?=\S)){0,40},\s+whether you\s(?:[^.!?]|\.(?=\S))+?\sor\s/iu,
  nl: /(?<!\p{L})(?:Bedankt|Dank (?:je|jullie|u))(?!\p{L})(?:[^.!?]|\.(?=\S)){0,40},\s+of (?:je|jullie|u)\s(?:[^.!?]|\.(?=\S))+?\sof\s/iu,
  fr: /(?<!\p{L})Merci(?!\p{L})(?:[^.!?]|\.(?=\S)){0,40},\s+que (?:vous|tu)\s(?:[^.!?]|\.(?=\S))+?\sou\s/iu,
  es: /(?<!\p{L})Gracias(?!\p{L})(?:[^.!?]|\.(?=\S)){0,40},\s+(?:tanto )?si\s(?:[^.!?]|\.(?=\S))+?\s(?:o|como si)\s/iu,
  it: /(?<!\p{L})Grazie(?!\p{L})(?:[^.!?]|\.(?=\S)){0,40},\s+che (?:tu|voi)\s(?:[^.!?]|\.(?=\S))+?\so\s/iu,
};

/** `Manche …, andere …`: readers the author imagines, one per feature. */
const SOME_OTHERS = {
  de: /(?<!\p{L})Manche\s(?:[^.!?]|\.(?=\S)){3,200}?[,.]\s+(?:und\s+)?andere(?!\p{L})/iu,
  en: /(?<!\p{L})Some\s(?:[^.!?]|\.(?=\S)){3,200}?[,.]\s+(?:and\s+)?others(?!\p{L})/iu,
  nl: /(?<!\p{L})Sommigen?\s(?:[^.!?]|\.(?=\S)){3,200}?[,.]\s+(?:en\s+)?anderen(?!\p{L})/iu,
  fr: /(?<!\p{L})Certains\s(?:[^.!?]|\.(?=\S)){3,200}?[,.]\s+(?:et\s+)?d['’]autres(?!\p{L})/iu,
  es: /(?<!\p{L})Algunos\s(?:[^.!?]|\.(?=\S)){3,200}?[,.]\s+(?:y\s+)?otros(?!\p{L})/iu,
  it: /(?<!\p{L})Alcuni\s(?:[^.!?]|\.(?=\S)){3,200}?[,.]\s+(?:e\s+)?altri(?!\p{L})/iu,
};
/** The third of them, hedged: `ein paar stehen vielleicht`, `a few might be`. */
const A_FEW_MAYBE = {
  de: /(?<!\p{L})(?:ein paar|einige)\s(?:[^.!?]|\.(?=\S)){0,40}?vielleicht(?!\p{L})/iu,
  en: /(?<!\p{L})a few\s(?:[^.!?]|\.(?=\S)){0,30}?(?:might|may|perhaps|maybe)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:een paar|enkelen?)\s(?:[^.!?]|\.(?=\S)){0,40}?misschien(?!\p{L})/iu,
  fr: /(?<!\p{L})quelques-uns\s(?:[^.!?]|\.(?=\S)){0,40}?peut-être(?!\p{L})/iu,
  es: /(?<!\p{L})(?:puede que|quizá|quizás|tal vez)\s(?:\p{L}+\s){0,3}?(?:unos cuantos|algunos)(?!\p{L})/iu,
  it: /(?<!\p{L})qualcuno\s(?:[^.!?]|\.(?=\S)){0,40}?forse(?!\p{L})|(?<!\p{L})forse\s(?:\p{L}+\s){0,3}?qualcuno(?!\p{L})/iu,
};
/** A link to a page of this site, not `ref:` and not another domain. */
const SITE_LINK = /\]\(\/(?!\/)[^)\s]*\)/g;

/** The author's own feeling as the last sentence of a paragraph. */
const FEELING_CLOSE = {
  de: /(?<!\p{L})(?:hätte ich (?:nie|niemals|nicht) gerechnet|habe ich nicht gerechnet|hat mich (?:sehr |riesig |besonders )?gefreut|freut mich|freue mich|als ich zugeben möchte|war ich mir nicht sicher|baue ich\s(?:[^.]|\.(?=\S)){0,40}?für (?:euch|dich|sie)|Für (?:euch|dich|sie) baue ich)(?!\p{L})/iu,
  en: /(?:I['’]d never have (?:guessed|expected)|I never (?:expected|thought)|I was (?:glad|happy|thrilled|delighted)|made me (?:happy|glad)|than I['’]d like to admit|I wasn['’]t sure|I build (?:[^.]|\.(?=\S)){0,40}?for (?:you|them))/iu,
};

const DISAPPOINT_TEASER = {
  de: /(?<!\p{L})muss ich (?:dich |euch |Sie )?enttäuschen(?!\p{L})/iu,
  en: /(?<!\p{L})I (?:have|need) to disappoint(?!\p{L})/iu,
  nl: /(?<!\p{L})moet ik (?:je |jullie |u )?teleurstellen(?!\p{L})/iu,
  fr: /(?<!\p{L})je dois (?:vous |te )décevoir(?!\p{L})/iu,
  es: /(?<!\p{L})tengo que decepcionar(?:te|os|le|les)?(?!\p{L})/iu,
  it: /(?<!\p{L})devo deluder(?:ti|vi|la)?(?!\p{L})/iu,
};

/** `…, genau die Wochen, in denen …` hung on a finished sentence to reach the next paragraph. */
const BRIDGE_APPOSITION = {
  de: /,\s+genau (?:die|der|das|den|dem)\s+\p{L}+,\s+(?:in|an|auf|bei|mit|nach|vor|seit)\s+(?:denen|dem|der|die|das|den)\s(?:[^.!?]|\.(?=\S)){0,80}[.!]?$/iu,
  en: /,\s+(?:exactly|precisely) the\s+\p{L}+\s+(?:in which|when|that)\s(?:[^.!?]|\.(?=\S)){0,80}[.!]?$/iu,
};

/** The lines every contact form carries: welcome feedback, a personal read, a coy admission. */
const CONTACT_FORM = {
  de: [
    /(?<!\p{L})(?:ist|sind) (?:mir |uns )?(?:immer|jederzeit|stets) (?:herzlich )?willkommen(?!\p{L})/iu,
    /(?<!\p{L})lese ich (?:alle |jede |jeden )?(?:\p{L}+ )?selbst(?!\p{L})/iu,
    /(?<!\p{L})als ich zugeben (?:möchte|mag|will)(?!\p{L})/iu,
  ],
  en: [
    /(?<!\p{L})(?:is|are) always welcome(?!\p{L})/iu,
    /(?<!\p{L})I read (?:every|each|all)\s+\p{L}+\s+(?:myself|personally)(?!\p{L})/iu,
    /(?<!\p{L})than I['’]d (?:like|care) to admit(?!\p{L})/iu,
  ],
  nl: [
    /(?<!\p{L})(?:is|zijn) altijd welkom(?!\p{L})/iu,
    /(?<!\p{L})lees ik zelf(?!\p{L})/iu,
    /(?<!\p{L})dan ik wil toegeven(?!\p{L})/iu,
  ],
  fr: [
    /(?<!\p{L})(?:est|sont) toujours (?:le |la |les )?bienvenu/iu,
    /(?<!\p{L})Tout retour est le bienvenu(?!\p{L})/iu,
    /(?<!\p{L})je lis (?:chaque|tous les) \p{L}+ moi-même(?!\p{L})/iu,
    /(?<!\p{L})que je ne (?:veux|voudrais) bien l['’]admettre(?!\p{L})/iu,
  ],
  es: [
    /(?<!\p{L})(?:es|son) siempre bienvenid/iu,
    /(?<!\p{L})siempre (?:es |son )?bienvenid/iu,
    /(?<!\p{L})lo leo yo mism[oa](?!\p{L})/iu,
    /(?<!\p{L})de las que me gustaría admitir(?!\p{L})/iu,
  ],
  it: [
    /(?<!\p{L})(?:è|sono) sempre (?:il )?benvenut/iu,
    /(?<!\p{L})leggo personalmente(?!\p{L})/iu,
    /(?<!\p{L})di quanto mi piaccia ammettere(?!\p{L})/iu,
  ],
};

/** Adverbs that carry nothing in bulk (§2.18). Four per 1,000 words, and at least four. */
const FILLER_ADVERBS = {
  // `deutlich`, `klar` and `clearly` since PAR-986: `clearly emptier`, `clearly shorter`.
  de: ['gerade', 'inzwischen', 'eigentlich', 'wirklich', 'deutlich', 'klar'],
  en: ['actually', 'really', 'basically', 'literally', 'clearly'],
};

/* ---- 48 onwards: the seven guides of 2026-10-22 (PAR-984 to PAR-990) ---- */

/** Lower-case words of a passage; a number with its decimal or thousands mark stays one word. */
const tokens = (s) => s.toLowerCase().match(/\d+(?:[.,]\d+)*|[\p{L}'’-]+/gu) ?? [];
/** The figures of a passage as written, years left out: `2026` is a date, not a price. */
const figures = (s) =>
  (s.match(/\d+(?:[.,]\d+)*/g) ?? []).filter((n) => !/^(?:1[89]|20)\d\d$/.test(n));
const ngrams = (list, n) => {
  const out = new Set();
  for (let i = 0; i + n <= list.length; i++) out.add(list.slice(i, i + n).join(' '));
  return out;
};
const jaccard = (a, b) => {
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / (a.size + b.size - shared);
};

/** The post cut at its headings of `level` or above: `[{ heading, blocks }]`, the lead first. */
function chaptersOf(bs, level = 2) {
  const out = [{ heading: null, blocks: [] }];
  for (const b of bs) {
    if (b.kind === 'heading' && b.level <= level) out.push({ heading: b, blocks: [] });
    else out.at(-1).blocks.push(b);
  }
  return out;
}

const FAQ_HEADING =
  /^(?:Häufige Fragen|FAQ|Frequently asked questions|Veelgestelde vragen|Questions fréquentes|Foire aux questions|Preguntas frecuentes|Domande frequenti)\b/i;
/**
 * The FAQ chapter: `start` is the index of its `##`, `answers` the text under each `### …?`. A
 * question heading elsewhere in the post is a chapter title, not an answer read on its own.
 */
function faq(bs) {
  const start = bs.findIndex(
    (b) => b.kind === 'heading' && b.level === 2 && FAQ_HEADING.test(b.text)
  );
  if (start < 0) return { start: bs.length, answers: [] };
  const answers = [];
  for (const b of bs.slice(start + 1)) {
    if (b.kind === 'heading' && b.level <= 2) break;
    if (b.kind === 'heading') answers.push([]);
    else if (answers.length && (b.kind === 'para' || b.kind === 'list'))
      answers.at(-1).push(b.text);
  }
  return { start, answers: answers.map((a) => a.join(' ')).filter(Boolean) };
}
const running = (bs) => bs.filter((b) => b.kind === 'para' || b.kind === 'list');
const leadFields = (fields) =>
  fields.filter(([name]) => name === 'excerpt' || name === 'description').map(([, v]) => v);

/** Month and season names: `In October`, `Im Sommer` open on a date, not on a park. */
const TIME_WORD =
  /^(?:Januar|Jänner|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Frühling|Frühjahr|Sommer|Herbst|Winter|January|February|March|May|June|July|October|December|Spring|Summer|Autumn|Fall|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/;
const MONTH_WORD =
  /^(?:januar|jänner|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|october|december|januari|februari|maart|mei|augustus|janvier|février|mars|avril|juin|juillet|août|septembre|octobre|novembre|décembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|gennaio|febbraio|aprile|maggio|giugno|luglio|settembre|ottobre|dicembre)$/;
const UNIT_WORD =
  /^(?:cm|m|km|mm|zentimeter\p{L}*|meter\p{L}*|metres?|meters?|mètres?|metri|metros?|centimet\p{L}*|kilomet\p{L}*)$/u;
const MONTHS = MONTH_WORD.source.slice(1, -1);
/** The day of a date (`14. Oktober`, `October 14`, `14 de octubre`) and a product's number. */
const DATE_DAY = new RegExp(
  `\\d{1,2}(?:[._]|º|er)?(?:\\s+de)?\\s+${MONTHS}(?!\\p{L})|${MONTHS}\\s+\\d{1,2}(?!\\d)`,
  'giu'
);
const PRODUCT_NUMBER =
  /(?<=\p{Lu}[\p{L}-]*\s)\d+(?![\d.,]|\s*(?:€|£|\$|%|Euro|euros?|pounds?|Pfund|Prozent|per ?cent|cm|m|km|Meter\p{L}*|metres?|meters?|mètres?|metri|metros?|Minuten|minutes?|minuti|minutos|Jahr\p{L}*|years?|ans|años|anni|jaar|Uhr|h)(?!\p{L}))/gu;
/** A share counted out in words: `Sieben davon`, `seven of them`. */
const COUNT_WORD_ANY =
  /(?<!\p{L})\p{L}+ (?:davon|of them|daarvan|d['’]entre (?:eux|elles)|de (?:ellas|ellos)|di (?:esse|essi|cui))(?!\p{L})/iu;
/** The figures of a passage that a table could hold: no years, no day of a date, no model number. */
const tableFigures = (s) =>
  figures(
    s
      // `10 800 yens`: a space between thousands is one figure.
      .replace(/(\d)[\s\u00a0\u202f](?=\d{3}(?!\d))/g, '$1')
      .replace(DATE_DAY, ' ')
      .replace(PRODUCT_NUMBER, ' ')
  );
const PREP_NAME = {
  de: /^(?:Im|In|Bei|Beim)\s+(\p{Lu}[\p{L}-]*)/u,
  en: /^(?:At|In|For)\s+(?:the\s+)?(\p{Lu}[\p{L}-]*)/u,
  nl: /^(?:In|Bij)\s+(?:het\s+|de\s+)?(\p{Lu}[\p{L}-]*)/u,
  fr: /^(?:Chez|À|Au|Dans)\s+(?:le\s+|la\s+|l['’])?(\p{Lu}[\p{L}-]*)/u,
  es: /^En\s+(?:el\s+|la\s+)?(\p{Lu}[\p{L}-]*)/u,
  it: /^(?:A|Al|Nel|In)\s+(\p{Lu}[\p{L}-]*)/u,
};
/**
 * The parks and rides a post links: the first word of every link text, every slug of a link
 * target, and the slugs of the frontmatter lists (`tags`, `parkLinks`, `rideLinks`).
 */
function linkedNames(raw) {
  const words = new Set();
  const slugs = [];
  for (const m of raw.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    words.add(plain(m[1]).split(/\s+/)[0].toLowerCase());
    // `/parks/europe/france/paris/disneyland-park`: the city is a place, not a park.
    let path = m[2]
      .toLowerCase()
      .replace(/^ref:/, '')
      .replace(/[?#].*$/, '')
      .split('/')
      .filter(Boolean);
    if (/^[a-z]{2}$/.test(path[0] ?? '')) path = path.slice(1);
    if (path[0] === 'parks') path = path.slice(4);
    slugs.push(...path.filter((x) => x.length >= 3));
  }
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';
  for (const m of front.matchAll(/^\s+-\s+['"]?([a-z0-9][a-z0-9/-]+)['"]?\s*$/gm))
    slugs.push(...m[1].split('/'));
  return { words, slugs };
}

const ORIGIN = {
  de: /^(?:Aus\s+(?:der\s+|dem\s+|den\s+)?|Für\s[^.,]{0,40}?\saus\s+(?:der\s+|dem\s+|den\s+)?)\p{Lu}/u,
  en: /^(?:From|Coming from)\s+(?:the\s+)?(?!(?:January|February|March|April|May|June|July|August|September|October|November|December)\b)\p{Lu}/u,
  nl: /^(?:Vanuit|Uit)\s+(?:het\s+|de\s+)?\p{Lu}/u,
  fr: /^Depuis\s+(?:la\s+|le\s+|l['’])?\p{Lu}/u,
  es: /^Desde\s+(?:la\s+|el\s+)?\p{Lu}/u,
  it: /^(?:Dall['’]|Dalla\s+|Dal\s+|Da\s+)\p{Lu}/u,
};
/** The travel chapter the guide templates ask for (`Anreise aus Deutschland`) is a tour on purpose. */
const TRAVEL_HEADING =
  /Anreise|Anfahrt|Hinkommen|kommt man|Auto|Getting there|get there|Travel|How to get|by car|Arriv|Bereikbaar|Reis|Accès|Venir|Comment (?:s['’]y rendre|venir)|voiture|Cómo llegar|Llegar|coche|Come arrivare|Raggiungere/i;
/** A way of getting there, so `Aus Plop und Samson wurde der Name` is not a tour. */
const TRAVEL_WORD =
  /(?<!\p{L})(?:Zug|Bahn|Bus|Flug|Flugzeug|Auto|fährt|fährst|fliegst|fliegt|hält|stops|flies|km|Kilometer\p{L}*|Stunden?|train|bus|flight|fly|car|drive|hours?|trein|vlucht|uur|vol|voiture|heures?|tren|vuelo|coche|horas?|treno|volo|ore)(?!\p{L})/iu;

/** A figure and the comparative it is the difference behind: `3 € billiger`, `55 metres longer`. */
const DIFFERENCE = {
  de: /(\d+(?:,\d+)?)\s*(?:€|Euro|Prozentpunkte|Meter|m|Minuten|Stunden|Jahre|km\/h)?\s+(?:billiger|teurer|günstiger|länger|kürzer|höher|schneller|älter|tiefer)(?!\p{L})/gu,
  en: /(?:€|£|\$)?(\d+(?:\.\d+)?)\s*(?:euros?|pounds|percentage points|metres|meters|m|minutes|hours|years|km\/h|mph)?\s+(?:cheaper|more expensive|longer|shorter|higher|taller|faster|older|deeper)(?!\p{L})/giu,
};
const toNumber = (n, locale) =>
  Number(locale === 'en' ? n.replace(/,/g, '') : n.replace(/\.(?=\d{3})/g, '').replace(',', '.'));
/**
 * The same sum with no comparative, introduced as a conclusion: `der zweite Tag also 60 bis
 * 67,50 €`, `which puts the second day at €60 to €67.50`. A figure or a range.
 */
// `_` is the decimal point splitSentences() hides.
const NUM = String.raw`(\d+(?:[.,_]\d+)?)`;
const SO_DIFFERENCE = {
  de: new RegExp(
    String.raw`(?<!\p{L})also\s+(?:\p{L}+\s+){0,2}?${NUM}(?:\s*(?:€|Euro))?(?:\s*(?:bis|–|-)\s*${NUM})?`,
    'giu'
  ),
  en: new RegExp(
    String.raw`(?<!\p{L})which puts\s[^.]{0,40}?\sat\s+[€£$]?${NUM}(?:\s*(?:to|–|-)\s*[€£$]?${NUM})?`,
    'giu'
  ),
  nl: new RegExp(
    String.raw`(?<!\p{L})dus\s+(?:\p{L}+\s+){0,2}?(?:€\s*)?${NUM}(?:\s*(?:tot|–|-)\s*(?:€\s*)?${NUM})?`,
    'giu'
  ),
  fr: new RegExp(
    String.raw`(?<!\p{L})donc\s+(?:\p{L}+\s+){0,2}?${NUM}(?:\s*(?:à|–|-)\s*${NUM})?`,
    'giu'
  ),
  es: new RegExp(
    String.raw`(?<!\p{L})o sea,?\s+(?:\p{L}+\s+){0,2}?${NUM}(?:\s*(?:a|–|-)\s*${NUM})?`,
    'giu'
  ),
  it: new RegExp(
    String.raw`(?<!\p{L})quindi\s+(?:\p{L}+\s+){0,2}?${NUM}(?:\s*(?:a|–|-)\s*${NUM})?`,
    'giu'
  ),
};

const SUM_UNIT =
  /€|£|\$|(?<!\p{L})(?:Euro|euros?|Prozent|per ?cent|procent|pour ?cent|por ?ciento|per ?cento|Minuten|minutes?|minuten|minutos|minuti|Meter|metres?|meters?|mètres?|metros|metri)(?!\p{L})|%/iu;
/** A price and, in the same sentence or cell, the word that it is not sold (docs/blog.md §1.2). */
const PRICE = /\d[\d.,]*\s*(?:€|£|\$|Euro|euros?|Franken|francs|yen|Yen)|[€£$]\s*\d/u;
const NOT_SOLD = {
  de: /(?<!\p{L})(?:nicht (?:mehr )?im Verkauf|verkauf\p{L}*\s(?:[^.]{0,40}\s)?(?:derzeit |zurzeit |momentan |aktuell )?nicht(?!\p{L})|nicht (?:mehr )?(?:zu kaufen|erhältlich))/iu,
  en: /(?<!\p{L})(?:not on sale|(?:isn['’]t|aren['’]t) on sale|(?:isn['’]t|aren['’]t|is not|are not) (?:currently )?(?:being )?sold|no longer (?:on )?sale|no longer sold|not (?:currently )?available to buy)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:niet (?:meer )?te koop|niet (?:meer )?verkocht|niet in de verkoop)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:pas (?:en|mis en) vente|plus en vente|n['’](?:est|sont) pas vendu)/iu,
  es: /(?<!\p{L})(?:no se vende|no (?:está|están) a la venta|ya no se vende)/iu,
  it: /(?<!\p{L})(?:non (?:è |sono )?in vendita|non si vende|non viene venduto)/iu,
};

/** A sentence that opens on a link to a park or ride page: `[Wodan](ref:…) ist …`. */
const OPENS_ON_REF = /^\[[^\]]+\]\(ref:[^)\s]+\)/;
/** Two internal pages joined in one closing sentence: `… von [A](ref:…) und [B](ref:…).` */
const PAGE_WORD = /(?:seite|pages?|pagina|página|statisti)/iu;
const TWO_PAGES =
  /\]\((?:\/[^)\s]*|ref:[^)\s]+)\)\s+(?:und|and|en|et|y|e)\s+\[[^\]]+\]\((?:\/[^)\s]*|ref:[^)\s]+)\)/u;

/** `, die nennt die Rezeption`: the hand-off moved into a relative clause. */
const HANDOFF_RELATIVE =
  /,\s+(?:die|den|das)\s+(?:nennt|nennen|zeigt|zeigen)\s+(?:der|die|das)\s+\p{L}+/iu;
/** `Den Parkschein verkauft der Heide Park`: object, verb, subject, sentence after sentence. */
const OBJECT_FIRST =
  /^(?:Den|Diese[nrs]?)\s+\p{Lu}[\p{L}-]+\s+\p{Ll}+\s+(?:der|die|das|du|Gäste|Besucher)(?!\p{L})/u;

const SCOREBOARD = {
  de: /(?<!\p{L})(?:liegt|liegen)\s(?:[^.]{0,40}\s)?vorn(?:e)?(?!\p{L})|(?<!\p{L})ist\s(?:[^.]{0,40}\s)?das bessere(?!\p{L})/iu,
  en: /(?<!\p{L})(?:wins on|is the better)(?!\p{L})/iu,
};
/** `Disneyland Paris hat die größte Spanne im Vergleich.`: eight words at most. */
const SUPERLATIVE_TOPIC = {
  de: /(?<!\p{L})(?:hat|haben) die (?:größte|meisten|längste|höchste|kürzeste|günstigste|teuerste|beste)n?(?!\p{L})/iu,
  en: /(?<!\p{L})(?:has|have) the (?:biggest|largest|most|longest|widest|highest|shortest|cheapest|best)(?!\p{L})/iu,
};

const POINTS_TO_OWN = {
  de: /(?<!\p{L})(?:steht|stehen) (?:in|im) (?:unserem|unserer|unseren)\s+\[/iu,
  en: /(?<!\p{L})(?:is|are) in our\s+\[/iu,
};
/** A sentence whose only job is a pointer: the link and a verb of where-to-find. */
const POINTER_VERB =
  /(?<!\p{L})(?:steht|stehen|findest|lassen sich|lässt sich|zeigt|zeigen|shows?|lists?|you['’]ll find|you can (?:compare|see)|staat|staan|vind je|trouveras|montre|encontrarás|muestra|trovi|mostra)(?!\p{L})/iu;
const ANY_SITE_LINK = /\]\((?:\/(?!\/)[^)\s]*|ref:[^)\s]+)\)/;

const INDIRECT_WE = {
  de: /^(?:Welche[rsmn]?|Wie|Wann|Wo|Was|Wer|Ob)\s[^.?!]{3,140}?,\s+haben wir (?:in|im|für)\s[^.]*?(?:ausgewertet|zusammengetragen|durchgerechnet)/iu,
  en: /^(?:Which|What|When|How|Where|Whether)\s[^.?!]{3,140}?,\s+we (?:analysed|analyzed|worked out|compiled|counted) in\s/iu,
};

const AMONG_THEM = {
  de: /(?<!\p{L})(?:darunter|unter anderem)\s+(?:[^.,;]{2,40},\s+){2,}[^.,;]{2,40}?\s+und\s/giu,
  en: /(?<!\p{L})among them\s+(?:[^.,;]{2,40},\s+){1,}[^.,;]{2,40}?,?\s+and\s/giu,
  nl: /(?<!\p{L})waaronder\s+(?:[^.,;]{2,40},\s+){1,}[^.,;]{2,40}?\s+en\s/giu,
  fr: /(?<!\p{L})parmi (?:lesquel(?:le)?s|eux|elles)\s+(?:[^.,;]{2,40},\s+){1,}[^.,;]{2,40}?\s+et\s/giu,
  es: /(?<!\p{L})entre (?:ellas|ellos)\s+(?:[^.,;]{2,40},\s+){1,}[^.,;]{2,40}?\s+y\s/giu,
  it: /(?<!\p{L})tra cui\s+(?:[^.,;]{2,40},\s+){1,}[^.,;]{2,40}?\s+e\s/giu,
};

/**
 * The last clause of a paragraph says what you need not buy or cannot book: `braucht dafür
 * keinen Pass`, `, und reservieren lässt sich keiner.` A plain negation (`hat Disney noch nicht
 * genannt`) is too common to count.
 */
const NEGATION_END = {
  de: /(?<!\p{L})(?:kein\p{L}*\s+(?:\p{L}+\s+){0,3}?(?:kaufen|brauchst|braucht|brauchen|buchen|reservieren|leihen)|(?:brauchst|braucht|brauchen|kaufen|buchen|reservieren|leihen)\s+(?:\p{L}+\s+){0,3}?(?:kein\p{L}*|nicht)(?:\s+\p{L}+){0,3}|(?:lässt|lassen) sich (?:\p{L}+\s+)?(?:keine?r?s?|nicht(?: \p{L}+)?)|gibt es (?:dort |da |hier )?(?:keine?n?|nicht)(?: \p{L}+){0,3}|nicht zu (?:leihen|kaufen|buchen|reservieren))[.!]?$/iu,
  en: /(?<!\p{L})(?:(?:don['’]t|doesn['’]t|won['’]t|wouldn['’]t|do not|does not|would not) (?:need|buy|book)|(?:can['’]t|cannot|can not) (?:book|buy|reserve|rent|hire))(?:\s+[\p{L}'’]+){0,6}[.!]?$/iu,
};
/** Ordinal and count words, so `ab dem dritten Besuch` and `ab dem vierten Besuch` end alike. */
const COUNTING_WORD =
  /^(?:\d+\.?|ein\p{L}*|zwei\p{L}*|drei\p{L}*|vier\p{L}*|fünf\p{L}*|sechs\p{L}*|erste\p{L}*|zweite\p{L}*|dritte\p{L}*|vierte\p{L}*|one|two|three|four|five|first|second|third|fourth|fifth)$/iu;

const COST_PER_DURATION = {
  de: /(?<!\p{L})für die (?:gut |knapp |rund )?(?:\d+(?:,\d+)?|zwei|drei|vier|fünf|anderthalb|eineinhalb) (?:Minuten|Sekunden)(?!\p{L})[^.]*?(?:€|Euro|Millionen)|(?:€|Euro|Millionen)[^.]*?(?<!\p{L})für die (?:gut |knapp |rund )?(?:\d+(?:,\d+)?|zwei|drei|vier|fünf) (?:Minuten|Sekunden)(?!\p{L})/iu,
  en: /(?<!\p{L})for (?:the |a )?(?:good |barely |roughly )?(?:\d+(?:\.\d+)?|two|three|four|five) (?:minutes|seconds) of (?:the )?ride(?!\p{L})[^.]*?(?:€|£|\$|million)|(?:€|£|\$|million)[^.]*?(?<!\p{L})for (?:the |a )?(?:good |barely |roughly )?(?:\d+(?:\.\d+)?|two|three|four|five) (?:minutes|seconds) of (?:the )?ride(?!\p{L})/iu,
};

/** The opening of a park told as a date, paragraph after paragraph. */
const OPENED = {
  de: /(?<!\p{L})(?:eröffnet|gegründet)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:opened|founded)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:geopend|opende|opgericht)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:ouvert|inauguré|ouvre ses portes|fondé)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:abrió|inaugurado|inauguró|fundado)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:aperto|inaugurato|aprì|fondato)(?!\p{L})/iu,
};
const YEAR = /(?<!\d)(?:1[89]|20)\d\d(?!\d)/;
/** `Der Europa-Park in Rust …`, `Efteling in Kaatsheuvel …`: a park and its town open the sentence. */
const PARK_IN_TOWN =
  /^(?:(?:Der|Das|Die|The|Het|De|Le|La|L['’]|El|Il|Lo)\s+)?\p{Lu}[^,.]{0,40}?\s(?:in|à|a|en|bei|near|nahe)\s+\p{Lu}/u;

const APPENDED_SOURCE = {
  de: /,\s+so steht es (?:auf|in|im)\s[^.]{0,80}[.!]?$/iu,
  en: /,\s+(?:or )?so (?:it says|says the park|the park says) (?:on|in)\s[^.]{0,60}[.!]?$|,\s+according to (?:its|the park['’]s) (?:website|site|page)[.!]?$/iu,
};

const NEVER_LIKE_IT = {
  de: /(?<!\p{L})(?:noch nie|nie zuvor) (?:eine?n?|so eine?n?) [^.]{0,40}?wie (?:diese[nrs]?|sie|ihn|es)(?!\p{L})/iu,
  en: /(?<!\p{L})never had (?:a|an) [\p{L} -]{0,30}?like (?:it|this|her|that)(?!\p{L})/iu,
  nl: /(?<!\p{L})nog nooit (?:een|zo['’]n) [^.]{0,40}?als (?:deze|dit|die)(?!\p{L})/iu,
  fr: /(?<!\p{L})jamais eu d['’]?(?:e )?[^.]{0,40}?comme (?:celle-ci|celui-ci|elle|lui|ça)(?!\p{L})/iu,
  es: /(?<!\p{L})nunca (?:ha|había) tenido (?:un|una) [^.]{0,40}?como (?:esta|este|ella|él)(?!\p{L})/iu,
  it: /(?<!\p{L})mai avuto (?:un|una|un['’]) ?[^.]{0,40}?come (?:questa|questo|lei|lui)(?!\p{L})/iu,
};

const VERDICT_CLOSE = {
  de: /(?<!\p{L})würde ich(?!\p{L})/iu,
  en: /(?<!\p{L})(?:I['’]d|I would)(?!\p{L})/iu,
  nl: /(?<!\p{L})zou ik(?!\p{L})/iu,
};

/** Ride manufacturers: a name the reader can look up, so any language. */
const MANUFACTURER =
  /(?<!\p{L})(?:Intamin|Mack(?: Rides)?|Maurer|Vekoma|Gerstlauer|Bolliger (?:&|und|and) Mabillard|B&M|Great Coasters International|GCI|Rocky Mountain Construction|RMC|Zierer|Schwarzkopf|Zamperla|Premier Rides|Custom Coasters International|Gravity Group|Hafema|Huss|S&S|Arrow Dynamics|Golden Horse|Pinfari|Preston (?:&|and) Barbieri|Beijing Shibaolai)(?!\p{L})/u;
const CLOSED_SPAN =
  /(?<!\d)(?:1[89]|20)\d\d\s*(?:[–-]|bis|to|until|à|al|a|tot|und)\s*(?:(?:dem |el |il )?(?:1[89]|20)\d\d)(?!\d)/u;
const HISTORY_HEADING = /Geschichte|History|Geschiedenis|Histoire|Historia|Storia/i;
const BUILT_BY = {
  de: /(?<!\p{L})(?:hat|haben) (?:sie|ihn|es|\p{Lu}[\p{L}-]+(?: \p{Lu}[\p{L}-]+)*) (?:(?:1[89]|20)\d\d )?gebaut(?!\p{L})|^Gebaut (?:hat|haben)(?!\p{L})/u,
  en: /(?<!\p{L})(?:built|made) (?:it |her |them )?(?:in (?:1[89]|20)\d\d )?by (?:\p{Lu}|the )/u,
};

/** The caveat is about every ride (`jede Bahn im Freien`), not one parade. */
const EVERY =
  /(?<!\p{L})(?:jede\p{L}*|alle|beiden|sämtliche|any|every|all|both|elke|beide|toute?s?|chaque|les deux|cualquier|todas?|todos|ambos|ogni|tutt[ei]|entrambi)(?!\p{L})/iu;
const WEATHER_CAVEAT = {
  de: /(?<!\p{L})bei (?:schlechtem|extremem|starkem|zu starkem) (?:Wetter|Wind)(?!\p{L})[^.]*?(?:schließen|ausfallen|geschlossen|pausieren)/iu,
  en: /(?<!\p{L})(?:in|during) (?:bad|extreme|severe) weather(?!\p{L})[^.]*?(?:close|shut|stop|pause)/iu,
  nl: /(?<!\p{L})bij (?:slecht|extreem) weer(?!\p{L})[^.]*?(?:sluiten|dicht|stil)/iu,
  fr: /(?<!\p{L})(?:par|en cas de) (?:mauvais temps|météo extrême|intempéries)(?!\p{L})[^.]*?(?:ferm|arrêt)/iu,
  es: /(?<!\p{L})con (?:mal tiempo|tiempo extremo)(?!\p{L})[^.]*?(?:cerrar|cierra|parar)/iu,
  it: /(?<!\p{L})(?:con|in caso di) (?:maltempo|tempo estremo|meteo estremo)(?!\p{L})[^.]*?(?:chiud|ferm)/iu,
};

/** `, im Europa-Park an 16 Prozent.`: the second half of a pair with its verb left out. */
const PAIR_ELLIPSIS = {
  de: /,\s+(?:im|in der|beim|bei|in|das|der|die)\s+\p{Lu}[\p{L}-]*(?:\s+\p{Lu}[\p{L}-]*)?\s+(?:(?:an|bei|um|mit|nur|sogar|etwa|sind es|waren es)\s+){0,2}?(?:\d[\d.,]*|fast|gut|knapp|kaum|rund)(?:\s+[\p{L}%€.,\d]+){0,4}[.;]?$/u,
  en: /,\s+(?:at|in|for)\s+\p{Lu}[\p{L}-]*(?:\s+\p{Lu}[\p{L}-]*)?\s+(?:(?:on|at|by|with|only|even|about|just)\s+){0,2}?(?:\d[\d.,]*|nearly|just|barely|about)(?:\s+[\p{L}%€£.,\d]+){0,4}[.;]?$/u,
};
const FINITE = {
  de: /(?<!\p{L})(?:ist|sind|war|waren|hat|haben|liegt|liegen|lag|lagen|steht|stehen|stand|standen|kostet|kosten|gibt|gab|fährt|fahren|dauert|dauerte|wartest|stehst|zahlst)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:is|are|was|were|has|had|costs?|stands?|takes?|waits?|queued?|runs?)(?!\p{L})/iu,
};
const ELLIPTIC_PERCENT = {
  de: /,\s+mit \p{L}+ bei \d+(?:,\d+)? Prozent(?!\p{L})|(?<!\p{L})(?:montags|dienstags|mittwochs|donnerstags|freitags|samstags|sonntags) waren es \d+(?:,\d+)? Prozent(?!\p{L})/iu,
  en: /(?<!\p{L})with \p{L}+s at \d+(?:\.\d+)? per ?cent(?!\p{L})/iu,
};
const COMPARATIVE = /(?<!\p{L})(?:länger|kürzer|mehr|weniger|longer|shorter|more|less)(?!\p{L})/iu;

const MONTH_INDEX = {
  de: 'Januar Februar März April Mai Juni Juli August September Oktober November Dezember'.split(
    ' '
  ),
  en: 'January February March April May June July August September October November December'.split(
    ' '
  ),
};
const MONTHS_ALL = {
  de: 'Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember',
  en: 'January|February|March|April|May|June|July|August|September|October|November|December',
  nl: 'januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december',
  fr: 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre',
  es: 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre',
  it: 'gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre',
};
/** A research-day stamp: `Stand 25. September 2026`, `as of 25 September 2026`, `au 25 septembre 2026`. */
const RESEARCH_STAMP = {
  de: new RegExp(`(?<!\\p{L})Stand:?\\s(?:\\d{1,2}[._]\\s)?(?:${MONTHS_ALL.de})\\s20\\d\\d`, 'u'),
  en: new RegExp(
    `(?<!\\p{L})as of (?:\\d{1,2} )?(?:${MONTHS_ALL.en}) (?:\\d{1,2}, )?20\\d\\d`,
    'iu'
  ),
  nl: new RegExp(`(?<!\\p{L})stand:? (?:\\d{1,2} )?(?:${MONTHS_ALL.nl}) 20\\d\\d`, 'iu'),
  // `du 1er au 25 septembre` is a range and stays.
  fr: new RegExp(
    `(?<!\\bdu [^,;()]{1,25})(?:\\(|, |^)(?:au|état au) \\d{1,2}(?:er)? (?:${MONTHS_ALL.fr}) 20\\d\\d`,
    'iu'
  ),
  es: new RegExp(`\\((?:a|a fecha de) (?:\\d{1,2} de )?(?:${MONTHS_ALL.es}) de 20\\d\\d\\)`, 'iu'),
  it: new RegExp(
    `(?<!\\bdal [^,;()]{1,25})(?:\\(|, |^)(?:al|aggiornato al) \\d{1,2}°? (?:${MONTHS_ALL.it}) 20\\d\\d`,
    'iu'
  ),
};
/** A time of day right after the date: `um 22 Uhr`, `gegen Mittag`, `at noon`. */
const CLOCK_AFTER = {
  de: /^[^.]{0,25}?(?<!\p{L})(?:um \d{1,2}(?:[.:]\d\d)? Uhr|gegen (?:Mittag|Abend|\d{1,2})|mittags|abends|morgens|am (?:Mittag|Abend|Morgen|Nachmittag|Vormittag))(?!\p{L})/iu,
  en: /^[^.]{0,25}?(?<!\p{L})(?:at \d{1,2}(?:[.:]\d\d)?\s?(?:am|pm|h)?|at noon|around noon|at midday|in the (?:morning|afternoon|evening))(?!\p{L})/iu,
};

const BROCHURE_SPAN = {
  de: /(?<!\p{L})von (?:der|dem|einer|einem) (?:\p{Ll}+ )?\p{Lu}\p{L}+ (?:\p{L}+ ){0,3}?bis (?:zum|zur|zu einer|zu einem) (?:\p{Ll}+ )?\p{Lu}\p{L}+/u,
  en: /(?<!\p{L})from an? (?:\p{L}+ ){1,3}?to an? (?:\p{L}+ ){0,3}?\p{L}+/u,
};

/** `von der Öffnung bis zum Abend` is a span of the day, not a catalogue. */
const DAY_SPAN =
  /(?<!\p{L})(?:Öffnung|Eröffnung|Schließung|Morgen|Vormittag|Mittag|Nachmittag|Abend|Anfang|Ende|Start|Einlass|opening|closing|morning|noon|afternoon|evening|start|end)(?!\p{L})/iu;
const RECORD_TRIPLE = {
  de: /(?<!\p{L})(?:höchste|schnellste|längste)n?,?\s+(?:und\s+)?(?:höchste|schnellste|längste)n?,?\s+(?:und\s+)?(?:höchste|schnellste|längste)n?(?!\p{L})|(?<!\p{L})(?:alle(?:n)?|dieselben|die gleichen) drei (?:Rekorde|Zahlen)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:fastest|tallest|longest|highest),?\s+(?:and\s+)?(?:fastest|tallest|longest|highest),?\s+(?:and\s+)?(?:fastest|tallest|longest|highest)(?!\p{L})|(?<!\p{L})(?:all|the same) three records(?!\p{L})/iu,
};
const NAME_HISTORY = {
  de: /(?<!\p{L})(?:hieß (?:sie|er|es) bis|bis (?:(?:1[89]|20)\d\d|zum Jahr \d{4}) hieß|benannt (?:ist|wurde) (?:\p{L}+ ){0,6}?nach|hieß früher)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:until (?:1[89]|20)\d\d it was called|(?:is|was) named after)(?!\p{L})/iu,
};
const SINCE = {
  de: /(?<!\p{L})(?:ist|hält|fährt|steht|läuft|gilt) (?:\p{L}+ ){0,2}?seit (?:\d|dem |Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/iu,
  en: /(?<!\p{L})has (?:held|been (?:running|open|operating)|run|stood) (?:[^.]{0,50}? )?since(?!\p{L})/iu,
};
const SAME_PARK = {
  de: /(?<!\p{L})im (?:selben|gleichen) Park(?!\p{L})/iu,
  en: /(?<!\p{L})(?:in|at) the same park(?!\p{L})/iu,
  nl: /(?<!\p{L})in hetzelfde park(?!\p{L})/iu,
  fr: /(?<!\p{L})dans le même parc(?!\p{L})/iu,
  es: /(?<!\p{L})en el mismo parque(?!\p{L})/iu,
  it: /(?<!\p{L})nello stesso parco(?!\p{L})/iu,
};
const CALLS_IT_SUPERLATIVE = {
  de: /(?<!\p{L})nennt (?:sie|ihn|es)\s(?:[^.]{0,40}\s)?(?:die|den|das) (?:höchste|längste|schnellste|steilste|größte|erste|einzige)n?(?!\p{L})/iu,
  en: /(?<!\p{L})calls (?:it|her|them) (?:the )?(?:[^.]{0,30}\s)?(?:tallest|longest|fastest|steepest|biggest|largest|first|only|most)(?!\p{L})/iu,
};
const SUPERLATIVE_LOW = {
  de: /(?<!\p{L})am (?:günstigsten|wenigsten|billigsten|leersten|kürzesten|niedrigsten|ruhigsten)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:the cheapest|the least|the quietest|the shortest|the lowest)(?!\p{L})/iu,
};
const SUPERLATIVE_HIGH = {
  de: /(?<!\p{L})am (?:teuersten|meisten|vollsten|längsten|höchsten)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:the most expensive|the most|the busiest|the longest|the highest)(?!\p{L})/iu,
};

const NEGATION_REVEAL = {
  de: /(?<!\p{L})ist (?:es |sie |er )?(?:keine?n?|nicht)\s[^.!?]{1,40}[.]\s+(?:Es|Sie|Er|Das) ist(?!\p{L})|(?<!\p{L})ist es kein\p{L}*\s[^.!?]{1,40},\s+sondern(?!\p{L})/u,
  en: /(?<!\p{L})(?:is(?:n['’]t| not) an?|it['’]s not an?)\s[^.!?]{1,40}[.]\s+It(?:['’]s| is)(?!\p{L})/u,
};
/** A proper name in the reveal's second half; German nouns are capitalised, so one after a verb. */
const NAMED = {
  de: /(?:^|(?<!\p{L})(?:ist|sind|heißt|von|nach)\s)\p{Lu}|\p{Lu}[\p{L}-]*\s+\p{Lu}/u,
  en: /(?<=\s)\p{Lu}/u,
};
const FROM_TO_MIRROR = {
  de: /(?<!\p{L})von\s[^.,]{1,40}?\s(?:zu|zum|zur|nach)\s[^.]{1,40}?\sund\s+von\s[^.,]{1,40}?\s(?:zu|zum|zur|nach)\s/iu,
  en: /(?<!\p{L})from\s[^.,]{1,40}?\sto\s[^.]{1,40}?\sand\s+(?:from\s)[^.,]{1,40}?\sto\s/iu,
};
const QUEUE_COMPARISON_CLOSE = {
  de: /(?<!\p{L})(?:stehst|steht|stehen) (?:du |man )?(?:dort |da |hier )?(?:kürzer|länger|ähnlich lange?|halb so lange?|doppelt so lange?|genauso lange?)\s(?:[^.]{0,40}\s)?an[.!]?$/iu,
  en: /(?<!\p{L})you (?:queue|wait) (?:less|longer|about as long|half as long|twice as long|just as long)\b[^.]{0,40}[.!]?$/iu,
};
const DASH_EXPLAINED = {
  de: /(?<!\p{L})(?:Strich (?:heißt|bedeutet)|(?:steht|stehen) (?:dort |da |in der Tabelle )?(?:ein |zwei )?Striche?|ein Strich steht)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:a dash (?:means|stands for)|(?:shows?|there is) a dash)(?!\p{L})/iu,
};
/** With its verb: `passer d’un parc à l’autre` is a walk between two parks, not the tautology. */
const PARK_TO_PARK = {
  de: /(?<!\p{L})(?:(?:unterscheide\p{L}*|variiert|wechselt|anders|verschieden|ein anderer|eine andere)\s(?:[^.]{0,30}\s)?von Park zu Park|von Park zu Park (?:verschieden|unterschiedlich|anders|ein anderer|eine andere))(?!\p{L})/iu,
  en: /(?<!\p{L})(?:differs?|vary|varies|changes?) (?:[^.]{0,20} )?from park to park(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:verschilt|varieert) (?:[^.]{0,20} )?van park tot park(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:varie|diffère|change)(?:nt)? (?:[^.]{0,20} )?d['’]un parc à l['’]autre(?!\p{L})/iu,
  es: /(?<!\p{L})(?:varía|cambia|difiere)(?:n)? (?:[^.]{0,20} )?de un parque a otro(?!\p{L})/iu,
  it: /(?<!\p{L})(?:varia|cambia|differisce)(?:no)? (?:[^.]{0,20} )?da (?:un )?parco a(?:ll['’]altro| parco)(?!\p{L})/iu,
};

/** A measurement in a caption: the figure and its unit. */
const MEASURE =
  /\d+(?:[.,]\d+)?\s?(?:cm|m|km\/h|km|Zentimetern?|Metern?|metres?|meters?|mètres?|metri|metros|centimetres?|centimeters?)(?!\p{L})/giu;

const headings = (bs, minLevel = 2, maxLevel = 3) =>
  bs.filter((b) => b.kind === 'heading' && b.level >= minLevel && b.level <= maxLevel);

/**
 * One entry per pattern. `run(ctx)` returns the matching passages, `min` is how many a post may
 * carry before the warning fires. `ctx` is `{ bs, locale, fields, raw }`: the blocks of the post,
 * its language, the frontmatter's plain-text fields as `[name, value]` pairs, and the file itself.
 */
export const SLOP_RULES = [
  {
    id: 'origin-refrain',
    section: '§2.20 #1',
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      const finals = paragraphs(bs).map((b) => lastSentence(b.text));
      const normal = (s) => s.toLowerCase().replace(/\d+/g, '#');
      const count = new Map();
      for (const s of finals) count.set(normal(s), (count.get(normal(s)) ?? 0) + 1);
      return finals.filter(
        (s) =>
          RETRIEVAL[locale].test(s) ||
          (wordCount(s) >= 5 && !s.endsWith(':') && count.get(normal(s)) > 1)
      );
    },
  },
  {
    id: 'heading-triple',
    section: '§2.20 #2',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 3,
    run({ bs, locale }) {
      const and = HEADING_AND[locale];
      const split = new RegExp(`(?<!\\d),(?!\\d)\\s*(?:(?:${and})\\s+)?|\\s+(?:${and})\\s+`);
      return headings(bs)
        .map((h) => h.text)
        .filter((text) => {
          if (/[?!.]$/.test(text)) return false;
          const rest = text.replace(/^[^:,]{2,30}:\s+/, '');
          const items = rest.split(split);
          return items.length >= 3 && items.every((i) => i.trim() && wordCount(i) <= 4);
        });
    },
  },
  {
    id: 'name-colon-subheading',
    section: '§2.20 #3',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 4,
    run({ bs }) {
      return headings(bs)
        .map((h) => h.text)
        .filter((text) => /^[^:?]{2,40}\s?:\s\S.{1,50}$/.test(text) && !/[?]$/.test(text));
    },
  },
  {
    id: 'handoff-object-first',
    section: '§2.20 #4',
    // Since PAR-986 also `, die nennt die Rezeption …` and `zeigt die App`; since PAR-990 the
    // object-first opener without a hand-off (`Den Parkschein verkauft der Heide Park …`, German
    // only) when four sentences of a post open that way.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      const handoffs = paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter(
          (s) =>
            HANDOFF[locale].some((re) => re.test(s)) ||
            (locale === 'de' && HANDOFF_RELATIVE.test(s))
        );
      const series =
        locale === 'de'
          ? paragraphs(bs).flatMap((b) =>
              splitSentences(b.text).filter((s) => OBJECT_FIRST.test(s))
            )
          : [];
      return [...handoffs, ...(series.length >= 4 ? series : [])];
    },
  },
  {
    id: 'indirect-question-subject',
    section: '§2.20 #5',
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      // Since PAR-990 also `Welche Wochentage …, haben wir in [Guide] ausgewertet.`
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter(
          (s) => INDIRECT_QUESTION[locale].test(s) || INDIRECT_WE[locale].test(s)
        )
      );
    },
  },
  {
    id: 'widget-announcement',
    section: '§2.20 #6',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs }) {
      return bs
        .filter(
          (b, i) =>
            b.kind === 'para' &&
            isWidget(bs[i + 1]) &&
            /:$/.test(b.text) &&
            wordCount(lastSentence(b.text)) <= 30
        )
        .map((b) => b.text);
    },
  },
  {
    id: 'conditional-opener-series',
    section: '§2.20 #7',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const starts = (b) =>
        splitSentences(b.text).filter((s) => CONDITIONAL[locale].test(s) && !/\?$/.test(s));
      const all = paragraphs(bs).flatMap(starts);
      const dense = paragraphs(bs).filter((b) => starts(b).length >= 3);
      return all.length > 10 ? all : dense.flatMap(starts);
    },
  },
  {
    id: 'catalog-connector-series',
    section: '§2.20 #8',
    locales: ['de', 'en'],
    min: 6,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => CATALOG[locale].test(s))
      );
    },
  },
  {
    id: 'attribution-opener-series',
    section: '§2.20 #9',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const chapters = [[]];
      for (const b of bs) {
        if (b.kind === 'heading' && b.level === 2) chapters.push([]);
        else chapters.at(-1).push(b);
      }
      return chapters.flatMap((chapter) => {
        const hits = paragraphs(chapter).flatMap((b) =>
          splitSentences(b.text).filter((s) => ATTRIBUTION_OPENER[locale].test(s))
        );
        return hits.length > 2 ? hits : [];
      });
    },
  },
  {
    id: 'travel-imperative-close',
    section: '§2.20 #10',
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => TRAVEL_IMPERATIVE[locale].test(s));
    },
  },
  {
    id: 'tautological-because',
    section: '§2.20 #11',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const split = locale === 'de' ? /,?\sweil\s/ : /,?\sbecause\s/i;
      return paragraphs(bs)
        .flatMap((b) => splitSentences(b.text))
        .filter((s) => {
          const [main, because] = s.split(split);
          if (!because) return false;
          const left = new Set(finiteVerbs(main, locale));
          return finiteVerbs(because, locale).some((w) => left.has(w));
        });
    },
  },
  {
    id: 'excerpt-announces-post',
    section: '§2.20 #12',
    locales: ['de', 'en'],
    min: 1,
    run({ fields, locale }) {
      return fields
        .filter(([name]) => name === 'excerpt' || name === 'description')
        .flatMap(([, value]) => splitSentences(value))
        .filter((s) => ANNOUNCES_POST[locale].test(s));
    },
  },
  {
    id: 'count-announcement-opener',
    section: '§2.20 #13',
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => firstSentence(b.text))
        .filter(
          (s) =>
            wordCount(s) <= 7 &&
            COUNT_WORD[locale].test(s) &&
            !MEASURE_WORD.test(s) &&
            !CLOCK_TIME.test(s)
        );
    },
  },
  {
    id: 'data-caveat-close',
    section: '§2.20 #14',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs)
        .filter(
          (b) => MEASURED_DAYS.test(b.text) && CAVEAT_CLOSE[locale].test(lastSentence(b.text))
        )
        .map((b) => lastSentence(b.text));
    },
  },
  {
    id: 'double-attribution',
    section: '§2.20 #15',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) => {
        const list = splitSentences(b.text);
        return list
          .slice(1)
          .map((s, i) =>
            ATTRIBUTION[locale].test(s) && ATTRIBUTION[locale].test(list[i])
              ? `${list[i]} ${s}`
              : null
          )
          .filter(Boolean);
      });
    },
  },
  {
    id: 'range-before-enumeration',
    section: '§2.20 #16',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const text = bs.map((b) => b.text).join('\n');
      const token = (n) => n.replace(/[.,]+$/, '');
      const hits = [];
      for (const m of text.matchAll(RANGE[locale])) {
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 700);
        const numbers = new Set((after.match(/\d[\d.,]*/g) ?? []).map(token));
        if (token(m[1]) !== token(m[2]) && numbers.has(token(m[1])) && numbers.has(token(m[2])))
          hits.push(m[0]);
      }
      return hits;
    },
  },
  {
    id: 'definition-before-glossary',
    section: '§2.20 #17',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs }) {
      return bs
        .filter(
          (b, i) =>
            b.kind === 'para' &&
            isWidget(bs[i + 1], 'glossary-widget') &&
            DEFINES.test(lastSentence(b.text))
        )
        .map((b) => b.text);
    },
  },
  {
    id: 'source-silence-close',
    section: '§2.20 #18',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 3,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => SOURCE_SILENCE[locale].some((re) => re.test(s)))
      );
    },
  },
  {
    id: 'widget-caption-after',
    section: '§2.20 #19',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return bs
        .filter(
          (b, i) => b.kind === 'para' && isWidget(bs[i - 1]) && CAPTION_AFTER[locale].test(b.text)
        )
        .map((b) => firstSentence(b.text));
    },
  },
  {
    id: 'table-summary-before',
    section: '§2.20 #20',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return bs
        .filter(
          (b, i) =>
            b.kind === 'para' &&
            (bs[i + 1]?.kind === 'table' || isWidget(bs[i + 1])) &&
            TABLE_SUMMARY[locale].test(b.text)
        )
        .map((b) => firstSentence(b.text));
    },
  },
  {
    id: 'bet-opener',
    section: '§2.20 #22',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const first = paragraphs(bs)[0];
      return first ? splitSentences(first.text).filter((s) => BET[locale].test(s)) : [];
    },
  },
  {
    id: 'mirrored-good-bad',
    section: '§2.20 #23',
    locales: ['de', 'en'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs)
        .filter((b) => GOOD_WHEN[locale].test(b.text) && BAD_WHEN[locale].test(b.text))
        .map((b) => b.text);
    },
  },
  {
    id: 'appended-reason',
    section: '§2.20 #24',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    caption: true,
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => APPENDED_REASON[locale].test(s))
      );
    },
  },
  {
    id: 'appended-advice',
    section: '§2.20 #25',
    // No Dutch or Spanish formula was quoted, so those two are left to the critic.
    locales: ['de', 'en', 'fr', 'it'],
    caption: true,
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => APPENDED_ADVICE[locale].test(s))
      );
    },
  },
  {
    id: 'link-sentence-close',
    section: '§2.20 #26',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const lastRaw = (b) => splitSentences(b.raw).at(-1) ?? '';
      const series = paragraphs(bs).filter((b) => {
        const s = lastRaw(b);
        return POINTS_TO[locale].test(s) && ENDS_ON_LINK.test(s.trim());
      });
      const count = new Map();
      const linkSentences = paragraphs(bs).flatMap((b) =>
        splitSentences(b.raw).filter((s) => BLOG_LINK.test(s))
      );
      for (const s of linkSentences) count.set(s, (count.get(s) ?? 0) + 1);
      const chapters = [[]];
      for (const b of bs) {
        if (b.kind === 'heading' && b.level === 2) chapters.push([]);
        else chapters.at(-1).push(b);
      }
      const linkOnly = chapters
        .map((c) => c.at(-1))
        .filter((b) => b?.kind === 'para' && LINK_ONLY.test(b.raw.trim()));
      const leads = paragraphs(bs).flatMap((b) =>
        splitSentences(b.raw).filter((s) => LINK_LEADS[locale].test(s.trim()))
      );
      // Since PAR-986 `… steht in unserem [Guide](/blog/…).` twice; since PAR-988 a paragraph
      // that is nothing but pointers, to `/parks/…`, `/compare` and `ref:` pages as well.
      const own = POINTS_TO_OWN[locale]
        ? paragraphs(bs)
            .map((b) => lastRaw(b))
            .filter((s) => POINTS_TO_OWN[locale].test(s) && ENDS_ON_LINK.test(s.trim()))
        : [];
      const pointers = paragraphs(bs).filter((b) => {
        const list = splitSentences(b.raw);
        return list.length >= 2 && list.every((s) => ANY_SITE_LINK.test(s) && POINTER_VERB.test(s));
      });
      // `… stehen auf den Statistikseiten von [A](ref:…) und [B](ref:…).` closing two paragraphs.
      const pairClose = paragraphs(bs)
        .map((b) => lastRaw(b))
        .filter((s) => TWO_PAGES.test(s) && (POINTER_VERB.test(s) || PAGE_WORD.test(s)));
      return [
        // Three since PAR-990, four before.
        ...(series.length >= 3 ? series.map((b) => lastRaw(b)) : []),
        ...(pairClose.length >= 2 ? pairClose : []),
        ...(own.length >= 2 ? own : []),
        ...pointers.map((b) => b.text),
        ...(leads.length >= 2 ? leads : []),
        ...linkSentences.filter((s) => count.get(s) > 1),
        ...(linkOnly.length >= 4 ? linkOnly.map((b) => b.text) : []),
      ];
    },
  },
  {
    id: 'widget-announced-twice',
    section: '§2.20 #27',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const shows = paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => WIDGET_SHOWS[locale].test(s))
      );
      const picks = PICKS_FROM[locale]
        ? bs
            .filter((b, i) => b.kind === 'para' && isWidget(bs[i + 1]))
            .map((b) => lastSentence(b.text))
            .filter((s) => PICKS_FROM[locale].test(s))
        : [];
      return [...(shows.length >= 2 ? shows : []), ...picks];
    },
  },
  {
    id: 'how-teaser',
    section: '§2.20 #28',
    locales: ['de', 'en', 'nl', 'fr'],
    caption: true,
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => HOW_TEASER[locale].test(s) && !/\?$/.test(s))
      );
    },
  },
  {
    id: 'bold-step-labels',
    section: '§2.20 #29',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs }) {
      const hits = [];
      let run = [];
      const close = () => {
        if (run.length >= 3) hits.push(...run);
        run = [];
      };
      for (const b of bs) {
        if (b.kind === 'para' && STEP_LABEL.test(b.raw.trim())) run.push(b.text);
        else close();
      }
      close();
      return hits;
    },
  },
  {
    id: 'own-post-as-proof',
    section: '§2.20 #30',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => OWN_POST_AS_PROOF[locale].test(s))
      );
    },
  },
  {
    id: 'advice-who-series',
    section: '§2.20 #31',
    locales: ['de', 'en', 'nl'],
    min: 4,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => ADVICE_WHO[locale].test(s))
      );
    },
  },
  {
    id: 'not-found-close',
    section: '§2.20 #32',
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => NOT_FOUND_CLOSE[locale].test(s));
    },
  },
  {
    id: 'day-night-mirror',
    section: '§2.20 #33',
    // The critic's comment lists no French formula.
    locales: ['de', 'en', 'nl', 'es', 'it'],
    caption: true,
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        [...new Set([firstSentence(b.text), lastSentence(b.text)])].filter((s) =>
          DAY_NIGHT[locale].test(s)
        )
      );
    },
  },
  {
    id: 'looks-different-colon',
    section: '§2.20 #34',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    caption: true,
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => LOOKS_DIFFERENT[locale].test(s))
      );
    },
  },
  {
    id: 'riddle-title-fraction',
    section: '§2.20 #35',
    // Dutch has no quoted formula.
    locales: ['de', 'en', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, fields, locale }) {
      const titles = fields.filter(([name]) => name === 'title').map(([, value]) => value);
      return [...titles, ...headings(bs).map((h) => h.text)].filter((t) =>
        RIDDLE_FRACTION[locale].test(t)
      );
    },
  },
  {
    id: 'question-catalog-opener',
    section: '§2.20 #36',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter(
          (s) => ASKS_BEFOREHAND[locale].test(s) && (s.match(WHETHER[locale]) ?? []).length >= 3
        )
      );
    },
  },
  {
    id: 'empty-faq-answer',
    section: '§2.20 #37',
    locales: ['de', 'en', 'nl', 'es', 'it'],
    min: 2,
    run({ bs, locale }) {
      return bs
        .map((b, i) => [b, bs[i + 1]])
        .filter(
          ([h, a]) =>
            h.kind === 'heading' && h.level === 3 && /\?$/.test(h.text) && a?.kind === 'para'
        )
        .map(([, a]) => splitSentences(a.text))
        .filter(
          (list) =>
            EMPTY_ANSWER_END[locale].test(list[0]) ||
            (list.length === 1 &&
              wordCount(list[0]) < 6 &&
              !/\d/.test(list[0]) &&
              !YES_NO.test(list[0]))
        )
        .map((list) => list[0]);
    },
  },
  {
    id: 'bold-maxim',
    section: '§2.20 #38',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const edge = (raw) => {
        const r = raw.trim();
        const m =
          r.match(/^\*\*([^*]+[.!?])\*\*(?=\s|$)/) ?? r.match(/(?:^|[.!?]\s)\*\*([^*]+[.!?])\*\*$/);
        return m?.[1] ?? null;
      };
      // German capitalises every noun, so a capital inside the sentence names nothing there.
      const names = (s) =>
        locale !== 'de' &&
        /(?<=\s)\p{Lu}/u.test(s.replace(/^\p{Lu}[^\s]*\s/u, ' ').replace(/[.!?]\s+\p{Lu}/gu, ' '));
      // `**Tickets.** …`, `**Anreise.** …`, `**Essen.** …`: bold lead-ins on neighbouring paragraphs
      // label what each paragraph is about. A maxim stands alone; a lead-in question asks nothing.
      const leadIn = (b) => b?.kind === 'para' && /^\*\*[^*]+\*\*\s+\S/.test(b.raw.trim());
      const label = (b, s) => {
        if (!leadIn(b)) return false;
        const i = bs.indexOf(b);
        return /\?$/.test(s) || leadIn(bs[i - 1]) || leadIn(bs[i + 1]) || LABEL_PREPOSITION.test(s);
      };
      return paragraphs(bs)
        .map((b) => [b, edge(b.raw)])
        .filter(([b, s]) => s && !label(b, s))
        .map(([, s]) => s)
        .filter(
          (s) =>
            s &&
            wordCount(s) >= 4 &&
            wordCount(s) < 15 &&
            !/\d/.test(s) &&
            !/\]\(/.test(s) &&
            !names(s)
        );
    },
  },
  {
    id: 'origin-circle',
    section: '§2.20 #40',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale, fields }) {
      const texts = [
        ...fields.filter(([name]) => name === 'title' || name === 'excerpt').map(([, v]) => v),
        ...bs.filter((b) => b.kind !== 'fence').map((b) => b.text),
      ];
      const sentences = texts.flatMap((t) => splitSentences(t));
      const circle = sentences.filter((s) => WHERE_IT_BEGAN[locale].test(s));
      if (!BEGAN[locale]) return circle;
      // The refrain: the same beginning told four times, and at least three per 1,000 words, so a
      // long history guide with four `begann` in eight chapters stays quiet.
      const began = sentences.filter((s) => s.match(BEGAN[locale]));
      const words = texts.reduce((n, t) => n + wordCount(t), 0);
      const told = began.length >= 4 && (began.length * 1000) / Math.max(words, 1) >= 3;
      return [...new Set([...circle, ...(told ? began : [])])];
    },
  },
  {
    id: 'thanks-either-or',
    section: '§2.20 #41',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => THANKS_EITHER_OR[locale].test(s))
      );
    },
  },
  {
    id: 'imagined-reader-tour',
    section: '§2.20 #42',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs)
        .filter(
          (b) =>
            SOME_OTHERS[locale].test(b.text) &&
            ((b.raw.match(SITE_LINK) ?? []).length >= 2 || A_FEW_MAYBE[locale].test(b.text))
        )
        .map((b) => b.text.match(SOME_OTHERS[locale])[0]);
    },
  },
  {
    id: 'feeling-close',
    section: '§2.20 #43',
    locales: ['de', 'en'],
    min: 3,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => FEELING_CLOSE[locale].test(s));
    },
  },
  {
    id: 'disappoint-teaser',
    section: '§2.20 #44',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => DISAPPOINT_TEASER[locale].test(s))
      );
    },
  },
  {
    id: 'bridge-apposition',
    section: '§2.20 #45',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => BRIDGE_APPOSITION[locale].test(s))
      );
    },
  },
  {
    id: 'contact-form-phrase',
    section: '§2.20 #46',
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => CONTACT_FORM[locale].some((re) => re.test(s)))
      );
    },
  },
  {
    id: 'filler-adverb-pileup',
    section: '§2.20 #47',
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const text = paragraphs(bs)
        .map((b) => b.text)
        .join(' ');
      const words = wordCount(text);
      return FILLER_ADVERBS[locale]
        .map((adverb) => {
          const n = (text.match(new RegExp(`(?<!\\p{L})${adverb}(?!\\p{L})`, 'gu')) ?? []).length;
          return { adverb, n };
        })
        .filter(({ n }) => n >= 4 && (n * 1000) / Math.max(words, 1) >= 4)
        .map(({ adverb, n }) => `${adverb} ${n}× in ${words} words`);
    },
  },
  {
    id: 'faq-echo',
    section: '§2.20 #48',
    // An FAQ answer is read on its own, so one repeated fact is fine; a shared run of eight words
    // or a sentence that is the running text again is a copy. No wordlist, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs, fields }) {
      const { start, answers } = faq(bs);
      if (!answers.length) return [];
      const body = running(bs.slice(0, start));
      const grams = new Set(
        [...body.map((b) => b.text), ...leadFields(fields)].flatMap((t) => [
          ...ngrams(tokens(t), 8),
        ])
      );
      const sentences = body
        .flatMap((b) => splitSentences(b.text))
        .map((s) => new Set(tokens(s)))
        .filter((s) => s.size >= 12);
      // Half the answer's words sit in a run of eight shared with the text, or one long sentence
      // is a body sentence again with a word or two changed. The hit is that sentence.
      const sharesRun = (s) => [...ngrams(tokens(s), 8)].some((g) => grams.has(g));
      const copied = (a) => {
        const t = tokens(a);
        const covered = new Set();
        for (let i = 0; i + 8 <= t.length; i++)
          if (grams.has(t.slice(i, i + 8).join(' ')))
            for (let j = i; j < i + 8; j++) covered.add(j);
        return t.length >= 8 && covered.size / t.length >= 0.5;
      };
      const twin = (s) => {
        const t = new Set(tokens(s));
        return t.size >= 12 && sentences.some((u) => jaccard(t, u) >= 0.8);
      };
      return (
        answers
          // A one-sentence answer with a figure is the one fact §5.4 lets an answer repeat.
          .filter((a) => !(splitSentences(a).length === 1 && /\d/.test(a)))
          .map((a) => {
            const list = splitSentences(a);
            if (copied(a)) return list.find(sharesRun) ?? list[0];
            return list.find(twin) ?? null;
          })
          .filter(Boolean)
      );
    },
  },
  {
    id: 'faq-table-echo',
    section: '§2.20 #49',
    // An answer that reads out a table: five of its figures stand in one column, taken from
    // three rows and half the column or more, and they are three quarters of all it carries; the
    // cheapest and dearest of ten packages is an answer, not a read-out. Years, the day of a
    // date and the number in a product's name (`Express Pass 4`) are not figures, and one or two
    // shared figures are the single fact an answer read on its own may repeat.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs }) {
      // One column of one table, cell by cell: a column read out row after row.
      const columns = bs
        .filter((b) => b.kind === 'table')
        .flatMap((b) => {
          const body = b.rows.slice(1);
          const width = Math.max(0, ...body.map((r) => r.length));
          return [...Array(width).keys()].map((c) =>
            body.map((r) => new Set(tableFigures(r[c] ?? '')))
          );
        });
      return faq(bs)
        .answers.filter((a) => {
          const own = [...new Set(tableFigures(a))];
          return columns.some((rows) => {
            const shared = own.filter((n) => rows.some((r) => r.has(n)));
            const fromRows = rows.filter((r) => shared.some((n) => r.has(n))).length;
            const filled = rows.filter((r) => r.size).length;
            return (
              shared.length >= 5 &&
              fromRows >= 3 &&
              fromRows * 2 >= filled &&
              shared.length / own.length >= 0.75
            );
          });
        })
        .map((a) => firstSentence(a));
    },
  },
  {
    id: 'table-cells-in-prose',
    section: '§2.20 #50',
    // Three ways a paragraph reads out the table or list below it: four text cells of one
    // column, the first and last row named in a two-sentence intro (twice per post), or three
    // list entries. A paragraph under the table that works with its rows (`Angenommen, dein Kind
    // ist sechs …`) is the reason for the table, and a spec list itself is never the hit.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs }) {
      const column = [];
      const edges = [];
      const list = [];
      // A paragraph with a count the table does not hold (`Sieben davon im Bereich Fantasy`)
      // sums the table up, it does not read it out.
      const newCount = (b, next) => {
        const held = new Set(figures(next.text));
        return figures(b.text).some((n) => !held.has(n)) || COUNT_WORD_ANY.test(b.text);
      };
      bs.forEach((b, i) => {
        if (b.kind !== 'para' || (bs[i + 1] && newCount(b, bs[i + 1]))) return;
        for (const t of [bs[i + 1]].filter((n) => n?.kind === 'table')) {
          const body = t.rows.slice(1);
          const width = Math.max(0, ...body.map((r) => r.length));
          for (let c = 0; c < width; c++) {
            const values = new Set(
              body.map((r) => r[c] ?? '').filter((v) => v.length >= 3 && !/\d/.test(v))
            );
            if ([...values].filter((v) => b.text.includes(v)).length >= 4) {
              column.push(firstSentence(b.text));
              break;
            }
          }
        }
        const next = bs[i + 1];
        if (next?.kind === 'table' && next.rows.length >= 4 && splitSentences(b.text).length <= 2) {
          const [first, last] = [next.rows[1][0], next.rows.at(-1)[0]];
          if (first && last && first !== last && b.text.includes(first) && b.text.includes(last))
            edges.push(b.text);
        }
        if (next?.kind === 'list') {
          const names = next.src
            .filter((l) => /^\s*(?:[-*+]|\d+\.)\s/.test(l))
            .map((l) =>
              plain(l.replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))
                .split(/[:,(–]/)[0]
                .trim()
            )
            .filter((n) => n.length >= 3 && /^\p{Lu}/u.test(n));
          if (names.filter((n) => b.text.includes(n)).length >= 3) list.push(lastSentence(b.text));
        }
      });
      return [...column, ...(edges.length >= 2 ? edges : []), ...list];
    },
  },
  {
    id: 'fact-refrain',
    section: '§2.20 #51',
    // A figure and the three words after it (`365 Tagen im Jahr`) in three sections: the excerpt
    // and the `##` chapters. The FAQ is left out, since an answer is read on its own; a date is
    // not a fact repeated, and a measurement (`130 cm plus sieben`) is a ride's minimum height,
    // which the guides owe the reader in every chapter that names the ride.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, fields }) {
      const { start } = faq(bs);
      const sections = [
        leadFields(fields).join(' '),
        ...chaptersOf(bs.slice(0, start)).map((c) =>
          running(c.blocks)
            .map((b) => b.text)
            .join(' ')
        ),
      ];
      const seen = new Map();
      sections.forEach((text, i) => {
        const t = tokens(text);
        for (let j = 0; j + 3 < t.length; j++) {
          if (!/^\d/.test(t[j]) || /^(?:1[89]|20)\d\d$/.test(t[j])) continue;
          if (!t.slice(j + 1, j + 4).every((w) => /^\p{L}/u.test(w))) continue;
          if (t.slice(j + 1, j + 4).some((w) => MONTH_WORD.test(w) || UNIT_WORD.test(w))) continue;
          const key = t.slice(j, j + 4).join(' ');
          if (!seen.has(key)) seen.set(key, new Set());
          seen.get(key).add(i);
        }
      });
      return [...seen].filter(([, s]) => s.size >= 3).map(([k]) => k);
    },
  },
  {
    id: 'preposition-name-opener',
    section: '§2.20 #52',
    // `Im PortAventura Park … Im Gardaland … Bei Walibi`, `At Europa-Park … At Efteling`: more
    // than half the sentences of a paragraph of four, three paragraphs in a row, or one pair
    // opening a fifth of all paragraphs. The name must be a park or ride the post links (a link
    // text or target, a frontmatter list), since German capitalises `Im Schnitt` and `Bei
    // Regen` too. The FAQ is read answer by answer, and a widget or table ends a run. The
    // prepositions are short, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale, raw }) {
      const known = linkedNames(raw);
      const opener = (s) => {
        const m = s.match(PREP_NAME[locale]);
        if (!m || TIME_WORD.test(m[1])) return null;
        const name = m[1].toLowerCase();
        return known.words.has(name) ||
          (name.length >= 4 && known.slugs.some((slug) => slug.startsWith(name)))
          ? m[0]
          : null;
      };
      const body = bs.slice(0, faq(bs).start);
      const dense = paragraphs(body)
        .map((b) => splitSentences(b.text))
        .filter((l) => l.length >= 4 && l.filter(opener).length * 2 > l.length)
        .map((l) => l.find(opener));
      const inRow = [];
      let run = [];
      for (const b of body) {
        if (b.kind === 'para' && opener(b.text)) run.push(firstSentence(b.text));
        else if (b.kind !== 'list' && b.kind !== 'quote') {
          if (run.length >= 3) inRow.push(...run);
          run = [];
        }
      }
      if (run.length >= 3) inRow.push(...run);
      const opens = paragraphs(body).map((b) => opener(b.text));
      const count = new Map();
      for (const o of opens.filter(Boolean)) count.set(o, (count.get(o) ?? 0) + 1);
      const share = [...count].filter(([, n]) => n >= 4 && n / opens.length > 0.2).map(([o]) => o);
      return [...new Set([...dense, ...inRow, ...share])];
    },
  },
  {
    id: 'origin-tour',
    section: '§2.20 #53',
    // `Aus Italien hält … Aus Spanien fliegst du …`: a sentence per country of origin, twice in a
    // paragraph or opening three paragraphs in a row. The travel chapter the templates ask for
    // (`Anreise aus Deutschland`) is exempt, and so are headings. Short formula, every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const hits = [];
      let run = [];
      let travel = [false, false];
      const close = () => {
        if (run.length >= 3) hits.push(...run);
        run = [];
      };
      for (const b of bs) {
        if (b.kind === 'heading') {
          if (b.level <= 2) travel = [TRAVEL_HEADING.test(b.text), false];
          else travel[1] = TRAVEL_HEADING.test(b.text);
          close();
          continue;
        }
        if (b.kind !== 'para') continue;
        if (travel[0] || travel[1]) {
          close();
          continue;
        }
        const origins = splitSentences(b.text).filter(
          (s) => ORIGIN[locale].test(s) && TRAVEL_WORD.test(s)
        );
        if (origins.length >= 2) hits.push(...origins);
        if (ORIGIN[locale].test(b.text)) run.push(firstSentence(b.text));
        else close();
      }
      close();
      return [...new Set(hits)];
    },
  },
  {
    id: 'recomputed-difference',
    section: '§2.20 #54',
    // `Der Ultimate ist also 3 € billiger` after 80 € and 83 €: the reader's subtraction done for
    // them, from two figures in the same paragraph or the table next to it. Since the critic's
    // run of 2026-10-22 also without a comparative, as a conclusion (`der zweite Tag also 60 bis
    // 67,50 €`, `which puts … at`, `dus`, `donc`, `o sea`, `quindi`), where every figure of it is
    // such a difference. The comparatives are German and English, the conclusion all six.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const hits = [];
      bs.forEach((b, i) => {
        if (b.kind !== 'para') return;
        const tables = [bs[i - 1], bs[i + 1]].filter((n) => n?.kind === 'table');
        const pool = (without, skip) =>
          [
            ...b.text.replace(without, ' ').matchAll(/\d+(?:[.,]\d+)*/g),
            ...tables.flatMap((t) => [...t.text.matchAll(/\d+(?:[.,]\d+)*/g)]),
          ]
            .map((x) => toNumber(x[0], locale))
            .filter((x) => !skip.includes(x) && Number.isFinite(x));
        const isDifference = (n, figures) =>
          n >= 2 && figures.some((a) => figures.some((c) => Math.abs(a - c - n) < 1e-9));
        for (const s of splitSentences(b.text)) {
          for (const m of DIFFERENCE[locale] ? s.matchAll(DIFFERENCE[locale]) : []) {
            const n = toNumber(m[1], locale);
            if (isDifference(n, pool(m[0], [n]))) hits.push(s);
          }
          for (const m of s.matchAll(SO_DIFFERENCE[locale])) {
            // A sum has a unit; `also am 2., 3., 9. Oktober` and `donc de 18 jours` are counts.
            const tail = s.slice(m.index, m.index + m[0].length + 12);
            if (!SUM_UNIT.test(tail)) continue;
            const said = [m[1], m[2]]
              .filter(Boolean)
              .map((x) => toNumber(x.replace('_', locale === 'en' ? '.' : ','), locale));
            const figures = pool(m[0], said);
            if (said.every((n) => isDifference(n, figures))) hits.push(s);
          }
        }
      });
      return [...new Set(hits)];
    },
  },
  {
    id: 'verdict-opener',
    section: '§2.20 #55',
    // `Paris wins on shows`, `Für Achterbahnen ist Rust das bessere Ziel.`, `Der Parc Astérix hat
    // die meisten Ticketarten.`: a scoreboard line as the first sentence of chapter after chapter.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return bs
        .map((b, i) => [b, bs.slice(i + 1).find((n) => n.kind !== 'fence')])
        .filter(
          ([h, p]) => h.kind === 'heading' && h.level >= 2 && h.level <= 3 && p?.kind === 'para'
        )
        .map(([, p]) => firstSentence(p.text))
        .filter(
          (s) =>
            SCOREBOARD[locale].test(s) || (SUPERLATIVE_TOPIC[locale].test(s) && wordCount(s) <= 8)
        );
    },
  },
  {
    id: 'among-them-series',
    section: '§2.20 #56',
    // `among them A, B, C and D` as the shape of every chapter. One per chapter is a list;
    // four per post is the template. A short formula in every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 4,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        [...b.text.matchAll(AMONG_THEM[locale])].map((m) => m[0])
      );
    },
  },
  {
    id: 'closing-refrain',
    section: '§2.20 #57',
    // Paragraph ends that rhyme: three ending on a short negation (`braucht dafür keinen Pass`,
    // `, und reservieren lässt sich keiner.`), or three on the same last three words with the
    // counts evened out (`ab dem dritten Besuch`). The negation needs a wordlist (de, en); the
    // last-words refrain does not.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const finals = paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => !/[?:]$/.test(s));
      const negations = NEGATION_END[locale]
        ? finals.filter((s) => NEGATION_END[locale].test(s.split(/,\s+/).at(-1)))
        : [];
      const tail = (s) =>
        tokens(s)
          .slice(-3)
          .map((w) => (COUNTING_WORD.test(w) ? '#' : w))
          .join(' ');
      // A sentence with a figure is a spec line (`ab 90 Zentimetern`, `or 90 cm with an adult`)
      // the guide owes the reader, and a line without a full stop is a label over a widget.
      const count = new Map();
      // `kommt auf 142 km/h.` three times is a speed list; the refrain needs a word of five letters.
      const counts = (s) =>
        wordCount(s) >= 5 &&
        /[.!]$/.test(s) &&
        !/\d/.test(s) &&
        tail(s)
          .split(' ')
          .some((w) => w.length >= 5);
      for (const s of finals) if (counts(s)) count.set(tail(s), (count.get(tail(s)) ?? 0) + 1);
      return [
        ...(negations.length >= 3 ? negations : []),
        ...finals.filter((s) => counts(s) && count.get(tail(s)) >= 3),
      ];
    },
  },
  {
    id: 'cost-per-duration',
    section: '§2.20 #58',
    // `für die gut zwei Minuten Fahrt nennt der Park Kosten von 50 Millionen Euro`: a price set
    // against the length of the ride, which compares nothing. German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => COST_PER_DURATION[locale].test(s))
      );
    },
  },
  {
    id: 'mirrored-park-intro',
    section: '§2.20 #59',
    // `Der Europa-Park in Rust hat am 12. Juli 1975 eröffnet …` / `Das Efteling in Kaatsheuvel
    // hat am 31. Mai 1952 … eröffnet`: two paragraphs in a row open on a park's opening date
    // (§2.7). The opening verb is one word per locale, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const opens = (b) => {
        const s = b?.kind === 'para' ? firstSentence(b.text) : '';
        return PARK_IN_TOWN.test(s) && OPENED[locale].test(s) && YEAR.test(s) ? s : null;
      };
      return bs.flatMap((b, i) =>
        opens(b) && opens(bs[i + 1]) ? [`${opens(b)} ${opens(bs[i + 1])}`] : []
      );
    },
  },
  {
    id: 'appended-source',
    section: '§2.20 #60',
    // `…, so steht es auf seiner Website.`: the source hung on the end of the sentence, twice.
    locales: ['de', 'en'],
    caption: true,
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => APPENDED_SOURCE[locale].test(s))
      );
    },
  },
  {
    id: 'never-had-like-it',
    section: '§2.20 #61',
    // `Efteling has never had a ride like it.`: a novelty asserted instead of named.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => NEVER_LIKE_IT[locale].test(s))
      );
    },
  },
  {
    id: 'verdict-close-series',
    section: '§2.20 #62',
    // `Für ein paar Stunden am Abend würde ich das Abendticket nehmen.`: three `##` chapters that
    // end on the author's pick. German, English and Dutch.
    locales: ['de', 'en', 'nl'],
    min: 3,
    run({ bs, locale }) {
      return chaptersOf(bs)
        .map((c) => paragraphs(c.blocks).at(-1))
        .filter(Boolean)
        .map((b) => lastSentence(b.text))
        .filter((s) => VERDICT_CLOSE[locale].test(s));
    },
  },
  {
    id: 'spec-sheet-chain',
    section: '§2.20 #63',
    // `Taron von Intamin fährt seit 2016 …`: four sentences of one paragraph that each pair a
    // manufacturer with a year (any locale, the names are names), or the builder told in the same
    // formula three times (`hat sie 1997 gebaut`, `Gebaut hat sie …`; de, en). A spec list, a
    // table or one ride's data is not a hit. Under a history heading, or where two of the
    // sentences close a span of years (`fuhr von 1966 bis 1979`), the rides of the past are the
    // subject, so the chain needs five sentences there.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      let history = false;
      const chains = bs.flatMap((b) => {
        if (b.kind === 'heading') history = HISTORY_HEADING.test(b.text);
        if (b.kind !== 'para') return [];
        const list = splitSentences(b.text).filter((s) => MANUFACTURER.test(s) && YEAR.test(s));
        // `fuhr von 1966 bis 1979`: rides that are gone are history whatever the heading says.
        const past = history || list.filter((s) => CLOSED_SPAN.test(s)).length >= 2;
        return list.length >= (past ? 5 : 4) ? list : [];
      });
      const built = BUILT_BY[locale]
        ? paragraphs(bs).flatMap((b) =>
            splitSentences(b.text).filter((s) => BUILT_BY[locale].test(s))
          )
        : [];
      return [...chains, ...(built.length >= 3 ? built : [])];
    },
  },
  {
    id: 'weather-caveat',
    section: '§2.20 #64',
    // `Bei extremem Wetter kann in beiden Parks jede Bahn im Freien vorübergehend schließen.`:
    // true of every park on earth, so it says nothing about this one.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => WEATHER_CAVEAT[locale].test(s) && EVERY.test(s))
      );
    },
  },
  {
    id: 'pair-ellipsis',
    section: '§2.20 #65',
    // `im Phantasialand an 22 Prozent der Öffnungstage …, im Europa-Park an 16 Prozent`: the
    // second park's half without its verb, six times a post; and `with Sundays at 36 per cent`
    // with no word saying what the figure is more or less than, once. German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const sentences = paragraphs(bs).flatMap((b) => splitSentences(b.text));
      const pairs = sentences.filter((s) => {
        const m = s.match(PAIR_ELLIPSIS[locale]);
        return m && !FINITE[locale].test(m[0]);
      });
      const percent = sentences.filter((s) => {
        const m = s.match(ELLIPTIC_PERCENT[locale]);
        return m && !COMPARATIVE.test(s.slice(Math.max(0, m.index - 40), m.index + m[0].length));
      });
      return [...(pairs.length >= 6 ? pairs : []), ...percent];
    },
  },
  {
    id: 'publish-day-snapshot',
    section: '§2.20 #66',
    // `am 22. Oktober um 22 Uhr` in a post dated 22 October: what the author saw that evening,
    // outside a `Stand …:` stamp. The month names are a wordlist, so German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale, raw }) {
      const date = raw.match(/^date:\s*['"]?(\d{4})-(\d\d)-(\d\d)/m);
      if (!date) return [];
      const [day, month] = [Number(date[3]), MONTH_INDEX[locale][Number(date[2]) - 1]];
      const said =
        locale === 'de'
          ? new RegExp(`(?<!\\d)${day}[._][\\s\\u00a0]+${month}(?!\\p{L})`, 'gu')
          : new RegExp(
              `(?<!\\d)(?:${day}(?:st|nd|rd|th)? ${month}|${month} ${day}(?:st|nd|rd|th)?)(?!\\d)`,
              'gu'
            );
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) =>
          [...s.matchAll(said)].some(
            (m) =>
              CLOCK_AFTER[locale].test(s.slice(m.index + m[0].length)) &&
              !/(?:Stand|As of)\s*$/i.test(
                s.slice(0, m.index).trim().split(/\s+/).slice(-1)[0] ?? ''
              )
          )
        )
      );
    },
  },
  {
    id: 'research-stamp',
    section: '§2.20 #83',
    // `(Stand 25. September 2026)`, `as of 25 September 2026`: the day somebody looked, in running
    // text or the source list (§3.3, rules 15 and 21). A stamp that ends the paragraph right above
    // a table dates the table and stays; so do quotes and corrections, which are not paragraphs.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return bs.flatMap((b, i) => {
        if (b.kind !== 'para' && b.kind !== 'list') return [];
        if (b.kind === 'para' && /:\s*$/.test(b.text) && bs[i + 1]?.kind === 'table') return [];
        return splitSentences(b.text).filter((s) => RESEARCH_STAMP[locale].test(s));
      });
    },
  },
  // #67 is retired: `rulebook-example` flagged a post that took the wording docs/blog.md
  // recommends, which is what the rulebook is for.
  {
    id: 'brochure-span',
    section: '§2.20 #68',
    // `von der spanischen Finca bis zum Leuchtturm aus Neuengland`: a range with no figure in it,
    // the brochure's way of saying "a lot". German and English.
    locales: ['de', 'en'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => {
          const m = s.match(BROCHURE_SPAN[locale]);
          return m && !/\d/.test(m[0]) && !DAY_SPAN.test(m[0]);
        })
      );
    },
  },
  {
    id: 'record-triple',
    section: '§2.20 #69',
    // `die höchste, schnellste und längste`, `holds all three records`: the record triple as a
    // formula, three times a post. Two superlatives are a fact; a post whose title or tags are
    // about records has the triple as its subject. German and English.
    locales: ['de', 'en'],
    min: 3,
    run({ bs, locale, fields, raw }) {
      const title = fields
        .filter(([n]) => n === 'title')
        .map(([, v]) => v)
        .join(' ');
      const tags = raw.match(/^tags:\n((?:\s+-.*\n)+)/m)?.[1] ?? '';
      if (/rekord|record|récord|recorde/i.test(`${title} ${tags}`)) return [];
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => RECORD_TRIPLE[locale].test(s))
      );
    },
  },
  {
    id: 'name-history-series',
    section: '§2.20 #70',
    // `Bis 2004 hieß sie Wild Wild West`, `benannt ist sie nach einem Mond des Saturn`: the name's
    // history for ride after ride. German and English.
    locales: ['de', 'en'],
    min: 3,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => NAME_HISTORY[locale].test(s))
      );
    },
  },
  {
    id: 'since-template',
    section: '§2.20 #71',
    // `has held all three Dutch records since 2002`, `has been running since August 2018`: four
    // and three per 1,000 words, so a history post with four in 3,000 words stays quiet.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const text = paragraphs(bs).map((b) => b.text);
      // `seit dem 5. Oktober und noch bis zum 31. Oktober` is a period, not the template.
      const period =
        /(?<!\p{L})(?:seit|since)(?!\p{L})[^.]*(?<!\p{L})(?:bis|until|till)(?!\p{L})/iu;
      const hits = text.flatMap((t) =>
        splitSentences(t).filter((s) => SINCE[locale].test(s) && !period.test(s))
      );
      const words = wordCount(text.join(' '));
      return hits.length >= 4 && (hits.length * 1000) / Math.max(words, 1) >= 3 ? hits : [];
    },
  },
  {
    id: 'same-park-template',
    section: '§2.20 #72',
    // `The longest is Katun in the same park`: three per post. Every locale has the phrase.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 3,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => SAME_PARK[locale].test(s))
      );
    },
  },
  {
    id: 'calls-it-superlative',
    section: '§2.20 #73',
    // `Europa-Park calls it the launch coaster with the most inversions in the world`: the park's
    // superlative quoted, twice a post. German and English.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => CALLS_IT_SUPERLATIVE[locale].test(s))
      );
    },
  },
  {
    id: 'superlative-mirror',
    section: '§2.20 #74',
    // `Am günstigsten ist der 20. Januar, am teuersten Silvester.`: the cheapest and the dearest
    // in one sentence or two in a row. In a post about quiet days that pair is the answer, so it
    // fires only when the same frame (names and figures as placeholders) recurs in four sections
    // (`##` or `###`). German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const low = SUPERLATIVE_LOW[locale];
      const high = SUPERLATIVE_HIGH[locale];
      const pairs = (blocks) =>
        paragraphs(blocks).flatMap((b) => {
          const list = splitSentences(b.text);
          return list.flatMap((s, i) => {
            if (low.test(s) && high.test(s)) return [s];
            const next = list[i + 1] ?? '';
            return low.test(s) !== high.test(s) && (low.test(s) ? high : low).test(next)
              ? [`${s} ${next}`]
              : [];
          });
        });
      const frame = (s) =>
        (s.match(/[\p{L}\d][\p{L}\d'’.,-]*/gu) ?? [])
          .map((w, i) =>
            /^\d/.test(w) ? '#' : i > 0 && /^\p{Lu}/u.test(w) ? 'X' : w.toLowerCase()
          )
          .filter((w, i, all) => !((w === 'X' || w === '#') && all[i - 1] === w))
          .join(' ');
      const seen = new Map();
      chaptersOf(bs, 3).forEach((c, i) => {
        for (const p of pairs(c.blocks)) {
          if (!seen.has(frame(p))) seen.set(frame(p), { sections: new Set(), hits: [] });
          seen.get(frame(p)).sections.add(i);
          seen.get(frame(p)).hits.push(p);
        }
      });
      return [...seen.values()].filter((f) => f.sections.size >= 4).flatMap((f) => f.hits);
    },
  },
  {
    id: 'section-formula',
    section: '§2.20 #75',
    // `den zweiten Besuch machst du` in three `###` sections: five words with no figure and at
    // most one capital, so a ride's name (`Peter Pan's Flight in`) is not a formula, and none of
    // the title's words, which every section of the post is about. Words only, so every locale;
    // the FAQ is left out.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, fields }) {
      const topic = new Set(
        fields
          .filter(([n]) => n === 'title')
          .flatMap(([, v]) => tokens(v))
          .filter((w) => w.length >= 4)
      );
      const seen = new Map();
      chaptersOf(bs.slice(0, faq(bs).start), 3)
        .filter((c) => c.heading?.level === 3)
        .forEach((c, i) => {
          // A sentence with a figure is a spec line (`la taille minimale est de 1,20 m`).
          const words =
            running(c.blocks)
              .flatMap((b) => splitSentences(b.text))
              .filter((x) => !/\d/.test(x))
              .join(' ')
              .match(/\d+(?:[.,]\d+)*|[\p{L}'’-]+/gu) ?? [];
          for (let j = 0; j + 5 <= words.length; j++) {
            const five = words.slice(j, j + 5);
            if (five.some((w) => /\d/.test(w)) || five.filter((w) => /^\p{Lu}/u.test(w)).length > 1)
              continue;
            const g = five.join(' ').toLowerCase();
            if (five.filter((w) => w.length >= 5).length < 2) continue;
            if (five.some((w) => topic.has(w.toLowerCase()))) continue;
            if (!seen.has(g)) seen.set(g, new Set());
            seen.get(g).add(i);
          }
        });
      return [...seen].filter(([, s]) => s.size >= 3).map(([g]) => g);
    },
  },
  {
    id: 'opener-skeleton-series',
    section: '§2.20 #76',
    // `Im Europa-Park stehst du an Voltron am längsten an.` opening three paragraphs with the
    // names swapped: the first six words with names as placeholders, four of them ordinary
    // words. An opener with a figure (`At Heide Park, children under 90 centimetres get in free`)
    // is a spec line the guide owes the reader, and an FAQ answer is read alone; both are left
    // out. No wordlist, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs }) {
      const skeleton = (s) => {
        const out = [];
        (s.match(/[\p{L}\d][\p{L}\d'’.,&-]*/gu) ?? []).forEach((w, i) => {
          const k = /^\d/.test(w) ? '#' : i > 0 && /^\p{Lu}/u.test(w) ? 'X' : w.toLowerCase();
          if (!((k === 'X' || k === '#') && out.at(-1) === k)) out.push(k);
        });
        return out.slice(0, 6);
      };
      const count = new Map();
      const opens = paragraphs(bs.slice(0, faq(bs).start))
        .map((b) => firstSentence(b.text))
        .filter((s) => !/\d/.test(s))
        .map((s) => [s, skeleton(s)]);
      for (const [, k] of opens)
        if (k.length === 6 && !k.includes('#') && k.filter((w) => w !== 'X').length >= 4)
          count.set(k.join(' '), (count.get(k.join(' ')) ?? 0) + 1);
      return opens.filter(([, k]) => count.get(k.join(' ')) >= 3).map(([s]) => s);
    },
  },
  {
    id: 'negation-reveal',
    section: '§2.20 #77',
    // `X ist keine Achterbahn. Es ist …`, `ist es keine Achterbahn, sondern …`: the reveal (§2.1).
    // When the second half is a fact, a figure or a name (`It's a Maurer`, `Es ist eine
    // Wildwasserbahn, ab 1,20 Meter`), the sentence corrects a likely guess and stays.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) => {
        const m = b.text.match(NEGATION_REVEAL[locale]);
        if (!m) return [];
        const rest = b.text
          .slice(m.index + m[0].length)
          .split(/(?<=[.!?])\s/)[0]
          .trim();
        return /\d/.test(rest) || NAMED[locale].test(rest) ? [] : [m[0]];
      });
    },
  },
  {
    id: 'from-to-mirror',
    section: '§2.20 #78',
    // `von … zu … und von … zu …` in one sentence: the mirrored double preposition.
    locales: ['de', 'en'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => {
          const m = s.match(FROM_TO_MIRROR[locale]);
          return m && !/\d/.test(m[0]);
        })
      );
    },
  },
  {
    id: 'queue-comparison-close',
    section: '§2.20 #79',
    // `… stehst du dort halb so lange an.` as the last sentence of three paragraphs.
    locales: ['de', 'en'],
    min: 3,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => QUEUE_COMPARISON_CLOSE[locale].test(s));
    },
  },
  {
    id: 'dash-explained-twice',
    section: '§2.20 #80',
    // What the dash in a widget means, explained twice in one post.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => DASH_EXPLAINED[locale].test(s))
      );
    },
  },
  {
    id: 'park-to-park',
    section: '§2.20 #81',
    // `unterscheidet sich von Park zu Park`: a tautology where the difference belongs.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => PARK_TO_PARK[locale].test(s))
      );
    },
  },
  {
    id: 'caption-echo',
    section: '§2.20 #82',
    // `Mitfahren darf man dort ab 90 Zentimetern.` under a photo whose caption says the same of
    // the same ride: a measurement of the caption or alt text that a sentence of the post repeats
    // next to a name from the caption. Figures and names, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, fields, raw }) {
      const captions = [
        ...fields.filter(([n]) => n === 'caption' || n === 'alt').map(([, v]) => v),
        ...[...raw.matchAll(/!\[([^\]]+)\]\(/g)].map((m) => m[1]),
      ];
      const sentences = running(bs).flatMap((b) => splitSentences(b.text));
      return captions.flatMap((c) => {
        const names = (c.match(/(?<=\s)\p{Lu}[\p{L}-]{3,}/gu) ?? []).filter(
          (n) => !TIME_WORD.test(n)
        );
        const norm = (m) => m.replace(/\s/g, '').toLowerCase();
        return (c.match(MEASURE) ?? []).flatMap((m) =>
          sentences.some(
            (s) =>
              (s.match(MEASURE) ?? []).some((x) => norm(x) === norm(m)) &&
              names.some((n) => s.includes(n))
          )
            ? [c]
            : []
        );
      });
    },
  },
  {
    id: 'price-not-sold',
    section: '§2.20 #84',
    // `ResortPass in Silber für 325 €, in Gold für 495 €, derzeit nicht im Verkauf`: a price for
    // something the reader cannot buy (docs/blog.md §1.2). A sentence or a table cell with an
    // amount and the not-on-sale formula; the formula is short in every locale. A ticket kept off
    // one date, and an unsold item named after the priced ones, are facts.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      // A list is read item by item: a source list's bullets are not one sentence.
      const items = (b) =>
        b.src
          .join('\n')
          .split(/\n(?=\s*(?:[-*+]|\d+\.)\s)/)
          .map((item) => plain(item.replace(/\s*\n\s*/g, ' ')));
      const units = [
        ...running(bs).flatMap((b) =>
          b.kind === 'list' ? items(b).flatMap(splitSentences) : splitSentences(b.text)
        ),
        ...bs.filter((b) => b.kind === 'table').flatMap((b) => b.rows.flat()),
      ];
      return units.filter((u) => {
        const m = u.match(NOT_SOLD[locale]);
        if (!m || !PRICE.test(u)) return false;
        // `isn't sold for 31 December`: one day off a ticket that is on sale.
        const near = u.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30);
        if (new RegExp(DATE_DAY.source, 'iu').test(near)) return false;
        // `…, and Speedy One isn't sold.`: the unsold item is another one than the priced.
        const clause = u
          .slice(0, m.index)
          .split(/;\s|,\s+(?:and|und|en|et|y|e)\s/)
          .at(-1);
        return PRICE.test(clause) || !/;\s|,\s+(?:and|und|en|et|y|e)\s/.test(u.slice(0, m.index));
      });
    },
  },
  {
    id: 'ref-link-opener-series',
    section: '§2.20 #85',
    // `[Silver Star](ref:…) ist … [Wodan](ref:…) ist eine Holzachterbahn … [Voltron Nevera](ref:…)
    // wird …`: ride after ride opening on its own link. Four sentences in one paragraph, or five
    // across two in a row. Links only, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs }) {
      const opens = (b) =>
        b?.kind === 'para' ? splitSentences(b.raw).filter((s) => OPENS_ON_REF.test(s.trim())) : [];
      const hits = [];
      bs.forEach((b, i) => {
        const own = opens(b);
        if (own.length >= 4) hits.push(...own);
        const pair = [...own, ...opens(bs[i + 1])];
        if (own.length && pair.length >= 5) hits.push(...pair);
      });
      return [...new Set(hits)];
    },
  },
];

/**
 * Every pattern that fires on one post, as `{ rule, section, hits }`. `fields` is the frontmatter's
 * plain-text fields (`plainTextFields()` in `check-prose.mjs`); `rules` lets a test run one rule.
 */
export function slopFindings(raw, locale, fields = [], rules = SLOP_RULES) {
  const ctx = { bs: blocks(raw), locale, fields, raw };
  return rules
    .filter((r) => r.locales.includes(locale))
    .map((r) => ({ rule: r.id, section: r.section, min: r.min, hits: r.run(ctx) }))
    .filter((f) => f.hits.length >= f.min);
}

/**
 * The patterns that read the same in one caption or alt text as in a post (`caption: true` on the
 * rule), at one hit each: a caption is a single sentence, so a series is out of reach. The rules
 * that ask about neighbouring blocks are not among them.
 */
export function captionFindings(text, locale) {
  const ctx = { bs: blocks(text), locale, fields: [], raw: text };
  return SLOP_RULES.filter((r) => r.caption && r.locales.includes(locale))
    .map((r) => ({ rule: r.id, section: r.section, hits: r.run(ctx) }))
    .filter((f) => f.hits.length > 0);
}
