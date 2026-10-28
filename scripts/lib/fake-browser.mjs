/**
 * A stand-in for the browser globals `lib/analytics/site-analytics.ts` reads (`window`,
 * `location`, `navigator`, `document`, `localStorage`, `fetch`), so its tests run in plain Node.
 * Every request the facade makes lands in `requests`, parsed.
 */

/** What the fake browser has sent to the collect endpoint, newest last. */
export const requests = [];

/** How often the page read `window.innerWidth`; the facade sends no window width, so it stays 0. */
export const windowReads = { width: 0 };

/** The fake page's clock in milliseconds, the one `performance.now()` reads; tests move it. */
export const clock = { now: 0 };

/** What the page registered with `addEventListener`, on the window and on the document. */
export const listeners = { window: [], document: [] };

/**
 * Plays a browser event to whoever listens: `visibilitychange` after setting the visibility,
 * `pagehide` on the window.
 *
 * @param {'visibilitychange' | 'pagehide'} type
 * @param {'visible' | 'hidden'} [visibility] the state the document is in when it fires
 */
export function fire(type, visibility) {
  if (visibility) document.visibilityState = visibility;
  const target = type === 'pagehide' ? listeners.window : listeners.document;
  for (const entry of target.filter((listener) => listener.type === type)) entry.handler();
}

/** Moves to another path, as a client-side navigation does. */
export function navigate(path) {
  location.pathname = path;
}

/**
 * Replaces the browser globals with the given page. Call before each case; `requests` is emptied.
 *
 * @param {object} [page]
 * @param {string} [page.host] hostname; only production's count
 * @param {string} [page.path] `location.pathname`
 * @param {string} [page.search] `location.search`, with its `?`
 * @param {string} [page.referrer] `document.referrer`
 * @param {string} [page.dnt] `navigator.doNotTrack`
 * @param {boolean} [page.gpc] `navigator.globalPrivacyControl`
 * @param {boolean} [page.webdriver] `navigator.webdriver`
 * @param {'visible' | 'hidden'} [page.visibility] `document.visibilityState`
 * @param {Record<string, string>} [page.storage] what `localStorage` holds
 */
export function browser(page = {}) {
  requests.length = 0;
  const {
    host = 'park.fan',
    path = '/de/parks/europe/germany/bruehl/phantasialand',
    search = '',
    referrer = '',
    dnt,
    gpc,
    webdriver,
    visibility = 'visible',
    storage = {},
  } = page;
  clock.now = 0;
  windowReads.width = 0;
  listeners.window.length = 0;
  listeners.document.length = 0;

  const define = (name, value) =>
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });

  const fakeWindow = {};
  Object.defineProperty(fakeWindow, 'innerWidth', {
    get() {
      windowReads.width++;
      return 1280;
    },
  });
  define('window', fakeWindow);
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
    visibilityState: visibility,
    addEventListener: (type, handler) => listeners.document.push({ type, handler }),
  });
  define('addEventListener', (type, handler) => listeners.window.push({ type, handler }));
  define('performance', { now: () => clock.now });
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
