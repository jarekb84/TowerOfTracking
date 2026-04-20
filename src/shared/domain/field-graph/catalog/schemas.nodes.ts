import { schemaNode } from '../builders';
import type { Node } from '../types';

// Schema nodes. Each tower-tracking storage schema is a first-class graph
// node. See `docs/field-graph/architecture/17-schema-as-a-first-class-graph-entity.md`
// §17.1 for the mental model and payload contract. Node ids are prefixed
// `schema:` so they never collide with Field / Section / View ids.
export const SCHEMA_NODES: readonly Node[] = [
  schemaNode('schema:v1', {
    payload: {
      appVersion: '0.10.x',
      description:
        'Original flat-key storage. Internal fields have no underscore prefix.',
    },
  }),
  schemaNode('schema:v2', {
    payload: {
      appVersion: '0.11.x',
      description:
        'Internal fields adopt underscore-prefixed convention (_date, _time, _notes, ...). Game fields remain V2 flat keys.',
    },
  }),
  schemaNode('schema:v3', {
    payload: {
      appVersion: '0.12.x',
      gameVersion: 'V28',
      description:
        'Section-prefixed V3 canonical keys for all game fields (battleReport_, coins_, damage_, ...). Triggered by game V28 sectionized export.',
    },
  }),
];
