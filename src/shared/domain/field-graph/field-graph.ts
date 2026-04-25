import {
  EDGE_META,
  FieldGraphBuildError,
  type Edge,
  type EdgeMeta,
  type EdgeType,
  type Node,
  type NodeKind,
  type RenamedFromPayload,
} from './types';

// A reference to a field-graph node. Public query methods accept either a
// raw string id (parser-boundary, migration-era) or a `Node` handle imported
// from the catalog (`_RUN_TYPE_NODE`, `BATTLE_REPORT__COINS_EARNED_NODE`,
// …). Returns stay `readonly string[]` — see EXPLORATION-node-identity-abc-
// deep-dive.md §4 for the rationale.
export type FieldRef = string | Node;

// FieldGraph is a frozen, indexed view over a set of Node and Edge records.
// The constructor runs all structural invariants; once built, every query is
// an O(1) map lookup plus an O(matching-edges) filter. See the spec at
// `docs/field-graph/architecture/08-clarifying-the-mental-model.md` §8.3 for
// the invariants enforced here.

export class FieldGraph {
  private readonly nodes: readonly Node[];
  private readonly edges: readonly Edge[];
  private readonly byId = new Map<string, Node>();
  private readonly byKind = new Map<NodeKind, Node[]>();
  private readonly edgesFromIdx = new Map<string, Edge[]>();
  private readonly edgesToIdx = new Map<string, Edge[]>();
  private readonly edgesByType = new Map<EdgeType, Edge[]>();
  private readonly legacyKeyIdx = new Map<string, string>();

  constructor(nodes: readonly Node[], edges: readonly Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.indexNodes();
    this.indexEdges();
    this.validateEdges();
    this.validateRenamedFromPayloads();
    this.validateCardinality();
  }

  // ---- Indexing ----

  private indexNodes(): void {
    for (const node of this.nodes) {
      if (this.byId.has(node.id)) {
        throw new FieldGraphBuildError(
          `duplicate node id '${node.id}' — node ids must be unique across all kinds`,
        );
      }
      this.byId.set(node.id, node);
      const existing = this.byKind.get(node.kind);
      if (existing) existing.push(node);
      else this.byKind.set(node.kind, [node]);
    }
  }

  private indexEdges(): void {
    for (const e of this.edges) {
      this.pushInto(this.edgesFromIdx, e.from, e);
      if (e.to !== undefined) this.pushInto(this.edgesToIdx, e.to, e);
      this.pushInto(this.edgesByType, e.type, e);
      if (EDGE_META[e.type]?.symmetric && e.to !== undefined) {
        // Index symmetric edges in the reverse direction too. The edge itself
        // is not duplicated in the master list, only in the indexes — see §2
        // "the indexer stores them in both directions."
        const reversed: Edge = { type: e.type, from: e.to, to: e.from, payload: e.payload };
        this.pushInto(this.edgesFromIdx, reversed.from, reversed);
        this.pushInto(this.edgesToIdx, reversed.to as string, reversed);
      }
    }
  }

  private pushInto<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const existing = map.get(key);
    if (existing) existing.push(value);
    else map.set(key, [value]);
  }

  // ---- Validation ----

  private validateEdges(): void {
    for (const e of this.edges) {
      const meta = EDGE_META[e.type];
      if (!meta) {
        throw new FieldGraphBuildError(`unknown edge type '${e.type}' from '${e.from}'`);
      }
      this.checkSource(e, meta);
      this.checkTarget(e, meta);
    }
  }

  private checkSource(e: Edge, meta: EdgeMeta): void {
    const src = this.byId.get(e.from);
    if (!src) {
      throw new FieldGraphBuildError(
        `dangling edge reference: ${e.type} from '${e.from}' — source node is not declared`,
      );
    }
    const allowed = Array.isArray(meta.sourceKind) ? meta.sourceKind : [meta.sourceKind];
    if (!allowed.includes(src.kind)) {
      throw new FieldGraphBuildError(
        `${e.type}: source '${e.from}' must be a ${allowed.join(' or ')} node (got ${src.kind})`,
      );
    }
  }

  private checkTarget(e: Edge, meta: EdgeMeta): void {
    if (meta.targetKind === 'none') {
      if (e.to !== undefined) {
        throw new FieldGraphBuildError(`${e.type} from '${e.from}': edge has no target but 'to' was set`);
      }
      return;
    }
    if (e.to === undefined) {
      throw new FieldGraphBuildError(`${e.type} from '${e.from}': missing 'to' target`);
    }
    if (meta.targetKind === 'terminal') return; // any string is valid
    const tgt = this.byId.get(e.to);
    if (!tgt) {
      throw new FieldGraphBuildError(
        `dangling edge reference: ${e.type} from '${e.from}' to '${e.to}' — target node is not declared`,
      );
    }
    if (tgt.kind !== meta.targetKind) {
      throw new FieldGraphBuildError(
        `${e.type}: target '${e.to}' must be a ${meta.targetKind} node (got ${tgt.kind})`,
      );
    }
  }

  private validateRenamedFromPayloads(): void {
    for (const e of this.edgesByType.get('RENAMED_FROM') ?? []) {
      const payload = e.payload as RenamedFromPayload | undefined;
      if (!payload || !payload.legacyKey || !payload.atSchema) {
        throw new FieldGraphBuildError(
          `RENAMED_FROM from '${e.from}': payload must include legacyKey and atSchema`,
        );
      }
      const schema = this.byId.get(payload.atSchema);
      if (!schema || schema.kind !== 'Schema') {
        throw new FieldGraphBuildError(
          `RENAMED_FROM from '${e.from}': atSchema '${payload.atSchema}' is not a declared Schema node`,
        );
      }
      this.checkLegacyKeyUnique(payload.legacyKey, e.from);
      this.legacyKeyIdx.set(payload.legacyKey, e.from);
    }
  }

  private checkLegacyKeyUnique(legacyKey: string, currentFrom: string): void {
    const existing = this.legacyKeyIdx.get(legacyKey);
    if (existing && existing !== currentFrom) {
      throw new FieldGraphBuildError(
        `legacy key '${legacyKey}' is claimed by both '${existing}' and '${currentFrom}' — ` +
          'two fields cannot both own the same legacy key',
      );
    }
    if (this.byId.has(legacyKey)) {
      throw new FieldGraphBuildError(
        `legacy key '${legacyKey}' collides with a declared node — legacy keys must exist only as ` +
          'RENAMED_FROM payload strings, never as node ids',
      );
    }
  }

  private validateCardinality(): void {
    for (const type of Object.keys(EDGE_META) as EdgeType[]) {
      const meta = EDGE_META[type];
      if (meta.cardinality === 'one') this.enforceAtMostOne(type, meta);
      else if (meta.cardinality === 'at-least-one') this.enforceAtLeastOne(type, meta);
    }
  }

  private enforceAtMostOne(type: EdgeType, meta: EdgeMeta): void {
    const counts = new Map<string, number>();
    for (const e of this.edgesByType.get(type) ?? []) {
      counts.set(e.from, (counts.get(e.from) ?? 0) + 1);
    }
    for (const [from, n] of counts) {
      if (n > 1) {
        throw new FieldGraphBuildError(
          `${type} cardinality 'one' violated: ${meta.sourceKind} '${from}' has ${n} edges of this type`,
        );
      }
    }
  }

  private enforceAtLeastOne(type: EdgeType, meta: EdgeMeta): void {
    const kinds = Array.isArray(meta.sourceKind) ? meta.sourceKind : [meta.sourceKind];
    for (const kind of kinds) {
      for (const src of this.byKind.get(kind) ?? []) {
        const has = (this.edgesFromIdx.get(src.id) ?? []).some((e) => e.type === type);
        if (!has) {
          throw new FieldGraphBuildError(
            `${type} cardinality 'at-least-one' violated: ${kind} '${src.id}' has no edge of this type`,
          );
        }
      }
    }
  }

  // ---- Query API ----

  // String-in lookups: parser/import boundary and direct id resolution. These
  // intentionally do not accept a Node — their job is to convert a raw key
  // (storage, clipboard, URL param) or a previously-returned id back into a
  // Node handle.
  getField(id: string): Node | null {
    const n = this.byId.get(id);
    return n && n.kind === 'Field' ? n : null;
  }

  resolveFieldByAnyKey(rawKey: string): Node | null {
    const direct = this.getField(rawKey);
    if (direct) return direct;
    const canonical = this.legacyKeyIdx.get(rawKey);
    return canonical ? this.getField(canonical) : null;
  }

  // Polymorphic input: `string | Node`. Build-time consumers pass an imported
  // `*_NODE` handle; migration-era consumers pass a raw id string. Unknown
  // ids fall through to empty arrays — orphan refs do not throw.
  private toId(ref: FieldRef): string {
    return typeof ref === 'string' ? ref : ref.id;
  }

  sourcesOf(totalField: FieldRef): readonly string[] {
    return (this.edgesToIdx.get(this.toId(totalField)) ?? [])
      .filter((e) => e.type === 'IS_SOURCE_OF')
      .map((e) => e.from);
  }

  fieldsInSection(section: FieldRef): readonly string[] {
    return (this.edgesToIdx.get(this.toId(section)) ?? [])
      .filter((e) => e.type === 'BELONGS_TO_SECTION')
      .map((e) => e.from);
  }

  sectionsOf(field: FieldRef): readonly string[] {
    return (this.edgesFromIdx.get(this.toId(field)) ?? [])
      .filter((e) => e.type === 'BELONGS_TO_SECTION')
      .map((e) => e.to as string);
  }

  edgesFrom(node: FieldRef, type?: EdgeType): readonly Edge[] {
    const all = this.edgesFromIdx.get(this.toId(node)) ?? [];
    return type ? all.filter((e) => e.type === type) : all;
  }

  edgesTo(node: FieldRef, type?: EdgeType): readonly Edge[] {
    const all = this.edgesToIdx.get(this.toId(node)) ?? [];
    return type ? all.filter((e) => e.type === type) : all;
  }

  nodesOfKind(kind: NodeKind): readonly Node[] {
    return this.byKind.get(kind) ?? [];
  }

  edgesOfType(type: EdgeType): readonly Edge[] {
    return this.edgesByType.get(type) ?? [];
  }

  // ---- Enum-value queries ----
  //
  // Consumer-facing single-call helpers. Prefer these over raw `edgesFrom`
  // walks — the latter stays available for invariant tests and engine
  // internals. Each helper answers one specific consumer question:
  //
  //   acceptedValuesFor  — "what wire values does this field accept?"
  //   isAcceptedValue    — "is this raw string one of them?" (type predicate)
  //   matchAcceptedValue — "canonicalize or reject this raw string"
  //   enumValueMeta      — "give me the full metadata for this wire value"
  //
  // Matching is EXACT-STRING. Callers that need case-insensitive or whitespace-
  // tolerant matching normalize the input before calling in; the graph does
  // not second-guess wire values.

  enumValuesOf(field: FieldRef): readonly string[] {
    return (this.edgesFromIdx.get(this.toId(field)) ?? [])
      .filter((e) => e.type === 'ACCEPTS_VALUE')
      .map((e) => e.to as string);
  }

  /**
   * All wire values accepted by this field (e.g. `['farm', 'tournament', 'milestone']`).
   * Returns an empty array when the field has no ACCEPTS_VALUE edges (or the
   * field ref is unknown) — callers can treat "no enum values" uniformly
   * without branching on existence.
   */
  acceptedValuesFor(field: FieldRef): readonly string[] {
    const values: string[] = [];
    for (const enumId of this.enumValuesOf(field)) {
      const wireValue = this.terminalOf(enumId, 'HAS_STRING_VALUE');
      if (wireValue !== undefined) values.push(wireValue);
    }
    return values;
  }

  /** Type predicate — is `raw` one of this field's accepted wire values? Exact match. */
  isAcceptedValue(field: FieldRef, raw: string): boolean {
    return this.acceptedValuesFor(field).includes(raw);
  }

  /**
   * Returns the canonical wire value when `raw` exactly matches an accepted
   * value, else null. Today this is just `raw` itself on match — kept as a
   * named method so future "case-tolerant" or "alias" behavior has one place
   * to land, and so consumers read as intent (canonicalize) rather than
   * mechanics (includes).
   */
  matchAcceptedValue(field: FieldRef, raw: string): string | null {
    return this.isAcceptedValue(field, raw) ? raw : null;
  }

  /**
   * Full metadata for a declared accepted value. Returns null when the wire
   * value is not declared for the field. `displayName` and `color` come from
   * the corresponding terminal edges on the enum-value node and are omitted
   * when not declared so consumers can rely on optional-chaining + nullish
   * fallbacks (`meta?.color ?? FALLBACK`).
   */
  enumValueMeta(
    field: FieldRef,
    wireValue: string,
  ): {
    readonly id: string;
    readonly wireValue: string;
    readonly displayName?: string;
    readonly color?: string;
  } | null {
    for (const enumId of this.enumValuesOf(field)) {
      if (this.terminalOf(enumId, 'HAS_STRING_VALUE') === wireValue) {
        const displayName = this.terminalOf(enumId, 'HAS_DISPLAY_NAME');
        const color = this.terminalOf(enumId, 'HAS_COLOR');
        return {
          id: enumId,
          wireValue,
          ...(displayName === undefined ? {} : { displayName }),
          ...(color === undefined ? {} : { color }),
        };
      }
    }
    return null;
  }

  displayNameOf(node: FieldRef): string | undefined {
    return this.terminalOf(this.toId(node), 'HAS_DISPLAY_NAME');
  }

  colorOf(node: FieldRef): string | undefined {
    return this.terminalOf(this.toId(node), 'HAS_COLOR');
  }

  private terminalOf(nodeId: string, type: EdgeType): string | undefined {
    const match = (this.edgesFromIdx.get(nodeId) ?? []).find((e) => e.type === type);
    return match?.to;
  }
}
