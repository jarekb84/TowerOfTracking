import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_TO_V3_FIELD_MAP } from './v2-to-v3-field-map';
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

describe('v2 -> v3 schema inverse-check', () => {
  const supportedSet = new Set<string>(supportedFields as string[]);

  it('every target key in V2_TO_V3_FIELD_MAP exists in supportedFields.json', () => {
    const orphans: Array<{ v2: string; v3: string }> = [];
    for (const [v2, v3] of Object.entries(V2_TO_V3_FIELD_MAP)) {
      if (!supportedSet.has(v3)) {
        orphans.push({ v2, v3 });
      }
    }
    expect(orphans, `Orphaned V3 targets:\n${orphans.map((o) => `  ${o.v2} -> ${o.v3}`).join('\n')}`).toEqual([]);
  });

  it('every v2 game field is either mapped or intentionally dropped', () => {
    const { rows } = loadCsv(V2_FIELD_LIST);
    const gameFields = rows.filter((r) => r.kind === 'gameOrCustom').map((r) => r.camelCase);
    const mapKeys = new Set(Object.keys(V2_TO_V3_FIELD_MAP));
    const droppedKeys = new Set(Object.keys(INTENTIONALLY_DROPPED_V2_FIELDS));

    const unresolved = gameFields.filter((f) => !mapKeys.has(f) && !droppedKeys.has(f));
    expect(unresolved, `Unresolved V2 fields (add to map or intentionally-dropped):\n${unresolved.map((f) => `  ${f}`).join('\n')}`).toEqual([]);
  });

  it('no v2 field is in both the map and intentionally-dropped', () => {
    const mapKeys = Object.keys(V2_TO_V3_FIELD_MAP);
    const droppedKeys = new Set(Object.keys(INTENTIONALLY_DROPPED_V2_FIELDS));
    const conflicts = mapKeys.filter((k) => droppedKeys.has(k));
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
