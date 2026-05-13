import { appGraph } from './app-graph';
import type { FieldRef } from './field-graph';
import * as breakdownsQ from './catalog/edges/breakdowns/breakdowns.queries';
import * as dataTypesQ from './catalog/edges/data-types/data-types.queries';
import * as derivationsQ from './catalog/edges/derivations/derivations.queries';
import * as enumValuesQ from './catalog/edges/enum-values/enum-values.queries';
import * as internalFieldsQ from './catalog/edges/internal-fields/internal-fields.queries';
import * as measurementsQ from './catalog/edges/measurements/measurements.queries';
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

export const dataTypeOf = (field: FieldRef) => dataTypesQ.dataTypeOf(appGraph(), field);
export { DATA_TYPES, isDataType, type DataType } from './catalog/edges/data-types/data-types.constants';

export const derivationsOf = (field: FieldRef) => derivationsQ.derivationsOf(appGraph(), field);
export const fieldsDerivedFrom = (field: FieldRef) => derivationsQ.fieldsDerivedFrom(appGraph(), field);

// Lifecycle methods: hydrate a `ParsedGameRun` from raw fields, or apply a
// single-field edit and re-cascade dependents. See `hydration.ts`.
export { hydrateRun, updateField, type HydrationContext } from './hydration';

export const fieldsInSection = (section: FieldRef) => sectionsQ.fieldsInSection(appGraph(), section);
export const sectionsOf = (field: FieldRef) => sectionsQ.sectionsOf(appGraph(), field);
export const sectionsInCategory = (category: FieldRef) => sectionsQ.sectionsInCategory(appGraph(), category);
export const categoryOfSection = (section: FieldRef) => sectionsQ.categoryOfSection(appGraph(), section);
export const categoriesInDisplayOrder = () => sectionsQ.categoriesInDisplayOrder(appGraph());

export const sourcesOf = (totalField: FieldRef) => sourcesQ.sourcesOf(appGraph(), totalField);
export const fieldsMeasuredAgainst = (totalField: FieldRef) =>
  measurementsQ.fieldsMeasuredAgainst(appGraph(), totalField);
export const measurementTargetsOf = (field: FieldRef) =>
  measurementsQ.measurementTargetsOf(appGraph(), field);

export const breakdownTotalOf = (section: FieldRef) => breakdownsQ.breakdownTotalOf(appGraph(), section);
export const breakdownRateOf = (section: FieldRef) => breakdownsQ.breakdownRateOf(appGraph(), section);

export const displayNameOf = (node: FieldRef) => presentationQ.displayNameOf(appGraph(), node);
export const colorOf = (node: FieldRef) => presentationQ.colorOf(appGraph(), node);

// Parser/import-boundary lookups (string-only). Accept raw keys from
// storage / clipboard / CSV; resolve to canonical Field nodes via direct hit
// or RENAMED_FROM reverse-index lookup. Never call from UI / aggregation
// code — use `getField` (or pass a `*_NODE` handle through a polymorphic
// query) everywhere downstream.
export const getField = (id: string) => appGraph().getField(id);
export const resolveFieldByAnyKey = (rawKey: string) => appGraph().resolveFieldByAnyKey(rawKey);
