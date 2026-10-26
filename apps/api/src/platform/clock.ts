/** Injected time source: domain code never calls Date.now() directly (AGENTS.md). */
export type Clock = { now: () => Date };
export const systemClock: Clock = { now: () => new Date() };

export function fixedClock(
  start: Date,
): Clock & { advance: (ms: number) => void; set: (d: Date) => void } {
  let t = start.getTime();
  return {
    now: () => new Date(t),
    advance: (ms) => void (t += ms),
    set: (d) => void (t = d.getTime()),
  };
}
