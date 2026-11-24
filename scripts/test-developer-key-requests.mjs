// The developer portal's key model: the permission catalog's shape, which projects get a free
// key, what the request form and the admin's approval start with, how a key from before
// permissions reads, what the dashboard counts, and that no reply mail carries a key.
import {
  API_KEY_ERRORS,
  API_PERMISSIONS,
  API_PERMISSION_GROUPS,
  API_PERMISSION_GROUP_IDS,
  INTERNAL_PERMISSIONS,
  LEGACY_KEY_PERMISSIONS,
  REQUESTABLE_GROUP_IDS,
  requestablePermissions,
  KEYLESS_PERMISSIONS,
  PERMISSION_ROUTES,
  permissionGroup,
  sortPermissions,
} from '../lib/developers/permissions.ts';
import {
  normalizeUrl,
  requestTier,
  requestedPermissions,
  suggestedRequestsPerHour,
  toggleRevenue,
} from '../lib/developers/key-request.ts';
import { developerKeyState, usageTotals } from '../lib/developers/dashboard.ts';
import {
  apiStoresPermissions,
  awaitsPickup,
  createDataApiKeyBody,
  effectivePermissions,
  isLegacyKey,
} from '../lib/admin/api-keys.ts';
import {
  approvalDraft,
  approveKeyRequestBody,
  keyDecisionMailto,
  keyRequestPath,
  sortKeyRequests,
} from '../lib/admin/key-requests.ts';

const REQUEST = {
  id: '00000000-0000-4000-8000-000000000001',
  userId: '00000000-0000-4000-8000-0000000000aa',
  status: 'pending',
  tier: 'free',
  projectName: 'MagicParks',
  website: 'https://magicparks.example',
  kind: 'mobile-app',
  platforms: ['ios', 'android', 'web'],
  languages: 'ES, EN, DE, FR, IT, PT',
  description: 'A free app with live wait times for parks in Europe and the United States.',
  source: 'open-source',
  repository: 'https://github.com/example/magicparks',
  license: 'MIT',
  revenue: ['none'],
  permissions: ['live.schedule', 'parks.directory', 'forecasts.crowd'],
  volume: 'under-10k',
  parks: '',
  serverSide: true,
  caching: 'discovery 15 min, park 1 h, calendar 24 h',
  attributionUrl: 'https://magicparks.example/about',
  locale: 'es',
  createdAt: '2026-11-16T08:00:00.000Z',
  applicant: { email: 'dev@example.org', displayName: 'Rubén' },
};

const HOUR = 3_600_000;
const NOW = Date.parse('2026-11-16T12:00:00.000Z');

/** A key row as the lists return it, with only the fields a case needs. */
function key(fields) {
  return { revokedAt: null, expiresAt: null, revealedAt: '2026-11-01T00:00:00.000Z', ...fields };
}

/** The decoded subject and body of a `mailto:` link. */
function mail(href) {
  const url = new URL(href);
  return {
    to: decodeURIComponent(url.pathname),
    text: `${url.searchParams.get('subject')}\n${url.searchParams.get('body')}`,
  };
}

const testCases = [
  {
    name: 'every permission sits in exactly one group, and the groups are the listed ones',
    actual: () => {
      const grouped = API_PERMISSION_GROUP_IDS.flatMap((group) => API_PERMISSION_GROUPS[group]);
      return {
        sameSet: [...grouped].sort().join() === [...API_PERMISSIONS].sort().join(),
        noRepeat: new Set(grouped).size === grouped.length,
        prefixed: API_PERMISSIONS.every((p) => p.startsWith(`${permissionGroup(p)}.`)),
        routed: API_PERMISSIONS.every((p) => Array.isArray(PERMISSION_ROUTES[p])),
      };
    },
    expected: { sameSet: true, noRepeat: true, prefixed: true, routed: true },
  },
  {
    name: "park.fan's own permission is no request option and no legacy key reads it",
    actual: () => ({
      requestable:
        API_PERMISSION_GROUP_IDS.flatMap(requestablePermissions).includes('assistant.chat'),
      groups: REQUESTABLE_GROUP_IDS.includes('assistant'),
      legacy: LEGACY_KEY_PERMISSIONS.includes('assistant.chat'),
      internal: [...INTERNAL_PERMISSIONS],
    }),
    expected: { requestable: false, groups: false, legacy: false, internal: ['assistant.chat'] },
  },
  {
    name: 'without a key only the wait times are open',
    actual: () => [...KEYLESS_PERMISSIONS],
    expected: ['live.waits'],
  },
  {
    name: 'the refusal codes are unique and name a permission refusal as 403',
    actual: () => ({
      unique: new Set(API_KEY_ERRORS.map((e) => e.code)).size === API_KEY_ERRORS.length,
      missing: API_KEY_ERRORS.find((e) => e.code === 'api-key-permission-missing')?.status,
    }),
    expected: { unique: true, missing: 403 },
  },
  {
    name: 'permissions sort into catalog order and lose unknown values and repeats',
    actual: () => sortPermissions(['planner.day', 'nope', 'live.weather', 'planner.day']),
    expected: ['live.weather', 'planner.day'],
  },
  {
    name: 'a free key needs open source and no earnings; donations are fine',
    actual: () => [
      requestTier({ source: 'open-source', revenue: ['none'] }),
      requestTier({ source: 'open-source', revenue: ['donations'] }),
      requestTier({ source: 'open-source', revenue: ['donations', 'ads'] }),
      requestTier({ source: 'open-source', revenue: ['affiliate'] }),
      requestTier({ source: 'closed-source', revenue: ['none'] }),
      requestTier({ source: null, revenue: ['none'] }),
      requestTier({ source: 'open-source', revenue: [] }),
    ],
    expected: ['free', 'free', 'paid', 'paid', 'paid', 'paid', 'paid'],
  },
  {
    name: '„none“ excludes every other revenue model, and any other clears it',
    actual: () => [
      toggleRevenue(['ads', 'donations'], 'none', true),
      toggleRevenue(['none'], 'donations', true),
      toggleRevenue(['donations', 'ads'], 'ads', false),
    ],
    expected: [['none'], ['donations'], ['donations']],
  },
  {
    name: 'the suggested allowance follows the volume, the open bracket left to the owner',
    actual: () =>
      ['under-1k', 'under-10k', 'under-100k', 'more'].map((v) => suggestedRequestsPerHour(v)),
    expected: [1000, 1000, 20000, null],
  },
  {
    name: 'a bare host becomes https, anything without a dot is refused',
    actual: () => [normalizeUrl('example.org'), normalizeUrl('localhost'), normalizeUrl('  ')],
    expected: ['https://example.org/', null, null],
  },
  {
    name: 'a key from before permissions reads everything, and the dialogs know whether to send them',
    actual: () => ({
      legacy: isLegacyKey({ permissions: null }),
      legacyReads:
        effectivePermissions({ permissions: null }).length === LEGACY_KEY_PERMISSIONS.length,
      own: effectivePermissions({ permissions: ['planner.trip', 'live.weather'] }),
      oldApi: apiStoresPermissions([{ name: 'a' }]),
      newApi: apiStoresPermissions([{ permissions: null }]),
    }),
    expected: {
      legacy: true,
      legacyReads: true,
      own: ['live.weather', 'planner.trip'],
      oldApi: false,
      newApi: true,
    },
  },
  {
    name: 'a hand-made key sends sorted permissions, and none to an API without them',
    actual: () => {
      const base = {
        name: ' Site ',
        contact: '',
        usage: 'internal',
        note: '',
        requestsPerHour: null,
        allowedParkIds: [],
        expiresAt: null,
      };
      return [
        createDataApiKeyBody({ ...base, permissions: ['stats.live', 'live.waits'] }),
        createDataApiKeyBody(base),
      ];
    },
    expected: [
      {
        name: 'Site',
        usage: 'internal',
        requestsPerHour: null,
        allowedParkIds: null,
        permissions: ['live.waits', 'stats.live'],
      },
      { name: 'Site', usage: 'internal', requestsPerHour: null, allowedParkIds: null },
    ],
  },
  {
    name: 'an approval starts with what the request asked, and a paid tier is commercial',
    actual: () => [
      approvalDraft(REQUEST),
      approvalDraft({ ...REQUEST, tier: 'paid', parks: 'Efteling' }),
    ],
    expected: [
      {
        name: 'MagicParks',
        usage: 'non-commercial',
        permissions: ['live.schedule', 'parks.directory', 'forecasts.crowd'],
        requestsPerHour: 1000,
        note: 'Antrag vom 2026-11-16, dev@example.org.',
      },
      {
        name: 'MagicParks',
        usage: 'commercial',
        permissions: ['live.schedule', 'parks.directory', 'forecasts.crowd'],
        requestsPerHour: 1000,
        note: 'Antrag vom 2026-11-16, dev@example.org. Parks laut Antrag: Efteling.',
      },
    ],
  },
  {
    name: 'an approval body leaves empty fields out',
    actual: () =>
      approveKeyRequestBody({
        name: ' MagicParks ',
        usage: 'non-commercial',
        permissions: ['forecasts.crowd', 'live.schedule'],
        requestsPerHour: 1000,
        allowedParkIds: [],
        expiresAt: null,
        note: ' ',
        message: ' Bitte den Link im Footer lassen. ',
      }),
    expected: {
      name: 'MagicParks',
      usage: 'non-commercial',
      permissions: ['live.schedule', 'forecasts.crowd'],
      requestsPerHour: 1000,
      allowedParkIds: null,
      message: 'Bitte den Link im Footer lassen.',
    },
  },
  {
    name: 'the request paths name the decision',
    actual: () => [keyRequestPath('a b'), keyRequestPath('x', 'approve')],
    expected: ['/api/admin/api-key-requests/a%20b', '/api/admin/api-key-requests/x/approve'],
  },
  {
    name: 'open requests come first, oldest on top; decided ones after, newest first',
    actual: () =>
      sortKeyRequests([
        {
          id: 'd1',
          status: 'rejected',
          createdAt: '2026-11-01T00:00:00Z',
          decidedAt: '2026-11-02T00:00:00Z',
        },
        { id: 'p2', status: 'pending', createdAt: '2026-11-10T00:00:00Z' },
        {
          id: 'd2',
          status: 'approved',
          createdAt: '2026-11-03T00:00:00Z',
          decidedAt: '2026-11-05T00:00:00Z',
        },
        { id: 'p1', status: 'pending', createdAt: '2026-11-09T00:00:00Z' },
      ]).map((r) => r.id),
    expected: ['p1', 'p2', 'd2', 'd1'],
  },
  {
    name: 'the decision mail goes to the account, points to the dashboard and never carries a key',
    actual: () => {
      const approved = mail(
        keyDecisionMailto({ ...REQUEST, status: 'approved', decisionNote: 'Link im Footer.' }, 'P')
      );
      const rejected = mail(
        keyDecisionMailto({ ...REQUEST, status: 'rejected', locale: 'de' }, 'P')
      );
      return {
        to: approved.to,
        english: approved.text.includes('is approved'),
        dashboard: approved.text.includes('https://park.fan/en/developers/dashboard'),
        note: approved.text.includes('Link im Footer.'),
        noKey: !approved.text.includes('pfk_'),
        german: rejected.text.includes('nicht ausstellen'),
        pending: keyDecisionMailto(REQUEST, 'P'),
        withdrawn: keyDecisionMailto({ ...REQUEST, status: 'withdrawn' }, 'P'),
        noAddress: keyDecisionMailto({ ...REQUEST, status: 'approved', applicant: null }, 'P'),
      };
    },
    expected: {
      to: 'dev@example.org',
      english: true,
      dashboard: true,
      note: true,
      noKey: true,
      german: true,
      pending: null,
      withdrawn: null,
      noAddress: null,
    },
  },
  {
    name: 'a key waits for pick-up until revealed; revoked and expired win',
    actual: () => [
      developerKeyState(key({ revealedAt: null }), NOW),
      developerKeyState(key({}), NOW),
      developerKeyState(key({ expiresAt: new Date(NOW - HOUR).toISOString() }), NOW),
      developerKeyState(key({ revokedAt: '2026-11-15T00:00:00Z', revealedAt: null }), NOW),
    ],
    expected: ['pickup', 'active', 'expired', 'revoked'],
  },
  {
    name: 'the admin marks only a developer account key as not picked up',
    actual: () => {
      const owner = '00000000-0000-4000-8000-0000000000aa';
      return [
        awaitsPickup(key({ ownerUserId: owner, revealedAt: null })),
        awaitsPickup(key({ ownerUserId: owner })),
        awaitsPickup(key({ ownerUserId: null, revealedAt: null })),
        awaitsPickup(key({ revealedAt: null })),
        awaitsPickup(key({ ownerUserId: owner, revealedAt: undefined })),
        awaitsPickup(
          key({ ownerUserId: owner, revealedAt: null, revokedAt: '2026-11-15T00:00:00Z' })
        ),
      ];
    },
    expected: [true, false, false, false, false, false],
  },
  {
    name: 'the dashboard sums live keys only',
    actual: () =>
      usageTotals([
        key({
          requestsThisHour: 5,
          stats: {
            days: [
              { date: 'a', requests: 10, limited: 0 },
              { date: 'b', requests: 7, limited: 1 },
            ],
            months: [],
          },
        }),
        key({
          revokedAt: '2026-11-15T00:00:00Z',
          requestsThisHour: 99,
          stats: { days: [{ date: 'b', requests: 99, limited: 0 }], months: [] },
        }),
      ]),
    expected: { thisHour: 5, last30Days: 17, today: 7 },
  },
  {
    name: 'a request’s permissions read in catalog order',
    actual: () => requestedPermissions({ permissions: ['travel.tickets', 'live.weather'] }),
    expected: ['live.weather', 'travel.tickets'],
  },
];

let passed = 0;
let failed = 0;
console.log('\n🔑 Developer key model\n');
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
