/**
 * The actions this app renders Turnstile widgets with.
 *
 * Its own file, with no `server-only`, because both halves of the pair need it
 * and they sit on opposite sides of the boundary: the widget is a Client
 * Component and the check is a route handler. `lib/security/turnstile.ts` is
 * server-only — importing these from there would throw at build time in the
 * client bundle.
 *
 * They live together at all because a token is only good for the form it was
 * solved on, which is a promise two files apart have to keep between them. A
 * typo in either one reads as "the challenge failed", with nothing to point at.
 */
export const TURNSTILE_ACTIONS = {
  contribute: 'contribute',
  adminLogin: 'admin-login',
} as const;

export type TurnstileAction = (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS];
