/**
 * The writing rules in docs/blog.md, as far as a machine can decide them.
 *
 * Run: pnpm check:prose            (no network, no running site)
 *      pnpm check:prose --strict   (warnings become failures)
 *      pnpm check:prose --verbose  (print every hit, not the first few)
 *
 * docs/blog.md is the prose half of this and stays the source of truth; the lists below are its
 * executable twin, in the same sense as `attractionIsOutOfSeason()` is the SQL twin of the TS
 * season rule: hand-written, and changed in both halves or in neither.
 *
 * The split between an error and a warning is about what a regex can actually settle:
 *
 *   - An **error** is a rule with no legitimate exception. A `—` in a post body is wrong in every
 *     language we publish; `Ehrliche Reiseberichte` in a message catalog is a claim about us; a
 *     `Gerne!` there is chat register that escaped into the product.
 *   - A **warning** is a budget or a signal, and a human decides. `sondern` five times in five
 *     thousand words is normal German; `el cartel «Speed Zone»` is a sign with a name painted on
 *     it, which is the thing itself and not the prop §3.3 bans. A grep produces candidates.
 *
 * It earned its keep on the first run: `blog.intro` opened the blog index with `Ehrliche
 * Reiseberichte` / `Honest trip reports` / `Resoconti onesti` in all six languages, against a
 * rule that has been in CLAUDE.md the whole time.
 *
 * The message catalogs get a **ratchet** rather than a verdict, because they predate the rule:
 * 217 strings across six locales carry an em dash, and the count may go down but never up. That
 * keeps a green check honest instead of quarantining the debt out of sight.
 *
 * What this cannot see, and what the review pass in docs/blog.md §7.2 is still for: whether a
 * sentence claims anything (§1.7), whether a closer is decoration (§2.8), and whether six
 * captions in a row have the same skeleton (§5.2). Those are the expensive ones.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STRICT = process.argv.includes('--strict');
const VERBOSE = process.argv.includes('--verbose');

/**
 * Em dashes in `messages/<locale>.json` on the day the rule was written down (docs/blog.md §7.1).
 * Lower a number when you fix strings; never raise one.
 */
const UI_EM_DASH_BASELINE = { de: 0, en: 27, es: 0, fr: 0, it: 0, nl: 0 };

/** Sentence-length variance under this reads as one flat rhythm. Supporting signal, not a verdict. */
const MIN_BURSTINESS = 0.4;
/** Negative parallelisms (`nicht … sondern`, `not just … but`) per 1,000 words. */
const MAX_PARALLELISM_PER_1K = 1.5;
/** Exclamation marks per 1,000 words of a post (§4.5). Enthusiasm comes from the words. */
const MAX_EXCLAMATIONS_PER_1K = 1;
/** A sentence this short, three times in a row inside one paragraph, is staccato (§2.10). */
const STACCATO_MAX_WORDS = 5;
/** The product as the subject of the text, per 1,000 words (§2.13). The planner page read 8.8. */
const MAX_PRODUCT_SUBJECT_PER_1K = 6;
/** Negations per 100 words (§2.14). The German median is 1.2; the planner page read 2.8. */
const MAX_NEGATIONS_PER_100 = 2;
/** `X heißt: …` / `X means: …` per text (§2.15). */
const MAX_DEFINITION_COLONS = 2;
/**
 * Participial tails (`…, making it the tallest`) and their twins in the other five languages
 * (`…, was die Bahn zur höchsten macht`), per 1,000 words (§2.3). Measured on 2026-09-30: the
 * English posts carried 1 in 95,000 words, the English glossary 39 in 38,000.
 */
const MAX_TAILS_PER_1K = 1;
/** Below this share of contracted forms, an English text of some length reads translated (§6). */
const MIN_CONTRACTION_SHARE = 0.25;
/**
 * Colon pivots per 100 sentences of a post (§2.7): a clause, a colon, then the sentence that
 * pays it off (`Acht davon sind Überlebende: …`). The German posts averaged 11.1 on 2026-09-30,
 * the busiest three sat at 16 to 21.
 */
const MAX_COLON_PIVOTS_PER_100 = 15;
/** Share of one caption series that may be quips before the series reads templated (§5.2). */
const MAX_QUIP_SHARE = 0.4;

const BLOG = 'content/blog';
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];

/**
 * The honesty family (§3.3), in all six languages — the first version of this script checked `de`
 * and `en` and walked straight past `Resoconti onesti`, the Italian half of the same shipped
 * sentence.
 *
 * Where it counts depends on who the sentence is about, and the split is not pedantry: in a
 * message catalog or an image caption the subject is always us, so `Ehrliche Reiseberichte` is
 * the banned claim by construction. In a post body the same adjective can belong to something
 * else entirely — `eerlijke prijzen` and `prezzi onesti` both mean *fair* prices, in a paragraph
 * about a restaurant, and both are fine. So: an error in the catalogs, a candidate in the prose.
 */
const HONESTY = /\b(ehrlich\w*|honest\w*|eerlijk\w*|honnêt\w*|onest[oaie]\w*)\b/gi;
const HONESTY_LABEL = 'honesty claim (docs/blog.md §3.3) — honesty is shown, not announced';

/** Chat register that only ever arrives by paste. */
const CHAT_RESIDUE =
  /\b(gerne!|selbstverständlich!|kein problem!|great question|of course!|certainly!|i hope this helps|let me know|as an ai|as a large language model)/gi;

/** Warnings: a budget, a signal, or a candidate a person has to look at. */
const WATCH = [
  {
    what: 'the sign at the entrance (§3.3)',
    re: /\b((?:das|ein|dem|den|am|vom|beim) schild|the sign|het bord|le panneau|el cartel|il cartello)\b/gi,
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
    re: /\b(am ende des tages|der schl[üu]ssel liegt|die zahlen sprechen f[üu]r sich|die tendenz ist steigend|at the end of the day|the key is)\b/gi,
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
    re: /(?<=^|[.!?]\s+)(?:(?:dann|jetzt|hier|da) (?:wird|wurde)(?:'s| es)? (?:\p{L}+ )?(?:kurios|spannend|interessant|lustig|absurd|verrückt)|und dann (?:das|der|die) \p{L}+ste\b|interessanter (?:ist|wird)|spannend(?:er)? wird|das beste(?: daran)?:|(?:here|this) is where (?:it|things) gets?|(?:then|now) (?:it|things) gets?(?: \p{L}+)? (?:weird|interesting|strange|tricky)|the best part[:?]|here'?s the (?:kicker|twist|catch)|and then the \p{L}+est\b)/gimu,
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
    what: 'vague sentiment (§1.2)',
    re: /\b(?:enthusiasten|fans|kenner|puristen) (?:lieben|schätzen|bevorzugen|betrachten|feiern|halten|mögen|schwärmen)\b|\b(?:gilt|gelten) (?:als|unter)\b|\b(?:enthusiasts|fans|riders|purists) (?:love|prize|consider|regard|praise|celebrate|prefer|rave|adore)\b|\bis (?:widely|often|generally|commonly) (?:regarded|considered|seen|described)\b|\bwidely (?:regarded|considered|seen)\b/gi,
  },
  {
    what: 'ad copy (§3)',
    re: /(?<!\p{L})(?:atemberaubend\p{L}*|beeindruckend\p{L}*|unvergesslich\p{L}*|einzigartig\p{L}*|faszinierend\p{L}*|spektakulär\p{L}*|legendär\p{L}*|ikonisch\p{L}*|nervenkitzel pur|adrenalin pur|pures adrenalin|für die ganze familie|für groß und klein|ein echtes highlight|ein absolutes muss|im herzen von|herzstück|aushängeschild|thrill-?seekers?|adrenaline junkies?|something for everyone|fun for the whole family|hidden gem|must-(?:see|visit|do)|unforgettable|breathtaking|iconic|legendary|world-class|jaw-dropping|heart-pounding|white-knuckle|exhilarating|visceral|hallmark|centerpiece|centrepiece|showpiece|in the heart of|rich history|onvergetelijk\p{L}*|een echte aanrader|voor jong en oud|voor het hele gezin|adembenemend\p{L}*|in het hart van|sensatiezoekers?|incontournables?|inoubliables?|à couper le souffle|pour toute la famille|petits et grands|au cœur de|plongez|n[’']hésitez pas|imprescindibles?|inolvidables?|no te pierdas|sumérgete|para toda la familia|grandes y pequeños|en el corazón de|toda una experiencia|imperdibil\p{L}*|indimenticabil\p{L}*|immergiti|per tutta la famiglia|grandi e piccini|nel cuore di|da non perdere)(?!\p{L})/giu,
  },
];

/*
 * The tail a model hangs on a finished sentence to say what the fact *does* (§2.3): `…, making
 * it the tallest`, `…, was den Nervenkitzel steigert`, `…, ce qui rend`, `…, lo que convierte`.
 * One is a sentence; one per paragraph is the template the English glossary was written from.
 */
const TAILS = {
  en: /,\s(?:thus\s)?(?:making|creating|giving|adding|offering|allowing|providing|ensuring|highlighting|reflecting|showcasing|underscoring|emphasi[sz]ing|contributing to|resulting in|delivering|producing|enhancing|lending)\b/gi,
  de: /,\s(?:was|wodurch|womit)\s[^,.;]{0,80}?\b(?:macht|erzeugt|verleiht|steigert|schafft|ermöglicht|verstärkt|bietet|sorgt|beiträgt|unterstreicht|verschafft)\b/gi,
  nl: /,\s(?:wat|waardoor|waarmee)\s[^,.;]{0,80}?\b(?:maakt|zorgt|geeft|biedt|creëert|versterkt|oplevert)\b/gi,
  fr: /,\s(?:ce qui|ce qu['’]|créant|offrant|donnant|rendant|permettant|ajoutant)\b/gi,
  es: /,\s(?:lo que|lo cual|creando|ofreciendo|dando|haciendo|permitiendo|añadiendo|convirtiendo)\b/gi,
  it: /,\s(?:il che|cosa che|creando|offrendo|dando|rendendo|permettendo|aggiungendo)\b/gi,
};

const EN_FULL =
  /\b(?:do not|does not|did not|is not|are not|was not|were not|has not|have not|it is|that is|there is|you are|cannot|will not|you will|we are|they are)\b/gi;
const EN_CONTRACTED =
  /\b(?:don|doesn|didn|isn|aren|wasn|weren|hasn|haven|can|won)['’]t\b|\b(?:it|that|there)['’]s\b|\b(?:you|we|they)['’](?:re|ll)\b/gi;

/**
 * Habits a whole text can be measured for, whatever surface it came from: the participial
 * tail (§2.3) and, in English, a text that never contracts (§6).
 */
function styleHabits(file, text, locale) {
  const words = text.trim().split(/\s+/).length;
  if (words < 300) return;
  const tail = TAILS[locale];
  if (tail) {
    const hits = text.match(tail) ?? [];
    if (hits.length >= 3 && (hits.length / words) * 1000 > MAX_TAILS_PER_1K)
      warn(
        file,
        `participial tail (§2.3): ${hits.length}× in ${words} words, budget ${MAX_TAILS_PER_1K}/1k — ${[...new Set(hits.map((h) => h.trim()))].slice(0, 4).join(' ')}`
      );
  }
  if (locale === 'en' && words >= 500) {
    const full = (text.match(EN_FULL) ?? []).length;
    const contracted = (text.match(EN_CONTRACTED) ?? []).length;
    if (full >= 10 && contracted / (full + contracted) < MIN_CONTRACTION_SHARE)
      warn(
        file,
        `${contracted} contraction(s) against ${full} full forms (§6): English that never says "don't" reads translated`
      );
  }
}

/** A clause, a colon, and the sentence that pays it off (§2.7). Lists and labels are not pivots. */
const COLON_PIVOT = /(?:^|[.!?]\s+)(?:\S+\s+){2,}\S+?:\s+(?:\S+\s+){4,}\S+?[.!?](?=\s|$)/g;
function colonPivots(body) {
  let sentences = 0;
  let pivots = 0;
  for (const paragraph of body.split(/\n\s*\n/)) {
    const p = paragraph.trim().replace(/\s+/g, ' ');
    if (!p || /^([-+]|\d+\.|>|—)\s?/.test(p)) continue;
    sentences += splitSentences(p).length;
    pivots += (p.match(COLON_PIVOT) ?? []).length;
  }
  return { sentences, pivots };
}

const PARALLELISM = /\bsondern\b|\bnot (just|only|merely)\b[^.!?]{0,60}\bbut\b/gi;

/** Our own features as grammatical subject: `der Planer kennt`, `the planner says` (§2.13). */
const PRODUCT_SUBJECT =
  /\b(?:der|dem|den|des) (?:planer|tagesplaners?|kompass|assistent\w*)\b|\bthe (?:planner|compass|assistant)\b/gi;
const NEGATION = {
  de: /\b(nicht|nichts|kein\w*|nie|niemals)\b/gi,
  en: /\b(not|no|never|nothing|none|isn'?t|doesn'?t|don'?t|won'?t|can'?t)\b/gi,
};
const DEFINITION_COLON = /\b(hei(?:ß|ss)t|bedeutet|means)\s*:/gi;

/**
 * Three habits of explanatory copy that a regex can count but not judge (§2.13–§2.15): the
 * product as protagonist, a text that keeps saying what something does not do, and a run of
 * `X heißt: …` definitions. All three were measured on the planner page before they were rules.
 */
function explainerHabits(file, text, locale) {
  const words = text.trim().split(/\s+/).length;
  if (words < 300) return;
  const product = (text.match(PRODUCT_SUBJECT) ?? []).length;
  if ((product / words) * 1000 > MAX_PRODUCT_SUBJECT_PER_1K)
    warn(
      file,
      `the product as protagonist (§2.13): ${product}× in ${words} words, budget ${MAX_PRODUCT_SUBJECT_PER_1K}/1k`
    );
  const negation = NEGATION[locale];
  if (negation) {
    const n = (text.match(negation) ?? []).length;
    if ((n / words) * 100 > MAX_NEGATIONS_PER_100)
      warn(
        file,
        `${((n / words) * 100).toFixed(1)} negations per 100 words (§2.14, budget ${MAX_NEGATIONS_PER_100})`
      );
  }
  const definitions = (text.match(DEFINITION_COLON) ?? []).length;
  if (definitions > MAX_DEFINITION_COLONS)
    warn(file, `${definitions} "X heißt:" definitions (§2.15, at most ${MAX_DEFINITION_COLONS})`);
}

/*
 * A heading and the line under it (§5.6). One tell is strong enough on its own: a heading that
 * asks a question and then gives an order (`Welche Bahnen darf mein Kind fahren? Nach Körpergröße
 * nachsehen`). The rest are weak and only count when two sit in the same group of strings:
 * the reader's own voice in the heading, a dek that repeats the heading, copy that describes the
 * site instead of the thing, a dek that opens on something everybody knows, and a qualifier
 * tacked on after the sentence was finished. The homepage block that prompted this carried six.
 */
const HEADING_KEY = /(^|\.)(title|heading|headline)$/i;
const DEK_KEY = /(^|\.)(lead|subtitle|intro|dek|teaser|tagline|body|text)$/i;
/** A question, then a fragment that is not a sentence: `Sind 70 Minuten viel? Kommt drauf an …`. */
const QUESTION_THEN_FRAGMENT = /\?\s+(\S[^?]*[^.?!:…])$/;
/** …and the fragment is an order: a German infinitive at the end, or a call-to-action verb up front. */
const ORDER_FIRST_WORD =
  /^(check|find|see|discover|explore|look|plan|compare|browse|get|start|learn|try|bekijk|kijk|zoek|vind|ontdek|vergelijk|vérifiez|vérifier|voir|voyez|trouvez|trouver|découvrez|découvrir|consultez|consulter|comparez|consulta|consultar|mira|busca|buscar|descubre|descubrir|compara|controlla|controllare|guarda|vedi|trova|trovare|scopri|scoprire|confronta)\b/i;
function headingTell(heading) {
  const m = heading.trim().match(QUESTION_THEN_FRAGMENT);
  if (!m) return null;
  const words = m[1].trim().split(/\s+/);
  const germanInfinitive = words.length <= 6 && /^[a-zäöüß]+en$/.test(words.at(-1));
  // `À vérifier …`, `Da controllare …`, `Comprobarlo …`: the Romance infinitive of an instruction.
  const romanceInfinitive =
    /^(à|da)\s+\p{L}+(er|ir|re|are|ere|ire)\b/iu.test(m[1].trim()) ||
    /^\p{L}+(ar|er|ir)(lo|la|los|las)$/iu.test(words[0]);
  return germanInfinitive || romanceInfinitive || ORDER_FIRST_WORD.test(words[0])
    ? 'order'
    : 'answer';
}
/*
 * The slogan heading (§4.3): two halves around a comma that mirror each other (`Parks ohne Zahlen,
 * Tage ohne Wetter`, `Der Park macht um neun auf, die Bahn um zehn`), or a comparison where a name
 * belongs (`Ein Block pro Bahn, so hoch wie ihre Schlange`). Measured on 2,565 headings on
 * 2026-09-30: the only hits were the planner page's.
 */
const MIRROR_WORD =
  /^(ohne|mit|um|pro|für|statt|vor|nach|bis|ab|von|aus|without|with|for|per|at|until|from|zonder|met|voor|sans|avec|pour|sin|con|para|senza|per)$/i;
function sloganTell(heading) {
  const text = heading.trim();
  if (/\b(so|genauso|ebenso) \p{L}+ wie\b|\bas \p{L}+ as\b/iu.test(text)) return 'a comparison';
  const halves = text.split(/,\s+/);
  if (halves.length !== 2) return null;
  const [a, b] = halves.map((half) => half.toLowerCase().split(/\s+/));
  const mirrored = a.find((word) => MIRROR_WORD.test(word) && b.includes(word));
  return mirrored ? `two halves mirrored on "${mirrored}"` : null;
}

const headingCheck = (file, where, heading) => {
  const slogan = sloganTell(heading);
  if (slogan) warn(file, `${where}: a slogan, not a heading (§4.3), ${slogan} — "${heading}"`);
  const tell = headingTell(heading);
  if (tell === 'order')
    fail(file, `${where}: a question followed by an order (§5.6) — "${heading}"`);
  else if (tell === 'answer')
    warn(file, `${where}: a question the heading answers itself (§2.12) — "${heading}"`);
};
const READER_VOICE =
  /\b(mein|meine|meinem|meinen|meiner|ich|my|I|mijn|mon|ma|mes|mi|mis|mio|mia)\b/;
const SELF_PAGE =
  /\b(auf einer seite|(?:steht|stehen) auf dieser seite|diese seite zeigt|on one page|this page (?:shows|lists))\b/i;
const TRUISM_OPENER = /^(jede[rs]?|alle|every|each|all) \p{L}+ /iu;
const TACKED_ON =
  /,\s(?:in|mit|nach|bei|für|auf|on|with|by|at)\s[^,.]{2,40},\s(?:die|der|das|which|that)\s[^,.]{2,50}\.$/i;
const STOPWORDS = new Set(
  'aber alle auch dass dein deine deinem deinen deiner diese diesem diesen dieser dieses doch eine einem einen einer eines euch hier ihre immer jede jedem jeden jeder jedes kann kein keine mehr nach nicht noch oder ohne sich sind über unter welche welchem welchen welcher welches wenn wird darf soll muss sein your the and for with from that this which what when where each every have into than then them they their about just only also more most some such'.split(
    ' '
  )
);
const stems = (text) =>
  new Set(
    (text.toLowerCase().match(/\p{L}{4,}/gu) ?? [])
      .filter((w) => !STOPWORDS.has(w))
      .map((w) => w.slice(0, 4))
  );

function headingTells(file, groups) {
  for (const [group, entries] of groups) {
    if (/(^|\.)(seo|meta)(\.|$)/i.test(group)) continue;
    const heading = entries.find(([k]) => HEADING_KEY.test(k));
    const tells = [];
    if (heading) {
      const [, h] = heading;
      headingCheck(file, heading[0], h);
      if (h.includes('?') && READER_VOICE.test(h)) tells.push('the reader’s voice in the heading');
      const hs = stems(h);
      for (const [k, v] of entries) {
        if (!DEK_KEY.test(k) || hs.size < 2) continue;
        const shared = [...stems(v)].filter((x) => hs.has(x));
        if (shared.length >= 3 && shared.length / hs.size >= 0.5)
          tells.push(`${k.split('.').pop()} repeats the heading`);
      }
    }
    for (const [k, v] of entries) {
      const text = v.trim();
      if (SELF_PAGE.test(text)) tells.push(`${k.split('.').pop()} describes the page`);
      if (DEK_KEY.test(k) && TRUISM_OPENER.test(text))
        tells.push(`${k.split('.').pop()} opens on a truism`);
      if (TACKED_ON.test(text)) tells.push(`${k.split('.').pop()} ends on a tacked-on qualifier`);
    }
    if (tells.length >= 2)
      warn(file, `${group}: ${tells.length} heading/dek tells (§5.6): ${tells.join('; ')}`);
  }
}

const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push({ file, msg });
const warn = (file, msg) => warnings.push({ file, msg });

/* ------------------------------------------------------------------ text extraction */

/** Post body without frontmatter, HTML comments, widget fences, tables, headings and link URLs. */
function postBody(raw) {
  return raw
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*\|.*$/gm, '')
    .replace(/^\s*#{1,6} .*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '');
}

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

function splitSentences(text) {
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

function sentences(text) {
  return splitSentences(text).filter((s) => s.trim().split(/\s+/).length >= 3);
}

/** Three or more very short sentences in a row, inside one paragraph of running prose (§2.10). */
function staccatoRuns(body) {
  const runs = [];
  for (const paragraph of body.split(/\n\s*\n/)) {
    const p = paragraph.trim();
    // A list item or a quotation is not running prose, and someone else's rhythm is theirs.
    if (!p || /^([-+]|\d+\.|>)\s/.test(p)) continue;
    let run = [];
    for (const s of splitSentences(p)) {
      if (s.trim().split(/\s+/).length > STACCATO_MAX_WORDS) {
        run = [];
        continue;
      }
      run.push(s.trim());
      if (run.length === 3) runs.push(run.join(' '));
    }
  }
  return runs;
}

/**
 * `> [!QUOTE]` blocks with a problem (docs/rules/a-quote-names-its-source.md): no source line at
 * all, or a source line that says the words were translated and no `[en] …` paragraph with the
 * original. The original's paragraphs are neither the words nor the source.
 */
const ORIGINAL_PARAGRAPH = /^\[[a-z]{2}(?:-[A-Z]{2})?\]\s/;
const TRANSLATED =
  /(?<!\p{L})(übersetzt|translated|vertaald|traduit|traducid[oa]|tradott[oa])(?!\p{L})/iu;
function quoteProblems(raw) {
  const out = [];
  for (const block of raw.match(/(?:^>.*(?:\n|$))+/gm) ?? []) {
    const text = block.replace(/^>[ \t]?/gm, '');
    if (!/^\[!QUOTE\]/.test(text)) continue;
    const paragraphs = text
      .replace(/^\[!QUOTE\][ \t]*/, '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const own = paragraphs.filter((p) => !ORIGINAL_PARAGRAPH.test(p));
    const start = (own[0] ?? '').replace(/\s+/g, ' ').slice(0, 60);
    if (own.length < 2) out.push({ kind: 'unsourced', start });
    else if (TRANSLATED.test(own.at(-1)) && own.length === paragraphs.length)
      out.push({ kind: 'no original', start });
  }
  return out;
}

/**
 * The frontmatter strings that leave the page as plain text: the card, the feed item, the
 * `<title>`, the search snippet, the cover's alt and caption (§4.5). Markdown there reaches the
 * reader as asterisks.
 */
function plainTextFields(raw) {
  const lines = (raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(title|excerpt|description|alt|caption):\s*(.*)$/);
    if (!m) continue;
    let value = m[3];
    if (/^[>|]-?$/.test(value)) {
      value = '';
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim() &&
        lines[i + 1].match(/^\s*/)[0].length > m[1].length
      )
        value += ` ${lines[++i].trim()}`;
    }
    out.push([m[2], value.trim().replace(/^(['"])(.*)\1$/, '$2')]);
  }
  return out;
}

function burstiness(lengths) {
  if (lengths.length < 20) return null;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance) / mean;
}

function walkStrings(node, path = '') {
  const out = [];
  if (typeof node === 'string') out.push([path, node]);
  else if (Array.isArray(node))
    node.forEach((v, i) => out.push(...walkStrings(v, `${path}[${i}]`)));
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node))
      out.push(...walkStrings(v, path ? `${path}.${k}` : k));
  return out;
}

function filesUnder(dir, ext) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full, ext));
    else if (entry.endsWith(ext)) out.push(full);
  }
  return out;
}

/** `subject: 'us'` — a catalog string or a caption, where the honesty claim can only be about us. */
function scan(file, text, { subject } = {}) {
  const honesty = text.match(HONESTY);
  if (honesty) {
    const line = `${HONESTY_LABEL}: ${[...new Set(honesty)].slice(0, 5).join(', ')}`;
    (subject === 'us' ? fail : warn)(file, line);
  }
  for (const { what, re } of WATCH) {
    const hits = text.match(re);
    if (hits) warn(file, `${what}: ${[...new Set(hits)].slice(0, 5).join(', ')}`);
  }
}

/* ------------------------------------------------------------------ blog posts */

const metrics = [];

for (const locale of LOCALES) {
  let dir;
  try {
    dir = readdirSync(join(BLOG, locale));
  } catch {
    continue;
  }
  for (const name of dir.filter((f) => f.endsWith('.md') && f !== 'README.md')) {
    const file = join(BLOG, locale, name);
    const raw = readFileSync(file, 'utf8');
    const body = postBody(raw);

    // The only "—" a post may hold is the signature line at the very end.
    const dashes = (body.match(/—/g) ?? []).length;
    const signature = (body.match(/^—\s*\S/gm) ?? []).length;
    if (dashes - signature > 0)
      fail(
        file,
        `${dashes - signature} em dash(es) in running text (§4.1); only "— Patrick" is allowed`
      );

    scan(file, body);

    for (const [field, value] of plainTextFields(raw)) {
      if (value.includes('—')) fail(file, `${field}: em dash (§4.1)`);
      if (/\*\*|__|`|\]\(|^#/.test(value))
        fail(file, `${field}: Markdown in a plain-text field (§4.5) — "${value.slice(0, 60)}"`);
    }

    for (const { kind, start } of quoteProblems(raw))
      if (kind === 'unsourced')
        fail(
          file,
          `[!QUOTE] without a source line (docs/rules/a-quote-names-its-source.md): "${start}"`
        );
      else
        warn(
          file,
          `[!QUOTE] says it is translated and carries no "[en] …" original (docs/rules/a-quote-names-its-source.md): "${start}"`
        );

    const words = body.trim().split(/\s+/).length;

    const ellipses = (body.replace(/\[(…|\.\.\.)\]/g, '').match(/…|\.\.\./g) ?? []).length;
    if (ellipses > 1)
      warn(file, `${ellipses} ellipses (§4.5, one per post; "[…]" in a quote is exempt)`);

    const bangs = (body.replace(/\[![A-Z]+\]/g, '').match(/!/g) ?? []).length;
    if ((bangs / words) * 1000 > MAX_EXCLAMATIONS_PER_1K)
      warn(
        file,
        `${bangs} exclamation mark(s) in ${words} words (§4.5, budget ${MAX_EXCLAMATIONS_PER_1K}/1k)`
      );

    explainerHabits(file, body, locale);
    styleHabits(file, body, locale);

    const { sentences: proseSentences, pivots } = colonPivots(body);
    if (proseSentences >= 40 && (pivots / proseSentences) * 100 > MAX_COLON_PIVOTS_PER_100)
      warn(
        file,
        `${pivots} colon pivots in ${proseSentences} sentences (§2.7, budget ${MAX_COLON_PIVOTS_PER_100}/100)`
      );

    for (const heading of [
      ...plainTextFields(raw)
        .filter(([f]) => f === 'title')
        .map(([, v]) => v),
      ...[...raw.matchAll(/^#{2,3} (.+)$/gm)].map((m) => m[1]),
    ])
      headingCheck(file, 'heading', heading);

    const staccato = staccatoRuns(body);
    if (staccato.length)
      warn(file, `staccato (§2.10), ${staccato.length}×: "${staccato[0].slice(0, 90)}"`);

    const parallel = (body.match(PARALLELISM) ?? []).length;
    const per1k = (parallel / words) * 1000;
    if (per1k > MAX_PARALLELISM_PER_1K)
      warn(
        file,
        `negative parallelism ${per1k.toFixed(1)}/1k words (§2.1, budget ${MAX_PARALLELISM_PER_1K})`
      );

    const lengths = sentences(body).map((s) => s.trim().split(/\s+/).length);
    const b = burstiness(lengths);
    const commas = ((body.match(/,/g) ?? []).length / words) * 100;
    if (b !== null) {
      metrics.push({ file, locale, sentences: lengths.length, burstiness: b, commas });
      if (b < MIN_BURSTINESS)
        warn(file, `sentence-length variance ${b.toFixed(2)} (§2.9, flat under ${MIN_BURSTINESS})`);
    }
  }
}

/* ------------------------------------------------------------------ message catalogs */

for (const locale of LOCALES) {
  const file = `messages/${locale}.json`;
  let strings;
  try {
    strings = walkStrings(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    continue;
  }

  const dashed = strings.filter(([, v]) => v.includes('—'));
  const baseline = UI_EM_DASH_BASELINE[locale];
  if (baseline === undefined) {
    if (dashed.length)
      fail(file, `${dashed.length} string(s) with an em dash and no baseline (§4.1)`);
  } else if (dashed.length > baseline) {
    fail(
      file,
      `${dashed.length} string(s) with an em dash, baseline is ${baseline} (§4.1) — new ones: ` +
        dashed
          .slice(baseline)
          .map(([k]) => k)
          .join(', ')
    );
  } else if (dashed.length < baseline) {
    warn(file, `em dashes down to ${dashed.length}; lower UI_EM_DASH_BASELINE.${locale} to match`);
  }

  for (const [key, value] of strings) {
    if (CHAT_RESIDUE.test(value))
      fail(file, `${key}: chat register in a UI string (§5.1) — "${value.slice(0, 60)}"`);
    CHAT_RESIDUE.lastIndex = 0;
  }

  // A UI string is a label, not a sales pitch: an exclamation mark is nearly always the tell.
  const bangs = strings.filter(([, v]) => /!/.test(v) && !/^[A-Za-zÄÖÜäöü]+!$/.test(v.trim()));
  if (bangs.length)
    warn(
      file,
      `${bangs.length} string(s) with an exclamation mark (§5.1): ${bangs
        .slice(0, 4)
        .map(([k]) => k)
        .join(', ')}`
    );

  scan(file, strings.map(([, v]) => v).join('\n'), { subject: 'us' });

  const groups = new Map();
  for (const [key, value] of strings) {
    const parent = key.split('.').slice(0, -1).join('.');
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push([key, value]);
  }
  headingTells(file, groups);
}

/* ------------------------------------------------------------------ media sidecars */

const captions = new Map(LOCALES.map((l) => [l, []]));
/** Captions per collection directory and locale, for the series check below. */
const series = new Map();
for (const file of filesUnder('public/media', '.json')) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    continue;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
  for (const field of ['alt', 'caption']) {
    const value = data[field];
    const perLocale = typeof value === 'string' ? { de: value } : value;
    if (!perLocale || typeof perLocale !== 'object') continue;
    for (const [locale, text] of Object.entries(perLocale)) {
      if (typeof text !== 'string' || !text.trim()) continue;
      if (text.includes('—')) fail(file, `${field}.${locale}: em dash (§4.1)`);
      scan(`${file} (${field}.${locale})`, text, { subject: 'us' });
      if (field === 'caption' && captions.has(locale)) captions.get(locale).push(text.trim());
      if (field === 'caption') {
        const key = `${file.split('/').slice(0, -1).join('/')} (${locale})`;
        if (!series.has(key)) series.set(key, []);
        series.get(key).push(text.trim());
      }
    }
  }
}

/*
 * A caption may be a joke (§5.2). A series of them is a template: the seven performer photos of
 * the Halloween guide carried seven punchlines with the same beat (`… Und der ist tot.`, `Clown
 * plus Kettensäge: was soll da schon schiefgehen?`). A quip here is a caption that turns on a
 * colon into a fragment, ends on a short second sentence, opens on a one-word label sentence,
 * asks, or contrasts `nicht X, sondern Y`.
 */
function isQuip(caption) {
  const s = splitSentences(caption);
  const len = (x) => x.trim().split(/\s+/).length;
  return (
    (s.length >= 2 && (len(s.at(-1)) <= 5 || len(s[0]) <= 2)) ||
    /:\s+\p{Ll}/u.test(caption) ||
    /\?\s*$/.test(caption) ||
    /\bnicht (?:nur )?[^,.]{1,40}, sondern\b|\bman \p{L}+ nicht [^,.]{1,40}, man\b|, (?:nicht|not) [^,.]{1,40}\.$|\bnot (?:just )?[^,.]{1,40}, but\b|\byou(?:['’]re| are) not [^,.]{1,40}, you(?:['’]re| are)\b/iu.test(
      caption
    )
  );
}
for (const [key, list] of series) {
  if (list.length < 5) continue;
  const quips = list.filter(isQuip);
  if (quips.length / list.length > MAX_QUIP_SHARE)
    warn(
      key,
      `${quips.length} of ${list.length} captions are quips (§5.2): one joke is a caption, a series of them is a template — "${quips[0].slice(0, 70)}"`
    );
}

// Six captions in a row opening the same way is the set-level tell (§5.2).
for (const [locale, list] of captions) {
  if (list.length < 20) continue;
  const openers = new Map();
  for (const c of list) {
    const first = c
      .split(/\s+/)[0]
      .toLowerCase()
      .replace(/[^\p{L}]/gu, '');
    openers.set(first, (openers.get(first) ?? 0) + 1);
  }
  const [word, count] = [...openers].sort((a, b) => b[1] - a[1])[0];
  const share = (count / list.length) * 100;
  if (share > 20)
    warn(
      `public/media (${locale})`,
      `${count} of ${list.length} captions (${share.toFixed(0)} %) open with "${word}" (§5.2)`
    );
}

/* ------------------------------------------------- content pages outside the blog */

/*
 * The glossary, the guide page, the Fancast page and the season banner are prose a
 * reader meets, and until this section existed none of them was checked: 287 KB of
 * German glossary carried machine-translation artefacts and three claims the rest of
 * the site contradicts, and the Fancast page used `ehrlich` three times — the one word
 * docs/blog.md bans outright. A green build showed none of it.
 *
 * These are source files, so the prose has to be lifted out of the code first: string
 * literals long enough to be a sentence, plus JSX text nodes. Identifiers and class
 * names never reach `scan`, which is what keeps `robust` in a prop from reading as the
 * AI vocabulary it is in a paragraph.
 */
function proseFromSource(src) {
  const out = [];
  // Comments first: they are English code documentation, where an em dash is correct
  // and none of these rules apply. Leaving them in reported the one JSDoc dash on the
  // guide page as a prose error on a page whose prose is clean.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, ' ');
  // Quoted literals that read as prose: a space, and not a path/class/import specifier.
  for (const m of code.matchAll(/(['"`])((?:\\.|(?!\1)[^\\]){25,})\1/g)) {
    const text = m[2];
    if (!/\s/.test(text)) continue;
    if (/^[\w@./-]+$/.test(text)) continue; // module specifier or path
    if (/^[a-z-]+(\s+[a-z0-9:[\]#/.%-]+)+$/i.test(text) && !/[.,;!?]/.test(text)) continue; // class list
    out.push(text.replace(/\\n/g, '\n').replace(/\\'/g, "'"));
  }
  // JSX text nodes: what sits between tags, with expressions stripped.
  for (const m of code.matchAll(/>([^<>{}]{25,})</g)) out.push(m[1]);
  return out.join('\n');
}

/*
 * Every per-locale content directory in the app, plus the glossary and the season
 * banner. The list is spelled out rather than globbed so that adding a page is a
 * deliberate line here — a `content/<locale>.tsx` that nobody added stays unchecked,
 * which is how the glossary went 274 terms without anyone reading them.
 */
const CONTENT_ROUTES = [
  'how-park-fan-works',
  'fancast',
  'best-time-to-visit',
  'trip-planner',
  'datenschutz',
  'impressum',
];

/*
 * The hero and meta copy of the landing pages is not in `content/<locale>.tsx` but in a
 * `PAGE_HEADERS` object in the route's `page.tsx`, all six locales in one file, and it is the
 * first text on the page (`70 Minuten bei Taron. Viel? Normal? …`). Until 2026-09-30 nothing
 * read it.
 */
const HEADER_ROUTES = ['how-park-fan-works', 'fancast', 'best-time-to-visit', 'trip-planner'];

const CONTENT_PAGES = [
  ...LOCALES.map((l) => [`content/glossary/${l}.ts`, l]),
  ...CONTENT_ROUTES.flatMap((route) =>
    LOCALES.map((l) => [`app/[locale]/${route}/content/${l}.tsx`, l])
  ),
  ...LOCALES.map((l) => [`content/home/announce.${l}.md`, l]),
  // English only, and public: the changelog at /en/changelog, the three published agent skills
  // and /llms.txt. Machine-facing text is read by people when something breaks (§5.5).
  ...filesUnder('content/changelog', '.md')
    .filter((f) => !f.endsWith('README.md'))
    .map((f) => [f, 'en']),
  ...filesUnder('content/agent-skills', '.md').map((f) => [f, 'en']),
  ['app/llms.txt/route.ts', 'en'],
];

/** `{ de: {…}, en: {…} }` inside a `page.tsx`: the lines of each locale's block, joined. */
function localeBlocks(src) {
  const out = new Map();
  let current = null;
  for (const line of src.split('\n')) {
    const open = line.match(/^ {2}(de|en|nl|fr|es|it): [{[]/);
    if (open) current = open[1];
    if (current) out.set(current, `${out.get(current) ?? ''}${line}\n`);
    if (current && /^ {2}[}\]],?$/.test(line)) current = null;
  }
  return out;
}

/** Glossary terms: the `id`, and every prose literal until the next term. */
function glossaryTerms(src) {
  return src
    .split(/^ {4}id: '/m)
    .slice(1)
    .map((part) => [part.slice(0, part.indexOf("'")), proseFromSource(part)]);
}

/*
 * The glossary is 274 terms in one file per locale, and a file-level hit (`AI vocabulary:
 * unprecedented`) does not say which of them to open. So it is scanned per term and reported per
 * rule with the term ids. It is also where the participial tail lived: 39 in the English file on
 * 2026-09-30, against one in all 22 English posts.
 */
function scanTerms(file, terms, locale) {
  const byRule = new Map();
  const note = (what, id, hits) => {
    if (!byRule.has(what)) byRule.set(what, []);
    byRule
      .get(what)
      .push(`${id} (${[...new Set(hits.map((h) => h.trim()))].slice(0, 2).join(', ')})`);
  };
  for (const [id, text] of terms) {
    const honesty = text.match(HONESTY);
    if (honesty) fail(file, `${id}: ${HONESTY_LABEL}: ${[...new Set(honesty)].join(', ')}`);
    for (const { what, re } of WATCH) {
      const hits = text.match(re);
      if (hits) note(what, id, hits);
    }
    const tails = text.match(TAILS[locale]);
    if (tails) note('participial tail (§2.3)', id, tails);
  }
  for (const [what, list] of byRule) {
    const shown = VERBOSE ? list : list.slice(0, 6);
    warn(
      file,
      `${what} in ${list.length} term(s): ${shown.join('; ')}${list.length > shown.length ? '; …' : ''}`
    );
  }
}

function checkPage(file, locale, text, raw) {
  // German and Dutch take the en dash for a parenthetical; the em dash is the wrong
  // character before it is a tell (§4.1, §6).
  const dashes = (text.match(/—/g) ?? []).length;
  if (dashes && (locale === 'de' || locale === 'nl'))
    fail(file, `${dashes} em dash(es) in prose (§4.1) — ${locale} takes "–"`);
  else if (dashes) warn(file, `${dashes} em dash(es) in prose (§4.1)`);

  if (file.startsWith('content/glossary/')) {
    // A reference text: no contraction budget, but every term on its own.
    scanTerms(file, glossaryTerms(raw), locale);
    explainerHabits(file, text, locale);
    return;
  }
  // A page is us talking about ourselves, same as a catalog string.
  scan(file, text, { subject: 'us' });
  explainerHabits(file, text, locale);
  styleHabits(file, text, locale);
  for (const m of raw.matchAll(/\btitle="([^"]+)"/g)) headingCheck(file, 'title', m[1]);
}

for (const [file, locale] of CONTENT_PAGES) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    continue; // not every locale publishes every page
  }
  const text = file.endsWith('.md') ? postBody(raw) : proseFromSource(raw);
  if (!text.trim()) continue;
  checkPage(file, locale, text, raw);
}

for (const route of HEADER_ROUTES) {
  const file = `app/[locale]/${route}/page.tsx`;
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const [locale, block] of localeBlocks(raw)) {
    const text = proseFromSource(block);
    if (!text.trim()) continue;
    checkPage(`${file} (${locale})`, locale, text, block);
    // The tagline is a heading in all but name: the same two tells apply (§2.12, §5.6).
    for (const m of block.matchAll(/\b(?:title|tagline|metaTitle): '([^']+)'/g))
      headingCheck(`${file} (${locale})`, 'heading', m[1]);
  }
}

/* ------------------------------------------------------------------ report */

const show = (list, label) => {
  if (!list.length) return;
  console.log(`\n${label}`);
  const limit = VERBOSE ? list.length : 40;
  for (const { file, msg } of list.slice(0, limit)) console.log(`  ${file}\n    ${msg}`);
  if (list.length > limit) console.log(`  … and ${list.length - limit} more (--verbose)`);
};

if (metrics.length) {
  console.log(
    'Prose metrics (§2.9) — burstiness under 0.4 is flat, commas thin under ~4 per 100 words\n'
  );
  for (const locale of LOCALES) {
    const rows = metrics.filter((m) => m.locale === locale);
    if (!rows.length) continue;
    const mean = (f) => rows.reduce((a, r) => a + f(r), 0) / rows.length;
    const bs = rows.map((r) => r.burstiness);
    console.log(
      `  ${locale}: ${rows.length} posts, burstiness ${mean((r) => r.burstiness).toFixed(2)} ` +
        `(${Math.min(...bs).toFixed(2)}–${Math.max(...bs).toFixed(2)}), commas ${mean((r) => r.commas).toFixed(1)}/100w`
    );
  }
}

show(warnings, `Warnings — candidates, not verdicts (${warnings.length}):`);
show(errors, `Errors (${errors.length}):`);

console.log(
  `\n${errors.length} error(s), ${warnings.length} warning(s). Rules: docs/blog.md` +
    (STRICT ? ' — --strict: warnings count as errors.' : '')
);

process.exit(errors.length || (STRICT && warnings.length) ? 1 : 0);
