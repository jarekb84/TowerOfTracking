import { buildGraph } from './build-graph';
import type { FieldGraph } from './field-graph';

// Process-wide singleton accessor for the application's field graph. Graph
// construction runs full invariant checks and indexes every edge — doing it
// on every consumer call would be wasteful. `appGraph()` memoizes the first
// build and returns the same instance thereafter. Tests can inject a
// hand-built graph via `setAppGraphForTesting` to verify consumer behavior
// without hardcoding enum values or relationships in the test itself.

let cached: FieldGraph | null = null;
let testOverride: FieldGraph | null = null;

export function appGraph(): FieldGraph {
  if (testOverride) return testOverride;
  if (!cached) cached = buildGraph();
  return cached;
}

// Test-only: substitute a custom graph so a consumer-level test can exercise
// "what happens when a new enum value is declared." Pass `null` to restore
// the real graph. Never call this from production code.
export function setAppGraphForTesting(graph: FieldGraph | null): void {
  testOverride = graph;
}
