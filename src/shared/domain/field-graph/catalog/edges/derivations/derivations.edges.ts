import { edge } from '../../../builders';
import type { Edge } from '../../../types';
import {
  _DATE_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
  BATTLE_REPORT__BATTLE_DATE_NODE,
  BATTLE_REPORT__TIER_NODE,
} from '../../fields.nodes';
import { DERIVER_NAMES } from './derivations.derivers';

// IS_DERIVED_FROM edges + deriver-name payloads. The cascade walker in
// `apply-derivations.ts` walks these in topological order, calls the
// registered deriver, and writes the result back into the field map.
//
// Add a new derivation: declare the edge here, add a row to the
// `DERIVER_NAMES` map and a function in `derivations.derivers.ts`. The
// `derivations.invariants.test.ts` invariant pairs the two.

function derivedFromEdge(fromId: string, toId: string, deriver: string): Edge {
  return edge(fromId, 'IS_DERIVED_FROM', toId, { deriver });
}

export const DERIVATION_EDGES: readonly Edge[] = [
  derivedFromEdge(_DATE_NODE.id, BATTLE_REPORT__BATTLE_DATE_NODE.id, DERIVER_NAMES.dateFromBattleDate),
  derivedFromEdge(_TIME_NODE.id, BATTLE_REPORT__BATTLE_DATE_NODE.id, DERIVER_NAMES.timeFromBattleDate),
  derivedFromEdge(_RUN_TYPE_NODE.id, BATTLE_REPORT__TIER_NODE.id, DERIVER_NAMES.runTypeFromTier),
];
