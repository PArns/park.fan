/**
 * One positive and one negative case per prose pattern in `scripts/prose-slop-patterns.mjs`
 * (docs/blog.md §2.20). The positive cases are the sentences the critic quoted on 2026-10-13, so a
 * rule that stops catching its own evidence fails here instead of in the next twelve guides.
 *
 * Run: pnpm test:prose-rules
 */
import assert from 'node:assert/strict';
import {
  DATE_LINE_START,
  SLOP_RULES,
  blocks,
  slopFindings,
  splitSentences,
} from './prose-slop-patterns.mjs';

let cases = 0;
const fires = (id, md, locale = 'de', fields = []) => {
  const rule = SLOP_RULES.find((r) => r.id === id);
  assert.ok(rule, `no rule named ${id}`);
  return slopFindings(md, locale, fields, [rule]).length > 0;
};
const yes = (id, md, locale, fields) => {
  cases++;
  assert.ok(fires(id, md, locale, fields), `${id} (${locale ?? 'de'}) should fire on:\n${md}`);
};
const no = (id, md, locale, fields) => {
  cases++;
  assert.ok(
    !fires(id, md, locale, fields),
    `${id} (${locale ?? 'de'}) should stay quiet on:\n${md}`
  );
};
const lines = (...l) => l.join('\n\n');
const fence = '```ride-waits-widget park=x\n```';

// The sentence splitter keeps a German date in one piece.
cases++;
assert.equal(splitSentences('Er öffnet am 27. September. Dann ist Schluss.').length, 2);

// Block parser: a fence is one block, and neighbours are what sits next to each other.
cases++;
assert.deepEqual(
  blocks(lines('Vorher:', fence, 'Danach.')).map((b) => b.kind),
  ['para', 'fence', 'para']
);

// 1 origin-refrain
yes(
  'origin-refrain',
  lines(
    'Erster Abschnitt. Eine Seite von Universal, die das bestätigt, konnten wir nicht abrufen.',
    'Zweiter Abschnitt. Eine Seite von Universal, die das bestätigt, konnten wir nicht abrufen.'
  )
);
yes(
  'origin-refrain',
  lines(
    'Prices differ. We could not retrieve a Universal page that confirms this.',
    'Hours differ. We could not retrieve a Universal page that confirms this.'
  ),
  'en'
);
no(
  'origin-refrain',
  'Der Park öffnet um neun. Eine Seite von Universal konnten wir nicht abrufen.'
);

// 2 heading-triple
yes(
  'heading-triple',
  lines(
    '## Express Pass: Pakete, Preise, Zeitfenster',
    '## Die App: Zeitfenster, Yoyakunori, Standby',
    '## Mindestgrößen, Begleitperson, Metalldetektor'
  )
);
no('heading-triple', lines('## Express Pass: Pakete, Preise, Zeitfenster', '## Wann du fährst'));
no('heading-triple', lines('## Preise und Zeitfenster', '## Die App', '## Anreise mit der Bahn'));

no(
  'heading-triple',
  lines(
    '## Altura mínima y acompañante en las atracciones',
    '## Qué hay en cada zona temática',
    '## Cierres y novedades en los Studios'
  ),
  'es'
);
no(
  'heading-triple',
  lines(
    '## Speed of Sound, 5,2 g dall’anno 2000',
    '## Goliath, 46 m e 106 km/h',
    '## Untamed, 2019'
  ),
  'it'
);

// 3 name-colon-subheading
yes(
  'name-colon-subheading',
  lines(
    '### Hugin und Munin: das Duell',
    '### Vikingløp: Kopf voraus',
    '### Stormvind: die Trommel',
    '### Loke: der Schneider'
  )
);
no(
  'name-colon-subheading',
  lines(
    '### Hugin und Munin: das Duell',
    '### Vikingløp: Kopf voraus',
    '### Wann ist am wenigsten los?'
  )
);

// 4 handoff-object-first
yes(
  'handoff-object-first',
  lines(
    'Wie teuer es wird, hängt vom Tag ab. Den Preis für deinen Tag nennt der Park im Buchungsablauf.',
    'Im Winter ist es leerer. Der Winter-Überblick vergleicht das mit anderen Parks.'
  )
);
yes(
  'handoff-object-first',
  lines(
    'It is a wooden coaster. A wooden coaster with a different history is described in the guide to Heide Park.',
    'It is a quiet park. The winter overview compares this with other parks.'
  ),
  'en'
);
no('handoff-object-first', 'Der Park öffnet um neun. Der Guide zu Heide Park ist verlinkt.');

// 5 indirect-question-subject
yes(
  'indirect-question-subject',
  lines(
    'Welcher Preis für deinen Tag gilt, steht im Kalender des Ticketshops.',
    'Wann die Brücke gesperrt ist, steht in der Betriebsmeldung.'
  )
);
yes(
  'indirect-question-subject',
  lines(
    'Which months and weekdays those are is in the statistics:',
    'Which rides close first is in the park app.'
  ),
  'en'
);
no('indirect-question-subject', 'Der Preis steht im Kalender des Ticketshops.');

// 6 widget-announcement
yes(
  'widget-announcement',
  lines(
    'Wie die Warteschlangen über den Tag wachsen:',
    fence,
    'Die ruhigsten kommenden Tage:',
    fence
  )
);
yes(
  'widget-announcement',
  lines('The months and weekdays from our measurements:', fence, 'The slowest days:', fence),
  'en'
);
yes(
  'widget-announcement',
  lines('Hoe de rijen groeien:', fence, 'De rustigste dagen:', fence),
  'nl'
);
yes(
  'widget-announcement',
  lines(
    'Der Wochentag macht den größten Unterschied, und die Spanne reicht von leer bis voll, wie die Messungen der letzten zwölf Monate an allen Bahnen zeigen. Hier sind die ruhigsten kommenden Tage:',
    fence,
    'Das Wetter im Park, genau jetzt:',
    fence
  )
);
no(
  'widget-announcement',
  lines('Die Tabelle steht unten.', fence, 'Danach geht es weiter.', fence)
);
no('widget-announcement', lines('Es gilt Folgendes:', 'Ein normaler Absatz.', fence));

// 7 conditional-opener-series
yes(
  'conditional-opener-series',
  lines(
    'Wer mit Kindern unter 120 cm kommt, fährt zuerst die Familienbahnen. Wer unter der Woche im September fährt, hat Ruhe. Wer ohne Auto kommt, nimmt die Bahn.'
  )
);
yes(
  'conditional-opener-series',
  lines(...Array.from({ length: 11 }, (_, i) => `Wer an Tag ${i + 1} kommt, wartet kurz.`))
);
yes(
  'conditional-opener-series',
  lines(
    'If you come with kids, ride first. If you come in May, expect rain. If you drive, park early.'
  ),
  'en'
);
no(
  'conditional-opener-series',
  lines('Wer mit Kindern kommt, fährt zuerst. Wer allein kommt, wartet.', 'Wer darf mitfahren?')
);

// 8 catalog-connector-series
const connectors = ['Dazu kommt Luna, 2023 eröffnet.', 'Und es gibt die Lisebergbanan.'];
yes('catalog-connector-series', lines(...Array.from({ length: 6 }, (_, i) => connectors[i % 2])));
yes(
  'catalog-connector-series',
  lines(
    ...Array.from(
      { length: 6 },
      (_, i) => ["There's also Luna.", 'Then there is the Lisebergbanan.'][i % 2]
    )
  ),
  'en'
);
no('catalog-connector-series', lines(...Array.from({ length: 5 }, (_, i) => connectors[i % 2])));

// 9 attribution-opener-series
yes(
  'attribution-opener-series',
  lines(
    '## Katun',
    'The park calls Katun the tallest in Italy.',
    'The park says 110 km/h.',
    'The park calls it a hypercoaster.'
  ),
  'en'
);
yes(
  'attribution-opener-series',
  lines(
    '## Katun',
    'Laut Park ist sie die höchste. Der Park nennt 110 km/h. Der Park gibt 90 Meter an.'
  )
);
no(
  'attribution-opener-series',
  lines(
    '## A',
    'Laut Park ist sie die höchste. Der Park nennt 110 km/h.',
    '## B',
    'Der Park gibt 90 Meter an.'
  )
);

// 10 travel-imperative-close
yes(
  'travel-imperative-close',
  lines(
    'Das ändert sich oft. Prüfe sie dort, bevor du fährst.',
    'Es gibt Sperrungen. Prüfe den Kalender vor der Fahrt.'
  )
);
yes(
  'travel-imperative-close',
  lines(
    'Hours change. Check the calendar before you travel.',
    'Rides close. Check the app before you go.'
  ),
  'en'
);
no(
  'travel-imperative-close',
  lines('Das ändert sich oft. Prüfe den Kalender vor der Fahrt.', 'Es regnet.')
);

// 11 tautological-because
yes(
  'tautological-because',
  'Ein zweiter Tag lohnt sich vor allem mit Kindern, weil sich Futuropolis dann den ganzen Tag lohnt.'
);
yes(
  'tautological-because',
  'It works best with children, because everything works at that height.',
  'en'
);
no(
  'tautological-because',
  'Ein zweiter Tag lohnt sich mit Kindern, weil die Bahnen dann kürzer sind.'
);
no('tautological-because', 'Fahr zuerst die Bahn, weil die Schlange zuerst kurz ist.');
no('tautological-because', 'Rides are popular, because rides close early.', 'en');
yes('tautological-because', 'Der Eintritt kostet viel, weil das Hotel kostet.');
no('tautological-because', 'Der Park ist voll, weil die Schulferien beginnen.');
no('tautological-because', 'It works best with children, because the queues are short.', 'en');

// 12 excerpt-announces-post
yes('excerpt-announces-post', '', 'de', [
  ['excerpt', 'Hier steht, an welchen Tagen der Park leer ist.'],
]);
yes('excerpt-announces-post', '', 'de', [
  ['description', 'Dieser Beitrag zählt auf, was Besucher wissen müssen.'],
]);
yes('excerpt-announces-post', '', 'en', [
  ['excerpt', 'This guide covers prices, hours and queues.'],
]);
yes('excerpt-announces-post', '', 'de', [
  ['excerpt', 'Dazu kommen die sechs Express-Produkte des Parks.'],
]);
no('excerpt-announces-post', '', 'de', [
  ['excerpt', 'Freitags ist am wenigsten los, außer im Oktober.'],
]);
no('excerpt-announces-post', '', 'de', [['title', 'Hier steht der Titel']]);

// 13 count-announcement-opener
yes(
  'count-announcement-opener',
  lines('Drei Bahnen stehen im Bereich. Sie sind kurz.', 'Es gibt drei Pakete. Sie kosten Geld.')
);
yes('count-announcement-opener', lines('There are three packages.', 'Two rides are wet.'), 'en');
no(
  'count-announcement-opener',
  lines('Der Park öffnet um neun Uhr. Das Tor ist breit.', 'Ein Absatz ohne Zählwort.')
);
no(
  'count-announcement-opener',
  lines(
    'Drei Bahnen stehen im Bereich. Sie sind kurz.',
    'Der Park ist groß und die Wege sind lang.'
  )
);

// 14 data-caveat-close
yes(
  'data-caveat-close',
  'Für den Park liegen 12 Messtage vor. Das reicht für eine grobe Richtung.'
);
yes(
  'data-caveat-close',
  'We have 9 days of data for the park. That is too few to say anything.',
  'en'
);
no('data-caveat-close', 'Für den Park liegen 12 Messtage vor. Der Freitag ist am leersten.');
no('data-caveat-close', 'Der Park ist klein. Das reicht für eine grobe Richtung.');

// 15 double-attribution
yes('double-attribution', 'Katun fährt 110 km/h nach Parkangabe. Laut Park ist sie 90 Meter hoch.');
yes(
  'double-attribution',
  'According to the park, it opened in 2020. The park says it is 90 m tall.',
  'en'
);
yes('double-attribution', 'Volgens het park opende hij in 2020. Het park noemt 90 meter.', 'nl');
no('double-attribution', 'Katun fährt 110 km/h nach Parkangabe. Sie ist 90 Meter hoch.');

// 16 range-before-enumeration
yes(
  'range-before-enumeration',
  lines('Die Annual Passes kosten zwischen 64 und 299 £.', '- Silver: 64 £', '- Gold: 299 £')
);
yes(
  'range-before-enumeration',
  lines('Passes cost between £64 and £299.', '- Silver: £64', '- Gold: £299'),
  'en'
);
no(
  'range-before-enumeration',
  lines('Die Annual Passes kosten zwischen 64 und 299 £.', '- Silver: 64 £', '- Gold: 250 £')
);

// 17 definition-before-glossary
const glossary = '```glossary-widget slug=rope-drop\n```';
yes(
  'definition-before-glossary',
  lines('Rope Drop heißt, dass du vor der Öffnung am Eingang stehst.', glossary)
);
yes(
  'definition-before-glossary',
  lines('Rope drop means arriving before the gates open.', glossary),
  'en'
);
no('definition-before-glossary', lines('Seit 2024 heißt die Bahn Nemesis Reborn.', glossary));
no(
  'definition-before-glossary',
  lines('Rope Drop heißt, dass du früh kommst.', 'Ein Absatz.', glossary)
);

// 18 source-silence-close
yes(
  'source-silence-close',
  lines(
    'Ruhezonen nennt der Park nicht.',
    'Einen Monat nennt der Park nicht.',
    'Die Höhe steht nicht auf der Seite des Parks.'
  )
);
yes(
  'source-silence-close',
  lines(
    "The park doesn't say.",
    'The height is not on the park’s page.',
    'The park does not name a month.'
  ),
  'en'
);
yes(
  'source-silence-close',
  lines('Het park noemt dat niet.', 'Het park noemt dit niet.', 'Het park geeft het niet.'),
  'nl'
);
no(
  'source-silence-close',
  lines('Ruhezonen nennt der Park nicht.', 'Einen Monat nennt der Park nicht.')
);

// 19 widget-caption-after
yes('widget-caption-after', lines(fence, 'In der Tabelle steht für jede Bahn die Wartezeit.'));
yes('widget-caption-after', lines(fence, 'The table shows the wait for every ride.'), 'en');
no('widget-caption-after', lines(fence, 'Die Karte kostet 5 Euro.'));
no('widget-caption-after', lines(fence, 'Freitags ist es am leersten.'));
no('widget-caption-after', lines('In der Tabelle steht nichts.', fence));

// 20 table-summary-before
yes(
  'table-summary-before',
  lines('Die Tabelle fasst zusammen, was die Pässe kosten.', '| a | b |\n| - | - |\n| 1 | 2 |')
);
yes('table-summary-before', lines('The table lists the rides.', fence), 'en');
no('table-summary-before', lines('Die Pässe kosten Geld.', '| a | b |\n| - | - |\n| 1 | 2 |'));

// 21 a date that opens a line renders as a numbered list (an error since 2026-10-11)
const dateLine = (s) => s.match(DATE_LINE_START);
cases += 2;
assert.ok(dateLine('Die Saison endet am\n1. November 2026.'), 'a date opening a line must match');
assert.ok(!dateLine('Die Saison endet am\n1. November 2026.'), 'a no-break space must not match');

console.log(`prose rules: ${cases} cases passed over ${SLOP_RULES.length} rules`);
