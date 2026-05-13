import { describe, expect, it } from 'vitest';
import {
  appGraph,
  colorOf,
  displayNameOf,
  sourcesOf,
} from '../../../index';
import {
  BATTLE_REPORT__COINS_EARNED_NODE,
  DAMAGE__DAMAGE_DEALT_NODE,
  TOTAL_ENEMIES__TOTAL_ENEMIES_NODE,
} from '../../fields.nodes';

// Production-catalog shape for HAS_DISPLAY_NAME + HAS_COLOR.
//   - HAS_DISPLAY_NAME is universal across Field, Section, and Category.
//     (EnumValue display names are enforced by `enum-values.invariants.test.ts`.)
//   - HAS_COLOR is scoped to the 77 breakdown source fields — non-breakdown
//     fields don't render with color today.
//
// Cardinality stays `'one'` (max-one) instead of `'at-least-one'` because
// the latter would fail every fixture graph in the test suite. Production-
// catalog universality is enforced by the explicit checks below.

// Sections whose fields render as breakdown sources but aren't IS_SOURCE_OF
// the denominator (supplementary breakdowns). Their source fields still
// need HAS_COLOR for the percentage-bar visualization.
const SUPPLEMENTARY_BREAKDOWN_SECTIONS = [
  'section:enemiesHitBy',
  'section:enemiesDestroyedBy',
  'section:killedWithEffectActive',
] as const;

function breakdownSourceFieldIds(): readonly string[] {
  const ids = new Set<string>();
  for (const total of [
    BATTLE_REPORT__COINS_EARNED_NODE,
    DAMAGE__DAMAGE_DEALT_NODE,
    TOTAL_ENEMIES__TOTAL_ENEMIES_NODE,
  ]) {
    for (const id of sourcesOf(total)) ids.add(id);
  }
  for (const sectionId of SUPPLEMENTARY_BREAKDOWN_SECTIONS) {
    for (const e of appGraph().edgesTo(sectionId, 'BELONGS_TO_SECTION')) {
      ids.add(e.from);
    }
  }
  // `totalEnemies_summonedEnemies` is multi-section (also a member of
  // section:killedWithEffectActive), so it's already picked up by the loop
  // above. Listed explicitly here as a safety net if that membership ever
  // changes.
  ids.add('totalEnemies_summonedEnemies');
  return [...ids];
}

describe('presentation catalog invariants', () => {
  it('every Field has a HAS_DISPLAY_NAME edge', () => {
    const missing: string[] = [];
    for (const node of appGraph().nodesOfKind('Field')) {
      if (displayNameOf(node) === undefined) missing.push(node.id);
    }
    expect(missing, `fields missing HAS_DISPLAY_NAME:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every Section has a HAS_DISPLAY_NAME edge', () => {
    const missing: string[] = [];
    for (const node of appGraph().nodesOfKind('Section')) {
      if (displayNameOf(node) === undefined) missing.push(node.id);
    }
    expect(missing, `sections missing HAS_DISPLAY_NAME:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every Category has a HAS_DISPLAY_NAME edge', () => {
    const missing: string[] = [];
    for (const node of appGraph().nodesOfKind('Category')) {
      if (displayNameOf(node) === undefined) missing.push(node.id);
    }
    expect(missing, `categories missing HAS_DISPLAY_NAME:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every breakdown source field has a HAS_COLOR edge', () => {
    const missing: string[] = [];
    for (const id of breakdownSourceFieldIds()) {
      if (colorOf(id) === undefined) missing.push(id);
    }
    expect(missing, `breakdown source fields missing HAS_COLOR:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every HAS_COLOR edge points at a hex string', () => {
    for (const edge of appGraph().edgesOfType('HAS_COLOR')) {
      expect(edge.to, `HAS_COLOR from ${edge.from} has no value`).toBeDefined();
      expect(edge.to as string).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
