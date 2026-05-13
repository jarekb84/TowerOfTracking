#!/usr/bin/env node
// Deterministic extractor for V28 game export headers.
//
// Reads every *.txt file under sampleData/v28/, parses section headers and
// field labels, and writes a CSV matrix showing which (section, field) pairs
// appear in which files. This is the raw input for building the V2->V3
// migration mapping by hand.
//
// Output: scripts/migration-data-prep/out/v28-field-matrix.csv
//
// Line classification:
//   - blank           -> skip
//   - contains '\t'   -> field. Key = text before first tab (trimmed),
//                        value = text after first tab (ignored here).
//   - no '\t'         -> section header. Text becomes current section.
//
// No heuristics, no fuzzy matching. Pure structural parse.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const INPUT_DIR = join(REPO_ROOT, 'sampleData', 'v28');
const OUT_DIR = join(__dirname, 'out');
const OUT_FILE = join(OUT_DIR, 'v28-field-matrix.csv');

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

function parseFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const pairs = [];
  let currentSection = '(no-section)';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const tabIndex = line.indexOf('\t');
    if (tabIndex === -1) {
      currentSection = line;
      continue;
    }

    const label = line.substring(0, tabIndex).trim();
    if (!label) continue;

    pairs.push({ section: currentSection, label });
  }

  return pairs;
}

function escapeCsv(cell) {
  const s = String(cell ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function main() {
  const files = readdirSync(INPUT_DIR)
    .filter(f => f.toLowerCase().endsWith('.txt'))
    .sort();

  if (files.length === 0) {
    console.error(`No .txt files found in ${INPUT_DIR}`);
    process.exit(1);
  }

  const perFile = new Map();
  const allKeys = new Map();

  for (const fileName of files) {
    const filePath = join(INPUT_DIR, fileName);
    const pairs = parseFile(filePath);
    const labelsByKey = new Map();

    for (const { section, label } of pairs) {
      const key = `${section}::${label}`;
      labelsByKey.set(key, true);
      if (!allKeys.has(key)) {
        allKeys.set(key, { section, label });
      }
    }

    perFile.set(fileName, labelsByKey);
  }

  const sortedKeys = [...allKeys.keys()].sort((a, b) => {
    const [secA, labA] = a.split('::');
    const [secB, labB] = b.split('::');
    if (secA !== secB) return secA.localeCompare(secB);
    return labA.localeCompare(labB);
  });

  const header = [
    'section',
    'label',
    'sectionCamel',
    'labelCamel',
    'proposedV3FieldName',
    ...files.map(f => basename(f, '.txt')),
    'presenceCount',
  ];

  const rows = [header];

  for (const key of sortedKeys) {
    const { section, label } = allKeys.get(key);
    const sectionCamel = toCamelCase(section);
    const labelCamel = toCamelCase(label);
    const proposed = sectionCamel
      ? `${sectionCamel}${labelCamel.charAt(0).toUpperCase()}${labelCamel.slice(1)}`
      : labelCamel;

    const presence = files.map(f => (perFile.get(f).has(key) ? 'x' : ''));
    const presenceCount = presence.filter(Boolean).length;

    rows.push([section, label, sectionCamel, labelCamel, proposed, ...presence, presenceCount]);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, rows.map(r => r.map(escapeCsv).join(',')).join('\n'), 'utf8');

  const uniquePairCount = sortedKeys.length;
  const sections = new Set(sortedKeys.map(k => k.split('::')[0]));

  console.log(`Parsed ${files.length} V28 files.`);
  console.log(`Unique (section, label) pairs: ${uniquePairCount}`);
  console.log(`Distinct sections: ${sections.size}`);
  console.log(`Output: ${OUT_FILE}`);
}

main();
