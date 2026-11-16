# Visitor accounts (`/account`)

A visitor's own account on park.fan (role `user` in the API's account system), so favorites,
ridden rides and the temperature unit follow them to every device they sign in on. **Not linked
yet:** the page is `noindex`, not in the sitemap, and nothing on the site points to it.

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
