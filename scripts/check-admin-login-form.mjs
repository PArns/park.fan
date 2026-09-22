#!/usr/bin/env node
/**
 * Assert that the admin login asks for everything in one form, in one request.
 *
 * What it pins is the shape a password manager sees: on the first paint, one
 * `<form>` holds the e-mail, the password and the six-digit code, and filling
 * all three sends a single POST that carries `totpCode` with them. Three
 * tickets went the other way — a per-step `key`, two sibling forms, then
 * dropping the hidden username field beside the code (PAR-291, PAR-345,
 * PAR-404) — and each was tested against a real vault and came back negative,
 * because an extension fills a login from what is in the document when it
 * looks, and the code field was not there yet. PAR-405 put it there.
 *
 * This file replaces `check-admin-login-step.mjs`, which asserted the opposite:
 * that the step change replaced the `<form>` element. There is no step change
 * left to assert.
 *
 * It does NOT check what a password manager does with the form. Whether
 * 1Password fills all three in one pass is a question about an extension, it is
 * answered by a person at a browser, and no assertion here can stand in for
 * that.
 *
 * Two stubs keep the run away from anything real, and both are in the browser
 * rather than on a server:
 *
 *   - `/api/admin/session` answers 401 to the GET the gate probes with, so the
 *     login screen renders, and `{"status":"totp-required"}` to the POST. The
 *     POST body is captured and asserted on; nothing is typed that would be
 *     worth sending anywhere.
 *   - `window.turnstile` is defined before the app loads. `loadTurnstileScript`
 *     (`components/common/turnstile-widget.tsx`) returns early when it is
 *     already there, so the run needs no request to challenges.cloudflare.com —
 *     and it needs the token: without one `canSubmit` is false, the button
 *     stays disabled and nothing is ever sent.
 *
 * Needs a running site (`pnpm build && pnpm start`, or `pnpm dev`):
 *
 *     pnpm check:admin-login-form
 *     BASE=http://localhost:3000 pnpm check:admin-login-form
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
 * would leave the button disabled for good.
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

const posts = [];

const browser = await chromium.launch(LAUNCH);
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.addInitScript(installTurnstileStub);

  await page.route('**/api/admin/session', async (route) => {
    if (route.request().method() === 'POST') {
      posts.push(route.request().postDataJSON() ?? {});
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

  const form = page.locator('form:has(#admin-email)');
  await form.waitFor({ state: 'visible', timeout: 30_000 });

  // The assertion this file exists for, and it is about the first paint: all
  // three fields are in the document before anybody submits anything, and they
  // are in the SAME form. A second form here would mean the split is back.
  const shape = await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')];
    const email = document.querySelector('#admin-email');
    const password = document.querySelector('#admin-password');
    const code = document.querySelector('#admin-totp');
    return {
      forms: forms.length,
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
      hasCode: Boolean(code),
      oneForm:
        Boolean(email && password && code) &&
        email.form !== null &&
        email.form === password.form &&
        email.form === code.form,
      codeAutocomplete: code?.getAttribute('autocomplete') ?? null,
      // Nothing may claim to be a username next to the code but the e-mail
      // field itself — that was PAR-404, and it stays gone.
      usernameFields: [...document.querySelectorAll('input[autocomplete~="username"]')].map(
        (input) => input.id || input.name || '(unnamed)'
      ),
      focused: document.activeElement?.id ?? null,
    };
  });

  check(
    'e-mail, password and code are all on screen at the first paint',
    shape.hasEmail && shape.hasPassword && shape.hasCode,
    `email=${shape.hasEmail} password=${shape.hasPassword} code=${shape.hasCode}`
  );
  check('they share one form', shape.oneForm, `forms in document: ${shape.forms}`);
  check(
    'the code field is the one a manager looks for',
    shape.codeAutocomplete === 'one-time-code',
    `autocomplete=${shape.codeAutocomplete}`
  );
  check(
    'only the e-mail field claims to be the username',
    shape.usernameFields.length === 1 && shape.usernameFields[0] === 'admin-email',
    `fields: ${shape.usernameFields.join(', ') || 'none'}`
  );
  // The code field must not take the caret: most accounts have no second factor
  // and never touch it.
  check(
    'the caret starts in the e-mail field',
    shape.focused === 'admin-email',
    `focused: ${shape.focused ?? 'nothing'}`
  );

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
  check('the challenge resolves, so the form can be sent', await submit.isEnabled());

  // Typing a complete code submits by itself, and that is the path a fill
  // takes: three fields, then one request.
  await page.fill('#admin-totp', '123456');
  await page.waitForFunction(() => true, undefined, { timeout: 1_000 }).catch(() => {});
  for (let i = 0; i < 100 && posts.length === 0; i += 1) {
    await page.waitForTimeout(100);
  }

  check('a filled code sends the attempt without a press', posts.length > 0);

  const sent = posts[0] ?? {};
  check(
    'one request carries all three',
    sent.email === 'check@park.fan' &&
      sent.password === 'not-a-password' &&
      sent.totpCode === '123456',
    `keys: ${Object.keys(sent).join(', ') || 'none'}`
  );
  check('and it is exactly one request', posts.length === 1, `POSTs: ${posts.length}`);
} catch (error) {
  check('the run reaches its verdict', false, String(error?.message ?? error).split('\n')[0]);
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.error(
    `\n${failed.length} failing assertion(s) about the admin login form.\n` +
      'What draws the line is the single `<form>` in app/admin/_app/login-screen.tsx —\n' +
      'see docs/rules/the-admin-holds-no-credential.md.'
  );
  process.exit(1);
}
