import { edge } from '../../../builders';
import type { Edge } from '../../../types';
import {
  BATTLE_REPORT__COINS_EARNED_NODE,
  BATTLE_REPORT__COINS_PER_HOUR_NODE,
  DAMAGE__DAMAGE_DEALT_NODE,
  TOTAL_ENEMIES__TOTAL_ENEMIES_NODE,
} from '../../fields.nodes';
import {
  SECTION_COINS_NODE,
  SECTION_DAMAGE_NODE,
  SECTION_ENEMIES_DESTROYED_BY_NODE,
  SECTION_ENEMIES_HIT_BY_NODE,
  SECTION_KILLED_WITH_EFFECT_ACTIVE_NODE,
  SECTION_TOTAL_ENEMIES_NODE,
} from '../../sections.nodes';

// Section-level breakdown rendering metadata.
//
// `HAS_BREAKDOWN_TOTAL` (Section → Field): "this section renders as a
// breakdown of this denominator field." Source field list is derived from
// the graph at render time — for genuine breakdowns, fields IS_SOURCE_OF
// the total; for supplementary breakdowns (same denominator, overlapping
// categorical views), fields IS_MEASURED_AGAINST the total scoped to the
// section. See `../sources/` and `../measurements/`.
//
// `HAS_BREAKDOWN_RATE` (Section → Field): "this section's breakdown also
// shows this field as a per-hour rate." Optional — most breakdowns don't
// have a rate companion.

export const BREAKDOWN_EDGES: readonly Edge[] = [
  // Genuine sum-to-total breakdowns
  edge(SECTION_DAMAGE_NODE.id, 'HAS_BREAKDOWN_TOTAL', DAMAGE__DAMAGE_DEALT_NODE.id),
  edge(SECTION_COINS_NODE.id, 'HAS_BREAKDOWN_TOTAL', BATTLE_REPORT__COINS_EARNED_NODE.id),
  edge(SECTION_COINS_NODE.id, 'HAS_BREAKDOWN_RATE', BATTLE_REPORT__COINS_PER_HOUR_NODE.id),
  edge(SECTION_TOTAL_ENEMIES_NODE.id, 'HAS_BREAKDOWN_TOTAL', TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id),

  // Supplementary same-denominator breakdowns
  edge(SECTION_ENEMIES_HIT_BY_NODE.id, 'HAS_BREAKDOWN_TOTAL', TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id),
  edge(SECTION_ENEMIES_DESTROYED_BY_NODE.id, 'HAS_BREAKDOWN_TOTAL', TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id),
  edge(SECTION_KILLED_WITH_EFFECT_ACTIVE_NODE.id, 'HAS_BREAKDOWN_TOTAL', TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id),
];
