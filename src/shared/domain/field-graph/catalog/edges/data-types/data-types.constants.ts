// TS-side source of truth for the closed set of field data types. The graph's
// IS_OF_TYPE edges target these literals; consumers (CSV export, parsers,
// formatters) dispatch on them.
//
// Mirrors `GameRunField.dataType` in `src/shared/types/game-run.types.ts` —
// commit 8 (game-fields rollout) lifts that inline union to import from here.

export const DATA_TYPES = ['number', 'duration', 'date', 'string'] as const;

export type DataType = typeof DATA_TYPES[number];

export function isDataType(value: string): value is DataType {
  return (DATA_TYPES as readonly string[]).includes(value);
}
