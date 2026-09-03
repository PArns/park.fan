/**
 * The planner's service worker.
 *
 * It exists for one reason and does one thing: a web push notification can only
 * be shown by a service worker, so this is the smallest one that can receive
 * the planner's "your next block starts soon" and put it on a lock screen.
 *
 * Deliberately NOT a caching worker. Nothing here intercepts `fetch`, and that
 * is the whole design: this site is statically prerendered and served through a
 * CDN that already does the caching, and a service worker that starts answering
 * navigations from its own store becomes the hardest kind of stale — one that
 * survives a deploy, ignores a purge, and needs the visitor to clear site data.
 * The cost of getting a push notification is one file with two listeners; the
 * cost of an offline cache on top would be a second, invisible copy of the
 * site's own cache policy.
 *
 * Registered by `use-push-subscription.ts`, and only after the visitor has
 * asked for notifications — a worker installed on every page load would claim
 * scope over the whole origin for a feature almost nobody turns on.
 */

self.addEventListener('install', () => {
  // Straight to active. There is no old worker whose caches have to be drained
  // first, because there are no caches.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // A push with a body this cannot read is not worth a banner reading
    // "undefined". Nothing sends one today; this is the guard for the day
    // something else does.
    return;
  }

  const title = typeof payload.title === 'string' ? payload.title : null;
  if (!title) return;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof payload.body === 'string' ? payload.body : '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      // The tag is what makes a phone that was in a pocket for two hours show
      // ONE banner instead of four about moments that have all passed. It is
      // the notification's own dedupe key, sent by the server for this.
      tag: typeof payload.tag === 'string' ? payload.tag : 'park-fan',
      renotify: false,
      data: { url: typeof payload.url === 'string' ? payload.url : '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // A tab on this site already open is focused rather than duplicated.
      // Somebody who taps a notification while the planner is open in a tab
      // wants that tab, not a second copy of it with their scroll position
      // reset.
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
