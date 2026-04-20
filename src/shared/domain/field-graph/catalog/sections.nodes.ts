import { sectionNode } from '../builders';
import type { Node } from '../types';

// Section nodes. These mirror the V3 canonical key prefixes emitted by the
// V28 parser — `battleReport_*`, `coins_*`, `damage_*`, etc. — so that a
// field's declared section matches its storage prefix in the common case.
// See `sampleData/supportedFields.json` for the authoritative list of V3
// prefixes and `docs/field-graph/architecture/15-multi-section-membership.md`
// for multi-membership semantics (a field may belong to more than one
// section via additional BELONGS_TO_SECTION edges declared in later commits).
export const SECTION_NODES: readonly Node[] = [
  sectionNode('section:battleReport'),
  sectionNode('section:bonusHealthGained'),
  sectionNode('section:cash'),
  sectionNode('section:coins'),
  sectionNode('section:counts'),
  sectionNode('section:currencies'),
  sectionNode('section:damage'),
  sectionNode('section:damageBlocked'),
  sectionNode('section:damageTaken'),
  sectionNode('section:enemiesDestroyedBy'),
  sectionNode('section:enemiesHitBy'),
  sectionNode('section:healthRegenerated'),
  sectionNode('section:killedWithEffectActive'),
  sectionNode('section:records'),
  sectionNode('section:totalEnemies'),
  sectionNode('section:utility'),
];
