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
 * What this cannot see, and what the read-aloud pass in docs/blog.md §7 is still for: whether a
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
const UI_EM_DASH_BASELINE = { de: 25, en: 55, es: 30, fr: 38, it: 30, nl: 39 };

/** Sentence-length variance under this reads as one flat rhythm. Supporting signal, not a verdict. */
const MIN_BURSTINESS = 0.4;
/** Negative parallelisms (`nicht … sondern`, `not just … but`) per 1,000 words. */
const MAX_PARALLELISM_PER_1K = 1.5;

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
    re: /\b(das schild|the sign|het bord|le panneau|el cartel|il cartello)\b/gi,
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
    re: /\b(delve|tapestry|underscore[sd]?|showcasing|boasts|vibrant|nestled|pivotal|meticulous\w*|robust|myriad|plethora)\b/gi,
  },
];

const PARALLELISM = /\bsondern\b|\bnot (just|only|merely)\b[^.!?]{0,60}\bbut\b/gi;

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

function sentences(text) {
  const t = text
    .replace(/\s+/g, ' ')
    .replace(/(\d)\.(\d)/g, '$1_$2')
    .replace(/\b([A-ZÄÖÜ])\./g, '$1_')
    .replace(/\b(z\. ?B|u\. ?a|ca|bzw|evtl|inkl|ggf|Nr|St|Mr|Mrs|Dr|vs|etc)\./gi, '$1');
  return t.split(/(?<=[.!?])\s+/).filter((s) => s.trim().split(/\s+/).length >= 3);
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

    const words = body.trim().split(/\s+/).length;
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
}

/* ------------------------------------------------------------------ media sidecars */

const captions = new Map(LOCALES.map((l) => [l, []]));
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
    }
  }
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
