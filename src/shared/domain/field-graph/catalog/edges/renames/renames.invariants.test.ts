import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appGraph } from '../../../app-graph';
import { renamesOf } from './renames.queries';
import { INTENTIONALLY_DROPPED_V2_FIELDS } from '@/shared/domain/migrations/intentionally-dropped';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..', '..', '..');
const V2_FIELD_LIST = join(REPO_ROOT, 'scripts', 'migration-data-prep', 'out', 'v2-field-list.csv');

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

function loadV2GameFields(): string[] {
  const raw = readFileSync(V2_FIELD_LIST, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]);
  const camelIdx = header.indexOf('camelCase');
  const kindIdx = header.indexOf('kind');
  return lines
    .slice(1)
    .map(parseCsvLine)
    .filter((row) => row[kindIdx] === 'gameOrCustom')
    .map((row) => row[camelIdx]);
}

describe('rename-edges catalog invariants', () => {
  const graph = appGraph();

  it('every V2 game field is either resolved by the graph or intentionally dropped', () => {
    const v2Fields = loadV2GameFields();
    const dropped = new Set(Object.keys(INTENTIONALLY_DROPPED_V2_FIELDS));
    const unresolved = v2Fields.filter(
      (f) => !graph.resolveFieldByAnyKey(f) && !dropped.has(f),
    );
    expect(
      unresolved,
      `Unresolved V2 fields (declare a RENAMED_FROM edge or add to intentionally-dropped):\n${unresolved.map((f) => `  ${f}`).join('\n')}`,
    ).toEqual([]);
  });

  it('no V2 field is both intentionally-dropped and a declared legacy key', () => {
    const dropped = new Set(Object.keys(INTENTIONALLY_DROPPED_V2_FIELDS));
    const legacyKeys = new Set<string>(
      graph.edgesOfType('RENAMED_FROM').map((e) => {
        const payload = e.payload as { legacyKey?: string } | undefined;
        return payload?.legacyKey ?? '';
      }),
    );
    const conflicts = [...dropped].filter((k) => legacyKeys.has(k));
    expect(conflicts).toEqual([]);
  });

  it('every legacy V1 internal-field key resolves to its canonical underscore form', () => {
    expect(graph.resolveFieldByAnyKey('date')?.id).toBe('_date');
    expect(graph.resolveFieldByAnyKey('time')?.id).toBe('_time');
    expect(graph.resolveFieldByAnyKey('notes')?.id).toBe('_notes');
    expect(graph.resolveFieldByAnyKey('runType')?.id).toBe('_runType');
    expect(graph.resolveFieldByAnyKey('run_type')?.id).toBe('_runType');
    expect(graph.resolveFieldByAnyKey('rank')?.id).toBe('_rank');
    expect(graph.resolveFieldByAnyKey('placement')?.id).toBe('_rank');
  });

  it('every RENAMED_FROM payload references a declared Schema node', () => {
    const renames = graph.edgesOfType('RENAMED_FROM');
    const orphans = renames.filter((e) => {
      const payload = e.payload as { atSchema?: string } | undefined;
      const schemaId = payload?.atSchema ?? '';
      return graph.nodesOfKind('Schema').every((s) => s.id !== schemaId);
    });
    expect(orphans).toEqual([]);
  });

  it('renamesOf returns historical chain for a known multi-rename field', () => {
    const records = renamesOf(graph, 'coins_orbs');
    // Each camelCase legacy key carries a parallel title-case-with-spaces form
    // (V2 clipboard display label), so the chain includes all four.
    expect(records.map((r) => r.legacyKey).sort()).toEqual([
      'Coins From Orb',
      'Coins From Orbs',
      'coinsFromOrb',
      'coinsFromOrbs',
    ]);
  });

  it('a sample V2 paste-style key resolves through the graph', () => {
    expect(graph.resolveFieldByAnyKey('coinsFromGoldenTower')?.id).toBe('coins_goldenTower');
    expect(graph.resolveFieldByAnyKey('blackHole')?.id).toBe('enemiesHitBy_blackHole');
    expect(graph.resolveFieldByAnyKey('blackHoleDamage')?.id).toBe('damage_blackHole');
  });
});
