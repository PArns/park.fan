/**
 * The twenty patterns the critic found in the twelve open guides of 2026-10-13, the date-line
 * regex and the sentence splitter they share with `scripts/check-prose.mjs` (docs/blog.md §2.20).
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
 * §7.2), not skipped by accident.
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
 * are neighbours when nothing sits between them, which is what the widget rules ask about.
 */
export function blocks(raw) {
  const lines = raw
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n');
  const out = [];
  let cur = null;
  const flush = () => {
    if (cur) out.push({ ...cur, text: plain(cur.lines.join(' ')) });
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
    cur ??= { kind, lines: [] };
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

/* ------------------------------------------------------------------ the rules */

/** Sentence-level wordlists. German and English first; a language that is missing is not covered. */
const RETRIEVAL = {
  de: /(?:konnten? wir nicht (?:abrufen|bestätigen|öffnen|prüfen)|nicht (?:abrufen|bestätigen)|fehlt die Angabe bei \d+ von \d+|ließ sich nicht (?:bestätigen|abrufen|belegen))/i,
  en: /(?:could(?: not|n['’]t) (?:be )?(?:retrieve|confirm|open|verify|find)|(?:is|are) missing (?:for|from|at) \d+ of \d+|we (?:could not|couldn['’]t) (?:retrieve|confirm))/i,
};

const HANDOFF = {
  de: [
    /^(?:Den|Die|Das|Welche[nrs]?)\s[^.]{3,90}?\s(?:nennt|nennen|zeigt|zeigen|beschreibt|beschreiben|erklärt|erklären|behandelt|behandeln|vergleicht|liefert|verrät|führt|listet)\s+(?:der|die|das|unser\w*|dieser|diese)\s(?:Park|Betreiber|Parkseite|Webseite|Seite|Guide|Beitrag|Artikel|Ratgeber|Überblick|Übersicht|Kalender|Ticketshop|Buchungsablauf)\b/iu,
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
  de: /^(?:Dazu kommt|Dazu kommen|Hinzu kommt|Hinzu kommen|Und es gibt|Außerdem gibt es|Außerdem kommt|Außerdem kommen|Und dann gibt es)\b/,
  en: /^(?:There(?:['’]s| is| are) also|Then there(?:['’]s| is| are)|And there(?:['’]s| is| are)|Also there)\b/i,
};

const ATTRIBUTION_OPENER = {
  de: /^(?:Laut (?:dem )?(?:Park|Betreiber|Parkseite)|Der Park (?:nennt|gibt|sagt|beschreibt|bezeichnet|führt|spricht)|Nach Angaben des (?:Parks|Betreibers)|Nach Parkangabe)\b/,
  en: /^(?:According to the (?:park|operator)|The park (?:calls|says|gives|lists|describes|states|names|quotes|puts|claims|notes))\b/i,
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

const headings = (bs, minLevel = 2, maxLevel = 3) =>
  bs.filter((b) => b.kind === 'heading' && b.level >= minLevel && b.level <= maxLevel);

/**
 * One entry per pattern. `run(ctx)` returns the matching passages, `min` is how many a post may
 * carry before the warning fires. `ctx` is `{ bs, locale, fields }`: the blocks of the post, its
 * language, and the frontmatter's plain-text fields as `[name, value]` pairs.
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
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => HANDOFF[locale].some((re) => re.test(s)));
    },
  },
  {
    id: 'indirect-question-subject',
    section: '§2.20 #5',
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => INDIRECT_QUESTION[locale].test(s))
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
];

/**
 * Every pattern that fires on one post, as `{ rule, section, hits }`. `fields` is the frontmatter's
 * plain-text fields (`plainTextFields()` in `check-prose.mjs`); `rules` lets a test run one rule.
 */
export function slopFindings(raw, locale, fields = [], rules = SLOP_RULES) {
  const ctx = { bs: blocks(raw), locale, fields };
  return rules
    .filter((r) => r.locales.includes(locale))
    .map((r) => ({ rule: r.id, section: r.section, min: r.min, hits: r.run(ctx) }))
    .filter((f) => f.hits.length >= f.min);
}
