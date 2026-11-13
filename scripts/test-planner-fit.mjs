/**
 * The fit assistant's answers, as the browser holds them while the visitor decides.
 *
 * The measuring is the API's: which wish falls out, what a lever buys and the plan a choice leaves
 * are `src/planner/day-optimizer/fit.vectors.spec.ts` there. What is here changes on a tap and must
 * not wait for a request: the order the list is drawn in, the toggles, and the question an
 * „In den Plan" press asks.
 *
 *     pnpm test:planner-fit
 */

import {
  addWishKey,
  entryWishKey,
  fitChoiceAll,
  fitOrder,
  leverKey,
  togglePin,
  toggleLever,
  toggleWish,
} from '../lib/planner/fit.ts';
import { noRoomForRide, requestedRideChoice } from '../lib/planner/add-ride-fit.ts';

let passed = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failures.push(name);
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const wish = (key, slug) => ({
  key,
  entryId: key.startsWith('e:') ? key.slice(2) : null,
  attractionSlug: slug,
  attractionName: slug,
  ride: null,
  headliner: true,
  replannable: true,
});

// ── The order the list is drawn in ──────────────────────────────────────────
{
  const wishes = [
    wish(entryWishKey('a1'), 'a'),
    wish(entryWishKey('a2'), 'a'),
    wish(addWishKey('b'), 'b'),
    wish(addWishKey('c'), 'c'),
  ];
  const keys = (choice) => fitOrder(wishes, choice).map((w) => w.key);
  check(
    'ohne Angaben: wie angeboten, die zweite Runde hinter allen ersten',
    keys(fitChoiceAll()).join(',') === 'e:a1,a:b,a:c,e:a2',
    keys(fitChoiceAll()).join(',')
  );
  const pinned = togglePin(fitChoiceAll(), addWishKey('c'));
  check('eine angepinnte Bahn steht oben', keys(pinned)[0] === 'a:c');
  check(
    'eine angepinnte zweite Runde bleibt, wo sie angepinnt ist',
    keys(togglePin(fitChoiceAll(), entryWishKey('a2')))[0] === 'e:a2'
  );
  check(
    'noch einmal antippen löst den Pin',
    keys(togglePin(pinned, addWishKey('c')))[0] === 'e:a1'
  );
}

// ── The toggles ─────────────────────────────────────────────────────────────
{
  const pinned = togglePin(fitChoiceAll(), addWishKey('b'));
  const off = toggleWish(pinned, addWishKey('b'));
  check('eine abgewählte Bahn ist nicht mehr angepinnt', off.priority.length === 0);
  check('und abgewählt', off.dropped.has('a:b'));
  check('noch einmal: wieder dabei', !toggleWish(off, addWishKey('b')).dropped.has('a:b'));

  const blocks = [
    { entryId: 'lunch', label: 'Essen', icon: 'food', durationMinutes: 60 },
    { entryId: 'show', label: 'Pause', icon: 'break', durationMinutes: 45 },
  ];
  const shorten = { kind: 'shorten-block', entryId: 'lunch' };
  const drop = { kind: 'drop-block', entryId: 'lunch' };
  const short = toggleLever(blocks, fitChoiceAll(), shorten);
  check('kürzen kürzt', short.shortBlocks.has('lunch') && !short.droppedBlocks.has('lunch'));
  const dropped = toggleLever(blocks, short, drop);
  check(
    'streichen ersetzt das Kürzen am selben Block',
    dropped.droppedBlocks.has('lunch') && !dropped.shortBlocks.has('lunch')
  );
  check('und hebt sich selbst auf', !toggleLever(blocks, dropped, drop).droppedBlocks.has('lunch'));
  const all = toggleLever(blocks, fitChoiceAll(), { kind: 'drop-all-blocks' });
  check('alle streichen streicht alle', all.droppedBlocks.size === 2);
  check(
    'und noch einmal keinen',
    toggleLever(blocks, all, { kind: 'drop-all-blocks' }).droppedBlocks.size === 0
  );
  check('ein Hebel hat einen Schlüssel', leverKey(drop) === 'drop-block:lunch');
  check('der für alle Blöcke auch', leverKey({ kind: 'drop-all-blocks' }) === 'drop-all-blocks:*');
}

// ── „In den Plan": the question, asked of the API ───────────────────────────

/** Runs `read` with `fetch` answering `answer`, and hands back what was sent. */
async function withFetch(answer, read) {
  const saved = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, init) => {
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify(answer), { status: 200 });
  };
  try {
    return { result: await read(), sent };
  } finally {
    globalThis.fetch = saved;
  }
}

const target = {
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
  parkSlug: 'phantasialand',
  date: '2099-07-01',
  timezone: 'Europe/Berlin',
};
const fitAnswer = (fitted, wanted) => ({
  status: 'fit',
  fit: {
    wishes: [],
    blocks: [],
    order: [],
    wanted,
    fitted: Array.from({ length: fitted }, (_, i) => `k${i}`),
    missed: [],
    endMinute: 0,
    totalWaitMinutes: 0,
    idleMinutes: 0,
    entries: [],
    stops: [],
  },
});

{
  const entries = [{ id: 'a1', attractionSlug: 'a', attractionName: 'a', startMinute: 600 }];
  const { result, sent } = await withFetch(fitAnswer(2, 3), () =>
    noRoomForRide({ target, entries, attractionSlug: 'taron', earlyEntry: true })
  );
  check(
    'die Frage ist der Tag plus diese Bahn',
    sent[0].mode === 'fit' &&
      sent[0].add.join() === 'taron' &&
      sent[0].entries.length === 1 &&
      sent[0].prefs.earlyEntry === true &&
      !('choice' in sent[0])
  );
  check(
    'wo nicht alles passt, öffnet die Frage',
    result !== null && result.question.add.join() === 'taron' && result.answer.wanted === 3
  );
  const { result: fits } = await withFetch(fitAnswer(3, 3), () =>
    noRoomForRide({ target, entries, attractionSlug: 'taron' })
  );
  check('wo alles passt, nicht', fits === null);
  const { result: refused } = await withFetch({ status: 'refused', refusal: 'unknown-ride' }, () =>
    noRoomForRide({ target, entries, attractionSlug: 'nope' })
  );
  check('eine verweigerte Frage legt wie bisher ab', refused === null);
  check(
    'und das Gegenüber öffnet mit der Bahn oben',
    requestedRideChoice('taron').priority.join() === 'a:taron'
  );
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((name) => `  ${name}`).join('\n'));
  process.exit(1);
}
