// Regression tests for what `verifyTurnstile` accepts.
//
// `success === true` is not the answer to "may this request proceed", and
// treating it as one is the bug these guard. Cloudflare confirms that a token
// is genuine; it says nothing about whether the token was meant for the form
// now redeeming it. Two facts in the same response settle that:
//
//   action    — /contribute is a challenge anybody may solve as often as they
//               like. Without this check it is a token vending machine for the
//               admin login, and both surfaces share one widget.
//   hostname  — a token solved on a copy of the login page hosted elsewhere is
//               a genuine token. This is what refuses it.
//
// The asymmetry between the two "not configured" cases is deliberate and is
// tested here: a missing SECRET refuses in production, a missing HOSTNAMES
// allowlist skips its check. An unset allowlist must not be able to take the
// admin login down on the deploy that shipped it; an unset secret means there
// is nothing to verify with at all.
process.env.TURNSTILE_SECRET_KEY = 'test-secret';
process.env.NODE_ENV = 'production';

const { verifyTurnstile } = await import('../lib/security/turnstile.ts');
const { TURNSTILE_ACTIONS } = await import('../lib/security/turnstile-actions.ts');

// siteverify never runs; each case supplies the answer it would have given.
let siteverifyReply;
globalThis.fetch = async () => ({ json: async () => siteverifyReply });

// The module logs a line per refusal, which is right in production and noise here.
console.warn = () => {};
console.error = () => {};

const ADMIN = { expectedAction: TURNSTILE_ACTIONS.adminLogin, remoteIp: '198.51.100.7' };
const CONTRIBUTE = { expectedAction: TURNSTILE_ACTIONS.contribute };
const ALLOWLIST = 'park.fan,www.park.fan';

const testCases = [
  {
    name: 'a genuine admin token from an allowed host',
    hostnames: ALLOWLIST,
    reply: { success: true, action: 'admin-login', hostname: 'park.fan' },
    check: ADMIN,
    expected: { success: true },
  },
  {
    name: 'a /contribute token may not be spent on the admin login',
    hostnames: ALLOWLIST,
    reply: { success: true, action: 'contribute', hostname: 'park.fan' },
    check: ADMIN,
    expected: { success: false, reason: 'action-mismatch' },
  },
  {
    name: 'and an admin token may not be spent on /contribute',
    hostnames: ALLOWLIST,
    reply: { success: true, action: 'admin-login', hostname: 'park.fan' },
    check: CONTRIBUTE,
    expected: { success: false, reason: 'action-mismatch' },
  },
  {
    name: 'a token solved on a lookalike host is refused',
    hostnames: ALLOWLIST,
    reply: { success: true, action: 'admin-login', hostname: 'park-fan.example' },
    check: ADMIN,
    expected: { success: false, reason: 'hostname-mismatch' },
  },
  {
    name: 'a host differing only in case is the same host',
    hostnames: ALLOWLIST,
    reply: { success: true, action: 'admin-login', hostname: 'PARK.FAN' },
    check: ADMIN,
    expected: { success: true },
  },
  {
    name: 'a second allowed host is allowed',
    hostnames: ALLOWLIST,
    reply: { success: true, action: 'admin-login', hostname: 'www.park.fan' },
    check: ADMIN,
    expected: { success: true },
  },
  {
    name: 'a response carrying no action at all is refused',
    hostnames: ALLOWLIST,
    reply: { success: true, hostname: 'park.fan' },
    check: ADMIN,
    expected: { success: false, reason: 'action-mismatch' },
  },
  {
    name: "Cloudflare's own refusal is passed through with its reason",
    hostnames: ALLOWLIST,
    reply: { success: false, 'error-codes': ['timeout-or-duplicate'] },
    check: ADMIN,
    expected: { success: false, reason: 'timeout-or-duplicate' },
  },
  {
    name: 'no allowlist configured → the host check is skipped, not failed',
    hostnames: '',
    reply: { success: true, action: 'admin-login', hostname: 'anywhere.example' },
    check: ADMIN,
    expected: { success: true },
  },
  {
    name: 'no allowlist does not excuse a wrong action',
    hostnames: '',
    reply: { success: true, action: 'contribute', hostname: 'park.fan' },
    check: ADMIN,
    expected: { success: false, reason: 'action-mismatch' },
  },
  {
    name: 'whitespace around an allowlist entry is ignored',
    hostnames: ' park.fan , www.park.fan ',
    reply: { success: true, action: 'admin-login', hostname: 'www.park.fan' },
    check: ADMIN,
    expected: { success: true },
  },
  {
    name: 'an empty token never reaches Cloudflare',
    hostnames: ALLOWLIST,
    token: '',
    reply: { success: true, action: 'admin-login', hostname: 'park.fan' },
    check: ADMIN,
    expected: { success: false, reason: 'missing-token' },
  },
  {
    name: 'nor does a 2049-byte one',
    hostnames: ALLOWLIST,
    token: 'x'.repeat(2049),
    reply: { success: true, action: 'admin-login', hostname: 'park.fan' },
    check: ADMIN,
    expected: { success: false, reason: 'token-too-long' },
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  if (testCase.hostnames) {
    process.env.TURNSTILE_HOSTNAMES = testCase.hostnames;
  } else {
    delete process.env.TURNSTILE_HOSTNAMES;
  }
  siteverifyReply = testCase.reply;

  const result = await verifyTurnstile(testCase.token ?? 'a-token', testCase.check);
  const matches =
    result.success === testCase.expected.success && result.reason === testCase.expected.reason;

  if (matches) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

// The secret is the one thing that may not be missing in production.
delete process.env.TURNSTILE_SECRET_KEY;
siteverifyReply = { success: true, action: 'admin-login', hostname: 'park.fan' };
const unconfigured = await verifyTurnstile('a-token', ADMIN);
if (unconfigured.success === false && unconfigured.reason === 'not-configured') {
  console.log('✅ PASS: no secret in production refuses rather than waving through');
  passed++;
} else {
  console.log('❌ FAIL: no secret in production refuses rather than waving through');
  console.log(`   Got:      ${JSON.stringify(unconfigured)}`);
  failed++;
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${passed + failed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
