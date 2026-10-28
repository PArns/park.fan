import { trackSiteEvent } from '@/lib/analytics/site-analytics';

/**
 * Asks the browser for notification permission and counts the answer as `push_permission`:
 * `granted`, `denied` (including a browser set to never ask, which answers without a prompt) or
 * `dismissed`, where the visitor closed the prompt without choosing. Call it only where the
 * permission is not decided yet, so each answer is one the visitor just gave.
 */
export async function askPushPermission(): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission();
  trackSiteEvent('push_permission', {
    result: permission === 'default' ? 'dismissed' : permission,
  });
  return permission;
}
