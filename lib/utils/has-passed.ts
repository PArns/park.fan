/** Whether an ISO time has passed at `nowMs`; a missing time never expires. */
export function hasPassed(iso: string | null, nowMs: number): boolean {
  if (!iso) return false;
  const time = Date.parse(iso);
  return Number.isFinite(time) && time <= nowMs;
}
