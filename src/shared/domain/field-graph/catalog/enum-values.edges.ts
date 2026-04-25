import { RUN_TYPE_VALUES, type RunTypeValue } from '../../run-types/types';
import { edge } from '../builders';
import type { Edge } from '../types';
import { _RUN_TYPE_NODE } from './fields.nodes';
import { runTypeEnumNodeId } from './enum-values.nodes';

// Edges for enum-valued fields. `_runType`'s accepted values are derived from
// `RUN_TYPE_VALUES` — the TS source of truth — so adding a new run type is a
// one-line edit in `run-types/types.ts` that flows through to the graph
// automatically. Per-value presentation (display name, color) lives in a
// small local map below; add a row when you add a value. The
// `enum-sync.invariant.test.ts` test catches drift between the two sides.

interface RunTypePresentation {
  readonly displayName: string;
  readonly color: string;
}

const RUN_TYPE_PRESENTATION: Readonly<Record<RunTypeValue, RunTypePresentation>> = {
  farm: { displayName: 'Farm', color: '#10b981' },
  tournament: { displayName: 'Tournament', color: '#f59e0b' },
  milestone: { displayName: 'Milestone', color: '#8b5cf6' },
};

function edgesForRunType(v: RunTypeValue): Edge[] {
  const enumId = runTypeEnumNodeId(v);
  const { displayName, color } = RUN_TYPE_PRESENTATION[v];
  return [
    edge(_RUN_TYPE_NODE.id, 'ACCEPTS_VALUE', enumId),
    edge(enumId, 'HAS_DISPLAY_NAME', displayName),
    edge(enumId, 'HAS_COLOR', color),
    edge(enumId, 'HAS_STRING_VALUE', v),
  ];
}

export const ENUM_VALUE_EDGES: readonly Edge[] = RUN_TYPE_VALUES.flatMap(edgesForRunType);
