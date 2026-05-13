/**
 * Run Type Definitions
 *
 * Core run type enumeration and type aliases used across multiple features.
 * Used by: data-import, game-runs, analysis features.
 */

/**
 * Authoritative wire-value list. Adding a new run type starts here; the
 * `RunType` object below derives from it, and the graph catalog reads from
 * the same const via `enum-values.nodes.ts` / `enum-values.edges.ts`. The
 * `enum-sync.invariant.test.ts` test enforces that the graph's ACCEPTS_VALUE
 * edges for `_runType` match this array exactly.
 */
export const RUN_TYPE_VALUES = ['farm', 'tournament', 'milestone'] as const;

/**
 * Type alias for backwards compatibility and union types.
 */
export type RunTypeValue = typeof RUN_TYPE_VALUES[number];

/**
 * Run type enumeration for type safety. Kept as a const object (not a TS
 * `enum`) so values are plain string literals assignable to `RunTypeValue`.
 * Consumers reference `RunType.FARM`, `RunType.TOURNAMENT`, `RunType.MILESTONE`.
 */
export const RunType = {
  FARM: 'farm',
  TOURNAMENT: 'tournament',
  MILESTONE: 'milestone',
} as const satisfies Record<string, RunTypeValue>;

/**
 * Type predicate for narrowing an arbitrary string to `RunTypeValue`.
 */
export function isRunTypeValue(v: string): v is RunTypeValue {
  return (RUN_TYPE_VALUES as readonly string[]).includes(v);
}
