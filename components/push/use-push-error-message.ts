'use client';

import { useTranslations } from 'next-intl';
import type { PushWriteError } from '@/lib/push/push-follows';

/**
 * One sentence per way a push write can fail, shared by both ride-alert dialogs and the show bell
 * so the three cannot drift apart. A generic "please try again" is false for the commonest
 * failures: with notifications blocked, retrying does nothing, and a browser set not to ask denies
 * without a prompt, so naming the cause is what turns a dead end into an instruction.
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
