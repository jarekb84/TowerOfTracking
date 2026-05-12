import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appGraph } from '@/shared/domain/field-graph/app-graph';
import { INTENTIONALLY_DROPPED_V2_FIELDS } from './intentionally-dropped';
import supportedFields from '../../../../sampleData/supportedFields.json';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const V2_FIELD_LIST = join(REPO_ROOT, 'scripts', 'migration-data-prep', 'out', 'v2-field-list.csv');
const V28_FIELD_MATRIX = join(REPO_ROOT, 'scripts', 'migration-data-prep', 'out', 'v28-field-matrix.csv');

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

function loadCsv(path: string): { header: string[]; rows: Record<string, string>[] } {
  const raw = readFileSync(path, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = parseCsvLine(l);
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
  return { header, rows };
}

describe('v2 -> v3 schema inverse-check (graph-driven)', () => {
  const supportedSet = new Set<string>(supportedFields as string[]);
  const graph = appGraph();

  it('every RENAMED_FROM target Field exists in supportedFields.json (or is an internal app-field)', () => {
    const orphans: Array<{ legacyKey: string; canonical: string }> = [];
    for (const e of graph.edgesOfType('RENAMED_FROM')) {
      const payload = e.payload as { legacyKey: string };
      // Internal fields use underscore prefix and aren't in supportedFields.json (V3 game fields only).
      if (e.from.startsWith('_')) continue;
      if (!supportedSet.has(e.from)) {
        orphans.push({ legacyKey: payload.legacyKey, canonical: e.from });
      }
    }
    expect(
      orphans,
      `Orphaned V3 targets:\n${orphans.map((o) => `  ${o.legacyKey} -> ${o.canonical}`).join('\n')}`,
    ).toEqual([]);
  });

  it('every v2 game field is either resolved by the graph or intentionally dropped', () => {
    const { rows } = loadCsv(V2_FIELD_LIST);
    const gameFields = rows.filter((r) => r.kind === 'gameOrCustom').map((r) => r.camelCase);
    const droppedKeys = new Set(Object.keys(INTENTIONALLY_DROPPED_V2_FIELDS));

    const unresolved = gameFields.filter(
      (f) => !graph.resolveFieldByAnyKey(f) && !droppedKeys.has(f),
    );
    expect(
      unresolved,
      `Unresolved V2 fields (declare a RENAMED_FROM edge or add to intentionally-dropped):\n${unresolved.map((f) => `  ${f}`).join('\n')}`,
    ).toEqual([]);
  });

  it('no v2 field is both intentionally-dropped and a declared legacy key', () => {
    const droppedKeys = new Set(Object.keys(INTENTIONALLY_DROPPED_V2_FIELDS));
    const legacyKeys = new Set<string>(
      graph.edgesOfType('RENAMED_FROM').map((e) => (e.payload as { legacyKey: string }).legacyKey),
    );
    const conflicts = [...droppedKeys].filter((k) => legacyKeys.has(k));
    expect(conflicts).toEqual([]);
  });

  it('every v28 matrix pair has a supportedFields entry', () => {
    const { rows } = loadCsv(V28_FIELD_MATRIX);
    const missing: string[] = [];
    for (const row of rows) {
      const key = `${row.sectionCamel}_${row.labelCamel}`;
      if (!supportedSet.has(key)) missing.push(key);
    }
    expect(missing, `V28 fields missing from supportedFields.json:\n${missing.map((f) => `  ${f}`).join('\n')}`).toEqual([]);
  });

  it('supportedFields.json has no duplicate entries', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const entry of supportedFields as string[]) {
      if (seen.has(entry)) duplicates.push(entry);
      seen.add(entry);
    }
    expect(duplicates).toEqual([]);
  });
});
