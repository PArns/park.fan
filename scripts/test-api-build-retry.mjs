// Regression test for the build-time retry in `apiFetch` (PAR-955).
//
// A backend deploy takes the API down for 16 to 22 s. One 502 thrown during the prerender failed the
// whole build, so a build now retries 502 and network failures until the API has been silent for
// a minute, and gives up for every later request at once. At runtime nothing is retried.
import assert from 'node:assert/strict';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const badGateway = () => new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });

/** Loads a fresh copy of the client, as if `NEXT_PHASE` had been `phase` when the process started. */
async function loadClient(phase) {
  if (phase) process.env.NEXT_PHASE = phase;
  else delete process.env.NEXT_PHASE;
  return import(`../lib/api/client.ts?phase=${phase ?? 'runtime'}-${Math.random()}`);
}

/** Runs `run` with `fetch` answering from `responses` in turn; the last one repeats. */
async function withFetch(responses, run) {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    const next = responses[Math.min(calls, responses.length - 1)];
    calls++;
    if (next instanceof Error) throw next;
    return next();
  };
  try {
    return await run(() => calls);
  } finally {
    globalThis.fetch = original;
  }
}

const build = 'phase-production-build';

// 502, 502, 200 is a deploy that ended inside the window: the page gets its data.
{
  const { apiFetch } = await loadClient(build);
  await withFetch([badGateway, badGateway, () => json({ ok: true })], async (calls) => {
    assert.deepEqual(await apiFetch('/v1/x'), { ok: true });
    assert.equal(calls(), 3);
  });
}

// A network failure is retried the same way.
{
  const { apiFetch } = await loadClient(build);
  await withFetch([new TypeError('fetch failed'), () => json({ ok: true })], async (calls) => {
    assert.deepEqual(await apiFetch('/v1/x'), { ok: true });
    assert.equal(calls(), 2);
  });
}

// A 404 is an answer: no retry, and it does not open a window.
{
  const { apiFetch } = await loadClient(build);
  await withFetch([() => json({ message: 'Not found' }, 404)], async (calls) => {
    await assert.rejects(apiFetch('/v1/x'), (e) => e.status === 404);
    assert.equal(calls(), 1);
  });
}

// An API that stays down: each failed call moves the clock 25 s on, so the fourth failure is past
// the minute and the request throws the 502 as maintenance. Later requests do not retry at all.
{
  const { apiFetch } = await loadClient(build);
  const realNow = Date.now;
  let offset = 0;
  Date.now = () => realNow() + offset;
  try {
    await withFetch(
      [
        () => {
          offset += 25_000;
          return badGateway();
        },
      ],
      async (calls) => {
        await assert.rejects(apiFetch('/v1/x'), (e) => e.status === 502 && e.isMaintenance);
        assert.equal(calls(), 4);
        await assert.rejects(apiFetch('/v1/y'), (e) => e.status === 502);
        assert.equal(calls(), 5, 'a request after the window closed must not retry');
      }
    );
  } finally {
    Date.now = realNow;
  }
}

// The first failure after a long quiet stretch still gets its retries: the window runs from the
// failure, not from the last answer.
{
  const { apiFetch } = await loadClient(build);
  const realNow = Date.now;
  try {
    await withFetch([() => json({ ok: true })], () => apiFetch('/v1/x'));
    Date.now = () => realNow() + 120_000;
    await withFetch([badGateway, () => json({ ok: true })], async (calls) => {
      assert.deepEqual(await apiFetch('/v1/y'), { ok: true });
      assert.equal(calls(), 2);
    });
  } finally {
    Date.now = realNow;
  }
}

// A caller that aborted its own request is not retried.
{
  const { apiFetch } = await loadClient(build);
  const controller = new AbortController();
  controller.abort();
  await withFetch([new DOMException('aborted', 'AbortError')], async (calls) => {
    await assert.rejects(apiFetch('/v1/x', { signal: controller.signal }));
    assert.equal(calls(), 1);
  });
}

// Without the build flag the first 502 throws.
{
  const { apiFetch } = await loadClient(undefined);
  await withFetch([badGateway, () => json({ ok: true })], async (calls) => {
    await assert.rejects(apiFetch('/v1/x'), (e) => e.status === 502 && e.isMaintenance);
    assert.equal(calls(), 1);
  });
}

console.log('api build retry: ok');
