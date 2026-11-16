# Visitor accounts (`/login`, `/account`) and members-only content

A visitor's own account on park.fan (role `user` in the API's account system), so favorites,
ridden rides and the temperature unit follow them to every device they sign in on. **Not linked
yet:** `/login` and `/account` are `noindex`, not in the sitemap, and nothing on the site points to
them; a member reaches the sign-in only by its address.

## Pieces

| Concern                                         | File                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Page (static) and panel                         | `app/[locale]/account/page.tsx`, `components/account/account-panel.tsx`      |
| Merge and sync decision (pure, tested)          | `lib/account/state.ts`, `pnpm test:account-sync`                             |
| The browser's sync                              | `lib/account/sync.ts`                                                        |
| Starting the sync on every page                 | `components/account/account-sync-gate.tsx` in `lib/providers.tsx`            |
| Registration route, proxy                       | `app/api/account/register`, `app/api/account/[[...path]]`                    |
| Sign-in UI shared with developers and the admin | `components/common/self-service-auth.tsx`, `components/common/auth-card.tsx` |
| Strings                                         | `account` and `accountAuth` in `messages/*.json`                             |

## Sign-in, members-only pages and features

- **Registration is closed for now.** `/login` shows only the sign-in until
  `NEXT_PUBLIC_ACCOUNT_REGISTRATION=open`, and the API refuses a registration with 403
  `registration-closed` until its own `ACCOUNT_REGISTRATION=open`. Set both together.
- **Account management** (`components/account/account-*.tsx`, calls in `lib/account/manage.ts`): the
  name, the password, a second factor, the signed-in devices, the JSON export of everything stored,
  and the deletion. Password, second factor and devices use the session routes every account has
  (`/api/admin/auth/*`); the name and the export are the account's own (`/api/account/*`).
- **`/login`** (`components/account/login-panel.tsx`): create an account or sign in. Both forms are
  behind Turnstile, solved in the browser and checked by `/api/account/register` and
  `/api/admin/session` before an address or password reaches the API. `?next=` names the page to
  return to; `safeNextPath` accepts only a path on this site, so the sign-in cannot redirect
  elsewhere. A signed-in member goes straight on.
- **`useMembership()`** (`lib/account/member.ts`): `loading`, `guest` or `member` with the account.
  A visitor without the marker is a guest without a request; a member's account is read once per
  page, through the sync.
- **`<MemberPage>`** (`components/account/members-only.tsx`) wraps a whole members-only page: a
  guest is sent to `/login?next=…`, a member sees the page. `/account` is the first one.
- **`<MembersOnly fallback>`** shows a part of a public page to members only.
- **The gate is not the control.** A page stays static and public; what a member sees comes from
  `/api/account/*`, which answers only the member's own session.

## A member's storage

`lib/account/storage.ts`: one JSON value per key for a members-only feature (`notes`,
`planner.presets`), kept by the API for the account, at most 64 KB per value and 100 keys.
`useAccountValue(key, fallback)` gives `{ value, save, loading, saving, error }` and shows a saved
value at once; `listAccountKeys`, `readAccountValue`, `writeAccountValue` and `removeAccountValue`
are the plain calls. The account page lists how many entries are stored. Deleting the account
erases the storage.

## How the sync works

- **Who syncs.** Registration (`/api/account/register`) and sign-in (`/api/admin/session`) set the
  script-readable marker `parkfan_account` for role `user` (`setSessionMarkers`). `AccountSyncGate`
  loads `lib/account/sync.ts` only when the marker is set, so no other visitor downloads it.
- **On start** (`accountSyncStep`): a browser that never synced with this account merges, keeping
  both sides' favorites and ridden rides and its own unit; one whose account changed on another
  device since its last sync takes the account's copy; otherwise its own copy goes up if it
  differs. The last agreement is kept in `localStorage` under `parkfan_account_sync`.
- **After that**, a change to favorites, ridden rides or the unit is pushed a second later
  (`PUT /api/account/data`). A 401 removes the marker and stops the sync.
- **What stays on the device:** the day plan (its trip id is its credential) and push alerts (bound
  to the browser's push subscription).

## Signing out and deleting

Signing out ends the sync, drops the marker and the agreement, and keeps the local favorites. The
account deletes itself with its password (`DELETE /api/account`); an owner deletes it on
`/admin/users`. The backend side: `docs/frontend/accounts.md` in v4.api.park.fan.
