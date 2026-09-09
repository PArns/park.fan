'use client';

import { useTranslations } from 'next-intl';
import type { PushWriteError } from '@/lib/push/push-follows';

/**
 * One sentence per way a push write can fail, shared by both ride-alert
 * dialogs and the show bell so the three surfaces cannot drift apart.
 *
 * This exists because every one of them used to render the same
 * "Das hat nicht geklappt. Bitte noch einmal versuchen." for ALL of them, and
 * in front of the two most common failures that sentence is simply false:
 * with notifications blocked in the browser, trying again does nothing at all
 * until the visitor changes a setting the page cannot reach — and it is worse
 * than useless, because a browser configured not to ask resolves the
 * permission request to `denied` without ever showing a prompt, so the
 * visitor never saw a question to answer and has no reason to suspect a
 * permission is missing. Naming the cause is the difference between a dead
 * end and an instruction.
 */
export function usePushErrorMessage() {
  const t = useTranslations('pushAlerts.pushErrors');

  return (error: PushWriteError): string => {
    if (error.reason === 'rate-limited') {
      return t('rateLimited', { seconds: error.retryAfterSeconds });
    }
    if (error.reason !== 'unavailable') return t('generic');

    switch (error.cause) {
      case 'denied':
        return t('blocked');
      case 'dismissed':
        return t('dismissed');
      case 'unsupported':
        return t('unsupported');
      case 'not-configured':
        return t('notConfigured');
      default:
        // `probe-failed` and `failed` are both "our end, and worth retrying".
        return t('generic');
    }
  };
}
