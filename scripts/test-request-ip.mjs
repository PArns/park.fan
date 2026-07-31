// Regression tests for client-IP resolution behind Cloudflare → Vercel.
//
// The bug this guards against: Vercel sets x-forwarded-for/x-real-ip to the peer that
// connected to IT, which since Cloudflare was put in front is a Cloudflare edge server.
// Reading those first (and preferring "the first IPv4 in the chain") made every GeoIP
// lookup resolve to the Cloudflare colo, so /api/nearby listed the parks around that
// datacenter instead of the visitor's.
import { getClientIp, pickClientIp, isLocalOrUnusableIp } from '../lib/utils/request-ip.ts';

/** Minimal NextRequest stand-in — the helpers only read request.headers. */
const req = (headers) => ({ headers: new Headers(headers) });

const CLIENT_V4 = '87.153.243.192';
const CLIENT_V6 = '2003:e9:df14:300:c923:284e:dc42:5a33';
const CF_EDGE = '172.71.150.11'; // a Cloudflare edge address

const testCases = [
  {
    name: 'Cloudflare → Vercel, IPv4 visitor: cf-connecting-ip beats Vercel x-forwarded-for',
    actual: () =>
      getClientIp(
        req({
          'cf-connecting-ip': CLIENT_V4,
          'x-forwarded-for': CF_EDGE,
          'x-real-ip': CF_EDGE,
        })
      ),
    expected: CLIENT_V4,
  },
  {
    name: 'Cloudflare → Vercel, IPv6 visitor: returns the v6 client, not the edge v4',
    actual: () =>
      getClientIp(
        req({
          'cf-connecting-ip': CLIENT_V6,
          'x-forwarded-for': CF_EDGE,
          'x-real-ip': CF_EDGE,
        })
      ),
    expected: CLIENT_V6,
  },
  {
    name: 'true-client-ip (Cloudflare Enterprise) used when cf-connecting-ip is absent',
    actual: () => getClientIp(req({ 'true-client-ip': CLIENT_V4, 'x-forwarded-for': CF_EDGE })),
    expected: CLIENT_V4,
  },
  {
    name: 'No Cloudflare (direct *.vercel.app): falls back to x-forwarded-for',
    actual: () => getClientIp(req({ 'x-forwarded-for': CLIENT_V4 })),
    expected: CLIENT_V4,
  },
  {
    name: 'No Cloudflare, IPv6 visitor: forwards the v6 address as-is',
    actual: () => getClientIp(req({ 'x-forwarded-for': CLIENT_V6 })),
    expected: CLIENT_V6,
  },
  {
    name: 'x-real-ip is the last resort',
    actual: () => getClientIp(req({ 'x-real-ip': CLIENT_V4 })),
    expected: CLIENT_V4,
  },
  {
    name: 'No usable header at all (local dev) → empty',
    actual: () => getClientIp(req({})),
    expected: '',
  },
  {
    name: 'Forwarding chain: leftmost entry wins, NOT the first IPv4',
    actual: () => pickClientIp(`${CLIENT_V6}, ${CF_EDGE}, 10.0.0.1`),
    expected: CLIENT_V6,
  },
  {
    name: 'Forwarding chain: plain IPv4 client',
    actual: () => pickClientIp(`${CLIENT_V4}, ${CF_EDGE}`),
    expected: CLIENT_V4,
  },
  {
    name: 'Port is stripped from an IPv4 address',
    actual: () => pickClientIp('87.153.243.192:54321'),
    expected: CLIENT_V4,
  },
  {
    name: 'Brackets + port are stripped from an IPv6 address',
    actual: () => pickClientIp('[2003:e9:df14:300:c923:284e:dc42:5a33]:443'),
    expected: CLIENT_V6,
  },
  {
    name: 'Bare IPv6 keeps all its colons',
    actual: () => pickClientIp(CLIENT_V6),
    expected: CLIENT_V6,
  },
  {
    name: 'Empty / whitespace chain → empty',
    actual: () => pickClientIp('  ,  '),
    expected: '',
  },
  // The /api/nearby short-circuit depends on these staying correct.
  { name: 'Public IPv4 is usable', actual: () => isLocalOrUnusableIp(CLIENT_V4), expected: false },
  { name: 'Public IPv6 is usable', actual: () => isLocalOrUnusableIp(CLIENT_V6), expected: false },
  { name: 'Empty is unusable', actual: () => isLocalOrUnusableIp(''), expected: true },
  { name: 'Loopback is unusable', actual: () => isLocalOrUnusableIp('127.0.0.1'), expected: true },
  {
    name: 'Private /16 is unusable',
    actual: () => isLocalOrUnusableIp('192.168.1.7'),
    expected: true,
  },
];

console.log('🧪 Testing client-IP resolution (Cloudflare → Vercel)\n');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = testCase.actual();
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
