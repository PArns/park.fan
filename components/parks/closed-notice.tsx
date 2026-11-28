import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Ban } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { GlassNotice } from '@/components/parks/glass-notice';
import { closedRidePost, closedRideSource, formatClosedOn } from '@/lib/parks/closed-ride';

/** The link style inside a closure notice, also for the lines a page adds below. */
export const CLOSED_NOTICE_LINK_CLASS =
  'text-primary hover:text-primary/80 font-medium underline decoration-dotted underline-offset-4';

interface ClosedNoticeProps {
  /** The editor's closing date, as the API stores it. */
  retiredAt: string;
  /** The editor's reason, which may name a post of ours or an outside source. */
  retiredReason: string | null | undefined;
  locale: Locale;
  /** Further lines of the notice, each a block-level `<span>`. */
  children?: ReactNode;
}

/**
 * The notice on a page that stays up for a park or a ride that has closed for good: the day it
 * closed and where the closure is told. Our own post comes first, because it is written for the
 * reader in their language; an outside source only where the reason names no post of ours.
 */
export async function ClosedNotice({
  retiredAt,
  retiredReason,
  locale,
  children,
}: ClosedNoticeProps) {
  const t = await getTranslations('attractions.retired');
  const post = closedRidePost(retiredReason, locale);
  const source = post ? null : closedRideSource(retiredReason);

  return (
    <GlassNotice
      icon={Ban}
      title={t('noticeTitle', { date: formatClosedOn(retiredAt, locale) })}
      tintClassName="bg-red-500/5 dark:bg-red-500/10"
      iconClassName="text-red-600 dark:text-red-400"
      className="mb-8"
    >
      {post && (
        <span className="block">
          {t.rich('noticePost', {
            title: post.title,
            link: (chunks) => (
              <Link href={post.href as '/'} className={CLOSED_NOTICE_LINK_CLASS}>
                {chunks}
              </Link>
            ),
          })}
        </span>
      )}
      {source && (
        <span className="block">
          {t.rich('noticeSource', {
            host: source.host,
            link: (chunks) => (
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className={CLOSED_NOTICE_LINK_CLASS}
              >
                {chunks}
              </a>
            ),
          })}
        </span>
      )}
      {children}
    </GlassNotice>
  );
}
