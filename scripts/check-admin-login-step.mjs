#!/usr/bin/env node
/**
 * Assert that the admin login replaces its `<form>` element when it moves from
 * the credentials step to the code step.
 *
 * What it pins is one DOM fact and nothing else: the node the browser sees on
 * the code step is not the node it saw on the credentials step, and the old one
 * has left the document. That is what `key={needsTotp ? 'totp' : 'credentials'}`
 * in `app/admin/_app/login-screen.tsx` buys, and it is invisible to everything
 * else we run — remove the key and both steps share one element, while React
 * says nothing, the form renders identically, and lint and the build stay green.
 *
 * It does NOT check what a password manager does with that. Whether 1Password
 * re-reads a replaced form is a question about an extension, it is answered by a
 * person at a browser, and no assertion here can stand in for that.
 *
 * Two stubs make the code step reachable without a credential, and both are in
 * the browser rather than on a server:
 *
 *   - `/api/admin/session` answers 401 to the GET the gate probes with, so the
 *     login screen renders, and `{"status":"totp-required"}` to the POST the
 *     form sends. Nothing is typed that would be worth sending anywhere.
 *   - `window.turnstile` is defined before the app loads. `loadTurnstileScript`
 *     (`components/common/turnstile-widget.tsx`) returns early when it is
 *     already there, so the run needs no request to challenges.cloudflare.com —
 *     and it needs the token: without one `canSubmit` is false, the button
 *     stays disabled and the step change this file exists for is never reached.
 *
 * Needs a running site (`pnpm build && pnpm start`, or `pnpm dev`):
 *
 *     pnpm check:admin-login-step
 *     BASE=http://localhost:3000 pnpm check:admin-login-step
 */

import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
/** Same rule as scripts/check-hero-search-rest.mjs: prefer a Chromium the image already ships. */
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/**
 * A stand-in for the Turnstile widget, installed before the app's own script runs.
 *
 * It keeps the shape the form is written against rather than the shortest thing
 * that yields a token: the answer arrives asynchronously, `reset()` mints a
 * second one, and `remove()` forgets the widget. `attempt()` resets in its
 * `finally`, so a login that stopped handing out tokens after the first solve
 * would leave the code step's button disabled for good.
 */
function installTurnstileStub() {
  let nextId = 0;
  const callbacks = new Map();
  window.turnstile = {
    render(element, options) {
      const id = `stub-${nextId++}`;
      callbacks.set(id, options.callback);
      setTimeout(() => options.callback(`${id}-token`), 0);
      return id;
    },
    remove(id) {
      callbacks.delete(id);
    },
    reset(id) {
      const callback = callbacks.get(id);
      if (callback) setTimeout(() => callback(`${id}-token-${Date.now()}`), 0);
    },
  };
}

const browser = await chromium.launch(LAUNCH);
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.addInitScript(installTurnstileStub);

  await page.route('**/api/admin/session', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'totp-required' }),
      });
      return;
    }
    // The gate's own probe, and anything else on this path: nobody is signed in.
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'unauthorized' }),
    });
  });

  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });

  const credentialsForm = page.locator('form:has(#admin-email)');
  await credentialsForm.waitFor({ state: 'visible', timeout: 30_000 });
  check('the credentials step renders', (await credentialsForm.count()) === 1);

  const before = await credentialsForm.elementHandle();

  await page.fill('#admin-email', 'check@park.fan');
  await page.fill('#admin-password', 'not-a-password');

  // The challenge is what gates the button, so wait for it rather than for a
  // deadline: green here is the proof that the run got as far as submitting
  // (📚 G-72), and a stub that stopped answering would fail on this line
  // instead of on the assertion the file is about.
  const submit = page.locator('form button[type="submit"]');
  await submit.waitFor({ state: 'visible', timeout: 15_000 });
  await page
    .waitForFunction(
      () => document.querySelector('form button[type="submit"]')?.disabled === false,
      undefined,
      { timeout: 15_000 }
    )
    .catch(() => {});
  const armed = await submit.isEnabled();
  check('the challenge resolves, so the form can be sent', armed);

  await submit.click();

  const codeForm = page.locator('form:has(#admin-totp)');
  await codeForm.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  const reachedCodeStep = (await page.locator('#admin-totp').count()) === 1;
  check('the code step opens on `totp-required`, with no credential behind it', reachedCodeStep);

  if (reachedCodeStep) {
    const after = await codeForm.elementHandle();
    const identity = await page.evaluate(
      ([first, second]) => ({
        same: first === second,
        firstStillInDocument: first.isConnected,
        forms: document.querySelectorAll('form').length,
      }),
      [before, after]
    );

    check(
      'the code step carries a different `<form>` node than the credentials step',
      !identity.same,
      identity.same ? 'same element — a swap of the children, not of the form' : ''
    );
    // Not the same assertion said twice: a step that renders its two forms as
    // siblings and hides one would pass the line above while leaving the old
    // fingerprint in the document for a manager to match against.
    check(
      'the credentials form has left the document',
      !identity.firstStillInDocument,
      `forms in document: ${identity.forms}`
    );
  }
} catch (error) {
  check('the run reaches its verdict', false, String(error?.message ?? error).split('\n')[0]);
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.error(
    `\n${failed.length} failing assertion(s) about the admin login's step change.\n` +
      'What draws the line is `key={needsTotp ? ... }` on the form in\n' +
      'app/admin/_app/login-screen.tsx — see docs/rules/the-admin-holds-no-credential.md.'
  );
  process.exit(1);
}
