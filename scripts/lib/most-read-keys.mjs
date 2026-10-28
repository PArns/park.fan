import { locales } from '../../i18n/config.ts';
import { listArticlesByRecency, listNewsByDate } from '../../lib/blog/listing.ts';

/** Every post's `translationKey`, in every locale, once: what `page_read` sends as `key`. */
export function listAllTranslationKeys() {
  const keys = new Set();
  for (const locale of locales) {
    for (const post of [...listArticlesByRecency(locale), ...listNewsByDate(locale)]) {
      keys.add(post.translationKey);
    }
  }
  return [...keys];
}
