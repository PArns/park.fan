// The Content-Security-Policy each kind of response ends up with, resolved from next.config's
// `headers()` the way Next resolves them. Every page, the admin and the machine-facing documents
// get the baseline, which names no script or style source and so cannot block what a page loads.
// An SVG keeps its own sandboxed policy: the baseline is a rule for every path, and placed after
// the SVG rule it would replace it, so an SVG opened on its own could run script on the admin's
// origin. See docs/features/admin.md#headers-shared-with-the-site.
import assert from 'node:assert/strict';
import nextConfig from '../next.config.ts';
import { resolveHeader } from './lib/header-rules.mjs';

const BASELINE = "object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
const SVG = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

const rules = await nextConfig.headers();
const csp = (path) => resolveHeader(rules, path, 'Content-Security-Policy').value;

const expected = {
  '/': BASELINE,
  '/en': BASELINE,
  '/de/parks/europe/germany/rust/europa-park': BASELINE,
  '/fr/parks/europe/germany/rust/europa-park/silver-star': BASELINE,
  '/de/blog/a-post': BASELINE,
  '/admin': BASELINE,
  '/admin/oauth/consent': BASELINE,
  '/api/admin/auth/me': BASELINE,
  '/api/mcp': BASELINE,
  '/api/og/parks/europe/germany/rust/europa-park': BASELINE,
  '/.well-known/api-catalog': BASELINE,
  '/llms.txt': BASELINE,
  '/robots.txt': BASELINE,
  '/logo.svg': SVG,
  '/media/diagrams/mk-tron-distant.svg': SVG,
};

for (const [path, policy] of Object.entries(expected)) {
  assert.equal(csp(path), policy, `${path} is sent with "${csp(path)}"`);
  console.log(`  ✓ ${path}: ${policy}`);
}

console.log(`\n${Object.keys(expected).length} paths get the policy they should`);
