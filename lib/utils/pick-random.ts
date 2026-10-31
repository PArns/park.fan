/** A random item of `list`, never `except` while there is another to take. */
export function pickRandom<T>(list: readonly T[], except?: T | null): T {
  const others = except == null ? list : list.filter((item) => item !== except);
  const pool = others.length > 0 ? others : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** `count` different items of `list` in random order; all of them when it has fewer. */
export function pickSome<T>(list: readonly T[], count: number): T[] {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
