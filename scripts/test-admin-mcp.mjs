// Tests for what the OAuth consent page may show and where it may send the browser.
//
// The consent page is the one place where a stranger's text (the app's self-chosen name) sits next
// to a decision, and where the browser follows an address the API returns. So the name is cleaned,
// the redirect host is the headline, and a response whose address differs from the one the person
// read is not followed. The consent page also has to refuse framing: in an iframe it is clickjacking
// with a real session behind it, so the header that forbids it is pinned here too.
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match.js';
import nextConfig from '../next.config.ts';
import {
  CLAUDE_CODE_ADD_COMMAND,
  MCP_URL,
  apiTokensPath,
  claudeCodeAddCommandWithToken,
  consentRequestPath,
  describeRedirectHost,
  describeScopes,
  displayClientName,
  hasPassed,
  safeRedirectTarget,
} from '../lib/admin/mcp.ts';

const headerRules = await nextConfig.headers();

/** The value a response header ends up with for `path`: every matching rule applies, the last wins. */
function headerFor(path, key) {
  let value;
  for (const rule of headerRules) {
    if (!getPathMatch(rule.source)(path)) continue;
    for (const header of rule.headers) {
      if (header.key.toLowerCase() === key.toLowerCase()) value = header.value;
    }
  }
  return value;
}

const BIDI_OVERRIDE = '‮';
const ZERO_WIDTH = '​';

const testCases = [
  // displayClientName
  {
    name: 'an ordinary name stays',
    actual: () => displayClientName('Claude'),
    expected: 'Claude',
  },
  {
    name: 'a right-to-left override cannot reorder the text around the name',
    actual: () => displayClientName(`Claude${BIDI_OVERRIDE}moc.live`),
    expected: 'Claudemoc.live',
  },
  {
    name: 'zero-width characters and control characters are removed',
    actual: () => displayClientName(`Cl${ZERO_WIDTH}aude\u0000\u0007`),
    expected: 'Claude',
  },
  {
    name: 'newlines and runs of spaces collapse to one space',
    actual: () => displayClientName('Claude\n\n   Code'),
    expected: 'Claude Code',
  },
  {
    name: 'a name that is only invisible characters reads as unnamed',
    actual: () => displayClientName(`${ZERO_WIDTH} ${BIDI_OVERRIDE}`),
    expected: 'Unbenannte App',
  },
  {
    name: 'a missing name reads as unnamed',
    actual: () => displayClientName(null),
    expected: 'Unbenannte App',
  },
  {
    name: 'a long name is cut at 60 characters with an ellipsis',
    actual: () => displayClientName('x'.repeat(80)),
    expected: `${'x'.repeat(60)}…`,
  },
  {
    name: 'a name of exactly 60 characters is not cut',
    actual: () => displayClientName('y'.repeat(60)),
    expected: 'y'.repeat(60),
  },

  // describeRedirectHost
  {
    name: 'claude.ai is a web host',
    actual: () => JSON.stringify(describeRedirectHost('claude.ai')),
    expected: '{"local":false,"punycode":false}',
  },
  {
    name: 'localhost with a port is this computer',
    actual: () => describeRedirectHost('localhost:53124').local,
    expected: true,
  },
  {
    name: '127.0.0.1 is this computer',
    actual: () => describeRedirectHost('127.0.0.1').local,
    expected: true,
  },
  {
    name: 'an IPv6 loopback with a port is this computer',
    actual: () => describeRedirectHost('[::1]:8080').local,
    expected: true,
  },
  {
    name: 'a host that merely starts with localhost is not this computer',
    actual: () => describeRedirectHost('localhost.evil.example').local,
    expected: false,
  },
  {
    name: 'a Punycode label is flagged',
    actual: () => describeRedirectHost('xn--clude-9qa.ai').punycode,
    expected: true,
  },
  {
    name: 'xn-- inside a label is not Punycode',
    actual: () => describeRedirectHost('exn--ample.com').punycode,
    expected: false,
  },

  // safeRedirectTarget
  {
    name: 'the contract example is followed',
    actual: () =>
      safeRedirectTarget('https://claude.ai/api/mcp/auth_callback?code=abc&state=xyz', 'claude.ai'),
    expected: 'https://claude.ai/api/mcp/auth_callback?code=abc&state=xyz',
  },
  {
    name: 'the host comparison ignores case',
    actual: () => safeRedirectTarget('https://Claude.AI/cb?code=1', 'claude.ai'),
    expected: 'https://claude.ai/cb?code=1',
  },
  {
    name: 'a different host than the one shown is refused',
    actual: () => safeRedirectTarget('https://evil.example/cb?code=1', 'claude.ai'),
    expected: null,
  },
  {
    name: 'a look-alike suffix is refused',
    actual: () => safeRedirectTarget('https://claude.ai.evil.example/cb', 'claude.ai'),
    expected: null,
  },
  {
    name: 'user info cannot smuggle another host behind the shown one',
    actual: () => safeRedirectTarget('https://claude.ai@evil.example/cb', 'claude.ai'),
    expected: null,
  },
  {
    name: 'user info on the right host is refused too',
    actual: () => safeRedirectTarget('https://user:pw@claude.ai/cb', 'claude.ai'),
    expected: null,
  },
  {
    name: 'a javascript: address is refused',
    actual: () => safeRedirectTarget('javascript:alert(1)', 'claude.ai'),
    expected: null,
  },
  {
    name: 'a data: address is refused',
    actual: () => safeRedirectTarget('data:text/html,x', 'claude.ai'),
    expected: null,
  },
  {
    name: 'plain http to a web host is refused',
    actual: () => safeRedirectTarget('http://claude.ai/cb', 'claude.ai'),
    expected: null,
  },
  {
    name: 'plain http to a loopback address is followed (Claude Code listens there)',
    actual: () => safeRedirectTarget('http://localhost:53124/callback?code=1', 'localhost:53124'),
    expected: 'http://localhost:53124/callback?code=1',
  },
  {
    name: 'a loopback port that differs from the one shown is refused',
    actual: () => safeRedirectTarget('http://localhost:6666/callback', 'localhost:53124'),
    expected: null,
  },
  {
    name: 'the API may state a loopback host without its port',
    actual: () => safeRedirectTarget('http://127.0.0.1:41000/cb', '127.0.0.1'),
    expected: 'http://127.0.0.1:41000/cb',
  },
  {
    name: 'a missing redirect is refused',
    actual: () => safeRedirectTarget(undefined, 'claude.ai'),
    expected: null,
  },
  {
    name: 'something that is not an address is refused',
    actual: () => safeRedirectTarget('not a url', 'claude.ai'),
    expected: null,
  },

  // framing
  {
    name: 'the consent page is sent with X-Frame-Options: DENY',
    actual: () => headerFor('/admin/oauth/consent', 'X-Frame-Options'),
    expected: 'DENY',
  },
  {
    name: 'the admin proxy answers with X-Frame-Options: DENY too',
    actual: () => headerFor('/api/admin/oauth/requests/abc/approve', 'X-Frame-Options'),
    expected: 'DENY',
  },

  // describeScopes
  {
    name: 'admin:read is described',
    actual: () => JSON.stringify(describeScopes('admin:read')),
    expected: '{"known":["Den Admin lesen"],"unknown":[]}',
  },
  {
    name: 'a scope the page does not know is passed on, not dropped',
    actual: () => JSON.stringify(describeScopes('admin:read admin:write')),
    expected: '{"known":["Den Admin lesen"],"unknown":["admin:write"]}',
  },
  {
    name: 'an empty scope describes nothing',
    actual: () => JSON.stringify(describeScopes('  ')),
    expected: '{"known":[],"unknown":[]}',
  },

  // paths and commands
  {
    name: 'the request id is encoded into the proxy path',
    actual: () => consentRequestPath('a b/c'),
    expected: '/api/admin/oauth/requests/a%20b%2Fc',
  },
  { name: 'no request id, no path', actual: () => consentRequestPath(null), expected: null },
  { name: 'a blank request id, no path', actual: () => consentRequestPath('  '), expected: null },
  {
    name: 'an absurdly long request id, no path',
    actual: () => consentRequestPath('a'.repeat(500)),
    expected: null,
  },
  {
    name: 'another account is asked for with an encoded userId',
    actual: () => apiTokensPath('a&b'),
    expected: '/api/admin/auth/tokens?userId=a%26b',
  },
  {
    name: 'the own list has no query',
    actual: () => apiTokensPath(),
    expected: '/api/admin/auth/tokens',
  },
  {
    name: 'the MCP address ends in /v1/mcp',
    actual: () => MCP_URL.endsWith('/v1/mcp'),
    expected: true,
  },
  {
    name: 'the Claude Code command carries the address',
    actual: () => CLAUDE_CODE_ADD_COMMAND.endsWith(MCP_URL),
    expected: true,
  },
  {
    name: 'the token command passes the token as a bearer header',
    actual: () =>
      claudeCodeAddCommandWithToken('pfa_x').endsWith('--header "Authorization: Bearer pfa_x"'),
    expected: true,
  },

  // hasPassed
  {
    name: 'a past time has passed',
    actual: () => hasPassed('2026-10-01T00:00:00Z', Date.parse('2026-10-02T00:00:00Z')),
    expected: true,
  },
  {
    name: 'a future time has not',
    actual: () => hasPassed('2026-10-03T00:00:00Z', Date.parse('2026-10-02T00:00:00Z')),
    expected: false,
  },
  { name: 'no expiry never passes', actual: () => hasPassed(null, Date.now()), expected: false },
  {
    name: 'garbage never passes',
    actual: () => hasPassed('soon', Date.now()),
    expected: false,
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
  if (result === testCase.expected) {
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
