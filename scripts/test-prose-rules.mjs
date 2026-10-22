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
  captionFindings,
  oldSpellings,
  slopFindings,
  splitSentences,
  werktagSentences,
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

no(
  'count-announcement-opener',
  lines('Um zehn gehst du in die Grèce. Dort ist es dann leer.', 'Um elf fährst du Tonnerre.')
);

no(
  'count-announcement-opener',
  lines(
    'Seventy kilometres separate the two parks. The A73 links them.',
    'One car held one, maybe two people.'
  ),
  'en'
);

no(
  'count-announcement-opener',
  lines('Six Flags doesn’t comment on pending litigation.', 'Six Flags closed the ride in 2026.'),
  'en'
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

// 22 bet-opener: the first paragraph only
yes(
  'bet-opener',
  lines('Der Tag im Park ist eine Wette darauf, dass das Wetter hält.', 'Zweiter.')
);
yes('bet-opener', lines('A day in the park is a bet on the weather.', 'Second.'), 'en');
yes('bet-opener', lines('Een dag in het park is een gok op het weer.'), 'nl');
yes('bet-opener', lines('Une journée au parc est un pari sur la météo.'), 'fr');
yes('bet-opener', lines('Un día en el parque es una apuesta por el tiempo.'), 'es');
yes('bet-opener', lines('Una giornata al parco è una scommessa sul meteo.'), 'it');
no('bet-opener', lines('Der Park öffnet um neun.', 'Der Tag ist eine Wette darauf, dass es hält.'));
no('bet-opener', lines('Er wettet nicht auf das Wetter.'));

// 23 mirrored-good-bad
yes(
  'mirrored-good-bad',
  lines('Der Montag ist gut, wenn die Schulen offen sind. Er ist schlecht, wenn Ferien beginnen.')
);
yes(
  'mirrored-good-bad',
  lines('Monday is good when schools are open. Monday is bad when holidays start.'),
  'en'
);
no('mirrored-good-bad', lines('Der Montag ist gut, wenn die Schulen offen sind.'));
no(
  'mirrored-good-bad',
  lines(
    'Der Montag ist gut, wenn die Schulen offen sind.',
    'Er ist schlecht, wenn Ferien beginnen.'
  )
);

// 24 appended-reason (two per post)
const reason = {
  de: 'Die Bahn ist früh voll, und das ist der Grund.',
  en: 'The ride fills early, which is exactly the reason.',
  nl: 'De baan is vroeg vol, en dat is precies de reden.',
  fr: 'Le manège est vite plein, et c’est la raison.',
  es: 'La atracción se llena pronto, y esa es la razón.',
  it: 'La giostra si riempie presto, ed è proprio questo il motivo.',
};
for (const [locale, sentence] of Object.entries(reason)) {
  yes('appended-reason', lines(sentence, `${sentence} Noch einer.`), locale);
  no('appended-reason', lines(sentence), locale);
}
no('appended-reason', lines('Das ist der Grund. Das ist der Grund.', 'Der Grund: Regen.'));

// 25 appended-advice (two per post)
const advice = {
  de: 'Der Samstag ist teurer, was man sich vorher überlegen sollte.',
  en: 'Saturday costs more, which is worth thinking about.',
  fr: 'Le samedi coûte plus cher, ce qui mérite réflexion.',
  it: 'Il sabato costa di più, cosa da valutare.',
};
for (const [locale, sentence] of Object.entries(advice)) {
  yes('appended-advice', lines(sentence, `${sentence}`), locale);
  no('appended-advice', lines(sentence), locale);
}
no('appended-advice', lines('Das sollte man sich überlegen.', 'Man sollte es sich überlegen.'));

// 26 link-sentence-close
yes(
  'link-sentence-close',
  lines(
    'Im [Efteling-Guide](/blog/efteling) steht, wie voll der Park ist.',
    'Unser [Halloween-Guide](/blog/halloween) beschreibt die anderen Parks.'
  )
);
no(
  'link-sentence-close',
  lines('Im [Efteling-Guide](/blog/efteling) steht, wie voll der Park ist.')
);
const guideLink = (n) =>
  `Absatz ${n} ist zu Ende. Alles andere steht im [Guide ${n}](/blog/guide-${n}).`;
yes('link-sentence-close', lines(...[1, 2, 3, 4].map(guideLink)));
// Three since PAR-990.
no('link-sentence-close', lines(...[1, 2].map(guideLink)));
yes(
  'link-sentence-close',
  lines(
    'Eins. Mehr dazu im [Guide](/blog/guide).',
    'Zwei.',
    'Drei. Mehr dazu im [Guide](/blog/guide).'
  )
);
yes(
  'link-sentence-close',
  lines(
    ...[1, 2, 3, 4].map(
      (n) => `## Kapitel ${n}\n\nText.\n\n[Weiter im Guide ${n}](/blog/guide-${n}).`
    )
  )
);
no('link-sentence-close', lines('## Kapitel\n\nText.\n\n[Weiter im Guide](/blog/guide).'));
yes(
  'link-sentence-close',
  lines(...[1, 2, 3, 4].map((n) => `Part ${n}. The rest is in the [guide ${n}](/blog/g-${n}).`)),
  'en'
);

// 27 widget-announced-twice
yes('widget-announced-twice', lines('Das Widget zeigt a.', 'Das Widget zeigt b.'));
yes('widget-announced-twice', lines('The widget shows a.', 'The widget shows b.'), 'en');
yes('widget-announced-twice', lines('De widget toont a.', 'De widget toont b.'), 'nl');
yes('widget-announced-twice', lines('Le widget montre a.', 'Le widget montre b.'), 'fr');
yes('widget-announced-twice', lines('El widget muestra a.', 'El widget muestra b.'), 'es');
yes('widget-announced-twice', lines('Il widget mostra a.', 'Il widget mostra b.'), 'it');
yes('widget-announced-twice', lines('Aus diesen sechs Bahnen würde ich zwei nehmen.', fence));
yes('widget-announced-twice', lines("These are the six rides I'd pick from.", fence), 'en');
no('widget-announced-twice', lines('Das Widget zeigt a.', 'Ein Absatz.', fence));
no('widget-announced-twice', lines('Aus diesen sechs Bahnen würde ich zwei nehmen.', 'Danach.'));

// 28 how-teaser (two per post)
yes(
  'how-teaser',
  lines('Wie voll es wird, zeigte sich am Samstag. Wie lang das dauert, lässt sich messen.')
);
yes(
  'how-teaser',
  lines('Just how full it gets became clear on Saturday. Just how long it takes was obvious.'),
  'en'
);
no('how-teaser', lines('Wie voll es wird, zeigte sich am Samstag.'));
no('how-teaser', lines('Wie voll wird es? Wie lang dauert es?'));

// 29 bold-step-labels
yes(
  'bold-step-labels',
  lines('**Zuerst** gehst du los.', '**Dann** fährst du.', '**Zum Schluss** isst du.')
);
yes('bold-step-labels', lines('**First** go.', '**Then** ride.', '**Finally** eat.'), 'en');
no('bold-step-labels', lines('**Zuerst** gehst du los.', '**Dann** fährst du.'));
no(
  'bold-step-labels',
  lines(
    '**Zuerst** gehst du los.',
    '**Dann** fährst du.',
    'Dazwischen Text.',
    '**Zum Schluss** isst du.'
  )
);

// 30 own-post-as-proof (two per post)
yes(
  'own-post-as-proof',
  lines(
    'Das Wetter dreht sich, wie in unserem Beitrag zum Winter steht.',
    'Die Preise steigen, wie in unserem Guide steht.'
  )
);
yes(
  'own-post-as-proof',
  lines('Prices rise, as our post on winter says.', 'Queues grow, as our guide says.'),
  'en'
);
no('own-post-as-proof', lines('Das Wetter dreht sich, wie in unserem Beitrag zum Winter steht.'));
no(
  'own-post-as-proof',
  lines('Wie lange es dauert, steht im Plan.', 'Wie viel es kostet, steht dort.')
);

// 31 advice-who-series (four per post)
const whoDe = [
  'Wer früh kommt, fährt zuerst Taron.',
  'Wer spät kommt, geht zum Feuerwerk.',
  'Wer Kinder hat, kann pausieren.',
  'Wer allein ist, sollte Single Rider nutzen.',
];
yes('advice-who-series', lines(...whoDe));
no('advice-who-series', lines(...whoDe.slice(0, 3)));
yes(
  'advice-who-series',
  lines(
    'If you arrive early, go to Taron.',
    'If you arrive late, head to the fireworks.',
    'If you have kids, take a break.',
    'If you are alone, choose single rider.'
  ),
  'en'
);
yes(
  'advice-who-series',
  lines(
    'Wie vroeg komt, gaat naar Taron.',
    'Wie laat komt, gaat naar het vuurwerk.',
    'Wie kinderen heeft, neemt pauze.',
    'Wie alleen is, kiest single rider.'
  ),
  'nl'
);
no(
  'advice-who-series',
  lines(
    'Wer früh kommt, wartet kürzer.',
    'Wer spät kommt, wartet länger.',
    'Wer fragt, bekommt.',
    'Wer will, kommt.'
  )
);

// 32 not-found-close (two per post)
yes(
  'not-found-close',
  lines('Die Höhe haben wir nicht gefunden.', 'Den Preis konnten wir nicht ablesen.')
);
yes('not-found-close', lines("We couldn't find the height.", "We didn't find a price."), 'en');
no('not-found-close', lines('Die Höhe haben wir nicht gefunden.'));
no('not-found-close', lines('Nicht gefunden haben wir die Höhe, aber den Preis.', 'Gefunden.'));

// 33 day-night-mirror (two per post)
const dayNight = {
  de: 'Tagsüber ist es voll, und abends wird es leer.',
  en: 'By day it is full, and in the evening it empties.',
  nl: 'Overdag is het vol en ’s avonds wordt het leeg.',
  es: 'De día está lleno y de noche se vacía.',
  it: 'Di giorno è pieno e di sera si svuota.',
};
for (const [locale, sentence] of Object.entries(dayNight)) {
  yes('day-night-mirror', lines(sentence, sentence), locale);
  no('day-night-mirror', lines(sentence), locale);
}
no('day-night-mirror', lines('Tagsüber ist es voll.', 'Abends ist es leer.'));
no(
  'day-night-mirror',
  lines('Der Park ist tagsüber und abends offen.', 'Der Park öffnet um acht.'),
  'fr'
);

// 34 looks-different-colon (two per post)
const different = {
  de: 'Der Sonntag sieht anders aus: die Schlangen wachsen.',
  en: 'Sunday is another matter: queues grow.',
  nl: 'Zondag ligt dat anders: de rijen groeien.',
  fr: 'Le dimanche, c’est autre chose : les files grandissent.',
  es: 'El domingo es otra historia: las colas crecen.',
  it: 'La domenica è un’altra storia: le code crescono.',
};
for (const [locale, sentence] of Object.entries(different)) {
  yes('looks-different-colon', lines(sentence, sentence), locale);
  no('looks-different-colon', lines(sentence), locale);
}
no('looks-different-colon', lines('Der Sonntag sieht anders aus.', 'Der Montag sieht anders aus.'));

// 35 riddle-title-fraction: title or heading
yes('riddle-title-fraction', lines('Text.'), 'de', [
  ['title', 'Die Hälfte? Der Park zur Hälfte leer'],
]);
yes('riddle-title-fraction', lines('## Ein Rekord, der zur Hälfte stimmt', 'Text.'));
yes('riddle-title-fraction', lines('## A record that is half of the story', 'Text.'), 'en');
yes('riddle-title-fraction', lines('## Un parc à moitié vide', 'Texte.'), 'fr');
yes('riddle-title-fraction', lines('## Un parque a medio récord', 'Texto.'), 'es');
yes('riddle-title-fraction', lines('## Un parco per metà vuoto', 'Testo.'), 'it');
no('riddle-title-fraction', lines('## Die Öffnungszeiten', 'Der Park ist zur Hälfte leer.'));
no('riddle-title-fraction', lines('Text.'), 'de', [['title', 'Die Öffnungszeiten']]);

// 36 question-catalog-opener (three members)
yes(
  'question-catalog-opener',
  lines('Wer in den Park fährt, will vorher wissen, ob es regnet, ob er zahlt und ob er wartet.')
);
yes(
  'question-catalog-opener',
  lines(
    'Anyone going wants to know beforehand whether it rains, whether it costs and whether it waits.'
  ),
  'en'
);
yes(
  'question-catalog-opener',
  lines('Wie gaat, wil vooraf weten of het regent, of het kost en of het wacht.'),
  'nl'
);
yes(
  'question-catalog-opener',
  lines('Tu veux savoir si la file est longue, si le parc est ouvert et si on peut manger.'),
  'fr'
);
yes('question-catalog-opener', lines('Conviene saber si llueve, si cuesta y si hay cola.'), 'es');
yes(
  'question-catalog-opener',
  lines('Chi parte vuole sapere prima se piove, se costa e se c’è coda.'),
  'it'
);
no('question-catalog-opener', lines('Wer fährt, will vorher wissen, ob es regnet.'));
no('question-catalog-opener', lines('Ob es regnet, ob es kostet und ob es wartet, ist offen.'));

// 37 empty-faq-answer (two per post)
yes(
  'empty-faq-answer',
  lines('### Was kostet das?', 'Das ist verschieden.', '### Wie voll ist es?', 'Das hängt ab.')
);
yes(
  'empty-faq-answer',
  lines('### What does it cost?', 'It varies.', '### How busy is it?', 'Busy.'),
  'en'
);
yes(
  'empty-faq-answer',
  lines('### ¿Cuánto cuesta?', 'Depende.', '### ¿Y la cola?', 'Eso depende.'),
  'es'
);
no(
  'empty-faq-answer',
  lines(
    '### Was kostet das?',
    'Das ist verschieden.',
    '### Wie voll?',
    'Der Park hat samstags bis zu 90 Minuten Wartezeit.'
  )
);
no('empty-faq-answer', lines('### ¿Hay descuento?', 'Sí.', '### ¿Y la cola?', 'Sí, claro.'), 'es');
no('empty-faq-answer', lines('### C’è lo sconto?', 'Sì.', '### E la coda?', 'Sì, certo.'), 'it');
no('empty-faq-answer', lines('### Gibt es Rabatt?', 'Nein.', '### Ist es offen?', 'Ja.'));
no(
  'empty-faq-answer',
  lines('### Wann?', 'Das Frühjahr. Dann wird es voll.', '### Wo?', 'Im Süden. Nahe Rust.')
);

// 38 bold-maxim
no(
  'bold-maxim',
  lines('**Mit Bahn und Bus.** Die Linie C-3 fährt bis Pinto, dort fährt der Bus 413 zum Tor.')
);
no('bold-maxim', lines('**En train et en bus.** La ligne C-3 va jusqu’à Pinto.'), 'fr');
no(
  'bold-maxim',
  lines(
    '**Included in the ticket.** Parking costs extra and is paid at the gate.',
    '**People with disabilities.** A carer enters free.'
  ),
  'en'
);
yes('bold-maxim', lines('Text davor. **Wer früh kommt, wartet kürzer.**'));
yes('bold-maxim', lines('**Wer früh kommt, wartet kürzer.** Dann der Rest.'));
yes('bold-maxim', lines('**The early visitor waits less.** Then the rest.'), 'en');
no('bold-maxim', lines('**Wer um 9 Uhr kommt, wartet kürzer.** Der Rest.'));
no('bold-maxim', lines('**[Der Guide](/blog/x) erklärt es.** Der Rest.'));
no('bold-maxim', lines('**Anreise.** Der Rest steht hier.'));
no('bold-maxim', lines('The **early** visitor waits less.'), 'en');
no('bold-maxim', lines('**Taron and Rookburgh set the pace here.** Rest.'), 'en');
no(
  'bold-maxim',
  lines(
    '**Dies ist ein sehr langer Satz mit vielen Wörtern, der weit über die Grenze von vierzehn Wörtern hinausreicht.** Rest.'
  )
);

// 40 origin-circle: the circle formula at once, the beginning told four times as a refrain
yes(
  'origin-circle',
  lines(
    'Und die Suche nach den Wartezeiten im Phantasialand, wo das alles angefangen hat, bringt mehr.'
  )
);
yes('origin-circle', lines('We went back to Brühl, where it all began.'), 'en');
yes('origin-circle', lines('Nous sommes retournés à Brühl, où tout a commencé.'), 'fr');
yes(
  'origin-circle',
  lines(
    '## Angefangen hat es vor Taron',
    'Im Phantasialand hat auch park.fan angefangen. Angefangen hat das mit einem Kinderwagen.',
    'Mit einem Projekt, das in Brühl angefangen hat, sehen Leute in New Jersey nach.'
  )
);
no(
  'origin-circle',
  lines(
    'Die Saison hat am 28. März angefangen. Anfang Oktober beginnt Halloween.',
    'Der Bau begann 1975, und 1981 hat der Park mit der zweiten Halle angefangen.'
  )
);
no('origin-circle', lines('The season started in March and ends in November.'), 'en');

// 41 thanks-either-or
yes(
  'thanks-either-or',
  lines(
    'Danke euch allen, ob ihr park.fan einmal vor dem Sommerurlaub aufgemacht habt oder jeden Morgen.'
  )
);
yes(
  'thanks-either-or',
  lines('Thank you all, whether you opened park.fan once or every morning before rope drop.'),
  'en'
);
yes(
  'thanks-either-or',
  lines('Bedankt allemaal, of je park.fan nu één keer hebt geopend of elke ochtend opent.'),
  'nl'
);
no(
  'thanks-either-or',
  lines('Danke euch allen. Ob der Samstag voll wird oder nicht, sagt der Kalender.')
);
no('thanks-either-or', lines('Thanks to everyone who passed the link on.'), 'en');

// 42 imagined-reader-tour: `Manche …, andere …` with two site links or a hedged third
yes(
  'imagined-reader-tour',
  lines(
    'Manche sitzen auf dem Sofa und suchen die [ruhigsten Tage](/best-time-to-visit), andere [planen ihren Parktag](/trip-planner).'
  )
);
yes(
  'imagined-reader-tour',
  lines(
    'Manche sitzen auf dem Sofa, andere planen am Abend. Ein paar stehen vielleicht in Orlando.'
  )
);
yes(
  'imagined-reader-tour',
  lines(
    'Some sit on the sofa and look for the [quietest days](/best-time-to-visit). Others [plan the day](/trip-planner).'
  ),
  'en'
);
no(
  'imagined-reader-tour',
  lines('Manche Bahnen öffnen um zehn, andere erst mittags, etwa [Taron](ref:phantasialand/taron).')
);
no('imagined-reader-tour', lines('Some rides open at ten, others at noon.'), 'en');

// 43 feeling-close: three paragraphs that end on the author's feeling
yes(
  'feeling-close',
  lines(
    'Lange war ich mir nicht sicher.',
    'Die Suche kommt aus New Jersey. Damit hätte ich nie gerechnet.',
    'Die News war die meistgelesene Seite, und das hat mich gefreut.'
  )
);
yes(
  'feeling-close',
  lines(
    'For a long time I wasn’t sure.',
    'Most clicks come from New Jersey. I’d never have guessed that.',
    'It was the most-read page, and I was glad.'
  ),
  'en'
);
no(
  'feeling-close',
  lines(
    'Damit hätte ich nie gerechnet.',
    'Die News war die meistgelesene Seite.',
    'Am Samstag kamen 1.400 Besucher über Facebook.'
  )
);

// 44 disappoint-teaser
yes(
  'disappoint-teaser',
  lines('Gleich dahinter kommt „hansa park wartezeiten“, und da muss ich enttäuschen.')
);
yes('disappoint-teaser', lines('Next comes Hansa-Park, and I have to disappoint you.'), 'en');
no(
  'disappoint-teaser',
  lines('Gleich dahinter kommt „hansa park wartezeiten“, obwohl park.fan dort nichts zeigen kann.')
);

// 45 bridge-apposition
yes(
  'bridge-apposition',
  lines(
    'Zwischen den Abzeichen liegen drei Wochen, genau die Wochen, in denen es Herbst geworden ist.'
  )
);
yes(
  'bridge-apposition',
  lines('The badges are three weeks apart, exactly the weeks in which autumn arrived.'),
  'en'
);
no('bridge-apposition', lines('Zwischen den Abzeichen liegen drei Wochen, genau 21 Tage.'));

// 46 contact-form-phrase
yes('contact-form-phrase', lines('Feedback ist immer willkommen, Kritik eingeschlossen.'));
yes('contact-form-phrase', lines('Jede Nachricht lese ich selbst.'));
yes('contact-form-phrase', lines('Ich habe ihn mir öfter angesehen, als ich zugeben möchte.'));
yes('contact-form-phrase', lines('Feedback is always welcome, criticism included.'), 'en');
yes('contact-form-phrase', lines('Il feedback è sempre benvenuto, critiche comprese.'), 'it');
no('contact-form-phrase', lines('Hunde sind an der Leine willkommen.'));
no('contact-form-phrase', lines('Les chiens sont les bienvenus en laisse.'), 'fr');

// 47 filler-adverb-pileup: four of one adverb, and four per 1,000 words
yes(
  'filler-adverb-pileup',
  lines(
    'Wer gerade im Park steht, sieht gerade die Wartezeit.',
    'Gerade dieser Park ist gerade voll, und gerade jetzt.'
  )
);
no(
  'filler-adverb-pileup',
  lines('Wer gerade im Park steht, sieht die Wartezeit.', 'Inzwischen ist es voll.')
);
no(
  'filler-adverb-pileup',
  lines(
    `Gerade hier ist es gerade voll, gerade mittags und gerade samstags. ${'Viele Wörter ohne das Wort. '.repeat(300)}`
  )
);

/* ---- 48 onwards: the seven guides of 2026-10-22 (PAR-984 to PAR-990) ---- */

// 4 handoff-object-first, since PAR-986 and PAR-990
yes(
  'handoff-object-first',
  lines(
    'Das Hotel hat Zimmer zu Sonderpreisen, die nennt die Rezeption bei der Ankunft.',
    'Es gibt Pakete. Die Preise zeigt die App am Eingang.'
  )
);
yes(
  'handoff-object-first',
  lines(
    'Den Parkschein verkauft der Heide Park an der Einfahrt.',
    'Den Erwachsenenpreis zahlen Gäste ab zwölf.',
    'Diese Novembertickets bewirbt der Park kaum.',
    'Den Seniorenrabatt gewährt der Park ab 60.'
  )
);
no(
  'handoff-object-first',
  lines('Den Parkschein verkauft der Heide Park an der Einfahrt.', 'Die App zeigt Wartezeiten.')
);

// 5 indirect-question-subject, since PAR-990
yes(
  'indirect-question-subject',
  lines(
    'Welche Wochentage leer sind, haben wir in [Wann im Freizeitpark wenig los ist](/blog/x) ausgewertet.',
    'Wie voll die Ferien sind, haben wir im [Ferien-Guide](/blog/y) durchgerechnet.'
  )
);
no('indirect-question-subject', 'Wir haben die Wochentage ausgewertet.');

// 8 catalog-connector-series, since PAR-987: the ranking connectors
yes(
  'catalog-connector-series',
  lines(
    'Nach Taron kommen F.L.Y. und Chiapas.',
    'Danach kommt Black Mamba.',
    'Knapp dahinter liegt River Quest.',
    'Dahinter folgen Raik und Winja’s.',
    'Danach folgt Talocan.',
    'Dazu kommt Crazy Bats.'
  )
);
no('catalog-connector-series', lines('Nach dem Mittag kommen mehr Gäste.', 'Danach ist es ruhig.'));

// 9 attribution-opener-series, since PAR-989: the plural and a park's name
yes(
  'attribution-opener-series',
  lines(
    'According to the parks, the rides open at ten. According to Heide Park, Colossos runs daily. According to Toverland, Troy is the tallest.'
  ),
  'en'
);
no('attribution-opener-series', 'According to the parks, the rides open at ten.', 'en');

// 26 link-sentence-close, since PAR-986, PAR-988 and PAR-990
const ownLink = (n) => `Absatz ${n}. Mehr dazu steht in unserem [Guide ${n}](/blog/guide-${n}).`;
yes('link-sentence-close', lines(ownLink(1), ownLink(2)));
no('link-sentence-close', lines(ownLink(1), 'Absatz zwei ohne Link.'));
yes(
  'link-sentence-close',
  'Auf den [Statistikseiten](/parks/x/statistik) stehen die Wartezeiten aller Bahnen. Im [Parkvergleich](/compare) lassen sich beide Parks nebeneinander stellen.'
);
no(
  'link-sentence-close',
  'Auf den [Statistikseiten](/parks/x/statistik) stehen die Wartezeiten. Taron ist am längsten.'
);
const pointsTo = (n) => `Absatz ${n}. Die Zahl steht im [Guide ${n}](/blog/guide-${n}).`;
yes('link-sentence-close', lines(...[1, 2, 3].map(pointsTo)));

// 47 filler-adverb-pileup, since PAR-986: the intensifiers
yes(
  'filler-adverb-pileup',
  lines(
    'The Saturday is clearly emptier, the morning clearly shorter.',
    'At noon the queue is clearly longer, clearly.'
  ),
  'en'
);
yes(
  'filler-adverb-pileup',
  'Samstags ist es deutlich voller, deutlich länger, deutlich teurer und deutlich lauter.'
);
no('filler-adverb-pileup', 'Der Samstag ist deutlich voller.');

// 48 faq-echo: two answers that copy the running text
const faqEcho = lines(
  '## Kinder',
  'Die Höhe gilt für den höchsten Punkt der Strecke über dem Boden, die Fallhöhe für die längste Abfahrt bis ins Tal.',
  'Bei 1,30 Meter bleibt dort nur Silver Star für dein Kind gesperrt, alle anderen Achterbahnen sind offen.',
  '## Häufige Fragen',
  '### Was heißt Höhe?',
  'Die Höhe gilt für den höchsten Punkt der Strecke über dem Boden, die Fallhöhe für die längste Abfahrt bis ins Tal.',
  '### Was darf mein Kind?',
  'Bei 1,30 Meter bleibt dort nur Silver Star für dein Kind gesperrt, alle anderen Achterbahnen sind offen. Das gilt das ganze Jahr.'
);
yes('faq-echo', faqEcho);
yes('faq-echo', faqEcho.replace('Bei 1,30 Meter', 'Mit 1,30 Metern'));
// One sentence with a figure is the one fact §5.4 lets an answer repeat.
no(
  'faq-echo',
  lines(
    '## Kinder',
    'Bei 1,30 Meter bleibt dort nur Silver Star für dein Kind gesperrt, alle anderen Achterbahnen sind offen.',
    'Mit 1,20 Meter fährt dein Kind im Phantasialand Chiapas, Winja’s Fear und Winja’s Force mit.',
    '## Häufige Fragen',
    '### Was darf mein Kind?',
    'Bei 1,30 Meter bleibt dort nur Silver Star für dein Kind gesperrt, alle anderen Achterbahnen sind offen.',
    '### Und mit 1,20?',
    'Mit 1,20 Meter fährt dein Kind im Phantasialand Chiapas, Winja’s Fear und Winja’s Force mit.'
  )
);
no(
  'faq-echo',
  lines(
    '## Preise',
    'Ein Tagesticket kostet im Europa-Park online 67 bis 76 €, an der Kasse zehn Euro mehr als im Netz.',
    '## Häufige Fragen',
    '### Was kostet ein Tag?',
    'Online 67 bis 76 €.',
    '### Gibt es Rabatt?',
    'Für Gruppen ab 20 Personen.'
  )
);

// 49 faq-table-echo
const priceTable = [
  '| Park | One Shot |',
  '| --- | --- |',
  '| Phantasialand | 5 € |',
  '| Mirabilandia | 5,90 € |',
  '| Thorpe Park | 6 £ |',
  '| Movie Park | 7 € |',
  '| Gardaland | 8 € |',
];
yes(
  'faq-table-echo',
  lines(
    priceTable.join('\n'),
    '## FAQ',
    '### What does a single ride cost?',
    'The One Shot at Mirabilandia at €5.90, the One Shot at Thorpe Park at £6, at Phantasialand €5, at Movie Park €7, at Gardaland €8.'.replace(
      '5.90',
      '5,90'
    )
  ),
  'en'
);
no(
  'faq-table-echo',
  lines(
    priceTable.join('\n'),
    '## FAQ',
    '### What does a single ride cost?',
    'From €5 at Phantasialand, and a day pass is €80.'
  ),
  'en'
);
// The day of a date and a product's number are not table figures.
no(
  'faq-table-echo',
  lines(
    [
      '| Pass | Price |',
      '| --- | --- |',
      '| Express Pass 4 | 4 € |',
      '| Express Pass 7 | 7 € |',
      '| Night | 14 € |',
      '| Day | 15 € |',
    ].join('\n'),
    '## FAQ',
    '### When can I use it?',
    'The Express Pass 4 and Express Pass 7 are sold on 14 and 15 October.'
  ),
  'en'
);

// 50 table-cells-in-prose
yes(
  'table-cells-in-prose',
  lines(
    'Fast Passes heißen Quick Pass, Express Ticket, Speedy Pass, Fastrack und Premier Access.',
    [
      '| Park | Name |',
      '| --- | --- |',
      '| Phantasialand | Quick Pass |',
      '| Gardaland | Express Ticket |',
      '| Movie Park | Speedy Pass |',
      '| Thorpe Park | Fastrack |',
    ].join('\n')
  )
);
yes(
  'table-cells-in-prose',
  lines(
    'Die Parks in Salou lassen auf Red Force, Furius Baco und Dragon Khan niemanden über 1,95 Meter.',
    '- Red Force, Ferrari Land: ab 1,40 m, höchstens 1,95 m\n- Furius Baco, PortAventura: ab 1,40 m\n- Dragon Khan, PortAventura: ab 1,40 m'
  )
);
// A count the table does not hold sums the table up.
no(
  'table-cells-in-prose',
  lines(
    'Im Phantasialand sind 14 der 40 Attraktionen überdacht, darunter Quick Pass, Express Ticket, Speedy Pass und Fastrack. Sieben davon liegen im Bereich Fantasy.',
    [
      '| Park | Name |',
      '| --- | --- |',
      '| Phantasialand | Quick Pass |',
      '| Gardaland | Express Ticket |',
      '| Movie Park | Speedy Pass |',
      '| Thorpe Park | Fastrack |',
    ].join('\n')
  )
);
no(
  'table-cells-in-prose',
  lines(
    'Vier Parks verkaufen einen Fast Pass.',
    ['| Park | Name |', '| --- | --- |', '| Phantasialand | Quick Pass |'].join('\n')
  )
);

// 51 fact-refrain
yes(
  'fact-refrain',
  lines(
    '## Öffnung',
    'Der Park ist an allen 365 Tagen im Jahr offen.',
    '## Winter',
    'Auch im Winter: an allen 365 Tagen im Jahr.'
  ),
  'de',
  [['excerpt', 'Efteling hat an allen 365 Tagen im Jahr geöffnet.']]
);
no(
  'fact-refrain',
  lines('## A', 'Ab 120 cm darfst du allein fahren.', '## B', 'Ab 120 cm darfst du allein fahren.'),
  'de',
  [['excerpt', 'Ab 120 cm darfst du allein fahren.']]
);

// 52 preposition-name-opener
yes(
  'preposition-name-opener',
  'Im PortAventura Park kostet er 20 €. Im Gardaland sind es 15 €. Im Parc Astérix 18 €. Bei Walibi Belgium gibt es keinen. Im Legoland kostet er 12 €. Mehr im [PortAventura-Guide](/blog/portaventura), zum [Gardaland](ref:gardaland), [Parc Astérix](ref:parc-asterix) und [Legoland](ref:legoland-deutschland).'
);
yes(
  'preposition-name-opener',
  lines(
    'At [Europa-Park](ref:europa-park) the queue is short.',
    'At Efteling it is longer, says the [Efteling guide](/blog/efteling).',
    'At Europa-Park the hotel helps.'
  ),
  'en'
);
no(
  'preposition-name-opener',
  lines('Im Sommer ist es voll.', 'Im Winter ist es leer.', 'Im Herbst regnet es.')
);
// German capitalises nouns: `Im Schnitt`, `Bei Regen` are not names the post links.
no(
  'preposition-name-opener',
  'Im Schnitt wartest du 20 Minuten. Bei Regen ist es leerer. Im Eingangsbereich gibt es Schließfächer. Im [Phantasialand](ref:phantasialand) ist es voll.'
);
// An FAQ answer is read alone.
no(
  'preposition-name-opener',
  lines(
    '## Häufige Fragen',
    '### Bis wann ist der Eintritt frei?',
    'Im Efteling gilt es bis einschließlich 3 Jahre. Im Europa-Park für 0 bis 3 Jahre. Im Phantasialand ebenso. Im Parc Astérix unter 3 Jahren.'
  )
);
// A widget ends the run.
no(
  'preposition-name-opener',
  lines(
    'Al [Phantasialand](ref:phantasialand) il baby switch c’è su 13 attrazioni.',
    'Al Phantasialand carrelli e rimorchi non sono ammessi.',
    '```glossary-widget slug=rider-switch\n```',
    'Al Phantasialand i bambini fino a undici anni entrano con un adulto.'
  ),
  'it'
);

// 53 origin-tour
yes(
  'origin-tour',
  'Aus Italien hält der Eurocity-Express in Basel. Aus Spanien fliegst du nach Straßburg.'
);
yes(
  'origin-tour',
  'From Italy the Eurocity train stops in Basel. Coming from Spain, you fly to Strasbourg.',
  'en'
);
no(
  'origin-tour',
  lines(
    '## Anreise',
    '### Anreise aus Deutschland',
    'Aus Köln fährt der Zug in drei Stunden. Aus Berlin fliegst du.'
  )
);
no('origin-tour', 'Aus Plop und Samson wurde der Name. Aus dem Apirama wurde ein Wald.');

// 54 recomputed-difference
yes(
  'recomputed-difference',
  'Der Quick Pass kostet 80 €, der Ultimate 83 €. Der Ultimate ist also 3 € teurer.'
);
yes(
  'recomputed-difference',
  'Hyperion is 1,375 metres long and Big One 1,430 metres. Big One is 55 metres longer than Hyperion.',
  'en'
);
no('recomputed-difference', 'Der Quick Pass kostet 80 €. Online ist er 3 € billiger.');

// 55 verdict-opener
yes(
  'verdict-opener',
  lines(
    '## Shows',
    'Paris wins on shows. The parade runs daily.',
    '## Coasters',
    'Rust is the better choice for coasters. Silver Star is the tallest.'
  ),
  'en'
);
yes(
  'verdict-opener',
  lines(
    '### Disneyland Paris',
    'Disneyland Paris hat die größte Spanne im Vergleich.',
    '### Parc Astérix',
    'Der Parc Astérix hat die meisten Ticketarten.'
  )
);
no(
  'verdict-opener',
  lines('## Shows', 'Paris wins on shows.', '## Coasters', 'Silver Star is 73 metres tall.'),
  'en'
);

// 56 among-them-series
const among = (n) => `Chapter ${n} has rides, among them Balder, Helix, Valkyria and Loke.`;
yes('among-them-series', lines(...[1, 2, 3, 4].map(among)), 'en');
no('among-them-series', lines(...[1, 2, 3].map(among)), 'en');
yes(
  'among-them-series',
  lines(
    ...[1, 2, 3, 4].map((n) => `Kapitel ${n} hat Bahnen, darunter Taron, Raik, Chiapas und F.L.Y.`)
  )
);

// 57 closing-refrain
yes(
  'closing-refrain',
  lines(
    'Taron hat kurze Wartezeiten. Wer früh kommt, braucht dafür keinen Pass.',
    'Im Europa-Park ist es leer. Am Dienstag brauchst du keinen Express.',
    'Die Warteschlange bleibt kurz. Ich würde keinen Quick Pass kaufen.'
  )
);
yes(
  'closing-refrain',
  lines(
    'Die Gold-Karte kostet 300 €. Billiger ist sie ab dem dritten Besuch.',
    'Die Silber-Karte kostet 200 €. Sie lohnt sich ab dem zweiten Besuch.',
    'Die Bronze-Karte kostet 100 €. Gold ist billiger ab dem vierten Besuch.'
  )
);
no(
  'closing-refrain',
  lines(
    'Taron hat kurze Wartezeiten. Ein Termin steht noch nicht fest.',
    'Der Park öffnet um zehn. Die Bahn läuft nicht.',
    'Es regnet. Die Show fällt aus.'
  )
);

// 58 cost-per-duration
yes(
  'cost-per-duration',
  'Für die gut zwei Minuten Fahrt nennt der Park Kosten von 50 Millionen Euro.'
);

// 59 mirrored-park-intro
yes(
  'mirrored-park-intro',
  lines(
    'Der Europa-Park in Rust hat am 12. Juli 1975 eröffnet. Er gehört der Familie Mack.',
    'Das Efteling in Kaatsheuvel hat am 31. Mai 1952 als Märchenwald eröffnet. Es gehört einer Stiftung.'
  )
);
no(
  'mirrored-park-intro',
  lines('Der Europa-Park in Rust hat am 12. Juli 1975 eröffnet.', 'Heute hat er 14 Achterbahnen.')
);

// 60 appended-source
yes(
  'appended-source',
  lines(
    'Der Park öffnet um neun, so steht es auf seiner Website.',
    'Kinder unter vier zahlen nichts, so steht es in den Antworten des Parks auf häufige Fragen.'
  )
);
no('appended-source', 'Der Park öffnet um neun, so steht es auf seiner Website.');

// 61 never-had-like-it
yes('never-had-like-it', 'Efteling has never had a ride like it.', 'en');
yes('never-had-like-it', 'Das Efteling hatte noch nie eine Bahn wie diese.');
no('never-had-like-it', 'Efteling has never had a launch coaster.', 'en');

// 62 verdict-close-series
const verdict = (n) =>
  `## Kapitel ${n}\n\nDas Abendticket gilt ab 17 Uhr. Für ein paar Stunden am Abend würde ich das Abendticket nehmen.`;
yes('verdict-close-series', lines(...[1, 2, 3].map(verdict)));
no(
  'verdict-close-series',
  lines(...[1, 2].map(verdict), '## Kapitel 3\n\nDer Park schließt um 18 Uhr.')
);

// 63 spec-sheet-chain
yes(
  'spec-sheet-chain',
  'Taron von Intamin fährt seit 2016. Black Mamba von Bolliger & Mabillard fährt seit 2006. Raik von Vekoma fährt seit 2016. F.L.Y. von Vekoma fliegt seit 2020.'
);
yes(
  'spec-sheet-chain',
  lines(
    'Gerstlauer hat The Smiler gebaut.',
    'Custom Coasters International hat sie 1997 gebaut.',
    'Gebaut hat sie 2012 Great Coasters International.'
  )
);
no('spec-sheet-chain', 'Taron von Intamin fährt seit 2016. Die Warteschlange ist morgens kurz.');
// Rides that are gone (`von 1966 bis 1979`) are history whatever the heading says.
no(
  'spec-sheet-chain',
  'Die Super 8 von Schwarzkopf fuhr von 1966 bis 1979. Die Loopen von Schwarzkopf lief von 1980 bis 1995. HangOver von Vekoma kam 1997. Cirkusexpressen von Zierer lief von 1977 bis 2008.'
);
// Under a history heading four are the history; five are the chain.
no(
  'spec-sheet-chain',
  lines(
    '## Geschichte',
    'Die Super 8 von Schwarzkopf fuhr ab 1966. Die Loopen von Schwarzkopf kam 1980. HangOver von Vekoma kam 1997. Balder von Intamin kam 2003.'
  )
);

// 64 weather-caveat
yes(
  'weather-caveat',
  'Bei extremem Wetter kann in beiden Parks jede Bahn im Freien vorübergehend schließen.'
);
no('weather-caveat', 'Bei schlechtem Wetter kann die Parade ausfallen.');

// 65 pair-ellipsis
yes(
  'pair-ellipsis',
  lines(
    'Regen gab es im Phantasialand an 22 Prozent der Öffnungstage, im Europa-Park an 16 Prozent.',
    'Voller war es im Plopsaland um 64 Prozent, im Movie Park um 31.',
    'Überdacht sind im Europa-Park 34 Attraktionen, im Phantasialand 14.',
    'Achterbahnen hat der Europa-Park 14, das Phantasialand 7.',
    'Restaurants hat der Europa-Park 64, das Phantasialand 46.',
    'Hotels hat der Europa-Park 6, im Phantasialand 3.'
  )
);
// Four pairs are under the threshold since the critic's sample of 2026-10-22.
no(
  'pair-ellipsis',
  lines(
    'Regen gab es im Phantasialand an 22 Prozent der Öffnungstage, im Europa-Park an 16 Prozent.',
    'Voller war es im Plopsaland um 64 Prozent, im Movie Park um 31.',
    'Überdacht sind im Europa-Park 34 Attraktionen, im Phantasialand 14.',
    'Achterbahnen hat der Europa-Park 14, das Phantasialand 7.'
  )
);
yes(
  'pair-ellipsis',
  'At Phantasialand both Saturday and Sunday are busy, with Sundays at 36 per cent.',
  'en'
);
no(
  'pair-ellipsis',
  'Regen gab es im Phantasialand an 22 Prozent der Tage, im Europa-Park waren es 16 Prozent.'
);

// 66 publish-day-snapshot
const dated = (body) => `---\ndate: '2026-10-22'\n---\n${body}`;
yes('publish-day-snapshot', dated('Taron stand am 22. Oktober um 22 Uhr bei fünf Minuten.'));
yes('publish-day-snapshot', dated('On 22 October at noon the queue was short.'), 'en');
no('publish-day-snapshot', dated('Taron stand am 21. Oktober um 22 Uhr bei fünf Minuten.'));

// 83 research-stamp
yes(
  'research-stamp',
  'Im Disneyland Park gibt es (Stand 25. September 2026) 35 Restaurants und Imbisse.'
);
yes(
  'research-stamp',
  '- Wartezeit-Daten: eigene Historie seit Dezember 2025, Stand 25. September 2026\n'
);
yes('research-stamp', 'Our page lists 82 attractions (as of 25 September 2026).', 'en');
yes('research-stamp', 'Notre page du parc liste 82 attractions (au 25 septembre 2026).', 'fr');
yes('research-stamp', 'La pagina elenca 82 attrazioni (al 25 settembre 2026).', 'it');
yes('research-stamp', 'La página recoge 82 atracciones (a 25 de septiembre de 2026).', 'es');
no(
  'research-stamp',
  'Stand 6. Oktober 2026:\n\n| Park | Preis |\n| --- | --- |\n| Efteling | 45 € |'
);
no('research-stamp', 'La saison va du 1er au 25 septembre 2026.', 'fr');
no('research-stamp', 'La stagione va dal 3 al 25 settembre 2026.', 'it');
no('research-stamp', '> 25 septembre 2026 : la première version disait autre chose.', 'fr');
no('research-stamp', 'Der Park hat am 25. September 2026 die Saison beendet.');

// 68 brochure-span
yes(
  'brochure-span',
  'Die Hotels reichen von der spanischen Finca bis zum Leuchtturm aus Neuengland.'
);
yes('brochure-span', 'The hotels range from a Spanish finca to a New England lighthouse.', 'en');
no('brochure-span', 'Die Warteschlange bleibt von der Öffnung bis zum Abend gleich lang.');

// 69 record-triple
yes(
  'record-triple',
  lines(
    'Troy ist die höchste, schnellste und längste Holzachterbahn.',
    'Kondaa ist die höchste, schnellste und längste in Belgien.',
    'Goliath hält alle drei Rekorde.'
  )
);
no(
  'record-triple',
  lines('Troy ist die höchste Holzachterbahn.', 'Kondaa ist die schnellste in Belgien.')
);
// Two superlatives are a fact, and a post about records has the triple as its subject.
no(
  'record-triple',
  lines(
    'Der Park nennt sie die höchste und schnellste Bahn dieser Art.',
    'Six Flags nennt sie die höchste und schnellste Spinning-Achterbahn.',
    'Sky Hawk ist die längste und höchste ihrer Art.'
  )
);
no(
  'record-triple',
  lines(
    'Troy ist die höchste, schnellste und längste Holzachterbahn.',
    'Kondaa ist die höchste, schnellste und längste in Belgien.',
    'Goliath hält alle drei Rekorde.'
  ),
  'de',
  [['title', 'Europas Achterbahn-Rekorde']]
);

// 70 name-history-series
yes(
  'name-history-series',
  lines(
    'Bis 2004 hieß sie Wild Wild West.',
    'Bis 2011 hieß sie Pepsi Max Big One.',
    'Benannt ist sie nach einem Mond des Saturn.'
  )
);
no('name-history-series', 'Bis 2004 hieß sie Wild Wild West.');

// 71 since-template
yes(
  'since-template',
  lines(
    'Goliath has held all three Dutch records since 2002.',
    'Taron has been running since August 2016.',
    'Black Mamba has been open since 2006.',
    'Klugheim has stood since 2016.'
  ),
  'en'
);
no(
  'since-template',
  lines(`Goliath has held all three Dutch records since 2002. ${'Plain words here. '.repeat(500)}`),
  'en'
);
// `seit … bis` is a period.
no(
  'since-template',
  lines(
    'Halloween läuft seit dem 5. Oktober und noch bis zum 31. Oktober.',
    'Die Show läuft seit dem 1. Oktober und bis zum 2. November.',
    'Der Markt ist seit dem 20. November und bis zum 23. Dezember offen.',
    'Die Bahn ist seit Mai und bis September in Betrieb.'
  )
);

// 72 same-park-template
yes(
  'same-park-template',
  lines(
    'The longest is Katun in the same park.',
    'The fastest is Valkyria in the same park.',
    'The tallest is Helix in the same park.'
  ),
  'en'
);
no('same-park-template', 'The longest is Katun in the same park.', 'en');

// 73 calls-it-superlative
yes(
  'calls-it-superlative',
  lines(
    'Europa-Park calls it the launch coaster with the most inversions in the world.',
    'Heide Park calls it the tallest wooden coaster.'
  ),
  'en'
);
no(
  'calls-it-superlative',
  'Europa-Park calls it the launch coaster with the most inversions.',
  'en'
);

// 74 superlative-mirror
const mirror = (park) =>
  `### ${park}\n\nAm günstigsten ist der 20. Januar, am teuersten Silvester.`;
yes('superlative-mirror', lines(...['A', 'B', 'C', 'D'].map(mirror)));
// Each park's own pair is information when the frame changes from section to section.
no(
  'superlative-mirror',
  lines(
    '### A\n\nAm vollsten ist es samstags, am ruhigsten mittwochs.',
    '### B\n\nAm Samstag ist es am vollsten, am Mittwoch am leersten.',
    '### C\n\nAm vollsten sind Mai und September, am ruhigsten der März.',
    '### D\n\nAm meisten los ist sonntags, am wenigsten dienstags.'
  )
);
// In a quiet-days post the pair in three park sections is the answer.
no('superlative-mirror', lines(...['A', 'B', 'C'].map(mirror)));

// 75 section-formula
const formula = (n) => `### Park ${n}\n\nDen zweiten Besuch machst du im Herbst, wenn es leer ist.`;
yes('section-formula', lines(...[1, 2, 3].map(formula)));
no('section-formula', lines(...[1, 2].map(formula)));
// The title's words are what every section is about.
no('section-formula', lines(...[1, 2, 3].map(formula)), 'de', [
  ['title', 'Der zweite Besuch im Herbst'],
]);

// 76 opener-skeleton-series
const frame = (park, ride) => `Im ${park} stehst du an ${ride} am längsten an. Der Rest ist kurz.`;
yes(
  'opener-skeleton-series',
  lines(
    frame('Europa-Park', 'Voltron'),
    frame('Phantasialand', 'Taron'),
    frame('Efteling', 'Baron')
  )
);
no(
  'opener-skeleton-series',
  lines(
    frame('Europa-Park', 'Voltron'),
    frame('Phantasialand', 'Taron'),
    'Im Efteling ist es leer.'
  )
);

// 77 negation-reveal
yes(
  'negation-reveal',
  'Die Mystery Castle ist keine Achterbahn. Es ist ein Freifallturm im Dunkeln.'
);
yes('negation-reveal', 'Eigentlich ist es keine Achterbahn, sondern ein Turm.');
no('negation-reveal', 'Die Mystery Castle ist keine Achterbahn, aber sie ist hoch.');
// A figure or a name in the second half corrects a guess.
no('negation-reveal', 'Chiapas ist keine Achterbahn. Es ist eine Wildwasserbahn, ab 1,20 Meter.');
no('negation-reveal', "Raik isn't a family ride. It's a Maurer.", 'en');

// 78 from-to-mirror
yes('from-to-mirror', 'Der Bus fährt von Rust zum Bahnhof und von Ringsheim zum Park.');
no(
  'from-to-mirror',
  'Die Saison läuft vom 8. bis zum 20. November und vom 29. November bis zum 3. Dezember.'
);

// 79 queue-comparison-close
const queueClose = (n) => `Absatz ${n}. Im Herbst stehst du dort halb so lange an.`;
yes('queue-comparison-close', lines(...[1, 2, 3].map(queueClose)));
no('queue-comparison-close', lines(...[1, 2].map(queueClose)));

// 80 dash-explained-twice
yes(
  'dash-explained-twice',
  lines('Ein Strich heißt, dass die Bahn zu war.', 'Wo ein Strich steht, fehlen die Daten.')
);
no('dash-explained-twice', 'Ein Strich heißt, dass die Bahn zu war.');

// 81 park-to-park
yes('park-to-park', 'Die Mindestgröße unterscheidet sich von Park zu Park.');
yes('park-to-park', 'The minimum height varies from park to park.', 'en');
no('park-to-park', 'Pour passer d’un parc à l’autre le même jour.', 'fr');

// 82 caption-echo
yes(
  'caption-echo',
  'Im Europa-Park fährt der Alpenexpress Enzian. Mitfahren darf man dort ab 90 Zentimetern.',
  'de',
  [['caption', 'Der Alpenexpress Enzian im Europa-Park, ab 90 Zentimetern.']]
);
no('caption-echo', 'Im Europa-Park fährt der Alpenexpress Enzian.', 'de', [
  ['caption', 'Der Alpenexpress Enzian im Europa-Park, ab 90 Zentimetern.'],
]);

// 54 recomputed-difference, since the critic's run of 2026-10-22: the conclusion without a comparative
const dayTable = [
  '| Ticket | Europa-Park |',
  '| --- | --- |',
  '| Tagesticket | 67 bis 76 € |',
].join('\n');
yes(
  'recomputed-difference',
  lines(
    dayTable,
    'Das Zwei-Tages-Ticket kostet im Europa-Park online 127 bis 143,50 € für Erwachsene, der zweite Tag also 60 bis 67,50 €.'
  )
);
yes(
  'recomputed-difference',
  lines(
    ['| Ticket | Europa-Park |', '| --- | --- |', '| Day ticket | €67 to €76 |'].join('\n'),
    'The two-day ticket costs €127 to €143.50 online, which puts the second day at €60 to €67.50.'
  ),
  'en'
);
no(
  'recomputed-difference',
  'Gespielt wird freitags und samstags vom 2. bis 31. Oktober 2026, also am 2., 3., 9., 10., 16. und 17. Oktober.'
);
no(
  'recomputed-difference',
  lines(
    dayTable,
    'Das Zwei-Tages-Ticket kostet im Europa-Park online 127 bis 143,50 €, also 20 € weniger als zwei Tage.'
  )
);

// 26 link-sentence-close, since the critic's run of 2026-10-22: two pages joined in the closing sentence
const twoPages = (n) =>
  `Absatz ${n}. Monate, Wochentage und Uhrzeiten stehen auf den Statistikseiten von [Europa-Park](ref:europa-park?bare) und [Phantasialand](ref:phantasialand?full).`;
yes('link-sentence-close', lines(twoPages(1), twoPages(2)));
no('link-sentence-close', lines(twoPages(1), 'Absatz zwei endet ohne Link.'));
// Two parks named in a closing sentence that points nowhere.
no(
  'link-sentence-close',
  lines(
    'Absatz eins. Seit 2006 gehört der Park der Compagnie des Alpes, der auch [Walibi Belgium](ref:walibi-belgium) und [Parc Astérix](ref:parc-asterix) gehören.',
    'Absatz zwei. Näher liegen das [Efteling](ref:efteling) und [Toverland](ref:attractiepark-toverland).'
  )
);

// 84 price-not-sold
no(
  'price-not-sold',
  '- Tarifs : 67 à 76 € (site du parc)\n- ResortPass (pas en vente en septembre 2026)\n- Euro Mir (RCDB)\n',
  'fr'
);
yes(
  'price-not-sold',
  'Den ResortPass gibt es in Silber für 325 €, in Gold für 495 €, derzeit nicht im Verkauf.'
);
yes(
  'price-not-sold',
  [
    '| Pass | Europa-Park |',
    '| --- | --- |',
    '| Jahreskarte | ResortPass in Silber für 325 €, in Gold für 495 €, derzeit nicht im Verkauf |',
  ].join('\n')
);
yes(
  'price-not-sold',
  "The ResortPass, €325 in Silver and €495 in Gold, isn't on sale at the moment.",
  'en'
);
no(
  'price-not-sold',
  'Der ResortPass ist derzeit nicht im Verkauf; neue Karten kündigt der Park an.'
);
no('price-not-sold', 'Der ResortPass kostet in Silber 325 €.');
no(
  'price-not-sold',
  "The €33 evening ticket, valid from 4 pm between 21 December and 3 January, isn't sold for 31 December.",
  'en'
);
no(
  'price-not-sold',
  'On the long days Speedy Rides costs €60, Unlimited €110, and Speedy One isn’t sold.',
  'en'
);

// 85 ref-link-opener-series
const refRide = (name, rest) =>
  `[${name}](ref:europa-park/${name.toLowerCase().replace(/\s+/g, '-')}) ${rest}`;
yes(
  'ref-link-opener-series',
  [
    refRide('Silver Star', 'ist 73 Meter hoch.'),
    refRide('Wodan', 'ist eine Holzachterbahn.'),
    refRide('Voltron Nevera', 'wird mit einem Abschuss gestartet.'),
    refRide('Blue Fire', 'fährt seit 2009.'),
  ].join(' ')
);
yes(
  'ref-link-opener-series',
  lines(
    [
      refRide('Silver Star', 'ist 73 Meter hoch.'),
      refRide('Wodan', 'ist eine Holzachterbahn.'),
      refRide('Arthur', 'ist ein Dark Ride.'),
    ].join(' '),
    [refRide('Voltron Nevera', 'wird gestartet.'), refRide('Blue Fire', 'fährt seit 2009.')].join(
      ' '
    )
  )
);
no(
  'ref-link-opener-series',
  [
    refRide('Silver Star', 'ist 73 Meter hoch.'),
    refRide('Wodan', 'ist eine Holzachterbahn.'),
    refRide('Voltron Nevera', 'wird gestartet.'),
    'Dazu kommt Blue Fire.',
  ].join(' ')
);

// 30 own-post-as-proof: the linked post with no verb, twice
const ownLinked =
  'Auch im Heide Park ist der Samstag der vollste Tag, wie in den meisten Parks aus unserem [Vergleich von Wochentag und Uhrzeit](/blog/freizeitpark-wenig-los-wochentag-uhrzeit).';
yes('own-post-as-proof', lines(ownLinked, ownLinked));
yes(
  'own-post-as-proof',
  lines(
    'Saturday is the busiest day, as at most parks in our [weekday comparison](/blog/theme-parks-quiet-days-and-hours).',
    'Sunday is quieter, as in our [rain guide](/blog/theme-parks-in-the-rain).'
  ),
  'en'
);
no(
  'own-post-as-proof',
  lines(
    'Der Samstag ist der vollste Tag, mehr dazu im [Vergleich](/blog/x).',
    'Wie in den meisten Parks ist der Samstag voll.'
  )
);

// 34 looks-different-colon: `works differently:`
yes(
  'looks-different-colon',
  lines(
    'A virtual queue works differently: you book a place in the app.',
    'A single rider line works differently: you ride alone.'
  ),
  'en'
);
no('looks-different-colon', 'A virtual queue works differently, and the app shows it.', 'en');

// 52 preposition-name-opener: a widget does not end a run of park openers
const parkLinks =
  'Links: [Europa-Park](ref:europa-park), [Walibi Holland](ref:walibi-holland), [Phantasialand](ref:phantasialand).';
const hourly = '```hourly-profile-widget park=x\n```';
yes(
  'preposition-name-opener',
  lines(
    parkLinks,
    'Im Europa-Park bleibt die Wartezeit bis zum Abend hoch.',
    hourly,
    'In Walibi Holland sinkt sie ab dem Nachmittag.',
    hourly,
    'Im Phantasialand ist sie mittags am längsten.',
    hourly
  )
);
no(
  'preposition-name-opener',
  lines(
    parkLinks,
    'Im Europa-Park bleibt die Wartezeit bis zum Abend hoch.',
    hourly,
    'Die Kurve sinkt ab dem Nachmittag.',
    hourly,
    'Im Phantasialand ist sie mittags am längsten.'
  )
);
// The town in a park's path is the park: `In Rust` and `Im Europa-Park` are one opener.
const twoParks =
  '[Europa-Park](/de/parks/europe/germany/rust/europa-park) und [Disneyland Park](/de/parks/europe/france/paris/disneyland-park).';
const filler = (n) => `Absatz ${n} hat keinen Ort am Anfang.`;
yes(
  'preposition-name-opener',
  lines(
    twoParks,
    'In Rust gibt es Baby-Switch.',
    filler(1),
    'Im Europa-Park fährt Voltron.',
    filler(2),
    'In Rust stehen sechs Hotels.',
    filler(3),
    'Im Europa-Park regnet es selten.',
    filler(4)
  )
);
no(
  'preposition-name-opener',
  lines(
    twoParks,
    'In Rust gibt es Baby-Switch.',
    filler(1),
    'In Paris fährt Big Thunder Mountain.',
    filler(2),
    filler(3),
    filler(4),
    filler(5),
    filler(6),
    filler(7)
  )
);

// 58 cost-per-duration: the budget in the next sentence, and a cost per second
yes(
  'cost-per-duration',
  'Für gut zwei Minuten Fahrt plant der Park 50 Millionen Euro ein, knapp 400.000 € pro Sekunde.'
);
yes(
  'cost-per-duration',
  'The park is budgeting 50 million euros for a ride of just over two minutes, close to €400,000 a second.',
  'en'
);
yes(
  'cost-per-duration',
  'Die Fahrt dauert gut zwei Minuten. Der Park nennt Kosten von 50 Millionen Euro.'
);
no('cost-per-duration', 'Die Fahrt dauert gut zwei Minuten. Der Fast Pass kostet 8 €.');
no('cost-per-duration', 'Der Park investiert 50 Millionen Euro in den neuen Themenbereich.');

// 72 same-park-template: the apposition `, ebenfalls im …`, `, also at …`
yes(
  'same-park-template',
  'Die längste ist Katun im selben Park. Goudurix, ebenfalls im Parc Astérix, hat sieben Inversionen. Am tiefsten fällt Valkyria, ebenfalls in Liseberg.'
);
yes(
  'same-park-template',
  'The longest is Katun in the same park. Goudurix, also at Parc Astérix, has seven inversions. The deepest drop is Valkyria, also at Liseberg.',
  'en'
);
no(
  'same-park-template',
  'Die längste ist Katun im selben Park. Das Fest, ebenfalls im Oktober, ist voll. Ebenfalls im Park liegt ein Hotel.'
);

// 76 opener-skeleton-series: `im`, `in` and `bei` are one slot
const longestQueue = (prep, park) =>
  `Die längste Warteschlange ${prep} ${park} steht vor der großen Achterbahn.`;
yes(
  'opener-skeleton-series',
  lines(
    longestQueue('im', 'Europa-Park'),
    longestQueue('in', 'Walibi Holland'),
    longestQueue('bei', 'Efteling'),
    longestQueue('im', 'Phantasialand')
  )
);
no(
  'opener-skeleton-series',
  lines(
    'At Heide Park in Soltau, children under 90 centimetres get in free.',
    'At Toverland in Sevenum, children under 90 centimetres pay nothing.',
    'At Parc Astérix in Plailly, children under 3 are free.'
  ),
  'en'
);

// 80 dash-explained-twice: two thresholds are two explanations
no(
  'dash-explained-twice',
  lines(
    'Ein Strich heißt, dass die Bahn unter 5 Minuten lag.',
    'Steht in der Tabelle ein Strich, gab es weniger als 20 Messtage.'
  )
);

// 81 park-to-park: by the day, with a verb of varying
yes(
  'park-to-park',
  'Premier Access One kostet je nach Tag unterschiedlich viel, bei Frozen Ever After zum Beispiel 23 Euro.'
);
yes(
  'park-to-park',
  'Premier Access One costs a different amount from day to day, for example €23 at Frozen Ever After.',
  'en'
);
no('park-to-park', 'Die Preise ändern sich von Tag zu Tag, angegeben ist der niedrigste.');
no('park-to-park', 'Ein Ticket kostet je nach Tag zwischen 40 und 56 Euro.');

// 83 research-stamp: a date that opens a range is the span of the data
no(
  'research-stamp',
  '- Wartezeit-Daten: eigene Messungen, Stand 24. Dezember 2025 bis 25. September 2026\n'
);
no(
  'research-stamp',
  '- Wartezeiten: eigene Messungen vom 24. Dezember 2025 bis zum 25. September 2026\n'
);
no('research-stamp', '- Wait-time data: as of 24 December 2025 to 25 September 2026\n', 'en');

// 85 ref-link-opener-series: a name in bold opens like a link
yes(
  'ref-link-opener-series',
  '**Big Thunder Mountain** ist eine Grubenbahn. **Star Wars Hyperspace Mountain** fährt im Dunkeln. **Phantom Manor** ist ein Geisterhaus. **Pirates of the Caribbean** fährt durch eine Höhle.'
);
no(
  'ref-link-opener-series',
  '**Tipp:** früh kommen. **Achtung:** Taschen bleiben draußen. **Preis:** 5 €. **Hinweis:** Hunde dürfen mit.'
);

// 86 title-heading
const titled = (t) => [['title', t]];
yes(
  'title-heading',
  lines('## Die schnellsten Achterbahnen Europas', 'Text.'),
  'de',
  titled('Die schnellsten Achterbahnen Europas')
);
yes(
  'title-heading',
  lines("## Europe's fastest roller coasters", 'Text.'),
  'en',
  titled("Europe's fastest roller coasters")
);
no(
  'title-heading',
  lines('## Die zehn schnellsten Achterbahnen', 'Text.'),
  'de',
  titled('Die schnellsten Achterbahnen Europas')
);
// The `seo.title` under it may be a chapter's heading.
no('title-heading', lines('## Wann der Europa-Park am leersten ist', 'Text.'), 'de', [
  ['title', 'Europa-Park: Deutschlands größter Park'],
  ['title', 'Wartezeiten: Wann ist der Europa-Park am leersten?'],
]);

// 87 chapter-pointer-opener
yes(
  'chapter-pointer-opener',
  lines(
    '## Mit Baby',
    'Für Babys und Kleinkinder gibt es einen eigenen [Guide zum Freizeitpark mit Kleinkind und Baby](/blog/freizeitpark-mit-kleinkind-und-baby). Ein Kinderwagen kostet 5 €.',
    '## Bei Regen',
    'Im [Regen-Guide](/blog/freizeitpark-bei-regen) stehen die überdachten Attraktionen beider Parks.'
  )
);
yes(
  'chapter-pointer-opener',
  lines(
    '## With a baby',
    "There's a separate [guide to theme parks with toddlers and babies](/blog/theme-parks-with-toddlers-and-babies).",
    '## When it rains',
    'The [rain guide](/blog/theme-parks-in-the-rain) lists the covered attractions in both parks.'
  ),
  'en'
);
no(
  'chapter-pointer-opener',
  lines(
    '## Mit Baby',
    'Ein Leih-Kinderwagen kostet 5 €; alles Weitere steht im [Guide](/blog/freizeitpark-mit-kleinkind-und-baby).',
    '## Bei Regen',
    'In [Hollywood eröffnet](/blog/hollywood-drift) hat die Bahn im September.'
  )
);

// 88 gap-above-widget
yes(
  'gap-above-widget',
  lines(
    'Seine Wartezeiten zeigt der Hansa-Park nur in der App im Park, deshalb fehlt der Kärnan unten.',
    fence
  )
);
yes(
  'gap-above-widget',
  lines(
    'Hansa-Park only publishes its wait times in its own app, which is why Kärnan is missing below.',
    fence
  ),
  'en'
);
yes(
  'gap-above-widget',
  lines('Per questo il Kärnan non compare nell’elenco qui sotto.', fence),
  'it'
);
no(
  'gap-above-widget',
  lines('Wie lange man am Kärnan ansteht, zeigt der Hansa-Park nur in seiner App.', fence)
);
no('gap-above-widget', lines('Deshalb fehlt der Kärnan unten.', 'Ein Absatz dazwischen.', fence));

// 89 same-model-series
yes(
  'same-model-series',
  lines(
    'Beide hat Intamin als Mega Coaster gebaut, dasselbe Modell wie Hyperion.',
    'Shambhala ist dasselbe Modell wie Silver Star.'
  )
);
yes(
  'same-model-series',
  'Intamin built both, the same model as Hyperion. Shambhala is the same model as Silver Star.',
  'en'
);
no('same-model-series', 'Beide hat Intamin als Mega Coaster gebaut, so wie Hyperion.');

// 90 elliptic-record
yes(
  'elliptic-record',
  'Goliath ist die höchste Bahn der Niederlande. In Belgien ist es [Kondaa](ref:walibi-belgium/kondaa) in Walibi Belgium.'
);
yes(
  'elliptic-record',
  "Goliath is the tallest in the Netherlands. In Belgium it's [Kondaa](ref:walibi-belgium/kondaa).",
  'en'
);
no(
  'elliptic-record',
  'Die höchste Achterbahn Belgiens ist [Kondaa](ref:walibi-belgium/kondaa). In Paris ist es teurer.'
);
no('elliptic-record', "In Paris it's offered at Hyperspace Mountain and Ratatouille.", 'en');

// 91 opening-date-close
yes(
  'opening-date-close',
  lines(
    'Katun ist ein Inverted Coaster von Bolliger & Mabillard und hat im April 2000 eröffnet.',
    'Valkyria fällt 50 Meter tief. Valkyria hat im August 2018 eröffnet.'
  )
);
yes(
  'opening-date-close',
  lines(
    'Katun is an inverted coaster and opened in April 2000.',
    'It has seven inversions and has been running since April 2024.'
  ),
  'en'
);
no(
  'opening-date-close',
  lines(
    'Katun hat im April 2000 eröffnet.',
    'Seit April 2000 hängen die Fahrgäste unter der Schiene, sechsmal über Kopf.'
  )
);
no(
  'opening-date-close',
  lines(
    "It's been called Nemesis Reborn since 16 March 2024.",
    "We've been measuring both parks since 26 December 2025."
  ),
  'en'
);

// 92 negated-measure-close
yes(
  'negated-measure-close',
  'The Smiler hat 14 Inversionen. Schneller als 85 km/h fährt sie nicht.'
);
yes(
  'negated-measure-close',
  'Its 14 inversions include two dive loops, and it never goes faster than 85 km/h.',
  'en'
);
no('negated-measure-close', 'Für 14 Überschläge reichen ihr 85 km/h.');
no(
  'negated-measure-close',
  'It never goes faster than 45 mph, and the first launch takes three seconds.',
  'en'
);

// 93 once-each-chain
const onceDe = (t) => `${t} gilt je einmal an Colossos und Krake.`;
yes('once-each-chain', lines(...['Bronze', 'Silber', 'Gold', 'Platin', 'Diamant'].map(onceDe)));
yes(
  'once-each-chain',
  lines(
    ...['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map(
      (t) => `${t} is good once on Colossos and Krake.`
    )
  ),
  'en'
);
no('once-each-chain', lines(...['Bronze', 'Silber', 'Gold', 'Platin'].map(onceDe)));

// 94 queue-there-series
const thereDe = (r) => `${r} fährst du am Nachmittag, dann ist die Warteschlange dort kürzer.`;
yes('queue-there-series', lines(...['Black Mamba', 'Taron', 'Chiapas', 'F.L.Y.'].map(thereDe)));
yes(
  'queue-there-series',
  lines(
    ...['Black Mamba', 'Taron', 'Chiapas', 'Maus au Chocolat'].map(
      (r) => `Ride ${r} late, the queue there is shorter.`
    )
  ),
  'en'
);
no('queue-there-series', lines(...['Black Mamba', 'Taron', 'Chiapas'].map(thereDe)));

// 95 bare-sum-close
yes(
  'bare-sum-close',
  'Der Quick Pass Ultimate kostet 80 € und gilt an elf Bahnen. Alle elf Einzelpässe zusammen kosten 83 €.'
);
yes(
  'bare-sum-close',
  'The Quick Pass Ultimate costs €80. All eleven single passes together come to €83.',
  'en'
);
no(
  'bare-sum-close',
  'Alle elf Einzelpässe zusammen kosten 83 €, der Ultimate ist also das billigere Bündel.'
);
no(
  'bare-sum-close',
  'Die Zwei-Tages-Karte beginnt bei 42,90 €, mit dem Parque Warner Beach zusammen kostet ein Tag ab 44,80 €.'
);
no(
  'bare-sum-close',
  'All of it together cost at least €116.50 on top of admission. For 2026 the park sells packages.',
  'en'
);

// 96 name-triple-echo
yes(
  'name-triple-echo',
  'ONE gilt für eine Bahn, und zur Wahl stehen auch Shambhala, Dragon Khan, Furius Baco und Uncharted. Express 5 Adrenaline gilt nur an sieben Bahnen: Shambhala, Dragon Khan, Furius Baco, Stampida, Grand Canyon Rapids, El Diablo und Templo del Fuego. Express 10 verkaufen auch Automaten vor Shambhala, Dragon Khan und Furius Baco.'
);
yes(
  'name-triple-echo',
  'Shambhala, Dragon Khan, Furius Baco and Uncharted are all on the menu. Express 5 covers Shambhala, Dragon Khan, Furius Baco and Stampida. Machines stand in front of Shambhala, Dragon Khan and Furius Baco.',
  'en'
);
no(
  'name-triple-echo',
  'ONE gilt im PortAventura Park für eine von 13 Bahnen, Uncharted eingeschlossen. Express 5 gilt an Shambhala, Dragon Khan und Furius Baco. Automaten stehen vor Shambhala und Stampida.'
);

// 97 x-against-x
yes(
  'x-against-x',
  'Verglichen haben wir mit trockenen Tagen im selben Monat, Wochenende gegen Wochenende und Ferien gegen Ferien.'
);
yes('x-against-x', 'We compared weekend against weekend and holiday against holiday.', 'en');
yes('x-against-x', 'Chaque jour de pluie est comparé, semaine contre semaine.', 'fr');
no('x-against-x', 'Verglichen haben wir Wochenende mit Wochenende.');
no('x-against-x', 'Dort fahren zwei Züge, Looping gegen Looping.');
no('x-against-x', 'Si siede schiena contro schiena.', 'it');

// 98 list-source-colon
yes(
  'list-source-colon',
  lines(
    'In Paris gilt je Attraktion eine Grenze. Nach Disneys Liste:',
    '- Big Thunder Mountain: 1,02 m'
  )
);
yes(
  'list-source-colon',
  lines(
    "Many rides have two limits. From the park's list, each with an adult:",
    '- Silver Star: 1.40 m'
  ),
  'en'
);
no(
  'list-source-colon',
  lines('In Paris hat jede Attraktion genau eine Mindestgröße:', '- Big Thunder Mountain: 1,02 m')
);
no('list-source-colon', 'Nach Disneys Liste gilt in Paris eine Grenze je Attraktion.');

// 99 widget-one-liner
const oneLiner = (p) => `In ${p} bleibt die Wartezeit über den Tag fast gleich.`;
yes(
  'widget-one-liner',
  lines(
    '## A',
    oneLiner('Blackpool'),
    hourly,
    oneLiner('Thorpe Park'),
    hourly,
    oneLiner('Alton Towers'),
    hourly
  )
);
no(
  'widget-one-liner',
  lines(
    '## A',
    `${oneLiner('Blackpool')} Erst abends wird es leer.`,
    hourly,
    oneLiner('Thorpe Park'),
    hourly,
    'So sieht der Tag aus:',
    hourly
  )
);

// 100 where-month-cause
yes(
  'where-month-cause',
  'Im Thorpe Park, wo im Oktober die Fright Nights laufen, war der Oktober der vollste Monat.'
);
yes(
  'where-month-cause',
  'At Thorpe Park, where Fright Nights run in October, October was the busiest month.',
  'en'
);
no(
  'where-month-cause',
  'Im Oktober laufen im Thorpe Park die Fright Nights, und der Oktober war der vollste Monat.'
);
no(
  'where-month-cause',
  'Im Thorpe Park, wo im Oktober die Fright Nights laufen, war der August ruhiger.'
);

// 101 heading-and-orphan
yes(
  'heading-and-orphan',
  lines(
    '## Wo du in den Niederlanden und Belgien parkst',
    'In den Niederlanden zahlst du 10 €, mehr im [Walibi-Belgien-Guide](/blog/walibi-belgium).'
  )
);
yes(
  'heading-and-orphan',
  lines('## Parking in the Netherlands and Belgium', 'In the Netherlands parking costs €10.'),
  'en'
);
no(
  'heading-and-orphan',
  lines(
    '## Wo du in den Niederlanden und Belgien parkst',
    'In den Niederlanden zahlst du 10 €, in belgischen Parks 12 €.'
  )
);
no('heading-and-orphan', lines('## Hotels und Essen', 'Im Park gibt es zwölf Restaurants.'));

// 102 next-year-close (PR #997)
yes(
  'next-year-close',
  dated(
    lines(
      '## Herbstferien',
      'Der 17. Oktober war der vollste Tag. Ob es 2027 wieder so kommt, zeigen erst die nächsten Herbstferien.'
    )
  )
);
yes(
  'next-year-close',
  dated(
    lines(
      '## October',
      'October was the busiest month. Whether next year repeats it is anyone’s guess.'
    )
  ),
  'en'
);
no(
  'next-year-close',
  dated(lines('## Neuheiten', 'Liseberg baut weiter. Oceana wird Anfang 2027 eröffnet.'))
);
no(
  'next-year-close',
  dated(
    lines(
      '## Häufige Fragen',
      '### Wann wird es 2027 voll?',
      'Wenn 2027 so läuft wie 2026, zuerst um Ostern, das auf den 28. März fällt.'
    )
  )
);

// 103 weekday-formula
yes(
  'weekday-formula',
  lines(
    'Beide Tage, ein Dienstag und ein Mittwoch, lagen in den Osterferien.',
    'Der 17. Oktober 2026, ein Samstag, gehört in acht Parks zu den vollsten Tagen.',
    'In Spanien war der Nationalfeiertag am 12. Oktober ein Montag, und das Wochenende davor war voll.'
  )
);
yes(
  'weekday-formula',
  lines(
    'Both days, a Tuesday and a Wednesday, fell in the Easter holidays.',
    'Heide Park peaked on German Unity Day, which fell on a Saturday in 2026.',
    'In Spain the national holiday on 12 October was a Monday.'
  ),
  'en'
);
no(
  'weekday-formula',
  lines(
    'Fronleichnam fiel 2026 auf einen Donnerstag, und der Freitag danach war ein Brückentag.',
    'Im Europa-Park war der Tag so voll wie ein Samstag.'
  )
);
no(
  'weekday-formula',
  lines(
    'At Europa-Park the day was as busy as a Saturday.',
    'I plan a 1 May that falls on a weekday as if it were a Saturday.',
    'Corpus Christi fell on Thursday 4 June.'
  ),
  'en'
);

// 104 count-superlative-refrain
const busiest = (n, s) => Array.from({ length: n }, (_, i) => `Park ${i} hatte ihn unter ${s}.`);
yes('count-superlative-refrain', lines(...busiest(5, 'seinen fünf vollsten Tagen')));
yes(
  'count-superlative-refrain',
  lines(...Array.from({ length: 5 }, (_, i) => `Park ${i} counts it among its five busiest days.`)),
  'en'
);
no('count-superlative-refrain', lines(...busiest(4, 'seinen fünf vollsten Tagen')));
no(
  'count-superlative-refrain',
  lines(...busiest(3, 'seinen fünf vollsten Tagen'), ...busiest(3, 'seinen drei längsten Bahnen'))
);

// 105 who-so-close
yes(
  'who-so-close',
  'Joris en de Draak und De Vliegende Hollander liegen gleichauf. Wer im Efteling also zwischen Drache und Geisterschiff schwankt, verliert mit keinem von beiden Zeit.'
);
yes(
  'who-so-close',
  'The two rides tie. So if you can’t choose between the dragon and the ghost ship, neither costs you time.',
  'en'
);
no(
  'who-so-close',
  'Die Stunde ab elf ist die längste. Wer zur Öffnung da ist, fährt die großen Bahnen am besten zuerst.'
);
no(
  'who-so-close',
  'The hour from eleven is the longest. If you’re there at opening, ride the big ones first.',
  'en'
);

// 106 round-robin-connector
yes(
  'round-robin-connector',
  lines(
    'Am 3. Oktober war der Heide Park dran.',
    'Eine Woche später kam Walibi Belgium an die Reihe.'
  )
);
yes(
  'round-robin-connector',
  lines('On 3 October it was Heide Park’s turn.', 'A week later, next up was Walibi Belgium.'),
  'en'
);
no('round-robin-connector', 'Am 3. Oktober war der Heide Park dran, eine Woche vor Halloween.');
no(
  'round-robin-connector',
  lines(
    'Der Heide Park ist nah dran an Soltau.',
    'Walibi Belgium hatte seinen vollsten Tag im Oktober.'
  )
);

// 107 rank-place-series
yes(
  'rank-place-series',
  lines(
    "In Chessington eröffnete am 3. Mai die World of PAW Patrol, und ihre beiden Bahnen Chase's Mountain Mission und Zuma's Hovercraft Adventure stehen dort seitdem auf Platz drei und vier, hinter Dragon's Fury und Vampire.",
    'Die Bluey-Bahn „Here Come the Grannies“, Ende März in Alton Towers eröffnet, kam dort auf Platz sieben, und Stormvåg auf Platz fünf.'
  )
);
yes(
  'rank-place-series',
  lines(
    "World of PAW Patrol opened at Chessington on 3 May, and its two rides have been third and fourth there ever since, behind Dragon's Fury and Vampire.",
    'The Bluey ride "Here Come the Grannies" came in seventh there, and Stormvåg came in fifth.'
  ),
  'en'
);
no(
  'rank-place-series',
  lines(
    'Bei den Golden Ticket Awards 2026 landete Troy auf Platz 24 der Holzachterbahnen weltweit.',
    'Wodan kam auf Platz 11, Balder auf Platz 13 und Colossos auf Platz 18.'
  )
);
no(
  'rank-place-series',
  lines(
    '| Platz | Bahn |\n| --- | --- |\n| 1 | Taron |\n| 2 | F.L.Y. |',
    'Taron steht dort seitdem auf Platz eins.'
  )
);

// 108 count-and-arrive
yes('count-and-arrive', 'Zählt man die Ferientage aller drei Regionen zusammen, kommt man auf 31.');
yes('count-and-arrive', 'Add up the holiday days of all three regions and you get 31.', 'en');
no('count-and-arrive', 'Die drei Regionen haben zusammen 31 Ferientage.');
no('count-and-arrive', 'Zählt man nach, stimmt die Liste.');

// 109 contrast-connector-series
yes(
  'contrast-connector-series',
  lines(
    'In Disney Adventure World war es dagegen von Januar bis Oktober in jedem Monat ähnlich voll.',
    'In PortAventura ist die Warteschlange an den großen Bahnen dagegen schon in der ersten Stunde fast so lang wie mittags.'
  )
);
yes(
  'contrast-connector-series',
  lines(
    'At Heide Park, on the other hand, three rides are so close that only a photo finish could settle it.',
    'At PortAventura, by contrast, the first hour is nearly as long as noon.'
  ),
  'en'
);
no(
  'contrast-connector-series',
  lines(
    'TRON und Big Thunder laufen dagegen nicht.',
    'Stadtbusse setzen dich dagegen am Ticket Center ab.',
    'Die Monate oben stehen dagegen auf wenigen Tagen.'
  )
);
no(
  'contrast-connector-series',
  lines(
    'Im Phantasialand liegt der Sonntag dagegen auf Platz zwei.',
    'Seit dem 28. September sammelt ein Netzwerk Unterschriften für ein Bürgerbegehren dagegen.'
  )
);

// 110 not-x-close
yes(
  'not-x-close',
  lines(
    'Wie viele wegen der Monster kamen, sagt keine Wartezeit: Wir zählen Minuten, nicht Kostüme.',
    'Gespeichert wird die angezeigte Wartezeit, also die Schätzung des Parks, nicht das, was eine Stoppuhr sagen würde.'
  )
);
yes(
  'not-x-close',
  lines(
    'How many came for the scares a wait time can’t tell you: we count minutes, not costumes.',
    'What we store is the posted wait rounded to five minutes, so it’s the park’s estimate, not what a stopwatch would say.'
  ),
  'en'
);
no(
  'not-x-close',
  lines(
    'Bis zum Saisonende fährst du am besten am Donnerstag, Freitag oder Sonntag, nicht am Samstag.',
    'Nimm dir eine Stunde dafür, nicht zwanzig Minuten.',
    'Den höchsten Wert im Park hat Van Helsing’s Factory, nicht die große Achterbahn.'
  )
);
no(
  'not-x-close',
  lines(
    'Eleven of these bins stand in the park today, not all of them shaped like Gijs.',
    'AtmosFear only runs in summer, not during Halloween and not at Christmas.',
    'The hotel belongs to Svenska Mässan, not to Liseberg.'
  ),
  'en'
);

// old-orthography: an error on every surface, German only
cases += 4;
assert.equal(oldSpellings('Er sagt, daß der Fluß hoch ist.').length, 2);
assert.equal(oldSpellings('Der Anschluß läßt auf sich warten.').length, 2);
assert.equal(oldSpellings('Zu Fuß macht es Spaß, mit Gruß, groß und nach Maß.').length, 0);
assert.equal(oldSpellings('Er sagt, dass der Fluss hoch ist.').length, 0);
cases += 2;
assert.equal(
  oldSpellings('Der Park liegt in Schloß Holte-Stukenbrock, nahe Schloß Dankern.').length,
  0
);
assert.equal(
  oldSpellings('> [!QUOTE]\n> Daß es so kommt, wußte keiner.\n> Quelle, 1990\n\nDanach.').length,
  0
);

// werktag-meaning: a Werktag includes Saturday unless the sentence says the span
cases += 6;
assert.equal(werktagSentences('An einem Werktag ohne Ferien ist es leer.', 'de').length, 1);
assert.equal(werktagSentences('Werktags, also Montag bis Freitag, ist es leer.', 'de').length, 0);
assert.equal(werktagSentences('Werktage sind leerer als das Wochenende.', 'de').length, 0);
assert.equal(werktagSentences('In un normale giorno feriale l’attesa è breve.', 'it').length, 1);
assert.equal(werktagSentences('Nei giorni feriali e nel fine settimana.', 'it').length, 0);
assert.equal(werktagSentences('On a weekday it is quiet.', 'en').length, 0);
assert.equal(
  werktagSentences(
    'Werktage heißen hier Montag bis Freitag ohne Feiertag. An Werktagen ist es leer.',
    'de'
  ).length,
  0
);
assert.equal(
  werktagSentences(
    'Per giorni feriali intendiamo dal lunedì al venerdì. Nei giorni feriali è vuoto.',
    'it'
  ).length,
  0
);
cases += 6;
assert.equal(werktagSentences('Unter der Woche, an Werktagen, ist es leer.', 'de').length, 0);
assert.equal(werktagSentences('In settimana, nei giorni feriali, è vuoto.', 'it').length, 0);
assert.equal(
  werktagSentences('Fünf Termine: 14., 15., 19., 20. und 21. Oktober, alles Werktage.', 'de')
    .length,
  0
);
assert.equal(
  werktagSentences('```best-days-widget slug=x\nWerktag\n```\n\nDer Park ist voll.', 'de').length,
  0
);
assert.equal(
  werktagSentences('Nei giorni feriali apre alle 10, tutti i sabati e le domeniche alle 9.', 'it')
    .length,
  0
);
assert.equal(
  werktagSentences('Il parco apre nei giorni feriali, il sabato e la domenica no.', 'it').length,
  0
);

// werktag-meaning in Spanish: a día laborable includes Saturday
cases += 3;
assert.equal(werktagSentences('Un día laborable fuera de vacaciones está vacío.', 'es').length, 1);
assert.equal(
  werktagSentences(
    'Comparé días laborables, es decir, de lunes a viernes sin festivos. Los días laborables son tranquilos.',
    'es'
  ).length,
  0
);
assert.equal(
  werktagSentences('Los días laborables y los fines de semana se parecen.', 'es').length,
  0
);

// 39 captions: the patterns that fit a single sentence run on caption and alt text
cases += 4;
assert.equal(captionFindings('Voll am Tag, und das ist der Grund.', 'de').length, 1);
assert.equal(captionFindings('Sunday is another matter: queues grow.', 'en').length, 1);
assert.equal(captionFindings('Der Eingang des Parks im Herbst.', 'de').length, 0);
assert.equal(captionFindings('A bet on the weather.', 'en').length, 0);
cases += 2;
assert.equal(captionFindings('De jour comme de nuit.', 'fr').length, 0);
assert.equal(captionFindings('', 'de').length, 0);

// 21 a date that opens a line renders as a numbered list (an error since 2026-10-11)
const dateLine = (s) => s.match(DATE_LINE_START);
cases += 2;
assert.ok(dateLine('Die Saison endet am\n1. November 2026.'), 'a date opening a line must match');
assert.ok(!dateLine('Die Saison endet am\n1. November 2026.'), 'a no-break space must not match');

console.log(`prose rules: ${cases} cases passed over ${SLOP_RULES.length} rules`);
