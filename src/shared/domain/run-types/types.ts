/**
 * Run Type Definitions
 *
 * Core run type enumeration and type aliases used across multiple features.
 * Used by: data-import, game-runs, analysis features.
 *
 * Co-located with run-types domain logic per Migration Story 11B.
 */

/**
 * Run type enumeration for type safety
 */
export enum RunType {
  FARM = 'farm',
  TOURNAMENT = 'tournament',
  MILESTONE = 'milestone'
}

/**
 * Type alias for backwards compatibility and union types
 */
export type RunTypeValue = `${RunType}`;
