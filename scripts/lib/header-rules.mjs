import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match.js';

/**
 * The value a response header ends up with for `path` under next.config's `headers()` rules, and
 * the source of the rule that set it: every matching rule applies and the last one wins per key,
 * as Next resolves them. The key is compared without case.
 */
export function resolveHeader(rules, path, key) {
  const wanted = key.toLowerCase();
  let value;
  let source;
  for (const rule of rules) {
    if (!getPathMatch(rule.source)(path)) continue;
    for (const header of rule.headers) {
      if (header.key.toLowerCase() === wanted) {
        value = header.value;
        source = rule.source;
      }
    }
  }
  return { value, source };
}
