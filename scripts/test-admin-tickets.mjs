/**
 * Unit tests for the ticket admin's pure half (`lib/admin/tickets.ts`): the list's one-line
 * summaries, the window table as the days change, what a save sends, where the API's problems
 * land, the link checks and order, the catalog's order and the click figures per link.
 *
 * Run: pnpm test:admin-tickets
 */
import assert from 'node:assert/strict';
import {
  EMPTY_TICKET_CLICKS,
  draftFromProduct,
  emptyTicketDraft,
  formatTicketDays,
  formatTicketLinks,
  formatTicketSale,
  groupTicketsByResort,
  mergeTicketProblems,
  moveItem,
  setOfficialTicketLink,
  setTicketDays,
  setTicketWindow,
  sharesTicketLinkHost,
  sortTicketProducts,
  strayTicketProblems,
  ticketBody,
  ticketCatalogPath,
  ticketClicks,
  ticketLinkHost,
  ticketLinkProblems,
  ticketOrderAfterMove,
  ticketPatch,
  ticketProblemField,
  ticketProblemsAt,
  ticketProblemsOf,
  ticketProblemsUnder,
  ticketUrlProblem,
  windowTableFor,
} from '../lib/admin/tickets.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const DISNEY = ['magic-kingdom-park', 'epcot', 'disneys-hollywood-studios'];
const DISNEY_WINDOWS = [1, 4, 5, 7, 8, 9, 10, 12, 13, 14].map((window, i) => ({
  days: i + 1,
  window,
}));
const SHOP = {
  seller: 'Walt Disney World',
  url: 'https://disneyworld.disney.go.com/admission/tickets/',
  official: true,
  sponsored: false,
};

/** A stored product as the admin list answers it. */
function product(overrides = {}) {
  return {
    id: 'wdw-date-based',
    slug: 'wdw-date-based',
    region: 'orlando',
    name: 'Walt Disney World date-based theme park ticket',
    resort: 'walt-disney-world',
    markets: ['us', 'uk', 'intl'],
    parks: DISNEY,
    days: { min: 1, max: 10 },
    windowTable: DISNEY_WINDOWS,
    anchor: 'start',
    hopping: 'optional',
    hopSets: [{ parks: DISNEY }],
    confidence: 'high',
    links: [SHOP],
    shopUrl: SHOP.url,
    notes: 'Day 1 is the start date.',
    active: true,
    sortOrder: 1,
    suggestRank: 10,
    sources: [],
    createdAt: '2026-11-13T10:00:00.000Z',
    updatedAt: '2026-11-13T10:00:00.000Z',
    ...overrides,
  };
}

console.log('the summary line');

test('a fixed length with a longer window reads "4 Tage in 7"', () => {
  assert.equal(
    formatTicketDays({
      days: { min: 4, max: 4 },
      windowTable: [{ days: 4, window: 7 }],
      anchor: 'start',
    }),
    '4 Tage in 7'
  );
});

test('a window as long as the days reads "am Stück"', () => {
  assert.equal(
    formatTicketDays({
      days: { min: 14, max: 14 },
      windowTable: [{ days: 14, window: 14 }],
      anchor: 'start',
    }),
    '14 Tage am Stück'
  );
});

test('one day in one is "1 Tag", wherever its window starts', () => {
  assert.equal(
    formatTicketDays({
      days: { min: 1, max: 1 },
      windowTable: [{ days: 1, window: 1 }],
      anchor: 'first_use',
    }),
    '1 Tag'
  );
});

test('a range names its lengths and their windows', () => {
  assert.equal(
    formatTicketDays({ days: { min: 1, max: 10 }, windowTable: DISNEY_WINDOWS, anchor: 'start' }),
    '1–10 Tage in 1–14'
  );
  assert.equal(
    formatTicketDays({
      days: { min: 2, max: 3 },
      windowTable: [
        { days: 2, window: 2 },
        { days: 3, window: 3 },
      ],
      anchor: 'start',
    }),
    '2–3 Tage am Stück'
  );
});

test('a window without a day count, counted from the first visit, says so', () => {
  assert.equal(
    formatTicketDays({ days: 'unlimited', windowDays: 14, anchor: 'first_use' }),
    '14 Tage am Stück ab dem ersten Besuch'
  );
});

test('a pass has no days to count', () => {
  assert.equal(
    formatTicketDays({ days: 'unlimited', pass: true, anchor: 'first_use' }),
    'Pass, beliebig viele Tage'
  );
});

test('the sale range, an open end, and a pass that ends', () => {
  assert.equal(
    formatTicketSale({ onSale: [{ from: '2027-01-03', to: '2027-05-22' }] }),
    'Start 3.1.–22.5.2027'
  );
  assert.equal(
    formatTicketSale({ onSale: [{ from: '2026-09-03', to: '2027-04-18' }] }),
    'Start 3.9.2026–18.4.2027'
  );
  assert.equal(
    formatTicketSale({ onSale: [{ to: '2027-12-31' }], until: '2028-01-31' }),
    'Start bis 31.12.2027 · gültig bis 31.1.2028'
  );
  assert.equal(formatTicketSale({}), 'keine Verkaufsgrenze bekannt');
});

test('links count, with the partner links among them', () => {
  assert.equal(formatTicketLinks([SHOP]), '1 Link');
  assert.equal(
    formatTicketLinks([SHOP, { seller: 'A', url: 'https://a.example/', sponsored: true }]),
    '2 Links, 1 Partnerlink'
  );
});

console.log('\nthe window table');

test('a longer range keeps each window and starts a new length at the one before it', () => {
  const table = windowTableFor(
    [
      { days: 1, window: 1 },
      { days: 2, window: 4 },
    ],
    1,
    4
  );
  assert.deepEqual(table, [
    { days: 1, window: 1 },
    { days: 2, window: 4 },
    { days: 3, window: 4 },
    { days: 4, window: 4 },
  ]);
});

test('a new length is never shorter than its own days', () => {
  assert.deepEqual(windowTableFor([{ days: 1, window: 1 }], 1, 3), [
    { days: 1, window: 1 },
    { days: 2, window: 2 },
    { days: 3, window: 3 },
  ]);
});

test('a shorter range drops the lengths outside it', () => {
  assert.deepEqual(windowTableFor(DISNEY_WINDOWS, 3, 4), [
    { days: 3, window: 5 },
    { days: 4, window: 7 },
  ]);
});

test('a range that is not one yet leaves the table alone', () => {
  const rows = [{ days: 2, window: 4 }];
  assert.deepEqual(windowTableFor(rows, null, 3), rows);
  assert.deepEqual(windowTableFor(rows, 4, 2), rows);
  assert.deepEqual(windowTableFor(rows, 1, 31), rows);
});

test('an emptied window stays empty, and the next new length starts from the last number', () => {
  const rows = setTicketWindow(
    [
      { days: 1, window: 3 },
      { days: 2, window: 4 },
    ],
    2,
    null
  );
  assert.deepEqual(rows, [
    { days: 1, window: 3 },
    { days: 2, window: null },
  ]);
  assert.deepEqual(windowTableFor(rows, 1, 3)[2], { days: 3, window: 3 });
});

test('a fixed length is its own range and has one row', () => {
  const draft = setTicketDays(emptyTicketDraft(), 'fixed', 4, 9);
  assert.equal(draft.daysMax, 4);
  assert.deepEqual(draft.windowTable, [{ days: 4, window: 4 }]);
});

test('unlimited keeps the table for the way back, and sends none', () => {
  const ranged = setTicketDays(emptyTicketDraft(), 'range', 1, 3);
  const unlimited = setTicketDays(ranged, 'unlimited', 1, 3);
  assert.equal(unlimited.windowTable.length, 3);
  const body = ticketBody({ ...unlimited, windowDays: 14 });
  assert.equal(body.days, 'unlimited');
  assert.equal('windowTable' in body, false);
  assert.equal(body.windowDays, 14);
});

console.log('\nwhat a save sends');

test('a stored product comes back as the same body', () => {
  const body = ticketBody(draftFromProduct(product()));
  assert.deepEqual(body.days, { min: 1, max: 10 });
  assert.deepEqual(body.windowTable, DISNEY_WINDOWS);
  assert.deepEqual(body.hopSets, [{ parks: DISNEY }]);
  assert.equal('caps' in body, false);
  assert.equal('description' in body, false);
  assert.equal('id' in body || 'shopUrl' in body || 'createdAt' in body, false);
});

test('no hop sets without hopping, and empty optional fields stay out', () => {
  const draft = { ...draftFromProduct(product()), hopping: 'none', description: '  ', until: '' };
  const body = ticketBody(draft);
  assert.equal('hopSets' in body, false);
  assert.equal('description' in body, false);
  assert.equal('until' in body, false);
});

test('a link without markets or locales is for everyone, and the official flag is only on one', () => {
  const draft = {
    ...emptyTicketDraft(),
    links: [
      {
        seller: ' Disney ',
        url: ' https://a.example/ ',
        official: true,
        sponsored: false,
        markets: [],
        locales: ['de'],
      },
    ],
  };
  assert.deepEqual(ticketBody(draft).links, [
    {
      seller: 'Disney',
      url: 'https://a.example/',
      official: true,
      sponsored: false,
      locales: ['de'],
    },
  ]);
});

test('an unchanged edit sends nothing', () => {
  assert.deepEqual(ticketPatch(product(), draftFromProduct(product())), {});
});

test('an edit sends the changed fields, and null for an emptied one', () => {
  const stored = product({ caps: [{ parks: ['epcot'], max: 1 }] });
  const draft = { ...draftFromProduct(stored), name: 'Disney ticket', caps: [], notes: '' };
  assert.deepEqual(ticketPatch(stored, draft), { name: 'Disney ticket', caps: null, notes: null });
});

test('the slug is never in a patch', () => {
  const draft = { ...draftFromProduct(product()), slug: 'something-else' };
  assert.deepEqual(ticketPatch(product(), draft), {});
});

console.log('\nproblems at their fields');

test('the problem list of a 400 or a validate answer', () => {
  assert.deepEqual(
    ticketProblemsOf({
      statusCode: 400,
      message: 'Invalid',
      problems: [
        { path: 'windowTable[2].window', message: 'must be at least its days (3)' },
        { nope: 1 },
      ],
    }),
    [{ path: 'windowTable[2].window', message: 'must be at least its days (3)' }]
  );
  assert.deepEqual(ticketProblemsOf({ message: 'Unauthorized' }), []);
  assert.deepEqual(ticketProblemsOf(null), []);
});

test('a path belongs to its top field', () => {
  assert.equal(ticketProblemField('windowTable[2].window'), 'windowTable');
  assert.equal(ticketProblemField('days.min'), 'days');
  assert.equal(ticketProblemField('links'), 'links');
  assert.equal(ticketProblemField(''), '');
});

const problems = [
  { path: 'links', message: 'exactly one official' },
  { path: 'links[1].url', message: 'must be https' },
  { path: 'links[10].seller', message: 'too long' },
  { path: 'days.min', message: 'at least 1' },
  { path: 'dryRun.owned', message: 'the plan threw' },
];

test('a field takes its own path, a row takes everything under it', () => {
  assert.deepEqual(ticketProblemsAt(problems, 'links'), ['exactly one official']);
  assert.deepEqual(
    ticketProblemsUnder(problems, 'links[1]').map((problem) => problem.path),
    ['links[1].url']
  );
  assert.deepEqual(
    ticketProblemsUnder(problems, 'days').map((problem) => problem.path),
    ['days.min']
  );
});

test('a row leaves out what its own fields show', () => {
  const row = [
    { path: 'links[0]', message: 'duplicate' },
    { path: 'links[0].url', message: 'must be https' },
    { path: 'links[0].markets[1]', message: 'unknown market' },
  ];
  assert.deepEqual(
    ticketProblemsUnder(row, 'links[0]', ['links[0].url']).map((problem) => problem.path),
    ['links[0]', 'links[0].markets[1]']
  );
});

test('a problem no field shows is listed apart, not lost', () => {
  assert.deepEqual(
    strayTicketProblems(problems, ['links', 'days']).map((problem) => problem.path),
    ['dryRun.owned']
  );
});

test("the form's own link checks and the API's are one list", () => {
  const merged = mergeTicketProblems(problems.slice(0, 2), [
    { path: 'links', message: 'exactly one official' },
    { path: 'name', message: 'required' },
  ]);
  assert.equal(merged.length, 3);
});

console.log('\nlinks');

test('a url is an absolute https address without a password', () => {
  assert.equal(ticketUrlProblem('https://shop.example/tickets'), null);
  assert.match(ticketUrlProblem(''), /fehlt/);
  assert.match(ticketUrlProblem('http://shop.example/'), /https/);
  assert.match(ticketUrlProblem('shop.example/tickets'), /https:\/\//);
  assert.match(ticketUrlProblem('https://user:pw@shop.example/'), /Passwort/);
  assert.match(ticketUrlProblem(`https://shop.example/${'a'.repeat(500)}`), /500/);
});

test('one to ten links, exactly one of them the shop, each with a seller and a url', () => {
  assert.deepEqual(ticketLinkProblems([SHOP]), []);
  assert.deepEqual(
    ticketLinkProblems([]).map((problem) => problem.path),
    ['links']
  );
  const noShop = ticketLinkProblems([{ seller: 'A', url: 'https://a.example/', sponsored: false }]);
  assert.deepEqual(
    noShop.map((problem) => problem.path),
    ['links']
  );
  const twoShops = ticketLinkProblems([SHOP, { ...SHOP, seller: 'B' }]);
  assert.match(twoShops[0].message, /Nur ein Link/);
  const broken = ticketLinkProblems([
    SHOP,
    { seller: ' ', url: 'http://b.example/', sponsored: true },
  ]);
  assert.deepEqual(
    broken.map((problem) => problem.path),
    ['links[1].seller', 'links[1].url']
  );
  const many = Array.from({ length: 11 }, (_, i) => ({
    ...SHOP,
    official: i === 0 ? true : undefined,
  }));
  assert.match(ticketLinkProblems(many)[0].message, /Höchstens 10/);
});

test('marking a link as the shop unmarks the other', () => {
  const links = setOfficialTicketLink(
    [SHOP, { seller: 'B', url: 'https://b.example/', sponsored: false }],
    1
  );
  assert.equal(links[0].official, undefined);
  assert.equal('official' in links[0], false);
  assert.equal(links[1].official, true);
});

test('a link moves up and down, and not past either end', () => {
  assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 1), ['a', 'c', 'b']);
  assert.deepEqual(moveItem(['a', 'b', 'c'], 0, 1), ['b', 'a', 'c']);
  assert.deepEqual(moveItem(['a', 'b', 'c'], 0, -1), ['a', 'b', 'c']);
  assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 3), ['a', 'b', 'c']);
});

console.log("\nthe catalog's order");

const catalog = [
  { slug: 'wdw-a', resort: 'walt-disney-world', sortOrder: 0 },
  { slug: 'uor-a', resort: 'universal-orlando', sortOrder: 1 },
  { slug: 'wdw-b', resort: 'walt-disney-world', sortOrder: 2 },
  { slug: 'uor-b', resort: 'universal-orlando', sortOrder: 3 },
  { slug: 'x-a', resort: 'somewhere-new', sortOrder: 4 },
];

test('moving inside a resort swaps with its neighbour of the same resort', () => {
  assert.deepEqual(ticketOrderAfterMove(catalog, 'wdw-b', -1), [
    'wdw-b',
    'uor-a',
    'wdw-a',
    'uor-b',
    'x-a',
  ]);
  assert.deepEqual(ticketOrderAfterMove(catalog, 'uor-a', 1), [
    'wdw-a',
    'uor-b',
    'wdw-b',
    'uor-a',
    'x-a',
  ]);
});

test('the first of a resort cannot go up, the last cannot go down', () => {
  assert.equal(ticketOrderAfterMove(catalog, 'wdw-a', -1), null);
  assert.equal(ticketOrderAfterMove(catalog, 'uor-b', 1), null);
  assert.equal(ticketOrderAfterMove(catalog, 'missing', 1), null);
});

test("grouped by the region's resorts in its order, an unknown resort last", () => {
  const groups = groupTicketsByResort([...catalog].reverse(), [
    { key: 'walt-disney-world', name: 'Walt Disney World Resort' },
    { key: 'universal-orlando', name: 'Universal Orlando Resort' },
    { key: 'day-trips', name: 'Day trips' },
  ]);
  assert.deepEqual(
    groups.map((group) => [group.key, group.products.map((p) => p.slug)]),
    [
      ['walt-disney-world', ['wdw-a', 'wdw-b']],
      ['universal-orlando', ['uor-a', 'uor-b']],
      ['somewhere-new', ['x-a']],
    ]
  );
});

test('the admin order is sortOrder, ties in the order the API sent', () => {
  assert.deepEqual(
    sortTicketProducts([
      { slug: 'b', sortOrder: 2 },
      { slug: 'a', sortOrder: 1 },
      { slug: 'c', sortOrder: 2 },
    ]).map((p) => p.slug),
    ['a', 'b', 'c']
  );
});

test('the catalog path encodes each part', () => {
  assert.equal(ticketCatalogPath('orlando'), '/api/admin/content/regions/orlando/tickets');
  assert.equal(
    ticketCatalogPath('orlando', 'wdw-date-based', 'archive'),
    '/api/admin/content/regions/orlando/tickets/wdw-date-based/archive'
  );
});

console.log('\nclicks per link');

const linked = product({
  links: [
    SHOP,
    {
      seller: 'Attraction Tickets',
      url: 'https://www.attractiontickets.com/en/orlando',
      sponsored: true,
      markets: ['uk'],
    },
    {
      seller: 'Attraction Tickets US',
      url: 'https://attractiontickets.com/us/orlando',
      sponsored: true,
    },
  ],
});
const byHost = {
  rows: ['wdw-date-based', 'uor-date-based'],
  cols: ['disneyworld.disney.go.com', 'attractiontickets.com'],
  cells: [
    { row: 'wdw-date-based', col: 'disneyworld.disney.go.com', count: 7 },
    { row: 'wdw-date-based', col: 'attractiontickets.com', count: 5 },
    { row: 'uor-date-based', col: 'attractiontickets.com', count: 2 },
  ],
};
const bySeller = {
  rows: ['wdw-date-based'],
  cols: ['Walt Disney World', 'Attraction Tickets', 'Attraction Tickets US'],
  cells: [
    { row: 'wdw-date-based', col: 'Walt Disney World', count: 7 },
    { row: 'wdw-date-based', col: 'Attraction Tickets', count: 4 },
    { row: 'wdw-date-based', col: 'Attraction Tickets US', count: 1 },
  ],
};

test('the host a click names a link by drops www and case', () => {
  assert.equal(ticketLinkHost('https://WWW.AttractionTickets.com/x'), 'attractiontickets.com');
  assert.equal(ticketLinkHost('not a url'), null);
});

test("a link with its own host takes the host's count; two on one host take the seller's", () => {
  assert.equal(sharesTicketLinkHost(linked), true);
  assert.deepEqual(ticketClicks(linked, byHost, bySeller), { total: 12, links: [7, 4, 1] });
});

test('without the seller table, links that share a host are unknown, not 0', () => {
  assert.deepEqual(ticketClicks(linked, byHost, null), { total: 12, links: [7, null, null] });
});

test('an event nobody has sent yet is 0 everywhere', () => {
  assert.deepEqual(ticketClicks(product(), EMPTY_TICKET_CLICKS, null), { total: 0, links: [0] });
});

test('a failed read is unknown, never 0', () => {
  assert.deepEqual(ticketClicks(product(), null, null), { total: null, links: [null] });
});

test('a product the table folded into the rest is unknown; one absent from a whole table is 0', () => {
  const cut = {
    rows: ['uor-date-based', '__rest__'],
    cols: ['disneyworld.disney.go.com'],
    cells: [],
  };
  assert.deepEqual(ticketClicks(product(), cut, null), { total: null, links: [null] });
  const whole = { rows: ['uor-date-based'], cols: ['disneyworld.disney.go.com'], cells: [] };
  assert.deepEqual(ticketClicks(product(), whole, null), { total: 0, links: [0] });
});

console.log(`\n${passed} cases passed.`);
