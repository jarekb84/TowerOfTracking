import { RUN_TYPE_VALUES, type RunTypeValue } from '../../run-types/types';
import { enumValueNode } from '../builders';
import type { Node } from '../types';

// EnumValue nodes for constrained-value internal fields. Each enum value is
// a first-class graph node so it can carry its own display name, wire value,
// and color.
//
// Id convention: `enum:<fieldId>.<wireValue>`. The wire value is used directly
// as the trailing segment for today's enum values — all are safe id tokens.
// If a future enum adds a wire value that isn't a valid id fragment (spaces,
// slashes, etc.) the id generator will need a slugging step.
//
// Naming the variable handles: `ENUM_<FIELD>__<WIRE_VALUE>_NODE`. The
// per-value handles below are derived from `RUN_TYPE_ENUM_NODES` so adding a
// run type stays a one-line edit in `RUN_TYPE_VALUES`; the named exports
// just give consumers a direct handle without re-deriving.

export function runTypeEnumNodeId(v: RunTypeValue): string {
  return `enum:runType.${v}`;
}

/** Lookup record keyed by wire value — avoids re-deriving in edges/tests. */
export const RUN_TYPE_ENUM_NODES = Object.fromEntries(
  RUN_TYPE_VALUES.map((v) => [v, enumValueNode(runTypeEnumNodeId(v))]),
) as Readonly<Record<RunTypeValue, Node>>;

export const ENUM_RUN_TYPE__FARM_NODE = RUN_TYPE_ENUM_NODES.farm;
export const ENUM_RUN_TYPE__TOURNAMENT_NODE = RUN_TYPE_ENUM_NODES.tournament;
export const ENUM_RUN_TYPE__MILESTONE_NODE = RUN_TYPE_ENUM_NODES.milestone;
