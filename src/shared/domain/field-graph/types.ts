// Core types for the field graph. Nodes are the *things* (fields, sections,
// categories, views, schemas, enum values); edges are the *relationships*
// between them. See `docs/field-graph/architecture/08-clarifying-the-mental-model.md`
// for the authoritative shape reference.

export type NodeKind =
  | 'Field'
  | 'Section'
  | 'Category'
  | 'View'
  | 'Schema'
  | 'EnumValue';

export interface Node {
  readonly id: string;
  readonly kind: NodeKind;
  readonly tags?: readonly string[];
  readonly payload?: Readonly<Record<string, unknown>>;
}

export type EdgeType =
  // Structural, between-nodes
  | 'BELONGS_TO_SECTION'
  | 'BELONGS_TO_CATEGORY'
  | 'IS_SOURCE_OF'
  | 'IS_DERIVED_FROM'
  | 'APPEARS_IN_VIEW'
  | 'APPEARS_IN_FILTER'
  | 'SHARES_LABEL_WITH'
  | 'PARTICIPATES_IN_COMPOSITE_KEY'
  | 'REPLACED_BY'
  | 'INTENTIONALLY_DROPPED_IN_SCHEMA'
  | 'IS_CORRELATED_WITH'
  | 'SHIPPED_IN_SCHEMA'
  | 'MIGRATED_TO_SCHEMA'
  | 'RENDERS_AS_IN_SECTION'
  | 'IS_REQUIRED_IN'
  | 'CONDITIONAL_ON'
  | 'ACCEPTS_VALUE'
  | 'IS_INTERNAL_FIELD'
  // Terminal-target (to is a plain string, not a node id)
  | 'HAS_DISPLAY_NAME'
  | 'HAS_COLOR'
  | 'HAS_DATA_TYPE'
  | 'HAS_CSV_HEADER'
  | 'HAS_STRING_VALUE'
  // Payload-only (legacy key lives in payload.legacyKey; `to` is absent)
  | 'RENAMED_FROM';

// Target kinds for validation. `'terminal'` means the `to` field is a plain
// string (display name, color, data type, composite-key tag). `'none'` means
// the edge has no `to` field — it's a marker or payload-only edge.
export type EdgeTargetKind = NodeKind | 'terminal' | 'none';

// Per-source cardinality:
//  - 'one'          → at most one edge of this type per source (0 or 1)
//  - 'at-least-one' → every source node of the expected kind must have >= 1
//                     (per the "every field is used in at least one view" rule)
//  - 'many'         → no constraint
export type Cardinality = 'one' | 'at-least-one' | 'many';

export interface EdgeMeta {
  // Some edges (HAS_DISPLAY_NAME, HAS_COLOR) are declared on multiple source
  // kinds — e.g. both Fields and EnumValues carry a display name. Accept a
  // single kind or an array; validation normalizes.
  readonly sourceKind: NodeKind | readonly NodeKind[];
  readonly targetKind: EdgeTargetKind;
  readonly cardinality: Cardinality;
  // Symmetric edges (SHARES_LABEL_WITH, IS_CORRELATED_WITH) are indexed in
  // both directions so queries from either endpoint return the other.
  readonly symmetric?: boolean;
}

export const EDGE_META: Readonly<Record<EdgeType, EdgeMeta>> = {
  BELONGS_TO_SECTION: { sourceKind: 'Field', targetKind: 'Section', cardinality: 'many' },
  BELONGS_TO_CATEGORY: { sourceKind: 'Section', targetKind: 'Category', cardinality: 'one' },
  IS_SOURCE_OF: { sourceKind: 'Field', targetKind: 'Field', cardinality: 'many' },
  IS_DERIVED_FROM: { sourceKind: 'Field', targetKind: 'Field', cardinality: 'many' },
  // Cardinality temporarily relaxed from 'at-least-one' to 'many' during the
  // field-graph migration. Phase 1 (commits 1–3) declares Field nodes without
  // any edges; the original invariant would reject every Field until commit 12
  // wires APPEARS_IN_VIEW edges. Commit 12 restores the stricter cardinality
  // (or downgrades it permanently if we decide some fields legitimately have
  // no view — compound-only sources, non-UI internal fields). Tracked in
  // `docs/field-graph/EPIC-migration.md` Migration-era suppressions.
  APPEARS_IN_VIEW: { sourceKind: 'Field', targetKind: 'View', cardinality: 'many' },
  APPEARS_IN_FILTER: { sourceKind: 'Field', targetKind: 'View', cardinality: 'many' },
  SHARES_LABEL_WITH: { sourceKind: 'Field', targetKind: 'Field', cardinality: 'many', symmetric: true },
  PARTICIPATES_IN_COMPOSITE_KEY: { sourceKind: 'Field', targetKind: 'terminal', cardinality: 'many' },
  REPLACED_BY: { sourceKind: 'Field', targetKind: 'Field', cardinality: 'many' },
  INTENTIONALLY_DROPPED_IN_SCHEMA: { sourceKind: 'Field', targetKind: 'Schema', cardinality: 'one' },
  IS_CORRELATED_WITH: { sourceKind: 'Field', targetKind: 'Field', cardinality: 'many', symmetric: true },
  SHIPPED_IN_SCHEMA: { sourceKind: 'Field', targetKind: 'Schema', cardinality: 'one' },
  MIGRATED_TO_SCHEMA: { sourceKind: 'Field', targetKind: 'Schema', cardinality: 'one' },
  RENDERS_AS_IN_SECTION: { sourceKind: 'Field', targetKind: 'Section', cardinality: 'many' },
  IS_REQUIRED_IN: { sourceKind: 'Field', targetKind: 'View', cardinality: 'many' },
  CONDITIONAL_ON: { sourceKind: 'Field', targetKind: 'EnumValue', cardinality: 'many' },
  ACCEPTS_VALUE: { sourceKind: 'Field', targetKind: 'EnumValue', cardinality: 'many' },
  IS_INTERNAL_FIELD: { sourceKind: 'Field', targetKind: 'none', cardinality: 'one' },
  HAS_DISPLAY_NAME: { sourceKind: ['Field', 'EnumValue'], targetKind: 'terminal', cardinality: 'one' },
  HAS_COLOR: { sourceKind: ['Field', 'EnumValue'], targetKind: 'terminal', cardinality: 'one' },
  HAS_DATA_TYPE: { sourceKind: 'Field', targetKind: 'terminal', cardinality: 'one' },
  HAS_CSV_HEADER: { sourceKind: 'Field', targetKind: 'terminal', cardinality: 'one' },
  HAS_STRING_VALUE: { sourceKind: 'EnumValue', targetKind: 'terminal', cardinality: 'one' },
  RENAMED_FROM: { sourceKind: 'Field', targetKind: 'none', cardinality: 'many' },
};

// Edge-type-specific payloads surface as optional properties on the Edge
// interface. The builder validates payload shape per type at construction.
export interface RenamedFromPayload {
  readonly legacyKey: string;
  readonly atSchema: string;
  readonly reason?: string;
}

export interface Edge {
  readonly type: EdgeType;
  readonly from: string;
  readonly to?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
  // Optional provenance for debugging duplicate-edge warnings, filled in by
  // a declaration helper later (e.g. `edges/belongs-to-section.ts:42`).
  readonly source?: string;
}

export class FieldGraphBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FieldGraphBuildError';
  }
}
