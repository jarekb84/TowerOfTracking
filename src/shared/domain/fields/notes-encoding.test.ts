import { describe, it, expect } from 'vitest';
import { encodeNotesForStorage, decodeNotesFromStorage } from './notes-encoding';

describe('notes-encoding', () => {
  describe('encodeNotesForStorage', () => {
    it('should return empty string for empty input', () => {
      expect(encodeNotesForStorage('')).toBe('');
    });

    it('should encode tabs as \\t', () => {
      expect(encodeNotesForStorage('before\tafter')).toBe('before\\tafter');
    });

    it('should encode newlines as \\n', () => {
      expect(encodeNotesForStorage('line1\nline2')).toBe('line1\\nline2');
    });

    it('should encode carriage returns as \\r', () => {
      expect(encodeNotesForStorage('line1\rline2')).toBe('line1\\rline2');
    });

    it('should encode Windows-style line breaks (\\r\\n)', () => {
      expect(encodeNotesForStorage('line1\r\nline2')).toBe('line1\\r\\nline2');
    });

    it('should escape backslashes first to prevent double-escaping', () => {
      // A literal backslash followed by 'n' should become \\n (escaped backslash + n)
      // not be confused with a newline character
      expect(encodeNotesForStorage('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should handle text that already looks like escape sequences', () => {
      // If user types literal "\\n" (backslash + n), it should become "\\\\n"
      expect(encodeNotesForStorage('see \\n for newline')).toBe('see \\\\n for newline');
    });

    it('should encode multiple special characters', () => {
      const input = 'line1\nline2\tcolumn2\nline3';
      const expected = 'line1\\nline2\\tcolumn2\\nline3';
      expect(encodeNotesForStorage(input)).toBe(expected);
    });

    it('should preserve regular text unchanged', () => {
      const input = 'Simple notes without special chars';
      expect(encodeNotesForStorage(input)).toBe(input);
    });
  });

  describe('decodeNotesFromStorage', () => {
    it('should return empty string for empty input', () => {
      expect(decodeNotesFromStorage('')).toBe('');
    });

    it('should decode \\t as tab', () => {
      expect(decodeNotesFromStorage('before\\tafter')).toBe('before\tafter');
    });

    it('should decode \\n as newline', () => {
      expect(decodeNotesFromStorage('line1\\nline2')).toBe('line1\nline2');
    });

    it('should decode \\r as carriage return', () => {
      expect(decodeNotesFromStorage('line1\\rline2')).toBe('line1\rline2');
    });

    it('should decode Windows-style line breaks', () => {
      expect(decodeNotesFromStorage('line1\\r\\nline2')).toBe('line1\r\nline2');
    });

    it('should unescape backslashes correctly', () => {
      expect(decodeNotesFromStorage('path\\\\to\\\\file')).toBe('path\\to\\file');
    });

    it('should preserve regular text unchanged', () => {
      const input = 'Simple notes without special chars';
      expect(decodeNotesFromStorage(input)).toBe(input);
    });
  });

  describe('round-trip encoding', () => {
    it('should preserve simple text through encode/decode cycle', () => {
      const original = 'Simple notes';
      const encoded = encodeNotesForStorage(original);
      const decoded = decodeNotesFromStorage(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve multiline text through encode/decode cycle', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const encoded = encodeNotesForStorage(original);
      const decoded = decodeNotesFromStorage(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve text with tabs through encode/decode cycle', () => {
      const original = 'Column1\tColumn2\tColumn3';
      const encoded = encodeNotesForStorage(original);
      const decoded = decodeNotesFromStorage(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve text with backslashes through encode/decode cycle', () => {
      const original = 'C:\\Users\\name\\file.txt';
      const encoded = encodeNotesForStorage(original);
      const decoded = decodeNotesFromStorage(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve complex mixed content through encode/decode cycle', () => {
      const original = 'Notes:\n- Item 1\t100\n- Item 2\t200\nPath: C:\\data';
      const encoded = encodeNotesForStorage(original);
      const decoded = decodeNotesFromStorage(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve text with literal escape-like sequences', () => {
      // User typed literal backslash-n as documentation
      const original = 'Use \\n for newlines and \\t for tabs';
      const encoded = encodeNotesForStorage(original);
      const decoded = decodeNotesFromStorage(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle empty string', () => {
      expect(decodeNotesFromStorage(encodeNotesForStorage(''))).toBe('');
    });

    it('should handle Windows line endings', () => {
      const original = 'Line 1\r\nLine 2\r\nLine 3';
      const encoded = encodeNotesForStorage(original);
      const decoded = decodeNotesFromStorage(encoded);
      expect(decoded).toBe(original);
    });
  });
});
