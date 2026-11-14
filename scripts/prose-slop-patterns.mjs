/**
 * The patterns the critic found in the guides of 2026-10-13 (1 to 20 in the twelve open ones, 22 to
 * 38 in the 27 older ones), in the thank-you post of 2026-10-19 (40 to 47) and in the four
 * multi-park guides of 2026-11-14 (115 to 123), the date-line regex and the sentence splitter they
 * share with `scripts/check-prose.mjs` (docs/writing/2-20-check-patterns.md §2.20). The wordlists
 * that script reads on every surface (`WATCH`, `TAILS`, `PRODUCT_SUBJECT`) live here too, so their
 * cases run in `pnpm test:prose-rules`.
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
 * in `locales`; a pattern that is not listed for a language is left to the critic (docs/writing/7-review.md
 * §7.2), not skipped by accident. Of the 22 to 38 batch, 23, 32 and 37 to 38 differ from the
 * rest only in what their `locales` list says; read the list, not this paragraph.
 *
 * `pnpm test:prose-rules` holds one positive and one negative case per rule, with the sentences
 * the critic quoted as fixtures.
 *
 * Two rules here belong to other sections of docs/writing/, because they are rules Patrick set
 * rather than patterns the critic counted: `news-outlet-attribution` (§5.0) and
 * `withheld-as-said` (§1.9).
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

/* ------------------------------------------------------------------ the wordlists every surface gets */

export const SIGN_RULE = 'the sign at the entrance (§3.3)';
/** Warnings: a budget, a signal, or a candidate a person has to look at. */
/**
 * The passages of `text` that one WATCH entry flags. `exempt` marks the look-alikes the entry
 * leaves alone, such as a show's name that contains a word of the list.
 */
export const watchHits = (text, { re, exempt }) =>
  (exempt ? text.replace(exempt, ' ') : text).match(re);
export const WATCH = [
  {
    what: SIGN_RULE,
    re: /\b((?:das|ein|dem|den|am|vom|beim) schild|the sign|het bord|wachttijdbord|le panneau|el cartel|il cartello)\b/gi,
  },
  {
    what: 'summary formula (§1.5)',
    re: /\b(zusammenfassend|abschließend l[äa]sst|insgesamt l[äa]sst|in conclusion|in summary|key takeaways)\b/gi,
  },
  {
    what: 'editorial commentary (§1.4)',
    re: /\b(es ist wichtig zu (beachten|betonen|erw[äa]hnen)|es ist entscheidend|worth noting|it'?s important to note)\b/gi,
  },
  {
    what: 'empty opener (§1.7)',
    re: /\b(in der heutigen (zeit|welt)|im digitalen zeitalter|mehr denn je|seit jeher|in today'?s|in the (ever-)?evolving)\b/gi,
  },
  {
    what: 'pseudo-wisdom (§1.7)',
    // `am Ende des Tages` is also the evening in a theme park: only the sentence-opening idiom.
    re: /\b(der schl[üu]ssel liegt|die zahlen sprechen f[üu]r sich|die tendenz ist steigend|the key is)\b|(?<=^|[.!?]\s+)(?:am ende des tages|at the end of the day),/gim,
  },
  {
    what: 'vague authority (§1.2)',
    re: /\b(studien zeigen|experten (sind sich einig|gehen davon aus)|branchenberichte|experts (agree|argue)|studies (show|suggest)|research suggests)\b/gi,
  },
  {
    what: 'business verb (§1.7)',
    re: /\b(revolutionier\w*|transformier\w*|ganzheitlich\w*|nahtlos\w*|ma[ßs]geschneidert\w*|leverage|unlock|empower|streamline|seamless|cutting-edge|elevate)\b/gi,
  },
  {
    what: 'AI vocabulary (§3)',
    re: /\b(delve|tapestry|underscore[sd]?|showcasing|boasts|vibrant|nestled|pivotal|meticulous\w*|robust|myriad|plethora|multifaceted|groundbreaking|game-?chang\w*|transformative|unprecedented|aforementioned|spearhead\w*|encompass\w*|endeavou?rs?|synerg\w*|in essence|rest assured|it goes without saying|thought leader\w*)\b/gi,
    // `Tapestry of Happiness` is a Disneyland show, and the German text names it too: a capitalised
    // `Tapestry of` before a capital is a title, not the `rich tapestry` this list is after.
    exempt: /\bTapestry(?= of \p{Lu})/gu,
  },
  {
    what: 'stock phrase (§3)',
    re: /\b(when it comes to|comes into play|without further ado|in a nutshell|buckle up|to the next level|bridge the gap|move the needle|at its core|in the realm of|here'?s the (thing|deal)|whether you'?re an? \w+ or|hier kommt\b[^.!?]{0,30}\bins spiel|ohne umschweife|schnall dich an|das n[äa]chste level|was viele nicht wissen)\b/gi,
  },
  {
    what: 'mechanical opener (§2.7)',
    re: /(?<=^|[.!?]\s+)(?:(?:moreover|furthermore|additionally|interestingly|notably|importantly|indeed|certainly|absolutely),|(?:darüber hinaus|des weiteren|interessanterweise|bemerkenswerterweise|letztendlich)\b)/gim,
  },
  {
    what: 'credential opener (§1.4)',
    re: /(?<=^|[.!?]\s+)(?:als (?:langj[äa]hrige[rs]?|erfahrene[rs]?|leidenschaftliche[rs]?|begeisterte[rs]?) |as an? (?:long-?time|seasoned|passionate|lifelong|avid) )/gim,
  },
  {
    what: 'question set-up (§2.12)',
    re: /(?<=^|[.!?]\s+)(?:das ergebnis|die antwort|der grund|der haken|the result|the answer|the reason|the catch)\?/gim,
  },
  {
    what: 'teaser (§2.16)',
    re: /(?<=^|[.!?]\s+)(?:(?:dann|jetzt|hier|da) (?:wird|wurde)(?:'s| es)? (?:\p{L}+ )?(?:kurios|spannend|interessant|lustig|absurd|verrückt)|und dann (?:das|der|die) \p{L}+ste\b|interessanter (?:ist|wird)|spannend(?:er)? wird|das beste(?: daran)?:|(?:here|this) is where (?:it|things) gets?|(?:then|now) (?:it|things) gets?(?: \p{L}+)? (?:weird|interesting|strange|tricky)|the best part[:?]|here'?s the (?:kicker|twist|catch)|and then the \p{L}+est\b)|(?<!\p{L})(?:ist der (?:leichte|leichtere|einfache|einfachere) teil|is the easy part|is het makkelijke deel|(?:est|c['’]est) la partie facile|es la parte fácil|è la parte facile)(?!\p{L})/gimu,
  },
  {
    what: 'appended verdict (§2.17)',
    re: /\b(?:und )?(?:genau )?das ist (?:genau )?(?:die aussage|der punkt|der trick|kein zufall|(?:vermutlich |wohl )?absicht)\b|\bthat'?s (?:exactly |precisely )?(?:the point|no accident|(?:probably )?deliberate|by design)\b|\bthat is (?:exactly |precisely )?the point\b/gi,
  },
  {
    what: 'no X, no Y, just Z (§2.17)',
    re: /\bkein\w* [^,.]{1,30}, kein\w* [^,.]{1,30}, (?:nur|einfach|dafür)\b|\bno [^,.]{1,30}, no [^,.]{1,30}, (?:just|only|simply)\b/gi,
  },
  {
    // `zeigt der Kalender`, `die Daten sagen`, `Was die Warteschlangen gerade anzeigen`: a queue,
    // a number or a calendar as the one who speaks (§2.13).
    what: 'things that talk (§2.13)',
    re: /(?<!\p{L})(?:(?:der|die|das|den|dem|unsere?|diese[rs]?|jede[rs]?)\s+(?:\p{L}+\s+)?(?:warteschlangen?|schlangen?|zahl(?:en)?|daten|wartezeit(?:en)?|kurven?|tageskurve|(?:crowd-)?kalender|tabellen?|prognosen?|messwerte?|statistik(?:en)?|anzeigen?|karten?|diagramm|grafik|farben?|balken|median|spitze|liste|skala)\s+(?:dir\s+|dazu\s+|dann\s+|hier\s+|auch\s+|nur\s+|gerade\s+(?:jetzt\s+)?|jetzt\s+|schon\s+)?(?:zeigt|zeigen|sagt|sagen|verrät|verraten|erzählt|erzählen|weiß|wissen|kennt|kennen|lügt|lügen|spricht|sprechen|antwortet|verspricht|verschweigt|verschweigen|behauptet|erwartet|erwarten|anzeigen|zeigt an|zeigen an)|(?:die|eine) farbe misst|the colou?r measures|(?:zeigt|sagt|verrät|erzählt|weiß|kennt)\s+(?:dir\s+|dann\s+|hier\s+|auch\s+)?(?:der|die|das)\s+(?:\p{L}+\s+)?(?:warteschlange|schlange|zahl|kalender|tabelle|kurve|karte|prognose|statistik|anzeige|liste|parkseite)|the (?:queue|line|numbers?|data|calendar|chart|curve|table|forecast|median|figures?|sign|display) (?:(?:already|also|then|now) )?(?:tells?|says|knows?|reveals?|lies|speaks|shows you|tells you))(?!\p{L})/giu,
  },
  {
    // The same in the four derived languages; every hit there was found by reading until 2026-09-30.
    what: 'things that talk, nl/fr/es/it (§2.13)',
    re: /(?<!\p{L})(?:(?:de|het) (?:\p{L}+ )?(?:data|cijfers|tabel|kalender|kolom|curve|kaart|voorspelling|mediaan|wachtrij)\s+(?:zegt|zeggen|vertelt|vertellen|laat zien|laten zien|verraadt|verraden|weet|weten|kent|kennen|belooft|liegt)|(?:les données|les chiffres|le tableau|le calendrier|la courbe|la carte|la prévision|la médiane|la file)\s+(?:(?:te|vous|nous|le|la)\s+)*(?:dit|disent|montre|montrent|révèle|révèlent|sait|savent|annonce|promet|ment)|(?:los datos|las cifras|la tabla|el calendario|la curva|el mapa|la previsión|la mediana|la cola|la fila)\s+(?:(?:te|os|nos|lo|la)\s+)*(?:dice|dicen|muestra|muestran|revela|revelan|sabe|saben|anuncia|promete|miente|enseña)|(?:i dati|i numeri|la tabella|il calendario|la curva|la mappa|la previsione|la mediana|la coda|la fila)\s+(?:(?:ti|vi|ci|lo|la)\s+)*(?:dice|dicono|mostra|mostrano|rivela|rivelano|sa|sanno|annuncia|promette|mente|racconta)|de kleur meet|la couleur mesure|el color mide|il colore misura)(?!\p{L})/giu,
  },
  {
    // `Der Europa-Park-Guide rechnet das nach`, `rekent de widget hierboven uit`: a page, a guide,
    // a report or a calendar doing the sums (§2.13). Say who did them (`habe ich nachgerechnet`)
    // or where the result is. A model computing a forecast is arithmetic and is not on the list.
    what: 'things that calculate (§2.13)',
    re: /(?:gutachten|studie|bericht|guide|artikel|beitrag|seite|widget|kalender|tabelle|tagesplaner|planer|übersicht)\s+(?:oben\s+|unten\s+|hierüber\s+|darunter\s+)?(?:rechnet|rechnen)\b|\b(?:rechnet|rechnen)\s+(?:der|die|das|unser\p{L}*)\s+(?:\p{L}+\s+)?(?:gutachten|studie|bericht|guide|artikel|beitrag|seite|widget|kalender|tabelle|tagesplaner|planer)\b|\b(?:eine[rs]?|eins) davon rechnet\b|\b(?:der|dem) plan\s+rechnet\b|\bdie seiten zur besten reisezeit\s+rechnen\b|\bthe plan counts\b|\b(?:the )?best-time pages\s+work with\b|(?:report|study|guide|article|post|page|widget|calendar|table|planner)s?\s+(?:works out|works through|calculates|crunches|adds up|does the maths?)\b|(?:rapport|onderzoek|studie|gids|artikel|pagina|widget|kalender|tabel|planner)\s+(?:rekent|rekenen)\b|\brekent\s+(?:de|het|onze)\s+(?:\p{L}+\s+)?(?:gids|widget|kalender|planner|dagplanner|pagina|tabel)\b|(?:rapport|étude|guide|article|page|widget|calendrier|tableau|planificateur)s?\s+calcule\b|(?:informe|estudio|guía|artículo|página|widget|calendario|tabla|planificador)\s+calcula\b|(?:rapporto|studio|guida|articolo|pagina|widget|calendario|tabella|pianificatore)\s+calcola\b/giu,
  },
  {
    // `Die Daten belegen das nicht`, `ein anderes Jahr verteilt das anders` (§2.13): data and a
    // year as the actor. They stood in the rain guide in six languages until 2026-10-06.
    what: 'data or a year as the actor (§2.13)',
    re: /(?<!\p{L})(?:die daten (?:belegen|beweisen)|ein anderes jahr verteilt|the data (?:doesn['’]t|don['’]t|does not|do not) (?:prove|show)|another year (?:will )?spreads?|de data (?:bewijzen|tonen)|een ander jaar verdeelt|les données ne le (?:prouvent|montrent)|une autre année répartira|los datos no lo (?:demuestran|prueban)|otro año lo repartiría|i dati non lo (?:provano|dimostrano)|un altro anno distribuirebbe)(?!\p{L})/giu,
  },
  {
    // `Offen bleibt, welche Bahnen …, und das sind zuerst die im Gebäude.` (§2.12): the question
    // set-up folded into one sentence. A question that stays open (`Reste à savoir si la question
    // est recevable.`) has no answer clause and is not a hit.
    what: 'a question answered in the same sentence (§2.12)',
    re: /(?<!\p{L})(?:(?:offen bleibt|bleibt die frage),? (?:welche|wie|was|ob|wann|wo)[^.!?]{0,120}, und (?:das|die|der|es) |what['’]s left (?:open )?is (?:which|how|what|whether)[^.!?]{0,120}, and |open blijft,? (?:welke|hoe|wat|of)[^.!?]{0,120}, en |reste à savoir (?:quel\p{L}*|si|comment)[^.!?]{0,120}, et |queda por saber (?:qué|cuál\p{L}*|cómo|si)[^.!?]{0,120}, y |resta da capire (?:quali|quale|come|se)[^.!?]{0,120}, e )/giu,
  },
  {
    // `und füllen die Lücke nicht mit Annahmen`, `Die Lücke liegt in unserer Datenbank und hat mit
    // den Parks nichts zu tun` (§2.14): an integrity pledge nobody asked for, about a gap the
    // reader did not need to hear about.
    what: 'a pledge about a gap (§2.14)',
    re: /(?<!\p{L})(?:(?:füllen|füllt) [^.!?]{0,20}lücke nicht|nicht mit annahmen|hat mit den parks nichts zu tun|(?:don['’]t|do not|won['’]t|will not) fill (?:the|that|this) gap|vullen het gat niet|niet met aannames|ne comblons pas|avec des suppositions|no rellenamos|con suposiciones|non (?:lo )?riempiamo|con supposizioni)(?!\p{L})/giu,
  },
  {
    // `so steht es in unserem Guide zum Park` (§1.2): our own post as the evidence for a claim.
    // Link the guide where a reader wants more; the claim names the park or the operator.
    what: 'our own guide as the source (§1.2)',
    re: /(?<!\p{L})(?:so steht es in unserem|steht im guide, dass|laut unserem guide|as our guide (?:to [^.,]{1,40} )?says|our guide says|according to our guide|zo staat het in onze gids|volgens onze gids|c['’]est écrit dans notre guide|selon notre guide|así consta en nuestra guía|según nuestra guía|così c['’]è scritto nella nostra guida|secondo la nostra guida)(?!\p{L})/giu,
  },
  {
    // `trockene Tage gleicher Art`, `derselben Gruppe` (§2.19): a comparison against a bucket the
    // reader was never shown. Say what is compared. `the same group` is left out: in the Walibi and
    // Parc Astérix posts it is the company. `kürzer als an vergleichbaren trockenen Tagen` since
    // PAR-988, after a comparative only: the planner's `sucht vergleichbare Tage` says which.
    what: 'an unnamed comparison (§2.19)',
    re: /(?<!\p{L})(?:gleicher art|derselben gruppe|(?:days|ones) of the same kind|van (?:het|de)zelfde soort|als (?:an |bei |in )?vergleichbare[nm]? (?:\p{L}+ )?tag(?:e|en)|than (?:on |at |in )?comparable (?:\p{L}+ )?days|dan (?:op |bij )?vergelijkbare (?:\p{L}+ )?dagen|que (?:les |des |lors des )?jours (?:\p{L}+ )?comparables|que (?:los |las )?(?:de |en )?(?:los )?días (?:\p{L}+ )?comparables|(?:che|rispetto a)i? (?:nei |ai )?giorni (?:\p{L}+ )?comparabili)(?!\p{L})/giu,
  },
  {
    // `Für den Europa-Park berücksichtigen wir … auch die Schulferien im Elsass` (§2.19): our
    // method told where the park's fact belongs. Say which holidays count, not how we count.
    // Since the guides of 2026-11-14 also rating by a measure (`bewerten wir … nach dem gemessenen
    // Andrang`); `Eine Reise bewerten wir wie der Reiseplaner:` explains the rating and stays.
    what: 'our method instead of the park (§2.19)',
    re: /(?<!\p{L})(?:berücksichtigen wir|rechnen wir (?:[\p{L}-]+ ){0,6}?mit ein|zählen wir (?:[\p{L}-]+ ){0,6}?mit(?!\p{L})|we (?:also )?take into account|we count (?:[\p{L}-]+ ){0,6}?as|tenemos en cuenta|(?:nous )?prenons en compte|teniamo conto|houden we (?:ook )?rekening|(?:bewerten|gewichten) wir (?:[\p{L}-]+ ){0,8}?nach|we (?:rate|score|weight) (?:[\p{L}-]+ ){0,8}?(?:by|according to)|(?:beoordelen|wegen) we (?:[\p{L}'’-]+ ){0,8}?(?:op|naar)|nous (?:les |la |le )?(?:évaluons|pondérons) (?:[\p{L}'’-]+ ){0,8}?(?:selon|d['’]après)|(?:las|los|la|lo) (?:valoramos|ponderamos),? (?:[\p{L}'’-]+,? ){0,8}?(?:por|según)|(?:le|li|la|lo) (?:valutiamo|pesiamo) (?:[\p{L}'’-]+ ){0,8}?in base a)(?!\p{L})/giu,
  },
  {
    // `echte Wartezeiten`, `real wait-time data`: authenticity announced instead of shown (§3.3).
    what: 'authenticity claim (§3.3)',
    re: /(?<!\p{L})(?:echte[nrms]? (?:wartezeiten|wartezeit|daten|messungen|messwerte|werte|warteschlangendaten|zahlen|ablesungen)|real (?:wait[- ]time |queue )?(?:data|wait times|numbers)|echte wachttijd\p{L}*|données réelles|datos reales|dati reali)(?!\p{L})/giu,
  },
  {
    // The register the model this site is written with falls into (Arize, September 2026).
    what: 'Claude register (§2.18)',
    re: /(?<!\p{L})(?:this matters|that matters|here['’]s the (?:part|thing) that|the honest answer|load-bearing|earns? (?:its|their) (?:keep|place)|deserves a moment|worth internali[sz]ing|das ist wichtig, weil|der knackpunkt|die falle ist|verdient sich seinen platz|tragende[nr]? (?:rolle|teil)|falls? into place|takes care of itself|sorts itself out|ergibt sich (?:dann )?von selbst|valt (?:dan )?(?:vanzelf )?op zijn plaats|se met en place tout seul|encaja solo|va a posto da sé)(?!\p{L})/giu,
  },
  {
    // `und keine davon ist die, die man erwartet`, `größer, als die Preise vermuten lassen`
    // (§2.16): the surprise announced before the fact. Both stood in the Alton Towers guide of
    // 2026-10-11. Say the fact; the reader decides whether it surprises them.
    what: 'expectation teaser (§2.16)',
    // `más dura de lo que parece` is how Spanish says "harder than it looks" and stays out.
    re: /(?<!\p{L})(?:als man (?:es )?(?:erwartet|erwarten würde|denkt|glaubt)|als (?:die|der|das) \p{L}+ vermuten l(?:ä|a)ss\p{L}*|die man (?:nicht )?erwartet|than (?:you|one)(?:['’]d| would| might| may)? (?:expect|think|imagine)|than (?:the|its|their) \p{L}+ suggests?|als (?:sein|ihr) name (?:verspricht|vermuten lässt)|dan (?:de|zijn|haar) naam doet vermoeden|que (?:son|leur) nom ne le laisse (?:croire|penser|supposer)|de lo que (?:promete|sugiere) su nombre|di quanto (?:prometta|suggerisca) il (?:suo )?nome|(?:the|not the) ones? you['’]d expect|dan je (?:zou )?(?:verwachten|verwacht|denkt)|qu['’]on ne (?:le )?(?:pense|croit|imagine)|que ne le laissent (?:penser|supposer)|de lo que (?:crees|piensas|esperas|cabría esperar)|di quanto (?:si pensi|pensi|ci si aspetti|immagini))(?!\p{L})/giu,
  },
  {
    what: 'colon set-up (§2.16)',
    re: /(?<=^|[.!?]\s+)(?:das beste|kurz gesagt|der clou|die gute nachricht|die schlechte nachricht|pro-?tipp|profi-?tipp|spoiler|das problem|der knackpunkt|die falle|bottom line|pro tip|here['’]s why|plot twist|the good news|the bad news|the trap)\s*:/gim,
  },
  {
    // A gap in the record with nobody named as its owner (§1.9).
    what: 'disclaimer that names nobody (§1.9)',
    re: /\b(?:nicht (?:öffentlich|allgemein) (?:dokumentiert|bekannt|verfügbar)|basierend auf (?:den )?verfügbaren (?:informationen|daten)|(?:obwohl|da) (?:spezifische|genaue) (?:details|angaben) (?:begrenzt|rar)|stand meines (?:letzten )?(?:updates|wissens)|not (?:widely|publicly) (?:documented|disclosed|available)|based on (?:the )?available information|(?:while|although) (?:specific )?details (?:are|remain) (?:limited|scarce)|as of my (?:last|latest) (?:update|knowledge))\b/gi,
  },
  {
    what: 'send-off (§1.6)',
    re: /\b(?:man darf gespannt sein|es bleibt spannend|die zukunft (?:sieht|wird) rosig|the future looks bright|exciting times ahead|a step in the right direction|watch this space|stay tuned)\b/gi,
  },
  {
    what: 'notability claim (§1.1)',
    re: /(?<!\p{L})(?:vielfach ausgezeichnet\p{L}*|preisgekrönt\p{L}*|in zahlreichen medien|international renommiert\p{L}*|award-winning|consistently ranked|widely recogni[sz]ed|critically acclaimed)(?!\p{L})/giu,
  },
  {
    what: 'stacked qualifier (§1.7)',
    re: /\b(?:could potentially|might possibly|may potentially|might arguably|kann (?:unter umständen )?möglicherweise|könnte (?:eventuell|möglicherweise|unter umständen))\b/gi,
  },
  {
    // `Von rasanten Achterbahnen bis hin zu gemütlichen Familienfahrten`, `Egal, ob du …`.
    what: 'range or whether opener (§3)',
    re: /(?<!\p{L})(?:von [^.!?]{3,60} bis hin zu[rm]?|(?<=^|[.!?]\s+)(?:egal,? ob|ob du nun|of je nu|que (?:vous soyez|tu sois)|ya seas?|tanto si|che tu sia|sia che))(?!\p{L})/gimu,
  },
  {
    // A park or a ride doing a person's verb (§2.13).
    what: 'false agency (§2.13)',
    re: /(?<!\p{L})(?:(?:lädt|laden) (?:\p{L}+ ){0,4}ein(?=[ ,.])|sorgt für (?:nervenkitzel|spaß|adrenalin|gänsehaut|stimmung|abwechslung|begeisterung)|(?:invites|promises) (?:you|visitors|guests|riders)|delivers (?:thrills|fun))(?!\p{L})/giu,
  },
  {
    what: 'AI vocabulary, nl/fr/es/it (§3)',
    re: /(?<!\p{L})(?:het is belangrijk om op te merken|in een snel veranderende wereld|naadloze?|baanbrekend\p{L}*|il convient de souligner|dans un monde où|à l['’]ère du numérique|tirer parti de|es importante destacar|vale la pena (?:señalar|destacar)|en última instancia|profundizar en|embarcarse en|è importante sottolineare|vale la pena (?:ricordare|sottolineare)|una testimonianza di|epocale)(?!\p{L})/giu,
  },
  {
    what: 'vague sentiment (§1.2)',
    re: /\b(?:enthusiasten|fans|kenner|puristen) (?:lieben|schätzen|bevorzugen|betrachten|feiern|halten|mögen|schwärmen)\b|\b(?:gilt|gelten) (?:als|unter)\b|\b(?:enthusiasts|fans|riders|purists) (?:love|prize|consider|regard|praise|celebrate|prefer|rave|adore)\b|\bis (?:widely|often|generally|commonly) (?:regarded|considered|seen|described)\b|\bwidely (?:regarded|considered|seen)\b|(?<!\p{L})(?:(?:liefhebbers|kenners) (?:waarderen|houden van|beschouwen|zweren bij)|(?:geldt|gelden) als|wordt (?:vaak |algemeen )?(?:beschouwd|gezien) als|les (?:passionnés|amateurs|puristes) (?:apprécient|adorent|considèrent|préfèrent)|(?:est|sont) (?:souvent |généralement |largement )?considérée?s? comme|los (?:aficionados|entusiastas|puristas) (?:aprecian|adoran|consideran|valoran|prefieren)|(?:es|son) (?:a menudo |generalmente )?considerad[oa]s?|gli (?:appassionati|puristi) (?:apprezzano|amano|considerano|preferiscono)|(?:è|sono) (?:spesso |generalmente )?considerat[oaie])(?!\p{L})/giu,
  },
  {
    what: 'ad copy (§3)',
    re: /(?<!\p{L})(?:alleinstellungsmerkmal\p{L}*|unique selling (?:point|proposition)s?|atemberaubend\p{L}*|beeindruckend\p{L}*|unvergesslich\p{L}*|einzigartig\p{L}*|faszinierend\p{L}*|spektakulär\p{L}*|legendär\p{L}*|ikonisch\p{L}*|nervenkitzel pur|adrenalin pur|pures adrenalin|für die ganze familie|für groß und klein|ein echtes highlight|ein absolutes muss|im herzen von|herzstück|aushängeschild|thrill-?seekers?|adrenaline junkies?|something for everyone|fun for the whole family|hidden gem|must-(?:see|visit|do)|unforgettable|breathtaking|iconic|legendary|world-class|jaw-dropping|heart-pounding|white-knuckle|exhilarating|visceral|hallmark|centerpiece|centrepiece|showpiece|in the heart of|rich history|onvergetelijk\p{L}*|een echte aanrader|voor jong en oud|voor het hele gezin|adembenemend\p{L}*|in het hart van|sensatiezoekers?|incontournables?|inoubliables?|à couper le souffle|pour toute la famille|petits et grands|au cœur de|plongez|n[’']hésitez pas|imprescindibles?|inolvidables?|no te pierdas|sumérgete|para toda la familia|grandes y pequeños|en el corazón de|toda una experiencia|imperdibil\p{L}*|indimenticabil\p{L}*|immergiti|per tutta la famiglia|grandi e piccini|nel cuore di|da non perdere|geheimtipp\p{L}*|kronjuwel|wow-effekt|tauch(?:e|t) (?:\p{L}+ )?ein|lass dich verzaubern|kommt jede[rs]? auf (?:seine|ihre) kosten|für jeden (?:geschmack )?etwas|liegt in der luft|erfüllt die luft|bustling|gleaming|towering|shimmering|palpable|look no further|bucket[- ]list|once[- ]in[- ]a[- ]lifetime|step into a world|voor ieder wat wils|verborgen parel|laat je betoveren|kloppend hart|il y en a pour tous les goûts|laissez-vous (?:emporter|séduire|transporter)|à ne pas manquer|immanquable|hay para todos los gustos|joya (?:escondida|oculta)|de visita obligada|déjate (?:llevar|sorprender)|ce n['’]è per tutti i gusti|gemma nascosta|lasciati (?:conquistare|trasportare)|tappa obbligata|mozzafiato)(?!\p{L})/giu,
  },
];

/*
 * The tail a model hangs on a finished sentence to say what the fact *does* (§2.3): `…, making
 * it the tallest`, `…, was den Nervenkitzel steigert`, `…, ce qui rend`, `…, lo que convierte`.
 * One is a sentence; one per paragraph is the template the English glossary was written from.
 * The English `which` tail counts too (`…, which makes Discovery Cove the one park`, `…, which
 * means we started in the busiest week`), and in both languages the verdict hung on with it
 * (`…, was im August ein echtes Argument für eine Nacht dort ist`).
 */
export const TAILS = {
  en: /,\s(?:thus\s)?(?:making|creating|giving|adding|offering|allowing|providing|ensuring|highlighting|reflecting|showcasing|underscoring|emphasi[sz]ing|contributing to|resulting in|delivering|producing|enhancing|lending|which (?:makes|means)|which\s[^,.;]{0,40}?\bis an? (?:real |good |strong )?(?:argument|reason))\b/gi,
  de: /,\s(?:was|wodurch|womit)\s[^,.;]{0,80}?\b(?:macht|erzeugt|verleiht|steigert|schafft|ermöglicht|verstärkt|bietet|sorgt|beiträgt|unterstreicht|verschafft|argument)\b/gi,
  // `, waardoor de trein een U-bocht maakt` is Dutch for "so": only the pitching verbs count there.
  nl: /,\s(?:(?:wat|waarmee)\s[^,.;]{0,80}?\b(?:maakt|zorgt|geeft|biedt|creëert|versterkt|oplevert)|waardoor\s[^,.;]{0,80}?\b(?:creëert|versterkt|oplevert|zorgt voor))\b/gi,
  // `, lo que cuenta` opening a sentence is a relative clause, not a tail: only the pitching verbs.
  fr: /,\s(?:ce qui (?:rend|donne|crée|permet|offre|fait|garantit|renforce|en dit)|créant|offrant|donnant|rendant|(?:leur |lui |vous )?permettant|ajoutant|produisant|générant|procurant)(?!\p{L})/giu,
  es: /,\s(?:lo que (?:hace|convierte|permite|crea|da|ofrece|genera|aporta|garantiza)|lo cual|creando|ofreciendo|dando|haciendo|permitiendo|añadiendo|convirtiendo)\b/gi,
  it: /,\s(?:(?:il che|cosa che) (?:rende|dà|crea|permette|offre|fa|garantisce)|creando|offrendo|dando|rendendo|permettendo|aggiungendo)\b/gi,
};

/**
 * Our own features as the subject of a verb: `der Planer kennt`, `the planner says` (§2.13). Until
 * 2026-09-30 every `dem Kompass` and `the compass` counted, which in a post about the compass
 * pushed writers into swapping the noun for `park.fan's compass` without changing who acts. The
 * compounds count since the guides of 2026-11-14 (`Der Reiseplaner zählt einen Tag als heiß`,
 * `The trip planner treats a day as hot`), and so does the plan it makes (`der Plan rechnet mit
 * dem frühen Einlass`) and our best-time pages in the plural (`die Seiten zur besten Reisezeit
 * rechnen dort mit dem Vorjahr`).
 */
export const PRODUCT_SUBJECT =
  /\b(?:(?:der|the) (?:reiseplaner|tagesplaner|planer|kompass|assistent|plan|trip planner|day planner|planner|compass|assistant) (?:weiß|knows|(?!(?:ist|is|in|im|auf|on|of|von|zu|to|mit|with|als|as|und|and|oder|or|nicht|not|bis|its|seine?|for|für|was|war)\b)\p{Ll}+[ts])|(?:die seiten zur besten reisezeit|the best-time pages) (?:\p{L}+ ){0,4}?(?:rechnen|zählen|nennen|zeigen|work|count|show|list|give))\b/giu;

/* ------------------------------------------------------------------ the rules */

/** Sentence-level wordlists. German and English first; a language that is missing is not covered. */
const RETRIEVAL = {
  de: /(?:konnten? wir nicht (?:abrufen|bestätigen|öffnen|prüfen)|nicht (?:abrufen|bestätigen)|fehlt die Angabe bei \d+ von \d+|ließ sich nicht (?:bestätigen|abrufen|belegen))/i,
  en: /(?:could(?: not|n['’]t) (?:be )?(?:retrieve|confirm|open|verify|find)|(?:is|are) missing (?:for|from|at) \d+ of \d+|we (?:could not|couldn['’]t) (?:retrieve|confirm))/i,
};

const HANDOFF = {
  de: [
    /^(?:Den|Die|Das|Welche[nrs]?)\s[^.]{3,90}?\s(?:nennt|nennen|zeigt|zeigen|beschreibt|beschreiben|erklärt|erklären|behandelt|behandeln|vergleicht|liefert|verrät|führt|listet|stellt|stellen|veröffentlicht|veröffentlichen)\s+(?:der|die|das|unser\w*|dieser|diese)\s(?:Park|Betreiber|Resort|Parkseite|Webseite|Seite|Guides?|Beitrag|Beiträge|Artikel|Ratgeber|Überblick|Übersicht|Kalender|Ticketshop|Buchungsablauf|App|Rezeption|Kasse|Hotline)\b/iu,
    /^(?:Der|Die|Das|Unser\w*|Dieser|Diese)\s+[\p{L}-]*(?:Überblick|Guide|Beitrag|Artikel|Ratgeber|Übersicht|Vergleich|Ranking|Rangliste|Kalender)\s[^.]{0,30}?\b(?:vergleicht|zeigt|nennt|beschreibt|erklärt|behandelt|zählt|führt|listet|rechnet|stellt)/iu,
  ],
  en: [
    /\b(?:is|are) (?:described|covered|explained|listed|compared|discussed|set out) in (?:(?:the|our|this) \w+|How park\.fan works)/i,
    /^The [\w -]{0,30}?(?:guide|overview|post|article|calendar|comparison|ranking)\b[^.]{0,30}?\b(?:compares|covers|lists|shows|explains|describes|discusses)\b/i,
    // Since the guides of 2026-11-14: `Our guides to … go through …`, `The resort publishes the
    // blackout dates on its Happy Entry page.`
    /^(?:The|Our) [\w -]{0,30}?(?:guides?|posts?)\b[^.]{0,120}?\b(?:go(?:es)?|walks?|works?) through\b/i,
    /^The (?:park|resort|operator) (?:publishes|lists|posts) [^.]{0,60}\bon (?:its|their) (?:[\w-]+ ){0,3}(?:page|website|site|app)\b/i,
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
  // Since the guides of 2026-11-14 also `Sieh dir die Frist beim Kauf an, bevor du die Tage …
  // festlegst.` and `… before you fix your San Diego days.`
  de: /^(?:Prüfe|Sieh dir|Schau dir)\b.*(?:vor der (?:Fahrt|Anreise|Reise|Abfahrt)|bevor du (?:\S+ ){0,6}?(?:fährst|losfährst|anreist|losgehst|buchst|aufbrichst|festlegst|planst|kaufst)|vor deiner (?:Anreise|Fahrt|Reise)|vor dem (?:Besuch|Ausflug))/,
  en: /^Check\b.*(?:before you (?:travel|go|visit|leave|set off|head out|drive|book|fix|plan|pick|lock in|commit)|before your (?:trip|visit|journey|drive)|ahead of (?:your|the) (?:trip|visit))/i,
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
  // `, which is why SeaWorld's multi-park tickets work there too`: the reason as an afterthought.
  en: new RegExp(
    String.raw`,\s+which is (?:(?:exactly |precisely )?the reason|why)${CLAUSE_END}`,
    'iu'
  ),
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

/**
 * The same proof with the post as a link and no verb: `wie in den meisten Parks aus unserem
 * [Vergleich …](/blog/…)`, `as at most parks in our [comparison](/blog/…)`. Read on the markdown.
 */
const OWN_POST_LINKED = {
  de: /(?<!\p{L})wie\s[^.]{0,60}?(?<!\p{L})(?:aus|in) (?:unserem|unserer|unseren)\s\[[^\]]+\]\((?:\/[a-z]{2})?\/(?:blog|news)\//iu,
  en: /(?<!\p{L})as\s[^.]{0,60}?(?<!\p{L})(?:from|in) our\s\[[^\]]+\]\((?:\/[a-z]{2})?\/(?:blog|news)\//iu,
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
  de: /(?<!\p{L})(?:sieht (?:das )?anders aus|ist (?:eine )?(?:ganz )?andere (?:Geschichte|Sache)|liegt (?:das )?anders|funktioniert (?:das |es )?anders)\s?:/iu,
  en: /(?<!\p{L})(?:is (?:quite )?(?:another|a different) (?:matter|story|thing)|looks different|works differently)\s?:/iu,
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
/** A name as a slug spells it: `Brühl` is `bruehl`, `Marne-la-Vallée` is `marne-la-vallee`. */
const slugWord = (w) =>
  w
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
/**
 * The parks and rides a post links: the first word of every link text, every slug of a link
 * target, and the slugs of the frontmatter lists (`tags`, `parkLinks`, `rideLinks`). `family`
 * maps a park's slug and its city from a `/parks/…` path to that city, so `In Rust` and `Im
 * Europa-Park` are one opener.
 */
function linkedNames(raw) {
  const words = new Set();
  const slugs = [];
  const family = new Map();
  for (const m of raw.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    words.add(plain(m[1]).split(/\s+/)[0].toLowerCase());
    let path = m[2]
      .toLowerCase()
      .replace(/^ref:/, '')
      .replace(/[?#].*$/, '')
      .split('/')
      .filter(Boolean);
    if (/^[a-z]{2}$/.test(path[0] ?? '')) path = path.slice(1);
    if (path[0] === 'parks') {
      // `/parks/europe/france/paris/disneyland-park`: the city is a place, not a park.
      if (path[3] && path[4]) {
        family.set(path[3], path[3]);
        family.set(path[4], path[3]);
      }
      path = path.slice(4);
    }
    slugs.push(...path.filter((x) => x.length >= 3));
  }
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';
  for (const m of front.matchAll(/^\s+-\s+['"]?([a-z0-9][a-z0-9/-]+)['"]?\s*$/gm))
    slugs.push(...m[1].split('/'));
  return { words, slugs, family };
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
/** A price and, in the same sentence or cell, the word that it is not sold (docs/writing/1-substance.md §1.2). */
const PRICE = /\d[\d.,]*\s*(?:€|£|\$|Euro|euros?|Franken|francs|yen|Yen)|[€£$]\s*\d/u;
const NOT_SOLD = {
  de: /(?<!\p{L})(?:nicht (?:mehr )?im Verkauf|verkauf\p{L}*\s(?:[^.]{0,40}\s)?(?:derzeit |zurzeit |momentan |aktuell )?nicht(?!\p{L})|nicht (?:mehr )?(?:zu kaufen|erhältlich))/iu,
  en: /(?<!\p{L})(?:not on sale|(?:isn['’]t|aren['’]t) on sale|(?:isn['’]t|aren['’]t|is not|are not) (?:currently )?(?:being )?sold|no longer (?:on )?sale|no longer sold|not (?:currently )?available to buy)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:niet (?:meer )?te koop|niet (?:meer )?verkocht|niet in de verkoop)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:pas (?:en|mis en) vente|plus en vente|n['’](?:est|sont) pas vendu)/iu,
  es: /(?<!\p{L})(?:no se vende|no (?:está|están) a la venta|ya no se vende)/iu,
  it: /(?<!\p{L})(?:non (?:è |sono )?in vendita|non si vende|non viene venduto)/iu,
};

/**
 * A sentence that opens on a link to a park or ride page, `[Wodan](ref:…) ist …`, or on a name in
 * bold, `**Big Thunder Mountain** ist …`. A bold label ends on a colon (`**Tipp:**`) and is none.
 */
const OPENS_ON_REF = /^(?:\*\*)?\[[^\]]+\]\(ref:[^)\s]+\)|^\*\*\p{Lu}[^*:]*\*\*(?!\s*:)/u;
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

/** A ride's length: `gut zwei Minuten Fahrt`, `a ride of just over two minutes`. */
const RIDE_DURATION = {
  de: /(?<!\p{L})(?:\d+(?:[,_]\d+)?|zwei|drei|vier|fünf|anderthalb|eineinhalb) (?:Minuten|Sekunden)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:\d+(?:[._]\d+)?|two|three|four|five) (?:minutes|seconds)(?!\p{L})/iu,
};
const RIDE_WORD = {
  de: /(?<!\p{L})(?:Fahrt|Fahrzeit|fährt|dauert)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:ride|lasts|long)(?!\p{L})/iu,
};
/** A building budget, not a ticket: millions. */
const BIG_MONEY = {
  de: /(?<!\p{L})(?:Millionen|Mio\.?|Milliarden?)(?:\s+\p{L}+)?\s*(?:€|Euro)|€\s*\d[\d.,_]*\s*(?:Millionen|Mio)/iu,
  en: /(?<!\p{L})(?:million|billion)(?:\s+\p{L}+)?\s*(?:euros?|pounds|dollars)|[€£$]\s*\d[\d.,_]*\s*(?:m|bn|million|billion)(?!\p{L})/iu,
};
/** `knapp 400.000 € pro Sekunde`, `close to €400,000 a second`. */
const COST_PER_SECOND = {
  de: /(?:€|Euro)\s+(?:pro|je) (?:Sekunde|Minute)(?!\p{L})/iu,
  en: /[€£$]\s*\d[\d.,_]*\s*(?:a|per) (?:second|minute)(?!\p{L})|(?:euros?|pounds|dollars) (?:a|per) (?:second|minute)(?!\p{L})/iu,
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
/** What turns a date into the start of a range: `bis`, `to`, `tot`, `au`, `al`, `a`, a dash. */
const RANGE_ON =
  /^\)?\s*(?:bis(?: zum)?|to|until|till|through|tot(?: en met)?|au|al|a|–|-)\s+(?:\p{L}+\s+)?\d/u;
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
/** `Goudurix, ebenfalls im Parc Astérix,`: the same hinge as an apposition, a month is not one. */
const NOT_TIME = `(?!${TIME_WORD.source.replace(/^\^/, '')})`;
const SAME_PARK = {
  de: new RegExp(
    `(?<!\\p{L})[Ii]m (?:selben|gleichen) Park(?!\\p{L})|,\\s+ebenfalls (?:im|in|bei|beim) ${NOT_TIME}\\p{Lu}`,
    'u'
  ),
  en: new RegExp(
    `(?<!\\p{L})(?:[Ii]n|[Aa]t) the same park(?!\\p{L})|,\\s+(?:also|likewise) (?:at|in) (?:the )?${NOT_TIME}\\p{Lu}`,
    'u'
  ),
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
/** Place prepositions and the article after them, one slot in an opener's frame. */
const FRAME_PLACE = /^(?:im|in|bei|beim|am|at|au|à|aux|en|nel|nello|nella|al|bij|op)$/u;
const FRAME_ARTICLE = /^(?:der|dem|den|the|het|de|le|la|les|l['’].*|el|il|lo)$/u;
const DASH_EXPLAINED = {
  de: /(?<!\p{L})(?:Strich (?:heißt|bedeutet)|(?:steht|stehen) (?:dort |da |in der Tabelle )?(?:ein |zwei )?Striche?|ein Strich steht)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:a dash (?:means|stands for)|(?:shows?|there is) a dash)(?!\p{L})/iu,
};
/**
 * With its verb: `passer d’un parc à l’autre` is a walk between two parks, not the tautology. By
 * the day only with a verb of varying (`kostet je nach Tag unterschiedlich viel`); `Die Preise
 * ändern sich von Tag zu Tag` says the price is dynamic, which is the fact.
 */
const PARK_TO_PARK = {
  de: /(?<!\p{L})(?:(?:unterscheide\p{L}*|variiert|wechselt|anders|verschieden|ein anderer|eine andere)\s(?:[^.]{0,30}\s)?von Park zu Park|von Park zu Park (?:verschieden|unterschiedlich|anders|ein anderer|eine andere)|(?:unterscheide\p{L}*|variiert|schwankt)\s(?:sich\s)?(?:je nach Tag|von Tag zu Tag)|(?:je nach Tag|von Tag zu Tag) (?:unterschiedlich|verschieden))(?!\p{L})/iu,
  en: /(?<!\p{L})(?:(?:differs?|vary|varies|changes?) (?:[^.]{0,20} )?from park to park|(?:differs?|vary|varies|costs? (?:a )?different (?:amounts?|prices?)) (?:[^.]{0,20} )?(?:from day to day|depending on the day))(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:verschilt|varieert) (?:[^.]{0,20} )?van park tot park(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:varie|diffère|change)(?:nt)? (?:[^.]{0,20} )?d['’]un parc à l['’]autre(?!\p{L})/iu,
  es: /(?<!\p{L})(?:varía|cambia|difiere)(?:n)? (?:[^.]{0,20} )?de un parque a otro(?!\p{L})/iu,
  it: /(?<!\p{L})(?:varia|cambia|differisce)(?:no)? (?:[^.]{0,20} )?da (?:un )?parco a(?:ll['’]altro| parco)(?!\p{L})/iu,
};

/* ---- 86 onwards: four critic runs of 2026-10-22 (coaster records, two comparisons, fast pass) ---- */

/** A link to one of our own posts: `(/blog/…)`, `(/de/news/…)`. */
const OWN_POST_LINK = /\]\((?:\/[a-z]{2})?\/(?:blog|news)\//;
/**
 * A chapter that opens by sending the reader to another post: `gibt es einen eigenen [Guide]`,
 * `Im [Regen-Guide](…) stehen`, `stehen im Überblick [Schulferien …]`, `There's a separate
 * [guide]`, `The [rain guide](…) lists`, `are in the overview [School holidays …]`.
 */
const CHAPTER_POINTER = {
  de: /(?:(?:gibt es|hat|haben)\s(?:\p{L}+\s){0,2}?(?:einen|eine|ein)\s(?:eigene[nrs]?|separate[nrs]?)|\]\([^)]*\)\s+(?:steht|stehen|zeigt|listet|nennt|sammelt)|(?:steht|stehen)\s(?:im|in der|in unserem|in unserer)\s[^.]{0,40}?\[|mehr dazu)(?!\p{L})/iu,
  en: /(?:there(?:['’]s| is) (?:a |an )?separate|ha(?:s|ve) (?:its|their) own|\]\([^)]*\)\s+(?:lists|covers|shows)|(?:is|are) in (?:the|our)\s[^.]{0,40}?\[|more (?:on that )?in (?:the|our))(?!\p{L})/iu,
};
/** `deshalb fehlt der Kärnan unten`: what the widget below leaves out, and the word for below. */
const GAP_MISSING = {
  de: /(?<!\p{L})(?:fehl\p{L}*|nicht (?:dabei|enthalten|aufgeführt|drin|zu sehen))(?!\p{L})/iu,
  en: /(?<!\p{L})(?:missing|(?:isn['’]t|aren['’]t|is not|are not) (?:in|on|shown|listed|included)|left out)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:ontbre\p{L}*|sta(?:at|an) (?:er )?niet)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:manqu\p{L}*|absente?s?|n['’]appara\p{L}* pas|ne figur\p{L}* pas)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:falta\p{L}*|no aparece\p{L}*|no figura\p{L}*|no está\p{L}*)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:manca\p{L}*|non (?:compare|compaiono|c['’]è|figura))(?!\p{L})/iu,
};
const GAP_BELOW = {
  de: /(?<!\p{L})unten(?!\p{L})/iu,
  en: /(?<!\p{L})below(?!\p{L})/iu,
  nl: /(?<!\p{L})hieronder(?!\p{L})/iu,
  fr: /(?<!\p{L})ci-dessous(?!\p{L})/iu,
  es: /(?<!\p{L})abajo(?!\p{L})/iu,
  it: /(?<!\p{L})qui sotto(?!\p{L})/iu,
};
const SAME_MODEL = {
  de: /(?<!\p{L})(?:dasselbe|das gleiche) Modell(?!\p{L})/iu,
  en: /(?<!\p{L})the same model(?!\p{L})/iu,
  nl: /(?<!\p{L})hetzelfde model(?!\p{L})/iu,
  fr: /(?<!\p{L})le même modèle(?!\p{L})/iu,
  es: /(?<!\p{L})el mismo modelo(?!\p{L})/iu,
  it: /(?<!\p{L})lo stesso modello(?!\p{L})/iu,
};
/** `In Belgien ist es [Kondaa](ref:…)`: the record is the one of the sentence before, unnamed. */
const ELLIPTIC_RECORD = {
  de: /^In\s+\p{Lu}[\p{L}-]*(?:\s+\p{Lu}[\p{L}-]*)?,?\s+(?:ist es|sind es)\s+\[/u,
  en: /^In\s+(?:the\s+)?\p{Lu}[\p{L}-]*(?:\s+\p{Lu}[\p{L}-]*)?,?\s+(?:it['’]s|it is|they['’]re|they are)\s+\[/u,
};
const MONTH_DE =
  'Januar|Jänner|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember';
const MONTH_EN =
  'January|February|March|April|May|June|July|August|September|October|November|December';
/**
 * `Valkyria hat im August 2018 eröffnet.`, `opened in April 2000.`, `has been running since April
 * 2024.` closing a paragraph. `since` only with a verb of running: `called … since March 2002`
 * and `measuring since 26 December 2025` are other facts.
 */
const OPENING_DATE_CLOSE = {
  de: new RegExp(
    `(?<!\\p{L})(?:(?:im|am)\\s+(?:\\d{1,2}[._]\\s*)?(?:${MONTH_DE})\\s+\\d{4}\\s+(?:eröffnet|in Betrieb gegangen)(?:\\s+(?:worden|hat|ist))?|(?:fährt|fahren|läuft|laufen)\\s+(?:\\p{L}+\\s+){0,3}?seit\\s+(?:dem\\s+)?(?:\\d{1,2}[._]\\s*)?(?:${MONTH_DE})\\s+\\d{4}|seit\\s+(?:dem\\s+)?(?:\\d{1,2}[._]\\s*)?(?:${MONTH_DE})\\s+\\d{4}\\s+(?:in Betrieb|geöffnet|offen)(?:\\s+(?:ist|sind))?)[.!]?$`,
    'u'
  ),
  en: new RegExp(
    `(?<!\\p{L})(?:(?:opened|went into operation|debuted)\\s+(?:in|on)\\s+(?:\\d{1,2}\\s+)?(?:${MONTH_EN})(?:\\s+\\d{1,2},?)?\\s+\\d{4}|(?:running|open|operating)(?:\\s+[\\p{L}-]+){0,4}?\\s+since\\s+(?:\\d{1,2}\\s+)?(?:${MONTH_EN})(?:\\s+\\d{1,2},?)?\\s+\\d{4})[.!]?$`,
    'u'
  ),
};
/** `Schneller als 85 km/h fährt sie nicht.`, `and it never goes faster than 85 km/h.` as a punchline. */
const NEGATED_MEASURE_CLOSE = {
  de: /(?:^(?:Schneller|Höher|Länger|Tiefer|Steiler|Weiter|Langsamer) als \d[^.]*\s(?:nicht|nie)|(?<!\p{L})(?:nie|nicht)\s(?:mehr\s)?(?:schneller|höher|länger|tiefer|steiler) als \d[^.,;]*)[.!]$/u,
  en: /(?<!\p{L})(?:never|doesn['’]t|does not|won['’]t)\s(?:ever\s)?(?:go|goes|get|gets|run|runs|climb|climbs|drop|drops|fall|falls|reach|reaches)\s(?:any\s)?(?:faster|higher|longer|deeper|steeper|taller) than \d[^.,;]*[.!]$/iu,
};
const ONCE_EACH = {
  de: /(?<!\p{L})gilt (?:je |jeweils )?(?:einmal|ein Mal)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:is|are) (?:good|valid) (?:for )?once(?!\p{L})/iu,
};
const QUEUE_THERE = {
  de: /(?<!\p{L})(?:Warteschlange|Wartezeit|Schlange)n? dort(?!\p{L})/iu,
  en: /(?<!\p{L})the (?:queue|wait|line)s? there(?!\p{L})/iu,
};
/** `Alle elf Einzelpässe zusammen kosten 83 €.` and nothing that says what the sum is against. */
const SUM_TOGETHER = {
  de: /(?<!\p{L})zusammen (?:kosten|kostet|kämen|kommen auf|kommt auf|ergeben|ergibt|machen|macht)(?!\p{L})/iu,
  en: /(?<!\p{L})together (?:come to|comes to|cost|costs|add up to|adds up to|total)(?!\p{L})/iu,
};
/** `mit dem Parque Warner Beach zusammen kostet ein Tag`: a combined ticket, not a sum. */
const SUM_WITH = /(?<!\p{L})(?:mit\s[^.,]{0,40}?zusammen|together with)(?!\p{L})/iu;
const SUM_COMPARED = {
  de: /(?<!\p{L})(?:billiger|günstiger|teurer|mehr als|weniger als|sparst|spart|lohnt|also)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:cheaper|dearer|more expensive|more than|less than|save|saves|worth|so)(?!\p{L})/iu,
};
/** `Wochenende gegen Wochenende`: a calque of our method (§2.19); `Looping gegen Looping` is a duel. */
const X_AGAINST_X = {
  de: /(?<!\p{L})(Wochenende|Werktag|Wochentag|Ferien|Ferientag|Feiertag|Schultag|Tag|Monat|Woche|Samstag|Sonntag|Jahr|Saison)\s+gegen\s+\1(?!\p{L})/iu,
  en: /(?<!\p{L})(weekend|weekday|holiday|day|month|week|year|season|saturday|sunday)\s+against\s+\1(?!\p{L})/iu,
  nl: /(?<!\p{L})(weekend|werkdag|vakantie|vakantiedag|feestdag|dag|maand|week|jaar|seizoen)\s+tegen\s+\1(?!\p{L})/iu,
  fr: /(?<!\p{L})(week-end|semaine|vacances|jour|mois|année|saison|férié)\s+contre\s+\1(?!\p{L})/iu,
  es: /(?<!\p{L})(fin de semana|laborable|vacaciones|festivo|día|mes|semana|año|temporada)\s+contra\s+\1(?!\p{L})/iu,
  it: /(?<!\p{L})(weekend|feriale|vacanze|festivo|giorno|mese|settimana|anno|stagione)\s+contro\s+\1(?!\p{L})/iu,
};
/** `Nach Disneys Liste:`, `From the park's list, each with an adult:` over a list. */
const LIST_SOURCE_COLON = {
  de: /^(?:Nach|Laut|Gemäß)\s[^.]{0,60}?Liste\p{L}*(?:[\s,][^.]{0,60})?:$/u,
  en: /^(?:From|According to|Per|On)\s[^.]{0,60}?(?<!\p{L})list(?!\p{L})[^.]{0,60}:$/iu,
};
/** The word for `or` beside `and`, for a list of names. */
const LIST_OR = { de: 'oder', en: 'or', nl: 'of', fr: 'ou', es: 'o|u', it: 'o' };
/** One word of a name: capitalised, a figure, or a joint (`Grand Canyon Rapids`, `Templo del Fuego`). */
const NAME_PART = /^(?:\p{Lu}[\p{L}\d'’.&-]*|\d[\d.]*|de[lr]?|of|the|von|des|du|la|el|di|van)$/u;

/** `, wo im Oktober die Fright Nights laufen`: a cause hinted at in a relative clause. */
const WHERE_MONTH = {
  de: new RegExp(`,\\s+wo\\s+(?:im|in|zu|ab)\\s+(${MONTH_DE})(?!\\p{L})`, 'u'),
  en: new RegExp(`,\\s+where\\s[^,.]{0,60}?(?<!\\p{L})in\\s+(${MONTH_EN})(?!\\p{L})`, 'u'),
};
/** Countries and regions: a heading word a chapter can drop without notice is a noun, not these. */
const COUNTRY =
  /^(?:Deutschland|Niederlanden?|Holland|Belgien|Frankreich|Spanien|Italien|Österreich|Schweiz|Großbritannien|England|Schottland|Polen|Schweden|Dänemark|Norwegen|Finnland|Tschechien|Japan|China|Kalifornien|Florida|Germany|Netherlands|Belgium|France|Spain|Italy|Austria|Switzerland|Britain|Scotland|Poland|Sweden|Denmark|Norway|Finland|Czechia|California|Europa|Europe|USA)$/u;
/** A widget that draws a park's data; `In <Park> …` over one after another is one run. */
const PARK_WIDGET =
  /^(?:stats|best-days|ride-waits|hourly-profile|weather|map|park-comparison)-widget(?!\S)/;
const IMAGE_ONLY = /^!\[[^\]]*\]\([^)]*\)$/;

/** A measurement in a caption: the figure and its unit. */
const MEASURE =
  /\d+(?:[.,]\d+)?\s?(?:cm|m|km\/h|km|Zentimetern?|Metern?|metres?|meters?|mètres?|metri|metros|centimetres?|centimeters?)(?!\p{L})/giu;

const headings = (bs, minLevel = 2, maxLevel = 3) =>
  bs.filter((b) => b.kind === 'heading' && b.level >= minLevel && b.level <= maxLevel);

/** `Wenn 2027 so läuft wie 2026`, `next year will tell`: a look at the year after the post's. */
const NEXT_YEAR = {
  de: /(?<!\p{L})(?:(?:im |das |dem )?(?:nächste|kommende)[nms]? (?:Jahr|Saison)|im Jahr darauf)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:next|the coming) (?:year|season)(?!\p{L})/iu,
};
/** A hedge or a condition: `wird 2027 eröffnet` is an announcement, `ob es 2027 so kommt` a guess. */
const OUTLOOK_VERB = {
  de: /(?<!\p{L})(?:dürfte|dürften|könnte|könnten|zeigt sich|wird sich zeigen|[Ww]enn|[Oo]b)(?!\p{L})/u,
  en: /(?<!\p{L})(?:might|could|may|[Ii]f|[Ww]hether|we['’]ll see|remains to be seen)(?!\p{L})/u,
};
const WEEKDAY_DE = 'Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonnabend|Sonntag';
const WEEKDAY_EN = 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday';
/** `fiel auf einen Samstag`, `war ein Montag`, `Der 17. Oktober, ein Samstag,`, `which fell on a Saturday`. */
const FELL_ON_WEEKDAY = {
  de: new RegExp(
    `(?:(?<!\\p{L})(?:fiel|fielen|fällt|fallen|lag|lagen)\\s+(?:\\p{L}+\\s+){0,3}?auf\\s+(?:einen|den)|(?<!\\p{L})(?:war|ist)\\s+(?:(?!(?:wie|als)\\s)[\\p{L}\\d_]+\\s+){0,6}?ein|(?<=[\\d\\p{L}]),\\s+ein)\\s+(?:${WEEKDAY_DE})(?!\\p{L})`,
    'u'
  ),
  en: new RegExp(
    `(?:(?<!\\p{L})(?:fell|falls|fall)\\s+on(?:\\s+a)?|(?<!\\p{L})(?:was|is)\\s+(?:(?!(?:as|like)\\s)[\\p{L}\\d_]+\\s+){0,6}?a|(?<=[\\d\\p{L}]),\\s+a)\\s+(?:${WEEKDAY_EN})(?!\\p{L})`,
    'u'
  ),
};
/** `fünf vollsten`, `five busiest`: a count word in front of a superlative. */
const COUNT_SUPERLATIVE = {
  de: /(?<!\p{L})(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|\d+)\s+(\p{Ll}+(?:st|ßt)(?:e|en|er|es|em))(?!\p{L})/gu,
  en: /(?<!\p{L})(?:two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(\p{Ll}+est|most\s+\p{Ll}+)(?!\p{L})/gu,
};
/** `Wer im Efteling also … schwankt, verliert …`: a rule for the reader drawn as a conclusion. */
const WHO_SO = {
  de: /^Wer\s[^,.?!]*?(?<!\p{L})also(?!\p{L})[^.?!]*,|^Wer\s[^,.?!]+,\s+(?:\p{L}+\s+){0,2}?also(?!\p{L})/u,
  en: /^So,?\s+if you\s[^.?!]+,|^If you\s[^,.?!]+,\s+(?:then\s+)?so(?!\p{L})/u,
};
/** `Danach war der Heide Park dran`, `kam … an die Reihe`, `next up was`. */
const ROUND_ROBIN = {
  de: /(?<!\p{L})(?:(?:war|waren|ist|sind)\s+(?:\p{L}+\s+){1,4}?dran|(?:kam|kamen|kommt|kommen)\s+(?:\p{L}+\s+){0,4}?an die Reihe|(?:war|ist) die Reihe an)(?!\p{L})/u,
  en: /(?<!\p{L})(?:(?:it was|it['’]s|then came)\s+(?:(?:[\p{L}-]+\s+){0,3}?[\p{L}-]+['’]s\s+)?turn|next up (?:was|is|came)|took (?:its|their) turn|(?:was|were) up next)(?!\p{L})/iu,
};
const ORDINAL_EN = 'second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth';
/**
 * `steht seitdem auf Platz drei`, `kam dort auf Platz sieben`: a new ride's place in its park's
 * own list. An award's `Platz 24 der Holzachterbahnen` names its list and is not this.
 */
const RANK_PLACE = {
  de: /(?<!\p{L})(?:seitdem|seither|dort|im Park)\s+(?:\p{L}+\s+){0,2}?auf\s+(?:den\s+)?(?:Platz|Rang|Plätzen)\s+(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)(?!\p{L})/gu,
  en: new RegExp(
    `(?<!\\p{L})(?:came in|comes in|been|ranks?|ranked|sits?|sat)\\s+(?:${ORDINAL_EN})(?:\\s+and\\s+(?:${ORDINAL_EN}))?(?:\\s+place)?\\s+(?:there|in the park|(?:ever\\s+)?since)(?!\\p{L})|(?<!\\p{L})(?:since then|there)\\s+at\\s+number\\s+\\p{L}+`,
    'gu'
  ),
};
/** `Zählt man … zusammen, kommt man auf`, `Add … up and you get`. */
const COUNT_AND_ARRIVE = {
  de: /^(?:Zählt|Rechnet|Addiert|Nimmt) man\s[^.?!]*,\s+(?:kommt|landet) man\s+auf(?!\p{L})/u,
  en: /^(?:(?:Add|Count|Total)\s[^.?!]*\s+and you (?:get|arrive at|end up with|come to|reach)|If you (?:add|count|total)\s[^,.?!]*,\s+you (?:get|arrive at|end up with|come to|reach))(?!\p{L})/u,
};
/**
 * The contrast connectors that pair two halves; one is German or English, a series is a scaffold.
 * `Genau dagegen ist alles gebaut`, `ein Bürgerbegehren dagegen.` mean "against it" and do not count.
 */
const CONTRAST_CONNECTOR = {
  de: /(?<!(?:genau|etwas|nichts|nicht|sich|was|viel|wenig)\s)(?<!\p{L})(?:dagegen|hingegen)(?=\s+\p{L})|(?<!\p{L})im Gegensatz dazu(?!\p{L})/iu,
  en: /(?<!\p{L})(?:on the other hand|by contrast|in contrast)(?!\p{L})/iu,
};
/**
 * `we count minutes, not costumes.`: a short negated twin at the end of a sentence. `nicht alle`,
 * `not all` is a share, and `not X and not Y` a list.
 */
const NOT_X_END = {
  // Since the guides of 2026-11-14 also `, kein X.`: `…, eine Gruppe, keine Rangliste.`
  de: /,\s+(?:(?:und\s+)?nicht\s+(?!(?:alle|nur|mehr|immer|ganz|so|unbedingt)(?!\p{L}))(?:(?!nicht\s)[\p{L}\d'’-]+(?:,(?=\s+(?:was|wie|wo|der|die|das)\s))?\s+){0,6}|kein(?:e[nrs]?)?\s+(?:[\p{L}'’-]+\s+){0,2})[\p{L}\d'’-]+[.!]$/u,
  en: /,\s+not\s+(?!(?:all|even|just|only|always|quite|really|much|yet|so)(?!\p{L}))(?:(?!not\s)[\p{L}\d'’-]+\s+){0,6}[\p{L}\d'’-]+[.!]$/u,
};
const NOT_X_TIME = new RegExp(
  `(?<!\\p{L})(?:${WEEKDAY_DE}|${WEEKDAY_EN}|${MONTH_DE}|${MONTH_EN}|Wochen?|weeks?|Tag|Tage|days?|Stunden?|hours?|Minuten|minutes|Wochenende|weekends?)(?!\\p{L})`,
  'iu'
);

/** A news post (`category: news` in the frontmatter), which §5.0 holds to rules of its own. */
export const isNews = (raw) =>
  /^category:\s*['"]?news\b/m.test(raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '');

/**
 * An outlet named as the speaker of a sentence (§5.0): `laut NOS`, `berichtet Omroep Flevoland`,
 * `heißt es bei 112Nederland`, `Omroep Flevoland reports`, and the twins in the other four. Italian
 * `secondo` is also the ordinal, so `il secondo giorno` is left out.
 */
const OUTLET_ATTRIBUTION = {
  de: /(?<!\p{L})(?:[Ll]aut (?:\p{Lu}|dem |der |den )|berichte(?:t|n|te|ten)(?!\p{L})|schreib(?:t|en)(?!\p{L})|schrieb(?:en)?(?!\p{L})|[Hh]eißt es (?:bei|in|im|von)|[Nn]ach Angaben (?:von|des|der)|zufolge|[Uu]nter Berufung auf|beruft sich auf|[Dd]emnach|[Nn]ach (?:diesem|dem|einem) Bericht)/u,
  en: /(?<!\p{L})(?:[Aa]ccording to|[Dd]rawing on|[Rr]eferring to|reports?(?=[ ,.])|reported|writes|wrote|[Cc]iting|cited by|quoted by|\p{Lu}[\p{L}\d]* (?:says|said|told)|(?:says|said|told) \p{Lu})/u,
  nl: /(?<!\p{L})(?:[Vv]olgens|meld(?:t|de|den)|schrijft|schreef|schreven|bericht(?:te|ten)|aldus)(?!\p{L})/u,
  fr: /(?<!\p{L})(?:[Ss]elon|[Dd]['’]après|rapporte(?:nt)?|écrit|écrivent|[Cc]it(?:e|ant)|relaie|ajoute \p{Lu}|indique \p{Lu})(?!\p{L})/u,
  es: /(?<!\p{L})(?:[Ss]egún|informa(?:n|ba|ron|ó)?|escribe|escriben|escribió|[Cc]itando|[Dd]e acuerdo con)(?!\p{L})/u,
  it: /(?<!\p{L})(?:[Ss]econdo (?!giorno|anno|me(?!\p{L}))|riporta(?:no)?|riferisc(?:e|ono)|si legge (?:su|in|nel)|scrive|scrivono|cita(?:ndo)?|[Ss]tando a|[Pp]er (?:la|il|l['’]) ?\p{Lu})(?!\p{L})/u,
};
/**
 * A sentence about a lawsuit, a court or an investigation names its side every time
 * (docs/rules/a-quote-names-its-source.md), so it does not count towards a copied report.
 */
const LEGAL_CLAIM =
  /(?<!\p{L})(?:Klage|klag|Anwält|Anwalt|Gericht|Staatsanwalt|Ermittl|lawsuit|su(?:e|ed|ing)(?!\p{L})|court|attorney|lawyer|investigat|filing|rechtbank|rechter|advoca|aanklacht|procès|tribunal|avocat|plainte|enquête|demanda|abogad|juzgado|investigación|tribunale|avvocat|indagin|denuncia)/iu;
const SOURCES_LINE = /^(?:Quellen|Sources?|Bronnen|Fuentes|Fonti)\s*:/i;
/** Where these thresholds come from is in docs/writing/5-posts-and-news.md §5.0. */
const OUTLET_SHARE = 0.25;
const OUTLET_MIN = 8;
const OUTLET_PER_PARAGRAPH = 4;

/**
 * Silence written as speech (§1.9): `haben Polizei und Walibi bisher nicht gesagt`, `sagen beide
 * Berichte nicht`, and not knowing handed to an outlet (`ist auch dem Sender nicht bekannt`).
 */
const WITHHELD_AS_SAID = {
  de: /(?<!\p{L})(?:(?:hat|haben)[^.!?]{0,80}?(?<!\p{L})(?:bisher|bislang|noch)\s+nicht\s+gesagt|sag(?:t|en)\s+(?:beide\s+|die\s+|alle\s+)?(?:Bericht|Meldung|Medien)\p{L}*\s+nicht|(?:weiß|wissen|kennt|kennen)\s+(?:der|die|das)\s+(?:Sender|Zeitung|Redaktion|Agentur)\s+nicht|(?:dem|der)\s+(?:Sender|Zeitung|Redaktion|Agentur)\s+(?:nicht\s+|un)bekannt|wissen\s+[^.!?]{0,30}?weder)/u,
  en: /(?<!\p{L})(?:(?:haven['’]t|hasn['’]t|have not|has not)\s+(?:yet\s+)?said\s+(?:whether|if|how|why|what|when|who|which)|(?:reports?|outlets?)\s+(?:don['’]t|doesn['’]t|do not|does not)\s+say|the\s+(?:broadcaster|paper|station|outlet|agency)\s+(?:doesn['’]t|does not)\s+know)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:hebben|heeft)\s+(?:\p{L}+\s+){0,6}?(?:nog\s+)?niet\s+gezegd(?!\p{L})/iu,
  fr: /(?<!\p{L})n['’](?:ont|a)\s+pas\s+(?:encore\s+)?dit(?!\p{L})/iu,
  es: /(?<!\p{L})no\s+(?:han|ha)\s+dicho(?!\p{L})/iu,
  it: /(?<!\p{L})non\s+(?:hanno|ha)\s+(?:ancora\s+)?detto(?!\p{L})/iu,
};
/** `wir` and `ich` holding something back are people deciding, and stay. */
const FIRST_PERSON = {
  de: /(?<!\p{L})(?:wir|ich)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:we|I)(?!\p{L})/u,
  nl: /(?<!\p{L})(?:wij|we|ik)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:nous|je)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:hemos|he)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:abbiamo|ho)(?!\p{L})/iu,
};

/** The question words a heading of the `Was über den Abend bekannt ist` kind opens on. */
const HEADING_QUESTION_WORD = {
  de: /^(?:Was|Wie|Wo|Wann|Warum|Wer|Welche[rsmn]?)(?!\p{L})/u,
  en: /^(?:What|How|Where|When|Why|Who|Which)(?!\p{L})/u,
  nl: /^(?:Wat|Hoe|Waar|Wanneer|Waarom|Wie|Welke)(?!\p{L})/u,
  fr: /^(?:Ce que|Ce qui|Comment|Où|Quand|Pourquoi|Qui|Quel(?:le)?s?)(?!\p{L})/u,
  es: /^(?:Qué|Lo que|Cómo|Dónde|Cuándo|Por qué|Quién(?:es)?|Cuál(?:es)?)(?!\p{L})/u,
  it: /^(?:Cosa|Che cosa|Ciò che|Quello che|Come|Dove|Quando|Perché|Chi|Quale|Quali)(?!\p{L})/u,
};

/** `weder … noch` and its twins in one sentence, and the sentence that opens on the first half. */
const NEITHER_NOR = {
  de: /(?<!\p{L})weder(?!\p{L})[^.!?]*(?<!\p{L})noch(?!\p{L})/iu,
  en: /(?<!\p{L})neither(?!\p{L})[^.!?]*(?<!\p{L})nor(?!\p{L})/iu,
  nl: /(?<!\p{L})noch(?!\p{L})[^.!?]*(?<!\p{L})noch(?!\p{L})/iu,
  fr: /(?<!\p{L})ni(?!\p{L})[^.!?]*(?<!\p{L})ni(?!\p{L})/iu,
  es: /(?<!\p{L})ni(?!\p{L})[^.!?]*(?<!\p{L})ni(?!\p{L})/iu,
  it: /(?<!\p{L})né(?!\p{L})[^.!?]*(?<!\p{L})né(?!\p{L})/iu,
};
const NEITHER_OPENER = {
  de: /^Weder(?!\p{L})/u,
  en: /^Neither(?!\p{L})/u,
  nl: /^Noch(?!\p{L})/u,
  fr: /^Ni(?!\p{L})/u,
  es: /^Ni(?!\p{L})/u,
  it: /^Né(?!\p{L})/u,
};

/**
 * `Von Gewalt distanzieren wir uns`: a press office's formula under the byline. Only the verb;
 * `nehmen wir klar Abstand davon` says the same in plain German and stays. Spanish and Italian
 * have no other verb for that plain sentence (`nos distanciamos`, `prendiamo le distanze`), so
 * they are left to the critic.
 */
const DISTANCING = {
  de: /(?<!\p{L})(?:distanzier(?:en|e|t)\s+(?:\p{L}+\s+){0,3}?(?:uns|mich)|(?:uns|mich)\s+(?:\p{L}+\s+){0,3}?(?:zu\s+)?distanzier\p{L}*)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:wants?\s+nothing\s+to\s+do\s+with|distance\s+(?:ourselves|myself))(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:distantiër\p{L}*\s+(?:wij\s+|we\s+)?(?:ons|me|mij)|(?:ons|me|mij)\s+(?:\p{L}+\s+){0,3}?distantiër\p{L}*)(?!\p{L})/iu,
  fr: /(?<!\p{L})nous\s+(?:nous\s+)?(?:désolidaris|dissoci|distanci)\p{L}*/iu,
};

/*
 * A place, then the verb that only says something is there: `Unter dem Plan steht …`, `Daneben
 * steht …`, `dabei steht nur …`. Once is a description; three in one paragraph walk the reader
 * through the screen. German puts the verb second, so the place opens the clause; English needs
 * the inversion (`Below the plan sits …`), and `in`, `on` and `at` count only with `sits` or
 * `stands`, since `In March it is hot` is no place. An article or pronoun after the place's first
 * word starts the subject (`In the week view each day sits`, `in der die Party steht`), so the
 * clause is an ordinary one and does not count.
 */
const PLACE_GAP = (subject) =>
  `(?:\\s+[^\\s,.!?;:]+(?:\\s+(?!(?:${subject})(?!\\p{L}))[^\\s,.!?;:]+){0,4}?)`;
const DE_SUBJECT =
  'der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|er|sie|es|man|ich|du|wir|ihr|jeder|jede|jedes';
const EN_SUBJECT =
  'the|a|an|each|every|this|that|these|those|its|their|your|our|my|his|her|it|there|they|we|you|he|she|i';
const PLACE_STANDS = {
  de: new RegExp(
    `(?:^|[,;:–—]\\s+)(?:(?:ganz|gleich|direkt|rechts|links)\\s+)?(?:(?:darunter|darüber|daneben|dahinter|davor|dazwischen|darin|darauf|dabei|dort|hier|oben|unten|links|rechts)${PLACE_GAP(DE_SUBJECT)}?|(?:unter|über|neben|hinter|vor|in|im|auf|am|an|bei|beim|zwischen|unterhalb|oberhalb)${PLACE_GAP(DE_SUBJECT)})\\s+(?:steht|stehen)(?!\\p{L})`,
    'giu'
  ),
  en: new RegExp(
    `(?:^|[,;:–—]\\s+)(?:(?:right|just|directly)\\s+)?(?:(?:below|above|under|underneath|beneath|beside|next\\s+to|behind|on\\s+top\\s+of|at\\s+the\\s+(?:top|bottom)\\s+of)${PLACE_GAP(EN_SUBJECT)}?\\s+(?:sits|sit|stands|stand|appears|appear|is|are)|(?:in|on|at)${PLACE_GAP(EN_SUBJECT)}\\s+(?:sits|sit|stands|stand))(?!\\p{L})`,
    'giu'
  ),
};

/* ---- 115 to 123 and the extensions, from the critics of the four multi-park guides of 2026-11-14 ---- */

/** A post about park.fan itself (`category: park-fan`), where our tools are the topic. */
const isAboutUs = (raw) =>
  /^category:\s*['"]?park-fan\b/m.test(raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '');
/** The post without its FAQ, which is read one answer at a time. */
const beforeFaq = (bs) => bs.slice(0, faq(bs).start);

/** Our own tools by the names the posts give them. */
const PRODUCT_NAME = {
  de: String.raw`(?:[\p{L}.]+-)?(?:Reiseplaner|Tagesplaner|Planer|Andrang-Kalender|Crowd-Kalender|Wartezeiten-Kalender)`,
  en: String.raw`(?:trip planner|day planner|planner|crowd calendar)`,
  nl: String.raw`(?:reisplanner|dagplanner|planner|drukte-kalender|druktekalender)`,
  fr: String.raw`(?:planificateur(?: de (?:voyage|journée))?|calendrier d['’]affluence)`,
  es: String.raw`(?:planificador(?: de viajes| del día)?|calendario de afluencia)`,
  it: String.raw`(?:pianificatore(?: di viaggio| della giornata)?|calendario (?:dell['’])?affluenza)`,
};
const PRODUCT_MENTION = Object.fromEntries(
  Object.entries(PRODUCT_NAME).map(([l, n]) => [l, new RegExp(`(?<!\\p{L})${n}(?!\\p{L})`, 'iu')])
);
/** `auch`, `too`, `the same way`: the tool does what the reader does, and follows them. */
const TOOL_ALSO =
  /(?<!\p{L})(?:auch|ebenso|genauso|too|also|as well|the same way|in the same order|ook|net zo|aussi|de même|también|igual|anche|allo stesso modo)(?!\p{L})/iu;
/** `Im Reiseplaner …`, `The trip planner allows …`: the sentence starts at the tool. */
const PRODUCT_OPENER = {
  de: new RegExp(
    `^(?:Im|Mit dem|Der|Dem|Den|Beim|Vom|Unser|Unserem|Unseren)\\s+(?:${PRODUCT_NAME.de}|Kalender)(?!\\p{L})`,
    'u'
  ),
  en: new RegExp(
    `^(?:In |With |On |For )?(?:the|our) (?:[\\p{L}.]+ )?(?:${PRODUCT_NAME.en}|calendar)(?!\\p{L})`,
    'iu'
  ),
  nl: new RegExp(
    `^(?:In |Met |Op )?(?:de|onze) (?:[\\p{L}.]+-)?(?:${PRODUCT_NAME.nl}|kalender)(?!\\p{L})`,
    'iu'
  ),
  fr: new RegExp(
    `^(?:Dans |Avec |Sur )?(?:le|notre) (?:${PRODUCT_NAME.fr}|calendrier)(?!\\p{L})`,
    'iu'
  ),
  es: new RegExp(`^(?:En |Con )?(?:el|nuestro) (?:${PRODUCT_NAME.es}|calendario)(?!\\p{L})`, 'iu'),
  it: new RegExp(
    `^(?:Nel nostro|Il nostro|Nel|Con il|Il|Sul|Col)\\s+(?:${PRODUCT_NAME.it}|calendario)(?!\\p{L})`,
    'iu'
  ),
};

/** `So …`, `That's why …`, `Deshalb …`: the consequence announced at the start of a sentence. */
const CAUSAL_OPENER = {
  de: /^(?:Deshalb|Darum|Deswegen|Daher)(?!\p{L})/u,
  en: /^(?:So(?=[\s,])(?!\s+(?:far|much|many|long|-called|called)(?!\p{L}))|That['’]s why|That is why|This is why|Which is why)(?!\p{L})/u,
  nl: /^(?:Daarom|Dus)(?!\p{L})/u,
  fr: /^(?:C['’]est pourquoi|C['’]est pour (?:ça|cela) que|Donc|Du coup)(?!\p{L})/u,
  es: /^(?:Por eso|Por (?:lo|ello) tanto|Así que)(?!\p{L})/u,
  it: /^(?:Per questo|Quindi|Perciò|Ecco perché)(?!\p{L})/u,
};
/** Causal openers per 1,000 words of running text, on top of the count of four. */
const CAUSAL_PER_1K = 1;

/** The words that make a sentence a negation. */
const NEGATION_WORD = {
  de: /(?<!\p{L})(?:nicht|kein\p{L}*|nie|niemals|nirgends|weder)(?!\p{L})/u,
  en: /(?<!\p{L})(?:not|no|never|neither|none|nothing|\p{L}+n['’]t)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:niet|geen|nooit|noch|nergens)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:pas|aucun\p{L}*|jamais|ni|nulle part)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:no|ningún|ninguna|ninguno|nunca|ni)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:non|nessun\p{L}*|mai|né)(?!\p{L})/iu,
};

/*
 * A spec attributed instead of stated (§1.2): `nach Disneys Angaben`, `nach Angaben des Parks`,
 * `nach Trainline`, `by Disney's count`, `the park gives 257 kilometres`. `laut` and `according
 * to` are left out: they are how every guide names a source once, and with them the existing
 * guides read as dense as the one the critic flagged. A sentence with a superlative or a plan is
 * a claim, which needs its source (§1.2), and does not count.
 */
const SOURCE_NAME = String.raw`\p{Lu}[\p{L}'’-]*(?:\s\p{Lu}[\p{L}'’-]*){0,2}`;
const SPEC_ATTRIBUTION = {
  de: new RegExp(
    String.raw`(?<!\p{L})(?:nach (?:${SOURCE_NAME}s |eigenen |offiziellen )?Angaben(?: (?:des|der|von) (?:${SOURCE_NAME}|\p{L}+))?|nach ${SOURCE_NAME}(?= (?:sind|hat|haben|liegt|liegen|kostet|dauert|fährt|braucht|\d))|(?:nennt|gibt) ${SOURCE_NAME} (?:[^.,]{0,30}\s)?\d)`,
    'gu'
  ),
  en: new RegExp(
    String.raw`(?<!\p{L})(?:[Bb]y (?:${SOURCE_NAME}['’]s?|the park['’]s|the operator['’]s|its own|their own) (?:count|figures?|reckoning|numbers)|(?:${SOURCE_NAME}|the park|the operator) (?:gives|puts (?:it|them) at|quotes) (?:[^.,]{0,30}\s)?\d)`,
    'gu'
  ),
};
const CLAIM_WORD =
  /(?<!\p{L})(?:\p{L}{3,}ste[nmrs]?|erste[nmrs]?|einzige[nmrs]?|\p{L}{3,}est|first|only|soll(?:en)?|geplant|wird|werden|will|plans?|planned|announced|angekündigt)(?!\p{L})/iu;
const MIN_SPEC_ATTRIBUTIONS = 6;
const SPEC_ATTRIBUTIONS_PER_1K = 2;

/** `Der Preis hängt von Größe und Strecke ab`, `the price depends on the date`: a price with no figure. */
const PRICE_DEPENDS = {
  de: /(?<!\p{L})(?:(?:der |die )?Preis\p{L}* (?:\p{L}+ ){0,2}?(?:hängt|hängen|richtet sich|richten sich|variier\p{L}*|schwank\p{L}*)|je nach [^.]{0,60}?(?:einen )?anderen Preis|kostet je nach|(?:hängt|hängen) (?:der |die )?Preis\p{L}*)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:prices? (?:\p{L}+ ){0,2}?(?:depends?|varies|vary|changes?|follows?) (?:on|by|with)|(?:a )?different price depending on|priced (?:by|according to) (?:the )?(?:date|day|demand))(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:prijs (?:\p{L}+ ){0,2}?(?:hangt af van|varieert|verschilt|wisselt)|afhankelijk van [^.]{0,60}?een andere prijs)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:prix (?:\p{L}+ ){0,2}?(?:dépend|varie|change)|un prix différent selon)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:precio (?:\p{L}+ ){0,2}?(?:depende|varía|cambia)|un precio distinto según)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:prezzo (?:\p{L}+ ){0,2}?(?:dipende|varia|cambia)|un prezzo diverso a seconda)(?!\p{L})/iu,
};
const MONEY_OR_FIGURE = /\d|[€£$¥]/u;

/** The travel-blog line that judges before the fact arrives (§2.16). */
const TEASER_PHRASE = {
  de: /(?<!\p{L})(?:geht es (?:sogar |noch )?(?:einfacher|leichter)|wird (?:es|das) (?:zu )?eine (?:kleine )?Expedition|vor eine Wahl|hatte ein anderes Jahr|erzählt eine andere Geschichte)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:makes it (?:even )?easier|turns into (?:a|quite a|something of a) (?:small |little )?expedition|leaves you (?:with )?a choice|had a different year|tells a different story)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:is het (?:nog )?makkelijker|wordt het (?:een )?(?:kleine )?expeditie|voor een keuze|had een ander jaar|vertelt een ander verhaal)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:c['’]est (?:encore )?plus simple|devient une (?:petite )?expédition|un choix à faire|a connu une autre année|raconte une autre histoire)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:es (?:aún|todavía) más fácil|se convierte en una (?:pequeña )?expedición|ante una elección|tuvo otro año|cuenta otra historia)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:è (?:ancora )?più (?:facile|semplice)|diventa una (?:piccola )?spedizione|davanti a una scelta|ha avuto un altro anno|racconta un['’]altra storia)(?!\p{L})/iu,
};

/*
 * German word order in English (§6): the object first, then the subject and a verb that has
 * nothing left to take (`Seasons, festivals and parties we enter by hand`, `A single park day you
 * plan ride by ride`), and the indirect question in front (`Whether you'll queue less …, you read
 * from the minutes`). A sentence that opens on a time or a place (`Every morning you …`) is no
 * object, and a contact clause (`The median we measure is …`) has its verb later.
 */
const OBJECT_FIRST_EN =
  /^(?!(?:In|On|At|For|From|With|Without|By|After|Before|During|Then|Now|So|If|When|Once|Today|Tomorrow|Here|There|This|That|These|Those|Next|Last|Every|Each|Some|Most|Many|All|Both|Any|Also|Still|Even|Only|Just|Sometimes|Often|Usually|Later|Earlier|Inside|Outside|Overall|Where|Whether|What|How|Which|Why|Who|You|We|I)\b)[A-Z][\p{L}'’-]*(?:,?\s(?:and\s)?(?!(?:is|are|was|were|has|have|had|if|when|because|that|which|who)\b)[\p{L}'’-]+){1,6}\s(?:we|you|I)\s(?:enter|plan|read|book|buy|pick|find|see|check|choose)\s(?!(?:the|a|an|your|our|it|them|this|that|these|those|one|its|their|my|his|her)\b)(?![^.]*\b(?:is|are|was|were|goes|gets|has|have|costs|lasts|runs)\b)/u;
const QUESTION_FIRST_EN =
  /(?:^|,\s+and\s+|^And\s+)(?:whether|which|what|how|where)\b[^,.?!]{3,120},\s+(?:you|we)\s+(?:read|see|tell|find|learn|check|work out)\b/iu;

/** A year and a first or an oldest: the founding superlative a caption reaches for. */
const FOUNDING = {
  de: /(?<!\p{L})(?:erste[nmrs]?|älteste[nmrs]?)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:first|oldest)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:eerste|oudste)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:premi(?:er|ère)s?|plus ancien(?:ne)?s?)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:primer[oa]?s?|más antigu[oa]s?)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:prim[oaie]|più antic[oaih]e?)(?!\p{L})/iu,
};
/** The captions of a post: the frontmatter's `caption:` and the second part of `![alt | caption](…)`. */
const captionsOf = (raw) => [
  ...[
    ...(raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '').matchAll(
      /^\s*caption:\s*['"]?(.+?)['"]?\s*$/gm
    ),
  ].map((m) => m[1]),
  ...[...raw.matchAll(/!\[[^\]|]*\|\s*([^\]|]+?)\s*(?:\|\s*\w+\s*)?\]\(/g)].map((m) => m[1]),
];

/** An indirect question as the subject of a verb of deciding, depending or pointing (§2.20 #5). */
const QUESTION_DECIDES = {
  de: /^(?:Wo|Ob|Was|Wie|Wann|Welche[rsmn]?|Wie ?viel\p{L}*|Wie lange?|Warum|Wieso)\s[^,.?!]{3,120},\s+(?:entscheide[tn]|entscheidet sich|hängt|hängen|bestimm(?:t|en)|legt|legen|liest|lest|schlägt|schlagen|beschreibt|beschreiben|erklärt|erklären|regelt|regeln|richtet sich|ergibt sich|machen|macht)(?!\p{L})/u,
  en: /^(?:Where|Whether|What|Which|How(?! (?:about|come))|Why)\b[^.?!,]{3,120}?\s(?:decides?|decided|depends|depend|determines?|is decided|comes down to|hinges on|is set out in|is explained in|is described in)(?!\p{L})/u,
  nl: /^(?:Waar|Of|Wat|Hoe|Wanneer|Welke)\s[^,.?!]{3,120},\s+(?:bepaalt|bepalen|beslist|hangt|hangen|lees je|legt|leggen|beschrijft|verklaart)(?!\p{L})/u,
  fr: /^(?:Où|Ce qui|Ce que|Comment|Combien|Quand|Quel(?:le)?s?)\s[^,.?!]{3,120}\s(?:décide|décident|dépend|dépendent|détermine|déterminent|se lit)(?!\p{L})/u,
  es: /^(?:Dónde|Si|Lo que|Cómo|Cuándo|Cuánt[oa]s?|Qué|Cuál(?:es)?)\s[^,.?!]{3,120}\s(?:decide|deciden|depende|dependen|determina|determinan)(?!\p{L})/u,
  it: /^(?:Dove|Se|Ciò che|Quello che|Come|Quando|Quant[oaie]|Quale|Quali)\s[^,.?!]{3,120}\s(?:decide|decidono|dipende|dipendono|determina|determinano)(?!\p{L})/u,
};

/**
 * A count and the kind of thing counted: `auf zwei Arten`, `one of three ways`, `in drei Gegenden`.
 * After an article (`les deux formules`, `the two versions`) it points back and counts nothing.
 */
const COUNT_NUMBER = {
  de: '(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|eine[nmr]? von (?:zwei|drei|vier|fünf))',
  en: '(?:two|three|four|five|six(?!\\s+Flags)|seven|eight|nine|ten|eleven|twelve|one of (?:two|three|four|five))',
  nl: '(?:twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|een van (?:de )?(?:twee|drie|vier))',
  fr: "(?:deux|trois|quatre|cinq|six(?!\\s+Flags)|sept|huit|neuf|dix|onze|douze|(?:l|d)['’]une des (?:deux|trois|quatre))",
  es: '(?:dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|una de (?:las )?(?:dos|tres|cuatro))',
  it: '(?:due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|uno dei|una delle)',
};
const COUNT_KIND_NOUN = {
  de: '(?:Arten|Wege|Wegen|Möglichkeiten|Optionen|Varianten|Gegenden|Sorten|Kategorien|Versionen)',
  en: '(?:ways|options|choices|versions|variants|kinds|areas|routes|flavou?rs)',
  nl: '(?:manieren|opties|mogelijkheden|varianten|soorten|versies|routes)',
  fr: '(?:façons|manières|options|possibilités|variantes|formules|versions|sortes)',
  es: '(?:formas|maneras|opciones|posibilidades|variantes|modalidades|versiones)',
  it: '(?:modi|opzioni|possibilità|varianti|formule|versioni)',
};
/**
 * The alternatives among them, which may stand a few words before the colon (`auf zwei Arten in
 * die Reise: als …`); `five areas: Marerijk, Reizenrijk, …` names a park's map and stays.
 */
const COUNT_WAY_NOUN = {
  de: '(?:Arten|Wege|Wegen|Möglichkeiten|Optionen|Varianten)',
  en: '(?:ways|options|choices|versions|variants)',
  nl: '(?:manieren|opties|mogelijkheden|varianten)',
  fr: '(?:façons|manières|options|possibilités|variantes|formules)',
  es: '(?:formas|maneras|opciones|posibilidades|variantes|modalidades)',
  it: '(?:modi|opzioni|possibilità|varianti|formule)',
};
const COUNT_KIND = Object.fromEntries(
  Object.keys(COUNT_NUMBER).map((l) => [
    l,
    new RegExp(
      `(?<!\\p{L})(?<!(?:die|den|der|the|both|de|les|los|las|le|i|gli)\\s)${COUNT_NUMBER[l]}\\s+(?:\\p{L}+\\s+)?${COUNT_KIND_NOUN[l]}(?!\\p{L})`,
      'iu'
    ),
  ])
);
const COUNT_KIND_END = Object.fromEntries(
  Object.keys(COUNT_KIND_NOUN).map((l) => [
    l,
    new RegExp(`${COUNT_KIND_NOUN[l]}[.:]$|${COUNT_WAY_NOUN[l]}[^.:!?]{0,40}:`, 'iu'),
  ])
);

/** A link among the first four words of a sentence or followed by six words at most. */
const linkAtEdge = (s) => {
  const words = s
    .replace(/\]\([^)]*\)/g, ']')
    .trim()
    .split(/\s+/);
  const first = words.findIndex((w) => w.includes('['));
  const last = words.findLastIndex((w) => w.includes(']'));
  return first >= 0 && (first < 4 || words.length - 1 - last <= 6);
};
/** A pointer that ends a paragraph: the verb of where-to-find, in each locale. */
const POINTER_CLOSE = {
  de: /(?<!\p{L})(?:steht|stehen|findest du|findet man|siehst du|zeigt|zeigen|beschreibt|beschreiben|erklärt|erklären|vergleicht|liest du|planst du|lässt sich|lassen sich)(?!\p{L})/u,
  en: /(?<!\p{L})(?:is in|are in|is on|are on|you['’]ll find|you can (?:see|find|compare|check)|shows?|lists?|describes?|explains?|is set out in|go(?:es)? through|works? through|you plan)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:staat|staan|vind je|zie je|toont|beschrijft|legt uit|vergelijkt|plan je)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:se trouve|se trouvent|trouveras|tu trouves|tu vois|montre|décrit|explique|compare|tu planifies)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:está|están|encontrarás|encuentras|ves|muestra|describe|explica|compara|planificas)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:si trova|si trovano|trovi|vedi|mostra|descrive|spiega|confronta|pianifichi)(?!\p{L})/iu,
};

/** `ausverkauft`, `sells out`, `en nombre limité`: what a paragraph ends on when it runs out (§2.20 #57). */
const SOLD_OUT = {
  de: /(?<!\p{L})(?:ausverkauft|vergriffen|(?:ist|sind) (?:\p{L}+ ){0,3}?(?:verkauft|weg)|Kontingent|begrenzte[rn]? (?:Menge|Zahl|Anzahl)|solange (?:der )?Vorrat|früh weg|schnell weg)(?!\p{L})/iu,
  en: /(?<!\p{L})(?:sells? out|sold out|go(?:es)? (?:early|fast|quickly)|gone (?:early|by|fast)|while (?:they|stocks?|supplies) last|limited (?:numbers|quantities|number)|(?:they|it|tickets?|passes|slots|places|seats) (?:are|is) gone)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:uitverkocht|beperkt aantal|zolang de voorraad strekt|snel weg|vroeg weg|(?:is|zijn) (?:dan |vaak |snel |al )?op(?=[.!]?$))(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:épuisée?s?|partent vite|en nombre limité|dans la limite des (?:places|stocks))(?!\p{L})/iu,
  es: /(?<!\p{L})(?:se agotan?|agota[n]?|agotad[oa]s?|vuelan|en número limitado|hasta agotar)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:esaurit[oiea]|vanno a ruba|in numero limitato|fino a esaurimento)(?!\p{L})/iu,
};

/** `X zählt als ein X`, `a day like that counts as one day` (§2.20 #11): the tautology. */
const COUNTS_AS_ITSELF = {
  de: /(?<!\p{L})(\p{L}{3,})\s+(?:zählt|zählen|gilt|gelten)\s+(?:dann\s+|also\s+|nur\s+)?als\s+(?:ein\p{L}*\s+)?\1(?!\p{L})(?!\s+(?:bis|unter|ab|wenn|solange|von|des|der|mit|\d))/iu,
  en: /(?<!\p{L})(\p{L}{3,})(?:\s+like (?:that|this))?\s+(?:counts?|counted|is counted|are counted)\s+as\s+(?:one\s+|a\s+|an\s+)?\1(?!\p{L})(?!\s+(?:until|up to|under|from|if|as long as|of|with|\d))/iu,
  nl: /(?<!\p{L})(\p{L}{3,})\s+(?:telt|tellen|geldt|gelden)\s+(?:dan\s+)?als\s+(?:een\s+|één\s+)?\1(?!\p{L})(?!\s+(?:tot|onder|vanaf|als|van|met|\d))/iu,
  fr: /(?<!\p{L})(?:(\p{L}{3,})\s+(?:compte|comptent|est compté\p{L}*)\s+(?:alors\s+)?comme\s+(?:un\s+|une\s+)?\1(?!\p{L})(?!\s+(?:jusqu|sous|dès|si|de|d['’]|du|des|avec|\d))|(?:jour|journée)\s+(?:\p{L}+\s+){0,2}?compte comme (?:un|une)(?:\s+seule?)?(?=[.,;]|$))/iu,
  es: /(?<!\p{L})(?:(\p{L}{3,})\s+(?:cuenta|cuentan|se cuenta)\s+como\s+(?:un\s+|una\s+)?\1(?!\p{L})(?!\s+(?:hasta|desde|si|de|del|con|\d))|día\s+(?:\p{L}+\s+){0,2}?cuenta como (?:uno|una?)(?:\s+solo)?(?=[.,;]|$))/iu,
  it: /(?<!\p{L})(?:(\p{L}{3,})\s+(?:conta|contano|vale|valgono|è contat\p{L})\s+come\s+(?:un\s+|una\s+|uno\s+)?\1(?!\p{L})(?!\s+(?:fino|sotto|da|se|di|del|della|con|\d))|(?:giorno|giornata)\s+(?:\p{L}+\s+){0,2}?(?:conta|vale) come (?:uno|una?)(?:\s+sola?)?(?=[.,;]|$))/iu,
};

/** `Jede Stunde weniger im Park ist auch eine Stunde weniger für Fahrten.` (§2.20 #23) */
const MIRRORED_LESS = {
  de: /(?<!\p{L})Jede[rs]?\s+(\p{L}+)\s+weniger(?!\p{L})[^.]*(?<!\p{L})auch\s+eine?[rns]?\s+\1\s+weniger(?!\p{L})/iu,
  en: /(?<!\p{L})Every\s+(\p{L}+)\s+less(?!\p{L})[^.]*(?<!\p{L})also\s+an?\s+\1\s+less(?!\p{L})/iu,
  nl: /(?<!\p{L})Elke?\s+(\p{L}+)\s+minder(?!\p{L})[^.]*(?<!\p{L})ook\s+(?:een|één)\s+\1\s+minder(?!\p{L})/iu,
  fr: /(?<!\p{L})Chaque\s+(\p{L}+)\s+de moins(?!\p{L})[^.]*(?<!\p{L})aussi\s+une?\s+\1\s+de moins(?!\p{L})/iu,
  es: /(?<!\p{L})Cada\s+(\p{L}+)\s+(?:de\s+)?menos(?!\p{L})[^.]*(?<!\p{L})también\s+una?\s+\1\s+(?:de\s+)?menos(?!\p{L})/iu,
  it: /(?<!\p{L})Ogni\s+(\p{L}+)\s+in meno(?!\p{L})[^.]*(?<!\p{L})anche\s+(?:un['’]\s*|una?\s+|uno\s+)\1\s+in meno(?!\p{L})/iu,
};

/*
 * A vague word for a set whose members the same sentence then lists (§2.20 #16): `an einige
 * Attraktionen, nach Angaben des Parks an Toutatis, OzIris, Cétautomatix …`. Three names or more
 * after it, and no `darunter`, `etwa`, `such as` between, which would make the list a sample.
 */
const PLACEHOLDER = {
  de: /(?<!\p{L})(?:einige[nrs]?|ausgewählte[nrs]?|mehrere[n]?|bestimmte[n]?|manche[n]?)\s+(?:\p{L}+\s+)?(?:Attraktionen|Bahnen|Fahrgeschäfte|Achterbahnen|Shows|Restaurants|Hotels|Parks)(?!\p{L})/u,
  en: /(?<!\p{L})(?:some|selected|several|certain|a few|a number of)\s+(?:\p{L}+\s+)?(?:attractions|rides|coasters|shows|restaurants|hotels|parks)(?!\p{L})/iu,
  nl: /(?<!\p{L})(?:enkele|sommige|bepaalde|geselecteerde|een aantal)\s+(?:\p{L}+\s+)?(?:attracties|achtbanen|shows|restaurants|hotels|parken)(?!\p{L})/iu,
  fr: /(?<!\p{L})(?:certaine?s|quelques|plusieurs)\s+(?:\p{L}+\s+)?(?:attractions|manèges|montagnes russes|spectacles|restaurants|hôtels|parcs)(?!\p{L})/iu,
  es: /(?<!\p{L})(?:algun[oa]s|ciert[oa]s|vari[oa]s|determinad[oa]s|seleccionad[oa]s)\s+(?:\p{L}+\s+)?(?:atracciones|montañas rusas|espectáculos|restaurantes|hoteles|parques)(?!\p{L})/iu,
  it: /(?<!\p{L})(?:alcun[ie]|cert[ie]|divers[ie]|selezionat[ie]|determinat[ie])\s+(?:\p{L}+\s+)?(?:attrazioni|giostre|montagne russe|spettacoli|ristoranti|hotel|parchi)(?!\p{L})/iu,
};
const SAMPLE_WORD =
  /(?<!\p{L})(?:darunter|etwa|wie|zum Beispiel|unter anderem|including|such as|among them|like|for example|e\.g|waaronder|zoals|bijvoorbeeld|dont|comme|notamment|par exemple|como|incluid[oa]s?|entre (?:ellas|ellos)|por ejemplo|tra cui|come|per esempio|ad esempio)(?!\p{L})/iu;
const NAME_LIST = /\p{Lu}[^,.:;]{0,40},\s+\p{Lu}[^,.:;]{0,40},\s+\p{Lu}/u;

/** `Beim Parc Astérix heißt der Pass Filotomatix.`, `At Disney … is called …` (§2.20 #76). */
const NAMING_OPENER = {
  de: /^(?:Im|Bei|Beim|In|Am)\s+(?:der\s+|dem\s+)?\p{Lu}[^,.]{0,40}?\s+(?:heißt|heißen)\s/u,
  en: /^(?:(?:At|In|For)\s+(?:the\s+)?\p{Lu}[^,.]{0,40}?\s+(?:[^,.]{0,60}\s)?(?:is|are) called\s|\p{Lu}[^,.]{0,40}?\s+calls? (?:its|their)\s)/u,
  nl: /^(?:In|Bij|Op)\s+(?:het\s+|de\s+)?\p{Lu}[^,.]{0,40}?\s+(?:heet|heten)\s/u,
  fr: /^(?:À|Au|Aux|Chez|Dans)\s+(?:l['’]|le\s+|la\s+)?\p{Lu}[^,.]{0,40}?,?\s+[^,.]{0,60}?s['’]appellen?t?\s/u,
  es: /^(?:En|Para)\s+(?:el\s+|la\s+)?\p{Lu}[^,.]{0,40}?,?\s+[^,.]{0,60}?se llaman?\s/u,
  it: /^(?:A|Al|All['’]|Allo|Nel|Nell['’]|In|Da)\s*\p{Lu}[^,.]{0,40}?,?\s+[^,.]{0,60}?si chiamano?\s/u,
};

/** A full date: the day as well as the month and the year (§2.20 #59). */
const FULL_DATE = new RegExp(DATE_DAY.source, 'iu');
/** A paragraph that opens on the link to a park's page: `ref:` with no ride after a slash. */
const PARK_LINK_OPENER =
  /^(?:(?:Der|Das|Die|The|Het|De|Le|La|L['’]|El|Il|Lo)\s+)?\[[^\]]+\]\(ref:(?:\/parks\/[^)\s]*|[^/)\s]+)\)/u;

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
    // Since the guides of 2026-11-14 also a verb of deciding, depending or pointing after the
    // question (`Wo du schläfst, entscheidet über …`, `What Early Entry is worth depends on the
    // day.`), three per post and in every locale. Any other verb is ordinary German.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      // Since PAR-990 also `Welche Wochentage …, haben wir in [Guide] ausgewertet.`
      const sentences = paragraphs(bs).flatMap((b) => splitSentences(b.text));
      const pointers = INDIRECT_QUESTION[locale]
        ? sentences.filter((s) => INDIRECT_QUESTION[locale].test(s) || INDIRECT_WE[locale].test(s))
        : [];
      const all = sentences.filter((s) => pointers.includes(s) || QUESTION_DECIDES[locale].test(s));
      return pointers.length >= 2 || all.length >= 3 ? all : [];
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
    // Since the guides of 2026-11-14 also a thing that counts as itself (`so ein Tag zählt als ein
    // Tag`, `with the first day counted as day one`), in every locale; the `weil` half is German
    // and English.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const split = { de: /,?\sweil\s/, en: /,?\sbecause\s/i }[locale];
      return paragraphs(bs)
        .flatMap((b) => splitSentences(b.text))
        .filter((s) => {
          if (COUNTS_AS_ITSELF[locale].test(s)) return true;
          const [main, because] = split ? s.split(split) : [s];
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
    // Since the guides of 2026-11-14 also a count of the kinds of a thing anywhere in a paragraph,
    // before a colon or as the last words (`Ein Umzugstag läuft auf eine von drei Arten ab:`, `…,
    // und es gibt ihn in zwei Varianten.`), in every locale; the short opener is German and English.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs, locale }) {
      const openers = COUNT_WORD[locale]
        ? paragraphs(bs)
            .map((b) => firstSentence(b.text))
            .filter(
              (s) =>
                wordCount(s) <= 7 &&
                // A quoted title (`aus Grimms „Die sechs Diener“`) is a name, not a count.
                COUNT_WORD[locale].test(s.replace(/[„“"«][^„“"«»”]*[“"»”]/gu, '')) &&
                !MEASURE_WORD.test(s) &&
                !CLOCK_TIME.test(s)
            )
        : [];
      const kinds = paragraphs(beforeFaq(bs)).flatMap((b) =>
        splitSentences(b.text).filter(
          (s) =>
            COUNT_KIND[locale].test(s) && (/:$/.test(s) || COUNT_KIND_END[locale].test(s.trim()))
        )
      );
      return [...new Set([...openers, ...kinds])];
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
    // Since the guides of 2026-11-14 also the vague word for a set that the same sentence then
    // lists (`einige Attraktionen, … an Toutatis, OzIris, Cétautomatix …`).
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const placeholders = paragraphs(bs).flatMap((b) =>
        [...b.text.matchAll(new RegExp(PLACEHOLDER[locale].source, 'giu'))].flatMap((m) => {
          const after = b.text.slice(m.index + m[0].length).split(/(?<=[.?])\s/)[0];
          const list = after.match(NAME_LIST);
          return list && !SAMPLE_WORD.test(after.slice(0, list.index)) ? [`${m[0]}${after}`] : [];
        })
      );
      const text = bs.map((b) => b.text).join('\n');
      const token = (n) => n.replace(/[.,]+$/, '');
      const hits = [];
      for (const m of text.matchAll(RANGE[locale])) {
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 700);
        const numbers = new Set((after.match(/\d[\d.,]*/g) ?? []).map(token));
        if (token(m[1]) !== token(m[2]) && numbers.has(token(m[1])) && numbers.has(token(m[2])))
          hits.push(m[0]);
      }
      return [...hits, ...placeholders];
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
    // Since the guides of 2026-11-14 also the maxim that mirrors itself in one sentence (`Jede
    // Stunde weniger im Park ist auch eine Stunde weniger für Fahrten.`), in every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs)
        .filter(
          (b) =>
            (GOOD_WHEN[locale]?.test(b.text) && BAD_WHEN[locale]?.test(b.text)) ||
            MIRRORED_LESS[locale].test(b.text)
        )
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
      // Since the guides of 2026-11-14 any page of the site, three paragraphs: `Jeden Tag einzeln
      // findest du im [Andrang-Kalender …](ref:…?calendar).`, `… beschreibt [So funktioniert
      // park.fan](/so-funktioniert-park-fan).` A sentence with a figure of its own or 26 words
      // carries a fact beside the link, and a line ending in a colon introduces a widget. The link
      // sits at the edge, among the first four words or the last six: a pointer is built
      // around it, while `In de ranglijst voor [Phantasialand](ref:…) is de belangrijkste kolom
      // …` only names the park.
      const ownClose = paragraphs(beforeFaq(bs))
        .map((b) => splitSentences(b.raw.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')).at(-1) ?? '')
        .filter(
          (s) =>
            ANY_SITE_LINK.test(s) &&
            POINTER_CLOSE[locale].test(s) &&
            linkAtEdge(s) &&
            !/\d/.test(s.replace(/\[[^\]]*\]\([^)]*\)/g, '')) &&
            wordCount(s) <= 25 &&
            !/:$/.test(s.trim())
        );
      return [
        // Three since PAR-990, four before.
        ...(series.length >= 3 ? series.map((b) => lastRaw(b)) : []),
        ...(ownClose.length >= 3 ? ownClose : []),
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
        splitSentences(b.raw)
          .filter(
            (s) => OWN_POST_AS_PROOF[locale].test(plain(s)) || OWN_POST_LINKED[locale]?.test(s)
          )
          .map(plain)
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
    // Regen` too. The FAQ is read answer by answer, and a table, a glossary or a gallery ends a
    // run; a park's data widget does not, since `In <Park> …` over one after another is it. The
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
          known.family.has(slugWord(name)) ||
          (name.length >= 4 && known.slugs.some((slug) => slug.startsWith(name)))
          ? m[0]
          : null;
      };
      // A park and the town it stands in are one opener: `In Rust` is `Im Europa-Park`.
      const familyOf = (o) => {
        const name = slugWord(o.match(PREP_NAME[locale])[1]);
        const slug = known.slugs.find((x) => name.length >= 4 && x.startsWith(name));
        return known.family.get(name) ?? known.family.get(slug) ?? o;
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
        else if (b.kind !== 'list' && b.kind !== 'quote' && !PARK_WIDGET.test(b.info ?? '')) {
          if (run.length >= 3) inRow.push(...run);
          run = [];
        }
      }
      if (run.length >= 3) inRow.push(...run);
      const opens = paragraphs(body).map((b) => opener(b.text));
      const count = new Map();
      for (const o of opens.filter(Boolean)) {
        const f = familyOf(o);
        count.set(f, [...(count.get(f) ?? []), o]);
      }
      const share = [...count.values()]
        .filter((list) => list.length >= 4 && list.length / opens.length > 0.2)
        .flat();
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
    run({ bs, locale, fields }) {
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
      // Since the guides of 2026-11-14 also three ends on what sells out (`An vollen Tagen ist das
      // Kontingent irgendwann verkauft.`, `On busy days it sells out.`), in the last clause and
      // with no figure there (`war am 8. Oktober ausverkauft` is news), unless the post is about
      // the sell-out, which its title then says.
      const title = fields.find(([n]) => n === 'title')?.[1] ?? '';
      const soldOut = SOLD_OUT[locale].test(title)
        ? []
        : finals.filter((s) => {
            const clause = s.split(/,\s+/).at(-1);
            return SOLD_OUT[locale].test(clause) && !/\d/.test(clause) && !SOURCES_LINE.test(s);
          });
      return [
        ...(negations.length >= 3 ? negations : []),
        ...(soldOut.length >= 3 ? soldOut : []),
        ...finals.filter((s) => counts(s) && count.get(tail(s)) >= 3),
      ];
    },
  },
  {
    id: 'cost-per-duration',
    section: '§2.20 #58',
    // `für die gut zwei Minuten Fahrt nennt der Park Kosten von 50 Millionen Euro`: a price set
    // against the length of the ride, which compares nothing. Since the critic runs of
    // 2026-10-22 also a budget in millions in the sentence after the ride's length, and any cost
    // per second (`knapp 400.000 € pro Sekunde`). A ticket price beside the length is no budget.
    // German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const length = (s) => RIDE_DURATION[locale].test(s) && RIDE_WORD[locale].test(s);
      return paragraphs(bs).flatMap((b) => {
        const list = splitSentences(b.text);
        return list.flatMap((s, i) => {
          if (COST_PER_DURATION[locale].test(s) || COST_PER_SECOND[locale].test(s)) return [s];
          if (!length(s)) return [];
          if (BIG_MONEY[locale].test(s)) return [s];
          const next = list[i + 1] ?? '';
          return BIG_MONEY[locale].test(next) && !length(next) ? [`${s} ${next}`] : [];
        });
      });
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
      // Since the guides of 2026-11-14 also two sections in a row whose first paragraphs open on a
      // park's link and give the day of its opening, with no town needed (`[SeaWorld
      // Orlando](ref:…) hat am 15. Dezember 1973 eröffnet …` / `Das [LEGOLAND Florida](ref:…) hat am
      // 15. Oktober 2011 … eröffnet …`). A ride's section opening on its date is a spec.
      const dated = (b) => {
        const s = b?.kind === 'para' ? firstSentence(b.text) : '';
        return PARK_LINK_OPENER.test(b?.raw ?? '') &&
          OPENED[locale].test(s) &&
          FULL_DATE.test(s) &&
          YEAR.test(s)
          ? s
          : null;
      };
      const starts = bs.flatMap((b, i) => (b.kind === 'heading' ? [dated(bs[i + 1])] : []));
      return [
        ...bs.flatMap((b, i) =>
          opens(b) && opens(bs[i + 1]) ? [`${opens(b)} ${opens(bs[i + 1])}`] : []
        ),
        ...starts.flatMap((s, i) => (s && starts[i + 1] ? [`${s} ${starts[i + 1]}`] : [])),
      ];
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
    // A date that opens a range (`Stand 24. Dezember 2025 bis 25. September 2026`) is the span of
    // the data, not the day somebody looked.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const stamp = (s) => {
        const m = s.match(RESEARCH_STAMP[locale]);
        return m && !RANGE_ON.test(s.slice(m.index + m[0].length));
      };
      return bs.flatMap((b, i) => {
        if (b.kind !== 'para' && b.kind !== 'list') return [];
        if (b.kind === 'para' && /:\s*$/.test(b.text) && bs[i + 1]?.kind === 'table') return [];
        return splitSentences(b.text).filter(stamp);
      });
    },
  },
  // #67 is retired: `rulebook-example` flagged a post that took the wording docs/writing/README.md
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
    // out. `im`, `in`, `bei` and an article after them are one word, so `im Europa-Park` and
    // `in Walibi Holland` share a frame. No wordlist, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const skeleton = (s) => {
        const out = [];
        (s.match(/[\p{L}\d][\p{L}\d'’.,&-]*/gu) ?? []).forEach((w, i) => {
          const low = w.toLowerCase();
          if (out.at(-1) === 'P' && FRAME_ARTICLE.test(low)) return;
          const k = /^\d/.test(w)
            ? '#'
            : i > 0 && /^\p{Lu}/u.test(w)
              ? 'X'
              : FRAME_PLACE.test(low)
                ? 'P'
                : low;
          if (!((k === 'X' || k === '#') && out.at(-1) === k)) out.push(k);
        });
        return out.slice(0, 6);
      };
      const count = new Map();
      // A figure inside a compound is part of a word (`The 1-day ticket`), not a spec.
      const firsts = paragraphs(beforeFaq(bs)).map((b) => firstSentence(b.text));
      const opens = firsts
        .map((s) => s.replace(/(?<![\d.,])\d+(?=-\p{L})/gu, 'n'))
        .filter((s) => !/\d/.test(s))
        .map((s) => [s, skeleton(s)]);
      for (const [, k] of opens)
        if (k.length === 6 && !k.includes('#') && k.filter((w) => w !== 'X').length >= 4)
          count.set(k.join(' '), (count.get(k.join(' ')) ?? 0) + 1);
      // Since the guides of 2026-11-14 also the naming frame, whatever the noun: `Beim Parc Astérix
      // heißt der frühe Einlass …`, `Bei Disney heißt der Weg …`, `Im Parc Astérix heißt der Pass …`.
      const named = firsts.filter((s) => NAMING_OPENER[locale].test(s));
      return [
        ...opens.filter(([, k]) => count.get(k.join(' ')) >= 3).map(([s]) => s),
        ...(named.length >= 3 ? named : []),
      ];
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
    // What the dash in a widget means, explained twice in one post. Two sentences with different
    // figures explain two thresholds (`unter 5 Minuten`, `weniger als 20 Messtage`), not one twice.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      const hits = paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => DASH_EXPLAINED[locale].test(s))
      );
      const key = (s) => [...new Set(figures(s))].sort().join(' ');
      return hits.filter((s) => hits.some((t) => t !== s && key(t) === key(s)));
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
    // something the reader cannot buy (docs/writing/1-substance.md §1.2). A sentence or a table cell with an
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
  {
    id: 'title-heading',
    section: '§2.20 #86',
    // `## Die schnellsten Achterbahnen Europas` under the title `Die schnellsten Achterbahnen
    // Europas`: the chapter names the post again (§4.3). The same words, or one of three or more
    // added or left out. Words only, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, fields }) {
      // The post's own title comes first; the `seo.title` under it may be what a chapter says.
      const titles = fields
        .filter(([n]) => n === 'title')
        .slice(0, 1)
        .map(([, v]) => new Set(tokens(v)));
      return headings(bs)
        .filter((h) => {
          const w = new Set(tokens(h.text));
          return titles.some((t) => {
            const [small, big] = w.size <= t.size ? [w, t] : [t, w];
            return (
              small.size >= 3 && big.size - small.size <= 1 && [...small].every((x) => big.has(x))
            );
          });
        })
        .map((h) => h.text);
    },
  },
  {
    id: 'chapter-pointer-opener',
    section: '§2.20 #87',
    // `Für Babys und Kleinkinder gibt es einen eigenen [Guide …](/blog/…).` as the first sentence
    // under a `##` or `###`: the chapter opens by sending the reader away. Twice a post; a link at
    // the end of the paragraph is the cure. German and English.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return bs.flatMap((b, i) => {
        if (b.kind !== 'heading' || b.level < 2 || b.level > 3 || bs[i + 1]?.kind !== 'para')
          return [];
        const s = splitSentences(bs[i + 1].raw)[0] ?? '';
        return OWN_POST_LINK.test(s) && CHAPTER_POINTER[locale].test(s) ? [plain(s)] : [];
      });
    },
  },
  {
    id: 'gap-above-widget',
    section: '§2.20 #88',
    // `deshalb fehlt der Kärnan unten`, `That's why Kärnan isn't in the list below`: a gap in the
    // widget nobody would have missed, reported right above it (§2.19). Say what the park does
    // instead, or nothing. Short formula, every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      return bs.flatMap((b, i) =>
        b.kind === 'para' && (isWidget(bs[i + 1]) || bs[i + 1]?.kind === 'table')
          ? splitSentences(b.text).filter(
              (s) => GAP_MISSING[locale].test(s) && GAP_BELOW[locale].test(s)
            )
          : []
      );
    },
  },
  {
    id: 'same-model-series',
    section: '§2.20 #89',
    // `dasselbe Modell wie Hyperion und Expedition GeForce`: a model pedigree read out ride after
    // ride (§3.3 rule 23). Twice a post. Short formula, every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => SAME_MODEL[locale].test(s))
      );
    },
  },
  {
    id: 'elliptic-record',
    section: '§2.20 #90',
    // `In Belgien ist es [Kondaa](ref:…) in Walibi Belgium`: which record is left to the sentence
    // before. Only with the linked name right after, so `In Paris it's offered at …` stays.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.raw)
          .filter((s) => ELLIPTIC_RECORD[locale].test(s.trim()))
          .map(plain)
      );
    },
  },
  {
    id: 'opening-date-close',
    section: '§2.20 #91',
    // `Valkyria hat im August 2018 eröffnet.`, `opened in May 2024.`, `has been running since
    // April 2024.`: the opening month tacked on as the paragraph's last words, in two paragraphs.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => OPENING_DATE_CLOSE[locale].test(s));
    },
  },
  {
    id: 'negated-measure-close',
    section: '§2.20 #92',
    // `Schneller als 85 km/h fährt sie nicht.`, `and it never goes faster than 85 km/h.` as the
    // paragraph's last sentence: a figure set up as a punchline by negation (§2.14, §2.17).
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => NEGATED_MEASURE_CLOSE[locale].test(s));
    },
  },
  {
    id: 'once-each-chain',
    section: '§2.20 #93',
    // `Bronze gilt je einmal an …. Silber gilt je einmal an …`: a data sheet of pass tiers, five
    // times a post.
    locales: ['de', 'en'],
    min: 5,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => ONCE_EACH[locale].test(s))
      );
    },
  },
  {
    id: 'queue-there-series',
    section: '§2.20 #94',
    // `…, dann ist die Warteschlange dort kürzer`: ride, time of day, `the queue there`, four times
    // a post.
    locales: ['de', 'en'],
    min: 4,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => QUEUE_THERE[locale].test(s))
      );
    },
  },
  {
    id: 'bare-sum-close',
    section: '§2.20 #95',
    // `Alle elf Einzelpässe zusammen kosten 83 €.` closing the paragraph that priced the bundle at
    // 80 €: the comparison left to the reader by juxtaposition. A sum that says what it is
    // against (`billiger`, `more than`, `so`) is the sentence the rule asks for.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter(
          (s) =>
            SUM_TOGETHER[locale].test(s) &&
            PRICE.test(s) &&
            !SUM_COMPARED[locale].test(s) &&
            !SUM_WITH.test(s)
        );
    },
  },
  {
    id: 'name-triple-echo',
    section: '§2.20 #96',
    // `Shambhala, Dragon Khan, Furius Baco und Uncharted … Shambhala, Dragon Khan, Furius Baco,
    // Stampida … vor Shambhala, Dragon Khan und Furius Baco`: the same three names in three lists
    // of one paragraph. Names and commas, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const joint = new RegExp(
        `,\\s+(?:(?:${HEADING_AND[locale]}|${LIST_OR[locale]})\\s+)?|\\s+(?:${HEADING_AND[locale]}|${LIST_OR[locale]})\\s+`,
        'u'
      );
      const isName = (item) =>
        item.length > 0 &&
        item.length <= 4 &&
        item.every((w) => NAME_PART.test(w)) &&
        /^\p{Lu}/u.test(item[0]);
      // The names of a clause's lists: an item that is all name joins the run; any other item
      // closes it with the name it starts with and opens the next with the name it ends with.
      const lists = (sentence) =>
        sentence.split(/[;:]\s+/).flatMap((clause) => {
          const runs = [];
          let run = [];
          const close = () => {
            if (run.length >= 3) runs.push(run);
            run = [];
          };
          for (const item of clause.replace(/[.!?]$/, '').split(joint)) {
            const words = item.split(/\s+/);
            if (isName(words)) {
              run.push(words.join(' '));
              continue;
            }
            const head = words.slice(
              0,
              words.findIndex((w) => !NAME_PART.test(w))
            );
            if (run.length && isName(head)) run.push(head.join(' '));
            close();
            const tail = words.slice(words.findLastIndex((w) => !NAME_PART.test(w)) + 1);
            while (tail.length && !/^[\p{Lu}\d]/u.test(tail[0])) tail.shift();
            if (isName(tail)) run.push(tail.join(' '));
          }
          close();
          return runs;
        });
      return paragraphs(bs).flatMap((b) => {
        const seen = new Map();
        for (const list of splitSentences(b.text).flatMap(lists)) {
          const keys = new Set();
          for (let j = 0; j + 3 <= list.length; j++)
            keys.add([...list.slice(j, j + 3)].sort().join(' · '));
          for (const k of keys) seen.set(k, (seen.get(k) ?? 0) + 1);
        }
        return [...seen].filter(([, n]) => n >= 3).map(([k]) => k);
      });
    },
  },
  {
    id: 'x-against-x',
    section: '§2.20 #97',
    // `Wochenende gegen Wochenende und Ferien gegen Ferien`: our comparison method as a calque
    // (§2.19), `Wochenende mit Wochenende` in German. Time words only, since `Looping gegen
    // Looping` is a duelling coaster and `schiena contro schiena` an idiom. Every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => X_AGAINST_X[locale].test(s))
      );
    },
  },
  {
    id: 'list-source-colon',
    section: '§2.20 #98',
    // `Nach Disneys Liste:`, `From the park's list, each with an adult:` right above a list: a
    // stated fact attributed to a list (§1.2), and the frame twice in a row as a rule.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return bs.flatMap((b, i) => {
        if (b.kind !== 'para' || bs[i + 1]?.kind !== 'list') return [];
        const s = lastSentence(b.text);
        return LIST_SOURCE_COLON[locale].test(s) ? [s] : [];
      });
    },
  },
  {
    id: 'widget-one-liner',
    section: '§2.20 #99',
    // `In Blackpool Pleasure Beach bleibt die Wartezeit … fast gleich.` as the whole paragraph
    // between a heading or widget and the next `hourly-profile-widget`, three times over the same
    // widget type: a caption per widget instead of prose. A line ending on a colon is the widget
    // announcement, counted there. No wordlist, so every locale.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 3,
    run({ bs }) {
      const byType = new Map();
      bs.forEach((b, i) => {
        if (b.kind !== 'para' || !isWidget(bs[i + 1]) || bs[i - 1]?.kind === 'para') return;
        if (IMAGE_ONLY.test(b.raw.trim()) || /:\s*$/.test(b.text)) return;
        const list = splitSentences(b.text);
        if (list.length !== 1) return;
        const type = bs[i + 1].info.split(/\s/)[0];
        byType.set(type, [...(byType.get(type) ?? []), list[0]]);
      });
      return [...byType.values()].filter((l) => l.length >= 3).flat();
    },
  },
  {
    id: 'where-month-cause',
    section: '§2.20 #100',
    // `Im Thorpe Park, wo im Oktober die Fright Nights laufen, war der Oktober …`: the cause hinted
    // at in a relative clause whose month the main clause names again. Say it: `Im Oktober laufen
    // die Fright Nights, und …`. German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => {
          const m = s.match(WHERE_MONTH[locale]);
          if (!m) return false;
          const rest = s.slice(0, m.index) + s.slice(m.index + m[0].length);
          return new RegExp(`(?<!\\p{L})${m[1]}(?!\\p{L})`, 'u').test(rest);
        })
      );
    },
  },
  {
    id: 'heading-and-orphan',
    section: '§2.20 #101',
    // `## Wo du in den Niederlanden und Belgien …` over a chapter that never says Belgium outside
    // a link label: the heading promises a half the text does not keep. The name after the last
    // `und`/`and` when it is a country or region (a noun like `Essen` is often said otherwise),
    // matched on its first five letters (`Belgien`, `belgischen`). German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return chaptersOf(bs, 3).flatMap((c) => {
        if (!c.heading || c.heading.level < 2 || /\?\s*$/.test(c.heading.text)) return [];
        const m = c.heading.text.match(
          new RegExp(
            `(?<!\\p{L})${HEADING_AND[locale]}\\s+(?:(?:der|die|das|den|dem|the|in|im)\\s+)?(\\p{Lu}[\\p{L}-]{3,})`,
            'gu'
          )
        );
        if (!m) return [];
        const name = m.at(-1).split(/\s+/).at(-1);
        if (!COUNTRY.test(name)) return [];
        const stem = slugWord(name).slice(0, 5);
        const text = c.blocks
          .filter((b) => b.kind !== 'heading' && b.kind !== 'fence')
          .map((b) => plain((b.raw ?? b.text).replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')))
          .join(' ');
        if (!text.trim()) return [];
        const words = (text.match(/[\p{L}-]+/gu) ?? []).map(slugWord);
        return words.some((w) => w.startsWith(stem)) ? [] : [c.heading.text];
      });
    },
  },
  {
    id: 'next-year-close',
    section: '§2.20 #102',
    // `Ob es 2027 wieder so kommt, zeigen erst die nächsten Herbstferien.` as the last line of a
    // chapter: a look ahead the data cannot back, used as a closing chord. The FAQ may ask about
    // next year; a chapter about this one ends on what it measured. German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale, raw }) {
      const postYear = Number(raw.match(/^date:\s*['"]?(\d{4})/m)?.[1] ?? 0);
      const ahead = (s) =>
        NEXT_YEAR[locale].test(s) ||
        (postYear > 0 && (s.match(/(?<!\d)20\d\d(?!\d)/g) ?? []).some((y) => Number(y) > postYear));
      return chaptersOf(bs)
        .filter((c) => c.heading && !FAQ_HEADING.test(c.heading.text))
        .flatMap((c) => {
          const last = c.blocks.filter((b) => b.kind !== 'fence').at(-1);
          if (last?.kind !== 'para') return [];
          const s = lastSentence(last.text);
          return ahead(s) && OUTLOOK_VERB[locale].test(s) ? [s] : [];
        });
    },
  },
  {
    id: 'weekday-formula',
    section: '§2.20 #103',
    // `In Spanien war der Nationalfeiertag am 12. Oktober ein Montag`, `German Unity Day, which
    // fell on a Saturday`: the weekday of a date as a clause of its own, again and again. Once
    // explains a bridge day; three times is a template. German and English.
    locales: ['de', 'en'],
    min: 3,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => FELL_ON_WEEKDAY[locale].test(s))
      );
    },
  },
  {
    id: 'count-superlative-refrain',
    section: '§2.20 #104',
    // `einer der fünf vollsten Tage` a dozen times through one post: the method's term turned
    // into a refrain. Five uses of the same count and superlative fire. German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      const seen = new Map();
      for (const b of running(bs))
        for (const m of b.text.matchAll(COUNT_SUPERLATIVE[locale])) {
          const key = m[0].toLowerCase().replace(/\s+/g, ' ');
          seen.set(key, (seen.get(key) ?? 0) + 1);
        }
      return [...seen].filter(([, n]) => n >= 5).map(([k, n]) => `${k} ×${n}`);
    },
  },
  {
    id: 'who-so-close',
    section: '§2.20 #105',
    // `Wer im Efteling also zwischen Drache und Geisterschiff schwankt, verliert mit keinem von
    // beiden Zeit.`: the paragraph's figures restated as advice with a `so` that claims a proof.
    // German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => WHO_SO[locale].test(s));
    },
  },
  {
    id: 'round-robin-connector',
    section: '§2.20 #106',
    // `Danach war der Heide Park dran`, `Dann kam Walibi an die Reihe`: parks walked through in
    // turn, as if the text were taking them in order. Twice in a post. German and English.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => ROUND_ROBIN[locale].test(s))
      );
    },
  },
  {
    id: 'rank-place-series',
    section: '§2.20 #107',
    // `stehen dort seitdem auf Platz drei und vier … kam dort auf Platz sieben`: each novelty
    // given its place in its park's list, one template per ride. A table says `Platz` as often as
    // it likes, and so does an award. Twice in running text. German and English.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).flatMap((s) => (s.match(RANK_PLACE[locale]) ?? []).map(() => s))
      );
    },
  },
  {
    id: 'count-and-arrive',
    section: '§2.20 #108',
    // `Zählt man die Ferientage zusammen, kommt man auf 31.`: the sum staged as an experiment
    // for an impersonal `man`. Say the sum. German and English.
    locales: ['de', 'en'],
    caption: true,
    min: 1,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => COUNT_AND_ARRIVE[locale].test(s))
      );
    },
  },
  {
    id: 'contrast-connector-series',
    section: '§2.20 #109',
    // `In Disney Adventure World war es dagegen …`, `In PortAventura ist die Warteschlange …
    // dagegen …`: one park set against the last one, twice in a post, so the chapters read as a
    // seesaw. Only a sentence that opens on the place counts; `dagegen` elsewhere is ordinary
    // German, and the corpus carries three in a 4,000-word guide without harm. German and English.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter(
          (s) => /^(?:In|Im|At|Bei|Beim)\s+\p{Lu}/u.test(s) && CONTRAST_CONNECTOR[locale].test(s)
        )
      );
    },
  },
  {
    id: 'not-x-close',
    section: '§2.20 #110',
    // `we count minutes, not costumes.`, `it's the park's estimate, not what a stopwatch would
    // say.`: a sentence that ends by naming what it is not. One correcting a real misreading is
    // fine; the second is a habit. A day or a duration after the `not` is visit advice (`am
    // Donnerstag, nicht am Samstag`, `eine Stunde, nicht zwanzig Minuten`) and does not count.
    // German and English.
    locales: ['de', 'en'],
    min: 2,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => {
          const m = s.match(NOT_X_END[locale]);
          // `300 Meter Strecke, zwei Züge, keine Mindestgröße.` ends a spec list, not a contrast.
          return m && !NOT_X_TIME.test(m[0]) && !(/^,\s+kein/u.test(m[0]) && /\d/.test(s));
        })
      );
    },
  },
  {
    id: 'heading-question-anaphora',
    section: '§2.20 #111',
    // `## Was über den Abend bekannt ist`, `## Was Walibi sagt`, `## Was offen ist`, `## Was
    // 2024 und 2025 passiert ist`: the chapters of a report template. Three are often the
    // visitor's questions §5.0 asks for (`Was ein Besuch kostet`), so it takes four. A heading
    // that ends in `?` is a reader's question and does not count.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale }) {
      const seen = new Map();
      for (const h of bs.filter((b) => b.kind === 'heading' && b.level === 2)) {
        // `Ce que` and `Ce qui` open the same way.
        const word = h.text.match(HEADING_QUESTION_WORD[locale])?.[0].split(' ')[0];
        if (!word || /\?\s*$/.test(h.text)) continue;
        seen.set(word, [...(seen.get(word) ?? []), h.text]);
      }
      return [...seen.values()].filter((list) => list.length >= 4).map((list) => list.join(' / '));
    },
  },
  {
    id: 'neither-nor-refrain',
    section: '§2.20 #112',
    // `Eine Zahl hat weder die Polizei noch Walibi genannt.` closing one paragraph and `Ob
    // Menschen festgenommen wurden, wissen weder … noch …` the next: the gap as a refrain. Two
    // paragraph ends, or two sentences in a row that open on `Weder`/`Neither`.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs, locale }) {
      const finals = paragraphs(bs)
        .map((b) => lastSentence(b.text))
        .filter((s) => NEITHER_NOR[locale].test(s));
      const openers = paragraphs(bs).flatMap((b) => {
        const list = splitSentences(b.text);
        return list
          .slice(1)
          .flatMap((s, i) =>
            NEITHER_OPENER[locale].test(s) && NEITHER_OPENER[locale].test(list[i])
              ? [list[i], s]
              : []
          );
      });
      // Since the guides of 2026-11-14 also the pair across a paragraph break or a heading:
      // `Neither operator runs a coach …` closing a chapter and `Neither operator sells …` opening
      // the next, or the same negated four words on both sides of a heading (`… bietet keiner der
      // beiden Betreiber an.` / `… verkauft keiner der beiden Betreiber …`).
      const seq = bs.filter((b) => b.kind === 'para' || b.kind === 'heading');
      const across = seq.flatMap((b, i) => {
        if (b.kind !== 'para') return [];
        let j = i + 1;
        while (seq[j]?.kind === 'heading') j++;
        if (seq[j]?.kind !== 'para') return [];
        const last = lastSentence(b.text);
        const first = firstSentence(seq[j].text);
        if (NEITHER_OPENER[locale].test(last) && NEITHER_OPENER[locale].test(first))
          return [last, first];
        if (j === i + 1) return [];
        const negated = [...ngrams(tokens(last), 4)].filter((g) => NEGATION_WORD[locale].test(g));
        const after = ngrams(tokens(first), 4);
        return negated.some((g) => after.has(g)) ? [last, first] : [];
      });
      return [...(finals.length >= 2 ? finals : []), ...openers, ...across];
    },
  },
  {
    id: 'distancing-formula',
    section: '§2.20 #113',
    // `Von Gewalt distanzieren wir uns bei park.fan klar`: a press office's sentence under a
    // person's byline. Say what you think of it in your own words.
    locales: ['de', 'en', 'nl', 'fr'],
    min: 1,
    run({ bs, locale }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => DISTANCING[locale].test(s))
      );
    },
  },
  {
    id: 'place-stands-tour',
    section: '§2.20 #114',
    // `Unter den Tickets steht … Daneben steht … dabei steht nur …`: the paragraph tours the
    // screen instead of saying what the reader gets. Three in one paragraph fire; say what the
    // thing does for the visitor and let the screenshot show where it is. German and English.
    locales: ['de', 'en'],
    min: 1,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) => {
        const hits = splitSentences(b.text).flatMap((sentence) =>
          [...sentence.matchAll(PLACE_STANDS[locale])].map((m) => m[0].replace(/^[,;:–—]\s+/, ''))
        );
        return hits.length >= 3 ? [`${hits.join(' / ')} ×${hits.length}`] : [];
      });
    },
  },
  {
    id: 'news-outlet-attribution',
    section: '§5.0',
    // `Die Polizei kam in den Park, berichtet Omroep Flevoland. … Laut NOS wollten sie …
    // Ähnlich formuliert es der belgische Sender VRT …`: a news post that relays reports instead
    // of telling what happened. News only; a sentence about a lawsuit or a court is left out.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale, raw }) {
      if (!isNews(raw)) return [];
      let total = 0;
      const hits = [];
      let crowded = false;
      for (const b of paragraphs(bs)) {
        if (SOURCES_LINE.test(b.text)) continue;
        const list = splitSentences(b.text);
        total += list.length;
        // A sentence ending in a colon introduces a quote, which names its source by rule.
        const own = list.filter(
          (s) => OUTLET_ATTRIBUTION[locale].test(s) && !LEGAL_CLAIM.test(s) && !/:$/.test(s)
        );
        if (own.length >= OUTLET_PER_PARAGRAPH) crowded = true;
        hits.push(...own);
      }
      const dense = hits.length >= OUTLET_MIN && hits.length / total >= OUTLET_SHARE;
      return dense || crowded ? hits : [];
    },
  },
  {
    id: 'withheld-as-said',
    section: '§1.9',
    // `Ob es Verletzte oder Festnahmen gab, haben Polizei und Walibi bisher nicht gesagt.`: what
    // someone withholds was not said. They have not announced it, a report does not name it, and
    // an open cause is unknown, not something one broadcaster fails to know.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 1,
    run({ bs, locale, fields }) {
      return [...running(bs).map((b) => b.text), ...leadFields(fields)].flatMap((text) =>
        splitSentences(text).filter(
          (s) => WITHHELD_AS_SAID[locale].test(s) && !FIRST_PERSON[locale].test(s)
        )
      );
    },
  },
  {
    id: 'product-opener-series',
    section: '§2.20 #115',
    // `Im Reiseplaner wählst du dafür …`, `The trip planner assumes …`, `Im Andrang-Kalender …`:
    // ten sentences of the Orlando guide started at our own tool and read like its manual (§2.13).
    // Five per post; a post about park.fan, where the tool is the topic, is left out.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 5,
    run({ bs, locale, raw }) {
      if (isAboutUs(raw)) return [];
      return paragraphs(beforeFaq(bs)).flatMap((b) =>
        splitSentences(b.text).filter((s) => PRODUCT_OPENER[locale].test(s))
      );
    },
  },
  {
    id: 'product-close-series',
    section: '§2.20 #116',
    // `Im Reiseplaner zählt die Extra Magic Time mit, …`, `Schließt ein Park früher, kommt im
    // Reiseplaner für den Abend …`: chapter after chapter ends on what our tool does instead of
    // what the reader can do. The tool opens the sentence or its main clause; an aside that says
    // the tool does the same (`(der Reiseplaner plant es genauso)`, `verteilt auch der
    // Reiseplaner`) follows the reader and stays. Three paragraphs; a post about park.fan is left out.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 3,
    run({ bs, locale, raw }) {
      if (isAboutUs(raw)) return [];
      return paragraphs(beforeFaq(bs))
        .map((b) => lastSentence(b.text))
        .filter((s) => {
          const t = s.replace(/\([^)]*\)/g, ' ');
          if (!PRODUCT_MENTION[locale].test(t) || TOOL_ALSO.test(t)) return false;
          const lead = (clause) => clause.split(/\s+/).slice(0, 6).join(' ');
          return t
            .split(/,\s+/)
            .slice(0, 2)
            .some((clause) => PRODUCT_MENTION[locale].test(lead(clause)));
        });
    },
  },
  {
    id: 'causal-opener-series',
    section: '§2.20 #117',
    // `So the calendar …`, `So with Universal's …`, `That's why Fuji-Q Highland …`, `Deshalb …`:
    // the consequence announced at the start of sentence after sentence. Four per post and one
    // per 1,000 words; at three, seven English posts fired on advice like `So start there`.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 4,
    run({ bs, locale }) {
      const list = paragraphs(beforeFaq(bs)).flatMap((b) => splitSentences(b.text));
      const hits = list.filter((s) => CAUSAL_OPENER[locale].test(s));
      const words = list.reduce((n, s) => n + wordCount(s), 0);
      return (hits.length / words) * 1000 >= CAUSAL_PER_1K ? hits : [];
    },
  },
  {
    id: 'negation-opener-series',
    section: '§2.20 #118',
    // `Der Parc Astérix hat keinen eigenen Bahnhof.`, `… hat nicht das ganze Jahr geöffnet.`,
    // `Für 2027 hat Disney noch keine Termine angekündigt.`: paragraph after paragraph opens on
    // what is not (§2.14, §2.19). A first sentence of ten words at most, five per post, the FAQ and
    // a bare yes or no left out.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 5,
    run({ bs, locale }) {
      return paragraphs(beforeFaq(bs))
        .map((b) => firstSentence(b.text))
        .filter(
          (s) => wordCount(s) <= 10 && !YES_NO.test(s.trim()) && NEGATION_WORD[locale].test(s)
        );
    },
  },
  {
    id: 'attribution-density',
    section: '§2.20 #119',
    // `nach Disneys Angaben` five times, `nach Angaben des Parks` four, `nach Trainline`: a spec
    // is stated, not attributed (§1.2). Six formulas and two per 1,000 words, counted in sentences
    // without a superlative or a plan; a news post is held to §5.0 instead. The four other
    // languages say `selon`, `según`, `secondo`, `volgens` for the plain `laut` as well, so a count
    // there cannot tell the formula from the one source a guide names, and they stay with the critic.
    locales: ['de', 'en'],
    min: MIN_SPEC_ATTRIBUTIONS,
    run({ bs, locale, raw }) {
      if (isNews(raw)) return [];
      const list = paragraphs(beforeFaq(bs)).flatMap((b) => splitSentences(b.text));
      const words = list.reduce((n, s) => n + wordCount(s), 0);
      const hits = list
        .filter((s) => !CLAIM_WORD.test(s))
        .flatMap((s) => s.match(SPEC_ATTRIBUTION[locale]) ?? []);
      return (hits.length / words) * 1000 >= SPEC_ATTRIBUTIONS_PER_1K ? hits : [];
    },
  },
  {
    id: 'price-without-figure',
    section: '§2.20 #120',
    // `Der Preis hängt von Größe und Strecke ab.`, `At all four, the price depends on the date.`:
    // a price that varies, with no figure in the sentence or the next (§3.3 rule 19). Two per post.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) => {
        const list = splitSentences(b.text);
        return list.filter(
          (s, i) =>
            PRICE_DEPENDS[locale].test(s) &&
            !MONEY_OR_FIGURE.test(s) &&
            !MONEY_OR_FIGURE.test(list[i + 1] ?? '')
        );
      });
    },
  },
  {
    id: 'teaser-phrase-series',
    section: '§2.20 #121',
    // `Mit dem Auto aus Belgien geht es noch einfacher.`, `Ohne Auto wird es eine kleine
    // Expedition.`, `Universal Studios Japan hatte ein anderes Jahr.`: a short line that judges
    // before the fact arrives (§2.16). Twelve words at most and no figure, two per post.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 2,
    run({ bs, locale }) {
      return paragraphs(bs).flatMap((b) =>
        splitSentences(b.text).filter(
          (s) => wordCount(s) <= 12 && !/\d/.test(s) && TEASER_PHRASE[locale].test(s)
        )
      );
    },
  },
  {
    id: 'object-first-calque',
    section: '§2.20 #122',
    // `Seasons, festivals and parties we enter by hand …`, `A single park day you plan ride by
    // ride …`, `Whether you'll queue less …, you read from the minutes.`: German word order
    // carried into English (§6). Two per post. English only: the other languages may front the
    // object.
    locales: ['en'],
    min: 2,
    run({ bs }) {
      return running(bs).flatMap((b) =>
        splitSentences(b.text).filter((s) => OBJECT_FIRST_EN.test(s) || QUESTION_FIRST_EN.test(s))
      );
    },
  },
  {
    id: 'caption-founding-series',
    section: '§2.20 #123',
    // `am 17. Juli 1955 eröffnet und damit das älteste …`, `als erstes LEGOLAND außerhalb
    // Europas`, `Die erste SeaWorld überhaupt öffnete 1964`: caption after caption built from a
    // year and a first (§5.2). Three captions of a post.
    locales: ['de', 'en', 'nl', 'fr', 'es', 'it'],
    min: 3,
    run({ raw, locale }) {
      return captionsOf(raw).filter((c) => YEAR.test(c) && FOUNDING[locale].test(c));
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
