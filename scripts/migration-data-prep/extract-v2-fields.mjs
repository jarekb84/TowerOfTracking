#!/usr/bin/env node
// Deterministic extractor for V2 (pre-V28) CSV headers.
//
// Reads sampleData/app/v2_data_format/v2_csv_headers.md (a single tab-
// delimited line containing every column header used by the app prior to
// V28) and writes a CSV listing each header with its camelCase form.
//
// This is the raw input for the V2->V3 migration mapping: every field in
// this output must be accounted for in the migration adapter (either
// mapped to a V3 canonical name or explicitly listed as dropped).
//
// Output: scripts/migration-data-prep/out/v2-field-list.csv
//
// No heuristics, no fuzzy matching.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const INPUT_FILE = join(REPO_ROOT, 'sampleData', 'app', 'v2_data_format', 'v2_csv_headers.md');
const OUT_DIR = join(__dirname, 'out');
const OUT_FILE = join(OUT_DIR, 'v2-field-list.csv');

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

function classifyField(header) {
  const trimmed = header.trim();
  if (trimmed.startsWith('_')) return 'internal';
  return 'gameOrCustom';
}

function escapeCsv(cell) {
  const s = String(cell ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function main() {
  const raw = readFileSync(INPUT_FILE, 'utf8');
  const firstLine = raw.split(/\r?\n/).find(l => l.trim().length > 0);

  if (!firstLine) {
    console.error(`No content found in ${INPUT_FILE}`);
    process.exit(1);
  }

  const headers = firstLine.split('\t').map(h => h.trim()).filter(Boolean);

  if (headers.length === 0) {
    console.error('No headers parsed.');
    process.exit(1);
  }

  const rows = [['header', 'kind', 'camelCase', 'mapsToV3Field']];

  const sorted = [...headers].sort((a, b) => {
    const aInt = a.startsWith('_');
    const bInt = b.startsWith('_');
    if (aInt !== bInt) return aInt ? -1 : 1;
    return a.localeCompare(b);
  });

  for (const header of sorted) {
    const kind = classifyField(header);
    const camel = kind === 'internal'
      ? '_' + toCamelCase(header.substring(1))
      : toCamelCase(header);
    rows.push([header, kind, camel, '']);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, rows.map(r => r.map(escapeCsv).join(',')).join('\n'), 'utf8');

  const internalCount = sorted.filter(h => h.startsWith('_')).length;
  console.log(`Parsed ${headers.length} V2 headers (${internalCount} internal, ${headers.length - internalCount} game/custom).`);
  console.log(`Output: ${OUT_FILE}`);
}

main();
