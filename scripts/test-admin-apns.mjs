/**
 * Unit tests for `/admin/push` (`lib/admin/apns.ts`): the key id read off Apple's file name, the
 * files the page refuses before reading them, the upload's body, and an API without the routes.
 *
 * Run: pnpm test:admin-apns
 */
import assert from 'node:assert/strict';
import {
  APNS_KEY_FILE_MAX_BYTES,
  apnsKeyFileProblem,
  apnsKeyIdFromFilename,
  apnsUploadBody,
  isApnsBackendMissing,
  isAppleId,
} from '../lib/admin/apns.ts';
import { activeNavItem, visibleGroups } from '../app/admin/_app/nav.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('the key id comes from Apple’s file name, also from a second download', () => {
  assert.equal(apnsKeyIdFromFilename('AuthKey_ABC123DEFG.p8'), 'ABC123DEFG');
  assert.equal(apnsKeyIdFromFilename('AuthKey_ABC123DEFG (1).p8'), 'ABC123DEFG');
  assert.equal(apnsKeyIdFromFilename('AuthKey_abc123defg.p8'), null);
  assert.equal(apnsKeyIdFromFilename('AuthKey_ABC123DEFGH.p8'), null);
  assert.equal(apnsKeyIdFromFilename('key.p8'), null);
  assert.ok(isAppleId('KC5QAXDX94'));
  assert.ok(!isAppleId('kc5qaxdx94'));
  assert.ok(!isAppleId('KC5QAXDX9'));
});

test('a certificate, an empty and an oversized file are refused before they are read', () => {
  assert.equal(apnsKeyFileProblem({ name: 'AuthKey_ABC123DEFG.p8', size: 257 }), null);
  assert.match(apnsKeyFileProblem({ name: 'Certificates.p12', size: 3000 }), /Zertifikat/);
  assert.match(apnsKeyFileProblem({ name: 'aps.cer', size: 1500 }), /Zertifikat/);
  assert.match(apnsKeyFileProblem({ name: 'AuthKey_ABC123DEFG.p8', size: 0 }), /leer/);
  assert.match(
    apnsKeyFileProblem({ name: 'AuthKey_ABC123DEFG.p8', size: APNS_KEY_FILE_MAX_BYTES + 1 }),
    /zu groß/
  );
});

test('the upload sends the file and only the ids that are set', () => {
  const file = { name: 'AuthKey_ABC123DEFG.p8', content: 'PEM' };
  assert.deepEqual(apnsUploadBody(file, { keyId: '', teamId: ' ', bundleId: '' }), {
    content: 'PEM',
    filename: 'AuthKey_ABC123DEFG.p8',
  });
  assert.deepEqual(
    apnsUploadBody(file, { keyId: ' ZZZ999YYYY ', teamId: 'KC5QAXDX94', bundleId: '' }),
    { content: 'PEM', filename: file.name, keyId: 'ZZZ999YYYY', teamId: 'KC5QAXDX94' }
  );
});

test('only a 404 means the API does not have the routes yet', () => {
  assert.ok(isApnsBackendMissing({ status: 404 }));
  assert.ok(!isApnsBackendMissing({ status: 403 }));
  assert.ok(!isApnsBackendMissing({ status: 500 }));
  assert.ok(!isApnsBackendMissing(null));
});

test('the page sits under Betrieb, for owners', () => {
  assert.equal(activeNavItem('/admin/push')?.label, 'Push (iOS)');
  const hrefs = (role) =>
    visibleGroups(role)
      .find((group) => group.label === 'Betrieb')
      .items.map((item) => item.href);
  assert.ok(hrefs('owner').includes('/admin/push'));
  assert.ok(!hrefs('editor').includes('/admin/push'));
});

console.log(`\n${passed} cases passed.`);
