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
    if (src.kind !== meta.sourceKind) {
      throw new FieldGraphBuildError(
        `${e.type}: source '${e.from}' must be a ${meta.sourceKind} node (got ${src.kind})`,
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
    const sources = this.byKind.get(meta.sourceKind) ?? [];
    for (const src of sources) {
      const has = (this.edgesFromIdx.get(src.id) ?? []).some((e) => e.type === type);
      if (!has) {
        throw new FieldGraphBuildError(
          `${type} cardinality 'at-least-one' violated: ${meta.sourceKind} '${src.id}' has no edge of this type`,
        );
      }
    }
  }

  // ---- Query API ----

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

  sourcesOf(totalFieldId: string): readonly string[] {
    return (this.edgesToIdx.get(totalFieldId) ?? [])
      .filter((e) => e.type === 'IS_SOURCE_OF')
      .map((e) => e.from);
  }

  fieldsInSection(sectionId: string): readonly string[] {
    return (this.edgesToIdx.get(sectionId) ?? [])
      .filter((e) => e.type === 'BELONGS_TO_SECTION')
      .map((e) => e.from);
  }

  sectionsOf(fieldId: string): readonly string[] {
    return (this.edgesFromIdx.get(fieldId) ?? [])
      .filter((e) => e.type === 'BELONGS_TO_SECTION')
      .map((e) => e.to as string);
  }

  edgesFrom(nodeId: string, type?: EdgeType): readonly Edge[] {
    const all = this.edgesFromIdx.get(nodeId) ?? [];
    return type ? all.filter((e) => e.type === type) : all;
  }

  edgesTo(nodeId: string, type?: EdgeType): readonly Edge[] {
    const all = this.edgesToIdx.get(nodeId) ?? [];
    return type ? all.filter((e) => e.type === type) : all;
  }

  nodesOfKind(kind: NodeKind): readonly Node[] {
    return this.byKind.get(kind) ?? [];
  }

  edgesOfType(type: EdgeType): readonly Edge[] {
    return this.edgesByType.get(type) ?? [];
  }
}
