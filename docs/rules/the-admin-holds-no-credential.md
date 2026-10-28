# The admin holds no credential (REQUIREMENT)

`/admin` authenticates with an **httpOnly session cookie** (`parkfan_admin_session`,
`lib/admin/session.ts`). Client code sends nothing: `adminFetch` is a plain same-origin fetch, and
`app/api/admin/[...path]` turns the cookie into `Authorization: Bearer …` server-side.

## Five things in the proxy are load-bearing

Each was a bug before:

1. **It exports every verb** (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`). The editing API uses PATCH
   and DELETE, which answered 405 at Next.
2. **It never calls `response.json()` unconditionally.** A 204 from a logout or a delete threw.
3. **It moves a token re-issued by a password change into the cookie.** Passing it through would
   leave the browser holding a cookie that was just revoked, logged out by succeeding.
4. **It validates the cookie against `auth/me`**, not merely notices one is set. `Cookie:
parkfan_admin_session=x` once satisfied the gate in front of `getServerApiHeaders()`'s
   `x-auth-key`, which the API reads as "our own frontend" and so as licence to skip the throttler
   and trust the forwarded address. Not `requireAdmin` though: the password change and the TOTP
   enrolment sit behind this proxy, and a session owing either must reach them; the API enforces
   the role floor.
5. **It relays every query parameter, a repeated one every time, except `pass`**
   (`adminProxyQuery`, `lib/admin/proxy-path.ts`). Copying them with `set` kept only the last
   `filter=`, so two filters on a traffic page reached the API as one.

## Three things the page does see

- **A personal access token, once.** `POST /api/admin/auth/tokens` answers with the secret, and the
  create dialog holds it in component state until „Fertig“. It is never written to storage or the
  address and never goes through a cached query (`adminFetch` is called directly). The session
  cookie stays the only credential the admin keeps.
- **A password, for one request.** Creating a token asks for the password again (and the code, when
  the account has a second factor), so a stolen session cannot mint a token that outlives it. The
  dialog empties both fields in the `finally` of every attempt, whatever the API answered, and
  sends them nowhere else. The password is never in the address, storage or a cached query.
- **A link from another site.** The OAuth consent URL is opened by an app's redirect, so the
  `SameSite=Strict` cookie is not sent with that one document request. The admin's HTML needs no
  cookie, and the session is read by a same-origin `fetch` after load, which carries it. Keep it
  that way: a server-rendered `/admin/oauth/*` page that read the cookie would see a signed-out
  visitor. The page may not be framed, see
  [admin → the consent page](../features/admin.md#the-consent-page-adminoauthconsentrequestid).

## Turnstile on the login

- The login form carries the same Turnstile challenge as `/contribute` (widget
  `components/common/turnstile-widget.tsx`, check `verifyTurnstile` in `lib/security/turnstile.ts`),
  verified in `/api/admin/session` **before** the credentials are forwarded. Everything behind it
  only counts attempts already made, and the per-account lockout (8 failures by default,
  `ADMIN_LOGIN_LOCKOUT_THRESHOLD` in the API) lets anybody who knows an editor's address spend their
  tries and keep them out.
- **`success: true` is not the answer.** Cloudflare confirms a token is genuine, not which form it
  was solved on, so the **action** (`TURNSTILE_ACTIONS`, `lib/security/turnstile-actions.ts`, a file
  without `server-only` so widget and check share it) and the **hostname** (`TURNSTILE_HOSTNAMES`)
  are checked too. Without the action check, `/contribute`, which anybody may solve as often as they
  like, is a token vending machine for the admin login.
- The two unset cases are asymmetric on purpose: a missing `TURNSTILE_SECRET_KEY` refuses in
  production, a missing hostname list only skips its check, so an unset variable cannot take both
  forms down on the deploy that shipped it.
- `/v1/admin/auth/login` is public, so the API asks for a solved token from every caller that does
  not send a valid `THROTTLE_BYPASS_KEYS` value. This app is exempt because it already redeemed the
  single-use token, which is also why the API cannot be the only verifier.

## One form, one request

E-mail, password and the six-digit code sit in **one `<form>` from the first paint** and go in one
POST, and the code is **one input** (`autocomplete="one-time-code"`) under six drawn boxes. The
mechanism is in [admin → the login screen](../features/admin.md#the-login-screen).

Why: six real inputs could not be autofilled — `value.replace(/\D/g,'').slice(-1)` per box kept only
the last of the six characters 1Password writes into the first box in one event. And a code field on
a second screen, after the credentials had been sent, was never filled: three fixes for the shape of
that second form (a per-step `key`, two sibling forms, dropping a hidden username field) each shipped
and each failed against a real vault. 1Password's own guidelines say why: _"Don't dynamically add or
remove fields from the DOM"_, and group related fields in the same `<form>`. One step also means a
login solves Turnstile once, and the race of an answer arriving for a step already left is gone.

## Check

`pnpm check:admin-login-form` holds the shape: three fields, one form, at the first paint, one POST
carrying all three. `pnpm test:turnstile` covers the action, hostname and unset cases. `pnpm test:admin-mcp` covers the
consent page's redirect guard, the `X-Frame-Options` header on its path, the token body and the
words for the API's refusals. `pnpm test:admin-proxy-path`
covers the path guard and the relayed query. Whether
1Password fills all three in one pass is a person's test. Background: [admin](../features/admin.md).
