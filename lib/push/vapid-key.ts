/**
 * The VAPID public key as the bytes `pushManager.subscribe` wants.
 *
 * It arrives base64url — no padding, `-` and `_` for `+` and `/` — and
 * `atob` understands neither, so this is a translation and not a formality:
 * skip it and `subscribe()` rejects with a key it cannot parse.
 *
 * Shared by `lib/planner/use-push-subscription.ts` (trip planner) and
 * `lib/push/push-registration.ts` (ride alerts, show follows) — both
 * subscribe the same browser to the same push service, and this is a pure,
 * feature-agnostic translation with nothing trip- or alert-specific in it,
 * unlike the rest of either file's subscribe flow.
 */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  // The buffer is allocated explicitly so the type is `ArrayBuffer` and not
  // `ArrayBufferLike`: `applicationServerKey` will not take a view that might
  // be over a `SharedArrayBuffer`, and `new Uint8Array(length)` is exactly that
  // to the type checker.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
