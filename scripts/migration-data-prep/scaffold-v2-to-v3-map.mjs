#!/usr/bin/env node
// Deterministic scaffolding pass for the V2 -> V3 field map.
//
// Reads:
//   - scripts/migration-data-prep/out/v2-field-list.csv
//   - scripts/migration-data-prep/out/v28-field-matrix.csv
//   - sampleData/v28/*.txt (raw V28 game exports, for last-occurrence hints)
//   - src/features/game-runs/card-view/run-details/section-config.ts
//     (source of truth for what counts as a "known V27" field, by
//     text-scanning the exported CATEGORIZED_FIELDS set; any V2 field NOT in
//     that set was either pure-V27 or new-in-V28, which the human reviewer
//     uses as a disambiguation hint).
//
// Emits:
//   src/shared/domain/migrations/v2-to-v3-field-map.generated.ts
//
// For each V2 game/custom field, the script looks for V28 targets whose
// `labelCamel` matches the V2 `camelCase` form (exact, case-sensitive). The
// resolved V3 target key follows PRD §6 F1: `<sectionCamel>_<labelCamel>`
// (single underscore separator).
//
// The V2 storage format is a FLAT key/value map. When users imported V28
// exports into the V27 parser during the transition window, repeated labels
// (e.g. "Black Hole" appears in Damage, Coins, Enemies Hit By, Enemies
// Destroyed By) collapsed under last-write-wins semantics: the LAST
// occurrence in the V28 file is what the bare V2 column ended up storing
// for V28-era runs. The scaffold surfaces that "last seen" section as a
// disambiguation hint for the human reviewer.
//
// Emission rules per V2 game field:
//   - 1 V28 candidate         -> auto-match, commented "// auto"
//   - 0 V28 candidates        -> TODO_V2('<v2Field>'), commented "// no candidate"
//   - >1 V28 candidates       -> TODO_V2('<v2Field>'), each option commented
//                                with presenceCount (runs visible in) and
//                                last-seen marker when it matches the V28
//                                last-occurrence across sample files.
//
// Same inputs -> same output. Rerun freely.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const V2_FIELD_LIST = join(__dirname, 'out', 'v2-field-list.csv');
const V28_FIELD_MATRIX = join(__dirname, 'out', 'v28-field-matrix.csv');
const V28_SAMPLES_DIR = join(REPO_ROOT, 'sampleData', 'v28');
const SECTION_CONFIG = join(
  REPO_ROOT,
  'src',
  'features',
  'game-runs',
  'card-view',
  'run-details',
  'section-config.ts'
);
const OUT_FILE = join(
  REPO_ROOT,
  'src',
  'shared',
  'domain',
  'migrations',
  'v2-to-v3-field-map.generated.ts'
);

function parseCsvLine(line) {
  const cells = [];
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

function parseCsvFile(path) {
  const raw = readFileSync(path, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    header.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
  return { header, rows };
}

function toCamelCase(input) {
  const cleaned = input.replace(/[^\w\s]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((part, i) => {
      const lower = part.toLowerCase();
      if (i === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function buildV28Index(v28Rows) {
  const byLabelCamel = new Map();
  for (const row of v28Rows) {
    const labelCamel = row.labelCamel;
    const sectionCamel = row.sectionCamel;
    if (!labelCamel || !sectionCamel) continue;
    const v3Key = `${sectionCamel}_${labelCamel}`;
    const presenceCount = parseInt(row.presenceCount || '0', 10);
    if (!byLabelCamel.has(labelCamel)) {
      byLabelCamel.set(labelCamel, []);
    }
    byLabelCamel.get(labelCamel).push({ v3Key, sectionCamel, labelCamel, presenceCount });
  }
  return byLabelCamel;
}

// For each V28 export file, record the LAST section a given labelCamel
// appears in. This mirrors what the V2 (flat, last-write-wins) parser would
// have stored when a V28 export was imported under V27.
function buildLastOccurrenceByLabel() {
  const byLabel = new Map();
  const files = readdirSync(V28_SAMPLES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.txt'))
    .sort();

  for (const fileName of files) {
    const raw = readFileSync(join(V28_SAMPLES_DIR, fileName), 'utf8');
    const lines = raw.split(/\r?\n/);
    let currentSection = null;
    const lastSectionByLabel = new Map();

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const tabIndex = line.indexOf('\t');
      if (tabIndex === -1) {
        currentSection = line;
        continue;
      }
      if (!currentSection) continue;
      const label = line.substring(0, tabIndex).trim();
      if (!label) continue;
      const labelCamel = toCamelCase(label);
      const sectionCamel = toCamelCase(currentSection);
      lastSectionByLabel.set(labelCamel, sectionCamel);
    }

    for (const [labelCamel, sectionCamel] of lastSectionByLabel) {
      if (!byLabel.has(labelCamel)) byLabel.set(labelCamel, new Map());
      const fileMap = byLabel.get(labelCamel);
      const key = `${sectionCamel}_${labelCamel}`;
      fileMap.set(fileName, key);
    }
  }

  return byLabel;
}

// Best-effort scan of section-config.ts to pull out the literal field names
// referenced in CATEGORIZED_FIELDS configs. Match `fieldName: 'camelCase'`
// tokens. This is a hint layer, not a dependency — we tolerate a partial
// match.
function loadKnownV27Fields() {
  let source;
  try {
    source = readFileSync(SECTION_CONFIG, 'utf8');
  } catch {
    return new Set();
  }
  const set = new Set();
  const re = /fieldName:\s*['"]([a-zA-Z_][\w]*)['"]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    set.add(m[1]);
  }
  // Internal fields that are always V27-era
  for (const f of ['_date', '_time', '_notes', '_runType', '_rank']) set.add(f);
  return set;
}

function escapeJsSingleQuote(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderEntry(v2Camel, candidates, knownV27, lastOccurrence) {
  const v2Quoted = `'${escapeJsSingleQuote(v2Camel)}'`;
  const v27Tag = knownV27.has(v2Camel) ? ' (known V27)' : ' (not in section-config; likely V28-only or dropped)';

  if (candidates.length === 1) {
    const target = candidates[0].v3Key;
    return `  ${v2Quoted}: '${target}', // auto${v27Tag}`;
  }

  if (candidates.length === 0) {
    return `  ${v2Quoted}: TODO_V2(${v2Quoted}), // no V28 candidate${v27Tag}`;
  }

  // Ambiguous: annotate with V28 presence + last-seen markers.
  const lastSeenByFile = lastOccurrence.get(v2Camel) ?? new Map();
  const allLastKeys = new Set(lastSeenByFile.values());

  const header = `  // ambiguous: ${candidates.length} V28 candidates${v27Tag}`;
  const optionLines = candidates.map((c) => {
    const isLastSeen = allLastKeys.has(c.v3Key);
    const files = [...lastSeenByFile.entries()]
      .filter(([, key]) => key === c.v3Key)
      .map(([f]) => f.replace(/\.txt$/, ''));
    const lastTag = isLastSeen
      ? ` [LAST in: ${files.join(', ')}]`
      : '';
    return `  //   '${c.v3Key}' (seen in ${c.presenceCount}/6)${lastTag}`;
  });
  return [header, ...optionLines, `  ${v2Quoted}: TODO_V2(${v2Quoted}),`].join('\n');
}

function renderOutput(entries) {
  const header = [
    '// AUTO-GENERATED by scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs',
    '// Do not hand-edit. Rerun the scaffolding script to regenerate.',
    '//',
    '// Source data:',
    '//   scripts/migration-data-prep/out/v2-field-list.csv',
    '//   scripts/migration-data-prep/out/v28-field-matrix.csv',
    '//   sampleData/v28/*.txt (for "last seen" hints)',
    '//   src/features/game-runs/.../section-config.ts (for "known V27" hints)',
    '//',
    '// This file is the scaffold for diffing. The hand-edited authoritative',
    '// map lives in v2-to-v3-field-map.ts alongside this file; app code',
    '// imports from there, not this one. When inputs change, rerun the',
    '// scaffold and reconcile manually into v2-to-v3-field-map.ts.',
    '//',
    '// Hint legend:',
    '//   "known V27"     -> V2 field appears in the run-details section-config',
    '//                      (was part of the V27 UI). High confidence a V27',
    '//                      meaning exists for it.',
    '//   "not in section-config" -> No V27 UI binding. Either a V28-only',
    '//                      field that leaked through last-write-wins, a V27',
    '//                      field that was only in charts/other views, or a',
    '//                      dead field.',
    '//   "(seen in N/6)" -> How many of the 6 V28 sample exports contained',
    '//                      this section/label pair. Lower counts = less',
    '//                      universal; may be run-type-specific.',
    '//   "[LAST in: X]"  -> In V28 export X, this section/label was the LAST',
    '//                      occurrence of the label. Flat last-write-wins',
    '//                      parsing of that file into V27 storage would',
    '//                      have left this value under the bare V2 key. If',
    '//                      a V2 row has V28-era data, this is the most',
    '//                      likely actual meaning of the bare V2 column.',
    '',
    '/**',
    ' * Sentinel for unresolved V2 -> V3 mappings. The hand-edited map must',
    ' * replace every TODO_V2 call with either a real target key or an entry',
    ' * in INTENTIONALLY_DROPPED (intentionally-dropped.ts).',
    ' */',
    'export function TODO_V2(v2FieldName: string): string {',
    '  throw new Error(',
    '    `[V2 migration] unresolved V2 field "${v2FieldName}" - resolve in v2-to-v3-field-map.ts or add to INTENTIONALLY_DROPPED`',
    '  );',
    '}',
    '',
    'export const V2_TO_V3_FIELD_MAP_GENERATED: Record<string, string> = {',
  ];
  const body = entries.map((e) => e.rendered);
  const footer = ['};', ''];
  return [...header, ...body, ...footer].join('\n');
}

function summarize(entries) {
  const summary = { auto: 0, none: 0, ambiguous: 0, knownV27: 0 };
  for (const e of entries) {
    summary[e.status]++;
    if (e.knownV27) summary.knownV27++;
  }
  return summary;
}

function main() {
  const v2 = parseCsvFile(V2_FIELD_LIST);
  const v28 = parseCsvFile(V28_FIELD_MATRIX);

  const v28Index = buildV28Index(v28.rows);
  const lastOccurrence = buildLastOccurrenceByLabel();
  const knownV27 = loadKnownV27Fields();

  const entries = [];
  const gameFields = v2.rows
    .filter((r) => r.kind === 'gameOrCustom')
    .sort((a, b) => a.camelCase.localeCompare(b.camelCase));

  for (const row of gameFields) {
    const v2Camel = row.camelCase;
    if (!v2Camel) continue;
    const candidates = v28Index.get(v2Camel) ?? [];
    let status;
    if (candidates.length === 1) status = 'auto';
    else if (candidates.length === 0) status = 'none';
    else status = 'ambiguous';

    entries.push({
      v2Camel,
      status,
      candidates,
      knownV27: knownV27.has(v2Camel),
      rendered: renderEntry(v2Camel, candidates, knownV27, lastOccurrence),
    });
  }

  const output = renderOutput(entries);

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, output, 'utf8');

  const summary = summarize(entries);
  console.log(`V2 game fields scanned:       ${entries.length}`);
  console.log(`Auto-matched (1 candidate):    ${summary.auto}`);
  console.log(`Ambiguous (>1 candidate):      ${summary.ambiguous}`);
  console.log(`Unresolved (0 candidates):     ${summary.none}`);
  console.log(`Known-V27 (in section-config): ${summary.knownV27}`);
  console.log(`Output: ${OUT_FILE}`);
}

main();
