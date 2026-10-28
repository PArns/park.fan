import { trackSiteEvent } from '@/lib/analytics/site-analytics';

/**
 * Asks the browser for notification permission and returns the answer. When the permission was
 * still undecided, it counts that answer as `push_permission`: `granted`, `denied` (including a
 * browser set to never ask, which answers without showing a prompt) or `dismissed`, where the
 * visitor closed the prompt without choosing. A permission that was already `granted` or `denied`
 * is returned without a count, so the event is one answer given now and not a visitor who turns the
 * switch on again.
 */
export async function askPushPermission(): Promise<NotificationPermission> {
  const decided = Notification.permission !== 'default';
  const permission = await Notification.requestPermission();
  if (!decided) {
    trackSiteEvent('push_permission', {
      result: permission === 'default' ? 'dismissed' : permission,
    });
  }
  return permission;
}
