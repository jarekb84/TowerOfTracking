import { appGraph } from './app-graph';
import type { FieldRef } from './field-graph';
import * as enumValuesQ from './catalog/edges/enum-values/enum-values.queries';
import * as internalFieldsQ from './catalog/edges/internal-fields/internal-fields.queries';
import * as presentationQ from './catalog/edges/presentation/presentation.queries';
import * as sectionsQ from './catalog/edges/sections/sections.queries';
import * as sourcesQ from './catalog/edges/sources/sources.queries';

// Engine + builders + types — re-exported as-is for tests and engine consumers.
export { FieldGraph, type FieldRef } from './field-graph';
export { buildGraph } from './build-graph';
export { appGraph, setAppGraphForTesting } from './app-graph';
export {
  fieldNode,
  sectionNode,
  categoryNode,
  viewNode,
  schemaNode,
  enumValueNode,
  edge,
  renamedFromEdge,
} from './builders';
export {
  EDGE_META,
  FieldGraphBuildError,
  type Cardinality,
  type Edge,
  type EdgeMeta,
  type EdgeTargetKind,
  type EdgeType,
  type Node,
  type NodeKind,
  type RenamedFromPayload,
} from './types';

// Singleton-bound query wrappers. Consumers call these directly; the
// per-concept query functions take `(graph, ...)` for tests.
//
// To add or extend queries, see
// `catalog/edges/PATTERN.md`.

export type { EnumValueMeta } from './catalog/edges/enum-values/enum-values.queries';

export const enumValuesOf = (field: FieldRef) => enumValuesQ.enumValuesOf(appGraph(), field);
export const acceptedValuesFor = (field: FieldRef) => enumValuesQ.acceptedValuesFor(appGraph(), field);
export const isAcceptedValue = (field: FieldRef, raw: string) =>
  enumValuesQ.isAcceptedValue(appGraph(), field, raw);
export const matchAcceptedValue = (field: FieldRef, raw: string) =>
  enumValuesQ.matchAcceptedValue(appGraph(), field, raw);
export const enumValueMeta = (field: FieldRef, wireValue: string) =>
  enumValuesQ.enumValueMeta(appGraph(), field, wireValue);

export const internalFields = () => internalFieldsQ.internalFields(appGraph());
export const isInternalField = (field: FieldRef) => internalFieldsQ.isInternalField(appGraph(), field);
export const csvHeaderOf = (field: FieldRef) => internalFieldsQ.csvHeaderOf(appGraph(), field);

export const fieldsInSection = (section: FieldRef) => sectionsQ.fieldsInSection(appGraph(), section);
export const sectionsOf = (field: FieldRef) => sectionsQ.sectionsOf(appGraph(), field);

export const sourcesOf = (totalField: FieldRef) => sourcesQ.sourcesOf(appGraph(), totalField);

export const displayNameOf = (node: FieldRef) => presentationQ.displayNameOf(appGraph(), node);
export const colorOf = (node: FieldRef) => presentationQ.colorOf(appGraph(), node);
