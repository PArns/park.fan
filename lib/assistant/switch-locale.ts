import { isValidLocale, type Locale } from '@/i18n/config';
import { localizedPath } from '@/lib/i18n/localized-path';
import { safeAssistantHref } from './links';

/**
 * Where Parky's language switch goes: the page at `pathname` in `locale`, as a path without the
 * locale, which next-intl's router puts in front. The page's own hreflang alternate (`alternate`,
 * from `hreflangPath`) comes first, since a post's slug differs per language; without one, the same
 * path with its localized segment respelled. Null for anything that would not land on a park.fan
 * page in `locale`, so the switch never leaves the site.
 */
export function localeSwitchPath(
  pathname: string,
  locale: Locale,
  alternate: string | null
): string | null {
  const parts = pathname.split('/');
  const rest = isValidLocale(parts[1] ?? '') ? `/${parts.slice(2).join('/')}` : pathname;
  const prefix = `/${locale}`;
  for (const candidate of [alternate, localizedPath(rest, locale)]) {
    const path = candidate ? safeAssistantHref(candidate) : null;
    if (path === prefix) return '/';
    if (path?.startsWith(`${prefix}/`)) return path.slice(prefix.length);
  }
  return null;
}
