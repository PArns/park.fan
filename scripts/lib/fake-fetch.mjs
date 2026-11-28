/**
 * A stand-in for `fetch` in the tests of the API fetchers, which must tell "the API said no"
 * from "the API did not answer" without a network.
 */

/** A JSON `Response` as the API sends it. */
export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Swaps the global `fetch` for the duration of one case. */
export async function withFetch(impl, run) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

/** Runs `fn` and names what came of it: the outcome is the assertion, so a throw is a value. */
export const outcome = async (fn) => {
  try {
    const value = await fn();
    return value === null ? 'null' : 'data';
  } catch {
    return 'threw';
  }
};
