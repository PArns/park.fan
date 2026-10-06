/**
 * The actions this app renders Turnstile widgets with. A token is only good for the form it was
 * solved on, so the widget (a Client Component) and the check (a route handler) read the same
 * names from here; a typo would read as "the challenge failed". Its own file because
 * `lib/security/turnstile.ts` is server-only.
 */
export const TURNSTILE_ACTIONS = {
  contribute: 'contribute',
  adminLogin: 'admin-login',
} as const;

export type TurnstileAction = (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS];
