/** A random item of `list`, never `except` while there is another to take. */
export function pickRandom<T>(list: readonly T[], except?: T | null): T {
  const others = except == null ? list : list.filter((item) => item !== except);
  const pool = others.length > 0 ? others : list;
  return pool[Math.floor(Math.random() * pool.length)];
}
