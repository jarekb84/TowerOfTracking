import { toCamelCase } from './field-utils';

/**
 * Replace every non-word, non-whitespace character with a space so that
 * `toCamelCase` can treat the result as a space-separated phrase. Mirrors
 * the `cleaned` step in scripts/migration-data-prep/extract-v28-fields.mjs
 * so runtime parsing and offline extraction produce identical keys (e.g.
 * "Defense %" -> "defense", not "defense%").
 */
function stripSpecialChars(input: string): string {
  return input.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * One parsed (section, label, value) triple from a V28 export. `label` is
 * the raw display label ("Killed By") — preserved so downstream field
 * creators can do label-based type detection (e.g. "Killed By" -> string,
 * "Real Time" -> duration). The `key` is the V3 canonical
 * `<sectionCamel>_<labelCamel>` form used as the in-memory field key.
 */
export interface SectionedEntry {
  /** `<sectionCamel>_<labelCamel>` — the ParsedGameRun.fields key. */
  key: string;
  /** Raw display label from the game export, e.g. "Killed By". */
  label: string;
  /** Raw value from the game export, e.g. "Scatter" or "228.27T". */
  value: string;
}

/**
 * Parse a V28-format game export (section-headered, tab-delimited) into an
 * array of entries. Each entry carries both the V3 canonical key and the
 * original display label, so callers can (a) store under the canonical
 * key and (b) still run label-based type detection on the display label.
 *
 * V28 export format:
 *   - Blank line           -> skip
 *   - Line without a TAB   -> section header (updates current section)
 *   - Line with a TAB      -> field. Key = text before first tab, value =
 *                             text after first tab.
 *
 * Matches the structural rules of scripts/migration-data-prep/extract-v28-fields.mjs
 * so the runtime parser and the offline field-matrix extractor stay in lockstep.
 *
 * Returns an empty array when no section context is established yet (i.e.
 * when a tab-line appears before the first section line), to avoid
 * emitting unsectioned keys.
 */
export function parseV28SectionedEntries(rawInput: string): SectionedEntry[] {
  const result: SectionedEntry[] = [];
  const lines = rawInput.split(/\r?\n/);
  let currentSection: string | null = null;

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
    const value = line.substring(tabIndex + 1).trim();
    if (!label || !value) continue;

    const sectionCamel = toCamelCase(stripSpecialChars(currentSection));
    const labelCamel = toCamelCase(stripSpecialChars(label));
    if (!sectionCamel || !labelCamel) continue;

    result.push({ key: `${sectionCamel}_${labelCamel}`, label, value });
  }

  return result;
}

/**
 * Convenience: same as parseV28SectionedEntries but returns a plain
 * `key -> value` map. Kept for call sites that don't need the original
 * display label.
 */
export function parseV28SectionedInput(rawInput: string): Record<string, string> {
  const entries = parseV28SectionedEntries(rawInput);
  const out: Record<string, string> = {};
  for (const entry of entries) {
    out[entry.key] = entry.value;
  }
  return out;
}

/**
 * Heuristic: does this raw input look like a V28 sectioned export (as
 * opposed to a legacy flat paste)? True when the input has at least one
 * line without a tab that is followed later by a tab-line (i.e. at least
 * one section-header pattern).
 *
 * Used at the paste/import boundary to route between the flat V2 parser
 * and the section-aware V28 parser.
 */
export function looksLikeV28SectionedInput(rawInput: string): boolean {
  const lines = rawInput.split(/\r?\n/);
  let sawSectionHeader = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const hasTab = line.includes('\t');
    if (!hasTab) {
      sawSectionHeader = true;
      continue;
    }
    if (sawSectionHeader) return true;
  }
  return false;
}
