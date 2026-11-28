/**
 * Tokenization for the media search index.
 *
 * Plain JS and its own module because the SAME function has to run at build time
 * (`scripts/generate-media-manifest.mjs`, building the vocabulary) and at query
 * time (`lib/media/index.ts`, looking a query up in it). If the two ever
 * disagreed on what a token is, the index would silently stop matching — the
 * classic search bug where nothing is broken and nothing is found.
 */

/**
 * Fold diacritics and case, so a search answers the way people actually type:
 * "grun" finds "grün", "asterix" finds "Astérix", "cafe" finds "café". The site's
 * other searches fold with this one too (`foldText` in `lib/utils/text-fold.ts`).
 *
 * NFD splits a letter into base + combining mark; stripping the U+0300–U+036F
 * range then leaves the base letter. German ß is mapped explicitly because it has
 * no decomposition. NFD also splits every Hangul syllable into its letters, which
 * no step removes, so the closing NFC puts them back together; otherwise „래"
 * would find „랜드".
 *
 * @param {unknown} value
 * @returns {string}
 */
export function foldText(value) {
  return String(value)
    .replace(/\u00df/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .toLowerCase();
}

/**
 * Split folded text into search tokens: runs of letters and digits, two
 * characters or longer.
 *
 * Single characters are dropped deliberately — they match almost everything, so
 * they bloat the postings lists without narrowing anything. A one-character query
 * falls through to the substring path instead.
 */
export function tokenize(value) {
  const out = [];
  for (const token of foldText(value).split(/[^a-z0-9]+/)) {
    if (token.length >= 2) out.push(token);
  }
  return out;
}

/**
 * Index of the first vocabulary entry that is >= `prefix` (lower bound).
 *
 * The vocabulary is sorted at build time, so a prefix query is a binary search to
 * this position followed by a forward walk while entries still start with the
 * prefix. That is what makes lookup cost scale with the number of *matches*
 * rather than with the number of images.
 */
export function lowerBound(vocabulary, prefix) {
  let low = 0;
  let high = vocabulary.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (vocabulary[mid] < prefix) low = mid + 1;
    else high = mid;
  }
  return low;
}
