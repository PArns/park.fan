// The developer portal's key requests: what the form's schema accepts and refuses, which revenue
// models make a use commercial, what the admin's key dialog starts with for a request, how scopes
// read on a key from before scopes, and what the reply mails carry.
import {
  isCommercialRequest,
  keyRequestInputSchema,
  suggestedRequestsPerHour,
  toggleRevenue,
} from '../lib/developers/key-request.ts';
import {
  API_SCOPES,
  API_SCOPE_DEFINITIONS,
  LEGACY_KEY_SCOPES,
  OPEN_API_ROUTES,
  sortScopes,
} from '../lib/developers/scopes.ts';
import {
  apiStoresScopes,
  createDataApiKeyBody,
  effectiveScopes,
  formatScopes,
} from '../lib/admin/api-keys.ts';
import {
  keyApprovalMailto,
  keyRejectionMailto,
  keyRequestPrefill,
} from '../lib/admin/key-requests.ts';

const VALID = {
  locale: 'de',
  name: 'Ada',
  email: 'ada@example.org',
  projectName: 'Coaster Widget',
  website: 'example.org',
  kind: 'smart-home',
  source: 'closed-source',
  revenue: ['none'],
  scopes: ['statistics', 'forecasts'],
  volume: 'under-1k',
  description: 'Ein Widget für den Flur, das die Wartezeiten von drei Parks anzeigt.',
  terms: true,
};

/** The fields a parse refused, or the parsed value's chosen fields. */
function parse(input, pick = []) {
  const result = keyRequestInputSchema.safeParse(input);
  if (!result.success) return { refused: [...new Set(result.error.issues.map((i) => i.path[0]))] };
  return Object.fromEntries(pick.map((key) => [key, result.data[key]]));
}

const RECORD = {
  ...parse(VALID, Object.keys(VALID)),
  organisation: '',
  repository: '',
  parks: 'Phantasialand, Toverland',
  message: '',
  id: '00000000-0000-4000-8000-000000000001',
  createdAt: '2026-11-16T08:00:00.000Z',
  status: 'pending',
};

/** The decoded body of a `mailto:` link. */
function mailBody(href) {
  return decodeURIComponent(new URL(href).searchParams.get('body') ?? '');
}

const testCases = [
  {
    name: 'a complete request passes, a bare host becomes https and scopes take the catalog order',
    actual: () => parse(VALID, ['website', 'scopes', 'organisation', 'repository']),
    expected: {
      website: 'https://example.org',
      scopes: ['forecasts', 'statistics'],
      organisation: '',
      repository: '',
    },
  },
  {
    name: 'open source needs the repository',
    actual: () => parse({ ...VALID, source: 'open-source' }),
    expected: { refused: ['repository'] },
  },
  {
    name: '„none“ cannot stand beside a revenue model',
    actual: () => parse({ ...VALID, revenue: ['none', 'ads'] }),
    expected: { refused: ['revenue'] },
  },
  {
    name: 'no scope, no terms, a short description and a bad address are each refused',
    actual: () =>
      parse({
        ...VALID,
        scopes: [],
        terms: false,
        description: 'kurz',
        email: 'nope',
      }).refused.sort(),
    expected: ['description', 'email', 'scopes', 'terms'],
  },
  {
    name: 'a URL that is not http(s) is refused',
    actual: () => parse({ ...VALID, website: 'javascript:alert(1)' }),
    expected: { refused: ['website'] },
  },
  {
    name: 'an unknown scope is refused',
    actual: () => parse({ ...VALID, scopes: ['forecasts', 'everything'] }),
    expected: { refused: ['scopes'] },
  },
  {
    name: 'ads, affiliate links, a price, client work and a company product are commercial',
    actual: () =>
      ['none', 'donations', 'ads', 'affiliate', 'paid', 'client-work', 'company'].map((m) =>
        isCommercialRequest([m])
      ),
    expected: [false, false, true, true, true, true, true],
  },
  {
    name: 'ticking „none“ clears the rest, ticking anything else clears „none“',
    actual: () => [
      toggleRevenue(['ads', 'paid'], 'none', true),
      toggleRevenue(['none'], 'ads', true),
      toggleRevenue(['ads', 'paid'], 'ads', false),
    ],
    expected: [['none'], ['ads'], ['paid']],
  },
  {
    name: 'the suggested allowance follows the volume, never under the default',
    actual: () => ['under-1k', 'under-10k', 'under-100k', 'more'].map(suggestedRequestsPerHour),
    expected: [1000, 1000, 20000, null],
  },
  {
    name: 'every scope has routes, and none of them is an open route',
    actual: () =>
      API_SCOPES.every(
        (scope) =>
          API_SCOPE_DEFINITIONS[scope].routes.length > 0 &&
          API_SCOPE_DEFINITIONS[scope].routes.every((route) => !OPEN_API_ROUTES.includes(route))
      ),
    expected: true,
  },
  {
    name: 'scopes sort into the catalog order and drop what the catalog does not know',
    actual: () => sortScopes(['travel', 'nope', 'forecasts', 'travel']),
    expected: ['forecasts', 'travel'],
  },
  {
    name: 'a key from before scopes opens forecasts and the planner',
    actual: () => [effectiveScopes({ scopes: null }), LEGACY_KEY_SCOPES],
    expected: [
      ['forecasts', 'planner'],
      ['forecasts', 'planner'],
    ],
  },
  {
    name: 'the API stores scopes only when its key list carries the field',
    actual: () => [
      apiStoresScopes([]),
      apiStoresScopes([{ id: 'a' }]),
      apiStoresScopes([{ id: 'a', scopes: null }]),
    ],
    expected: [false, false, true],
  },
  {
    name: 'scopes read in German, in the catalog order',
    actual: () => [formatScopes(['statistics', 'forecasts']), formatScopes([])],
    expected: ['Prognosen, Statistiken', 'keine Berechtigung'],
  },
  {
    name: 'a create sends scopes only when given',
    actual: () => {
      const base = {
        name: 'X',
        contact: '',
        usage: 'non-commercial',
        note: '',
        requestsPerHour: 1000,
        allowedParkIds: [],
        expiresAt: null,
      };
      return [
        'scopes' in createDataApiKeyBody(base),
        createDataApiKeyBody({ ...base, scopes: ['travel', 'forecasts'] }).scopes,
      ];
    },
    expected: [false, ['forecasts', 'travel']],
  },
  {
    name: 'a request fills the key dialog: name, address, usage, allowance, scopes, a note',
    actual: () => keyRequestPrefill({ ...RECORD, revenue: ['affiliate'], volume: 'under-100k' }),
    expected: {
      requestId: RECORD.id,
      name: 'Coaster Widget',
      contact: 'ada@example.org',
      usage: 'commercial',
      note: 'Antrag vom 2026-11-16, Ada. Parks laut Antrag: Phantasialand, Toverland.',
      requestsPerHour: 20000,
      scopes: ['forecasts', 'statistics'],
    },
  },
  {
    name: 'the approval mail goes to the applicant with the key, its scopes and the portal',
    actual: () => {
      const href = keyApprovalMailto(
        RECORD,
        'pfk_secret',
        { requestsPerHour: 1000 },
        ['forecasts'],
        'Patrick'
      );
      const body = mailBody(href);
      return [
        href.startsWith('mailto:ada%40example.org?'),
        body.includes('pfk_secret'),
        body.includes('Er öffnet: Prognosen.'),
        body.includes('https://park.fan/de/developers'),
        body.trim().endsWith('Patrick'),
      ];
    },
    expected: [true, true, true, true, true],
  },
  {
    name: 'an applicant from another language page gets the English mail, without a scope line while the API has none',
    actual: () => {
      const body = mailBody(
        keyApprovalMailto(
          { ...RECORD, locale: 'fr' },
          'pfk_x',
          { requestsPerHour: null },
          null,
          'P'
        )
      );
      return [
        body.startsWith('Hi Ada,'),
        body.includes('It opens'),
        body.includes('no hourly limit'),
        body.includes('https://park.fan/en/developers'),
      ];
    },
    expected: [true, false, true, true],
  },
  {
    name: 'the rejection mail carries the reason',
    actual: () =>
      mailBody(
        keyRejectionMailto(
          { ...RECORD, status: 'rejected', decision: { at: '', by: 'P', reason: 'Zu früh.' } },
          'P'
        )
      ).includes('Zu früh.'),
    expected: true,
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `threw: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
    passed++;
    console.log(`  ✓ ${testCase.name}`);
  } else {
    failed++;
    console.log(`  ✗ ${testCase.name}`);
    console.log(`      expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`      actual:   ${JSON.stringify(result)}`);
  }
}

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
console.log('🎉 All tests passed!');
