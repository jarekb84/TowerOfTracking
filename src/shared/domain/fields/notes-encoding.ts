/**
 * Encoding utilities for notes field to safely store in tab-delimited format.
 *
 * When storing notes in tab-delimited CSV (localStorage or export), literal tabs
 * and newlines break the format. This module provides encode/decode functions
 * to safely escape these characters.
 *
 * Encoding: literal chars → escape sequences (for storage)
 *   - tab (\t) → \\t
 *   - newline (\n) → \\n
 *   - carriage return (\r) → \\r
 *   - backslash (\\) → \\\\ (must escape backslash first to avoid double-escaping)
 *
 * Decoding: escape sequences → literal chars (for display)
 */

/**
 * Encode notes for safe storage in tab-delimited format.
 * Converts literal tabs/newlines to escape sequences.
 */
export function encodeNotesForStorage(notes: string): string {
  if (!notes) return '';

  return notes
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/\t/g, '\\t')   // Escape tabs
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r');  // Escape carriage returns
}

/**
 * Decode notes from storage, converting escape sequences back to literal chars.
 * Uses single-pass regex to correctly handle escaped backslashes (\\\\) vs escape sequences (\\n).
 */
export function decodeNotesFromStorage(notes: string): string {
  if (!notes) return '';

  // Single-pass replacement handles escaped backslashes correctly
  // Matches backslash followed by any character and decodes appropriately
  return notes.replace(/\\(.)/g, (_match, char: string) => {
    switch (char) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      default: return '\\' + char; // Unknown escape, preserve as-is
    }
  });
}
