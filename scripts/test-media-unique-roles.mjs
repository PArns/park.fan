/**
 * Tests for unique-role hand-over (`lib/admin/media-unique-roles`).
 *
 * Run: pnpm test:media-unique-roles
 *
 * Ticking `ride-card` on a new photo used to add the role and leave it on the old
 * one, and `getRideImage` kept showing the old photo. The failure is silent — the
 * build only warns — so what is pinned here is the one thing a person would only
 * notice on the ride page: the old holder loses exactly that role, keeps
 * everything else byte for byte, and nothing else is touched.
 */

import {
  handOverUniqueRoles,
  rolesToYield,
  uniqueClaims,
} from '../lib/admin/media-unique-roles.ts';

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`✅ ${name}`);
  } else {
    failed += 1;
    console.log(
      `❌ ${name}\n   expected ${JSON.stringify(expected)}\n   actual   ${JSON.stringify(actual)}`
    );
  }
}

/** A branch stub: `files` is what `read` answers, `writes` records what was written. */
function branch(files) {
  const writes = [];
  return {
    writes,
    read: async (path) => (files[path] ? JSON.parse(files[path]) : null),
    write: async (path, content, roles) => {
      writes.push({ path, content, roles });
    },
  };
}

console.log('\n🔎 Claims\n');

check(
  'a ride card claims its ride and every alsoRide',
  uniqueClaims({
    park: 'phantasialand',
    ride: 'winjas-fear',
    alsoRides: ['winjas-force'],
    roles: ['ride-card'],
  }),
  ['ride-card:phantasialand/winjas-fear', 'ride-card:phantasialand/winjas-force']
);
check(
  'a park background claims its park',
  uniqueClaims({ park: 'efteling', ride: null, roles: ['park-background', 'hero'] }),
  ['park-background:efteling']
);
check('hero is not unique', uniqueClaims({ park: 'efteling', ride: 'baron', roles: ['hero'] }), []);
check(
  'a ride card without a park claims nothing',
  uniqueClaims({ park: null, ride: 'baron', roles: ['ride-card'] }),
  []
);
check(
  'another ride of the same park keeps its card',
  rolesToYield(new Set(['ride-card:europa-park/voltron']), {
    park: 'europa-park',
    ride: 'blue-fire',
    roles: ['ride-card'],
  }),
  []
);
check(
  'a card answering for the claimed ride through alsoRides gives it up',
  rolesToYield(new Set(['ride-card:phantasialand/winjas-force']), {
    park: 'phantasialand',
    ride: 'winjas-fear',
    alsoRides: ['winjas-force'],
    roles: ['ride-card'],
  }),
  ['ride-card']
);

console.log('\n🔎 Hand-over\n');

// The case that was reported: a visitor's Voltron photo marked as the ride card,
// while the old photo still carried ride-card next to hero. The fixture is that
// sidecar as it stood on main before the fix, trimmed to two locales.
{
  const OLD = 'public/media/europa-park/voltron-nevera-powered-by-rimac.json';
  const NEW = 'public/media/europa-park/voltron-nevera-powered-by-rimac-461ea7.json';
  const original = `{
  "title": "Voltron Nevera powered by Rimac",
  "park": "europa-park",
  "ride": "voltron-nevera-powered-by-rimac",
  "area": "Croatia",
  "roles": ["ride-card", "hero"],
  "tags": ["coaster", "night", "outdoor", "photo", "ride"],
  "alt": {
    "de": "Ein Zug von Voltron Nevera fährt kopfüber durch eine Inversion, pink und blau angeleuchtet.",
    "en": "A Voltron Nevera train upside down in an inversion, lit pink and blue."
  },
  "credit": {
    "author": "Patrick Arns",
    "license": "all-rights-reserved"
  },
  "focus": {
    "x": 0.36,
    "y": 0.3
  }
}
`;
  const old = JSON.parse(original);
  const stub = branch({ [OLD]: original });

  const handovers = await handOverUniqueRoles({
    claimants: [
      {
        id: 'europa-park/voltron-nevera-powered-by-rimac-461ea7',
        claims: ['ride-card:europa-park/voltron-nevera-powered-by-rimac'],
      },
    ],
    holders: new Map([
      [OLD, { park: old.park, ride: old.ride, roles: old.roles }],
      [NEW, { park: old.park, ride: old.ride, roles: ['ride-card'] }],
    ]),
    skip: new Set([NEW]),
    read: stub.read,
    write: stub.write,
  });

  check(
    'the old Voltron photo is the only one written',
    stub.writes.map((w) => w.path),
    [OLD]
  );
  check(
    'it loses ride-card and keeps hero, every other line unchanged',
    stub.writes[0]?.content,
    original.replace('"roles": ["ride-card", "hero"]', '"roles": ["hero"]')
  );
  check('the log names both photos', handovers, [
    {
      from: 'europa-park/voltron-nevera-powered-by-rimac',
      roles: ['ride-card'],
      to: 'europa-park/voltron-nevera-powered-by-rimac-461ea7',
    },
  ]);
}

// The manifest says the old photo holds the role, but an earlier save in this
// session already took it away on the branch. The branch is what gets read.
{
  const OLD = 'public/media/x/old.json';
  const stub = branch({ [OLD]: JSON.stringify({ park: 'p', ride: 'r', roles: ['hero'] }) });
  const handovers = await handOverUniqueRoles({
    claimants: [{ id: 'x/new', claims: ['ride-card:p/r'] }],
    holders: new Map([[OLD, { park: 'p', ride: 'r', roles: ['ride-card'] }]]),
    skip: new Set(),
    read: stub.read,
    write: stub.write,
  });
  check('a role already gone on the branch writes nothing', [stub.writes, handovers], [[], []]);
}

// One save, two claims: the new card of one ride and the new background of a
// park. Each old holder is credited to the claim that took its role.
{
  const CARD = 'public/media/a/card.json';
  const BG = 'public/media/b/bg.json';
  const stub = branch({
    [CARD]: JSON.stringify({ park: 'a', ride: 'r', roles: ['ride-card'] }),
    [BG]: JSON.stringify({ park: 'b', roles: ['park-background'] }),
  });
  const handovers = await handOverUniqueRoles({
    claimants: [
      { id: 'a/new-card', claims: ['ride-card:a/r'] },
      { id: 'b/new-bg', claims: ['park-background:b'] },
    ],
    holders: new Map([
      [CARD, { park: 'a', ride: 'r', roles: ['ride-card'] }],
      [BG, { park: 'b', ride: null, roles: ['park-background'] }],
    ]),
    skip: new Set(),
    read: stub.read,
    write: stub.write,
  });
  check(
    'each hand-over names the claim that took it',
    handovers.map((h) => `${h.from}→${h.to}`),
    ['a/card→a/new-card', 'b/bg→b/new-bg']
  );
  check(
    'a role list emptied by the hand-over is left out of the sidecar',
    JSON.parse(stub.writes[0].content).roles,
    undefined
  );
}

// Nothing claimed, nothing read.
{
  const stub = branch({});
  let reads = 0;
  await handOverUniqueRoles({
    claimants: [{ id: 'x/plain', claims: [] }],
    holders: new Map([['public/media/x/a.json', { park: 'p', ride: 'r', roles: ['ride-card'] }]]),
    skip: new Set(),
    read: async (path) => {
      reads += 1;
      return stub.read(path);
    },
    write: stub.write,
  });
  check(
    'a save without a unique role reads and writes nothing',
    [reads, stub.writes.length],
    [0, 0]
  );
}

console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
console.log('🎉 Unique roles move.');
