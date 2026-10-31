/**
 * Unit tests for the admin's map of itself (`app/admin/_app/nav.ts`): every page has one entry,
 * sub-entries resolve to themselves and name their parent, and the role filter reaches into them.
 *
 * Run: pnpm test:admin-nav
 */
import assert from 'node:assert/strict';
import { activeNavItem, flatNavItems, navParent, visibleGroups } from '../app/admin/_app/nav.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const owner = visibleGroups('owner');
const hrefs = (groups) => groups.flatMap((group) => flatNavItems(group.items)).map((i) => i.href);

test('every page has exactly one entry', () => {
  const all = hrefs(owner);
  assert.equal(new Set(all).size, all.length);
});

test('a sub-entry is the active one and names its parent', () => {
  assert.equal(activeNavItem('/admin/traffic/seo')?.label, 'SEO');
  assert.equal(navParent(owner, '/admin/traffic/seo')?.href, '/admin/traffic');
  assert.equal(navParent(owner, '/admin/popularity')?.href, '/admin/traffic');
  assert.equal(navParent(owner, '/admin/ml/vergleich')?.href, '/admin/ml');
  assert.equal(navParent(owner, '/admin/traffic'), null);
});

test('the longest match still wins, and covers place foreign routes', () => {
  assert.equal(activeNavItem('/admin/traffic')?.href, '/admin/traffic');
  assert.equal(activeNavItem('/admin/attractions/123')?.href, '/admin/parks');
  assert.equal(activeNavItem('/admin')?.href, '/admin');
});

test('the role filter hides entries at every depth', () => {
  const viewer = hrefs(visibleGroups('viewer'));
  assert.ok(!viewer.includes('/admin/actions'));
  assert.ok(!viewer.includes('/admin/users'));
  assert.ok(viewer.includes('/admin/traffic/seo'));
});

console.log(`\n${passed} cases passed.`);
