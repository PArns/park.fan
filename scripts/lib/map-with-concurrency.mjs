/**
 * Run `task` over `items` with at most `limit` in flight; the results keep the order of `items`.
 * The first rejection rejects the call, and no further item starts after it.
 *
 * @template T, R
 * @param {readonly T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} task
 * @returns {Promise<R[]>}
 */
export async function mapWithConcurrency(items, limit, task) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        try {
          results[index] = await task(items[index]);
        } catch (error) {
          next = items.length;
          throw error;
        }
      }
    })
  );
  return results;
}
