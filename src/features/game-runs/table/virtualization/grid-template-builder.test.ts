import { describe, it, expect } from 'vitest';
import { buildGridTemplateColumns, isFixedWidthColumn } from './grid-template-builder';
import type { Header } from '@tanstack/react-table';

function createMockHeader(id: string, size: number): Header<unknown, unknown> {
  return {
    id,
    getSize: () => size,
  } as unknown as Header<unknown, unknown>;
}

describe('grid-template-builder', () => {
  describe('isFixedWidthColumn', () => {
    it('should return true for expander column', () => {
      expect(isFixedWidthColumn('expander')).toBe(true);
    });

    it('should return true for notes column', () => {
      expect(isFixedWidthColumn('notes')).toBe(true);
    });

    it('should return true for actions column', () => {
      expect(isFixedWidthColumn('actions')).toBe(true);
    });

    it('should return false for content columns', () => {
      expect(isFixedWidthColumn('timestamp')).toBe(false);
      expect(isFixedWidthColumn('tier')).toBe(false);
      expect(isFixedWidthColumn('wave')).toBe(false);
      expect(isFixedWidthColumn('coins')).toBe(false);
    });
  });

  describe('buildGridTemplateColumns', () => {
    it('should return empty string for empty headers array', () => {
      expect(buildGridTemplateColumns([])).toBe('');
    });

    it('should return fixed pixel size for fixed columns', () => {
      const headers = [
        createMockHeader('expander', 40),
      ];
      expect(buildGridTemplateColumns(headers)).toBe('40px');
    });

    it('should return minmax for content columns', () => {
      const headers = [
        createMockHeader('timestamp', 105),
      ];
      expect(buildGridTemplateColumns(headers)).toBe('minmax(105px, 1fr)');
    });

    it('should build correct template for mixed columns', () => {
      const headers = [
        createMockHeader('expander', 40),
        createMockHeader('notes', 36),
        createMockHeader('timestamp', 105),
        createMockHeader('tier', 40),
        createMockHeader('wave', 55),
        createMockHeader('actions', 40),
      ];

      const result = buildGridTemplateColumns(headers);
      expect(result).toBe(
        '40px 36px minmax(105px, 1fr) minmax(40px, 1fr) minmax(55px, 1fr) 40px'
      );
    });

    it('should handle single content column', () => {
      const headers = [
        createMockHeader('wave', 55),
      ];
      expect(buildGridTemplateColumns(headers)).toBe('minmax(55px, 1fr)');
    });

    it('should handle all fixed columns', () => {
      const headers = [
        createMockHeader('expander', 40),
        createMockHeader('notes', 36),
        createMockHeader('actions', 40),
      ];
      expect(buildGridTemplateColumns(headers)).toBe('40px 36px 40px');
    });

    it('should use exact sizes from getSize()', () => {
      const headers = [
        createMockHeader('tier', 100),
        createMockHeader('wave', 200),
      ];
      expect(buildGridTemplateColumns(headers)).toBe(
        'minmax(100px, 1fr) minmax(200px, 1fr)'
      );
    });
  });
});
