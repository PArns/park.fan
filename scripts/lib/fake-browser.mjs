/**
 * A stand-in for the browser globals `lib/analytics/site-analytics.ts` reads (`window`,
 * `location`, `navigator`, `document`, `localStorage`, `fetch`), so its tests run in plain Node.
 * Every request the facade makes lands in `requests`, parsed.
 */

/** What the fake browser has sent to the collect endpoint, newest last. */
export const requests = [];

/**
 * Replaces the browser globals with the given page. Call before each case; `requests` is emptied.
 *
 * @param {object} [page]
 * @param {string} [page.host] hostname; only production's count
 * @param {string} [page.path] `location.pathname`
 * @param {string} [page.search] `location.search`, with its `?`
 * @param {string} [page.referrer] `document.referrer`
 * @param {number} [page.width] `window.innerWidth`
 * @param {string} [page.dnt] `navigator.doNotTrack`
 * @param {boolean} [page.gpc] `navigator.globalPrivacyControl`
 * @param {boolean} [page.webdriver] `navigator.webdriver`
 * @param {Record<string, string>} [page.storage] what `localStorage` holds
 */
export function browser(page = {}) {
  requests.length = 0;
  const {
    host = 'park.fan',
    path = '/de/parks/europe/germany/bruehl/phantasialand',
    search = '',
    referrer = '',
    width = 1280,
    dnt,
    gpc,
    webdriver,
    storage = {},
  } = page;

  const define = (name, value) =>
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });

  define('window', { innerWidth: width });
  define('location', { hostname: host, pathname: path, search });
  define('navigator', {
    doNotTrack: dnt,
    globalPrivacyControl: gpc,
    webdriver,
    sendBeacon: (url, body) => {
      requests.push({ url, via: 'beacon', pending: body.text().then(JSON.parse), type: body.type });
      return true;
    },
  });
  define('document', {
    referrer,
    visibilityState: 'visible',
    addEventListener: () => {},
  });
  define('addEventListener', () => {});
  define('localStorage', {
    getItem: (key) => storage[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
  });
  define('fetch', (url, init) => {
    requests.push({
      url,
      via: 'fetch',
      pending: Promise.resolve(JSON.parse(init.body)),
      type: init.headers['Content-Type'],
      keepalive: init.keepalive,
    });
    return Promise.resolve({ ok: true });
  });
}

/** The parsed bodies of everything sent so far, one per request. */
export async function bodies() {
  return Promise.all(requests.map((request) => request.pending));
}

/** Every hit sent so far, across requests, in order. */
export async function hits() {
  return (await bodies()).flatMap((body) => body.hits);
}
