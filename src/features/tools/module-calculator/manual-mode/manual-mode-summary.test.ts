/**
 * Manual Mode Summary Tests
 */

import { describe, it, expect } from 'vitest';
import { generatePracticeModeSummary } from './manual-mode-summary';

describe('generatePracticeModeSummary', () => {
  describe('when inactive', () => {
    it('returns "Ready to practice"', () => {
      expect(generatePracticeModeSummary(false, 0, 0)).toBe('Ready to practice');
    });

    it('returns "Ready to practice" even with previous roll data', () => {
      expect(generatePracticeModeSummary(false, 10, 5000)).toBe('Ready to practice');
    });
  });

  describe('when active with no rolls', () => {
    it('returns "Session started"', () => {
      expect(generatePracticeModeSummary(true, 0, 0)).toBe('Session started');
    });
  });

  describe('when active with rolls', () => {
    it('formats singular roll correctly', () => {
      expect(generatePracticeModeSummary(true, 1, 450)).toBe('1 roll | 450 shards');
    });

    it('formats plural rolls correctly', () => {
      expect(generatePracticeModeSummary(true, 5, 2250)).toBe('5 rolls | 2,250 shards');
    });

    it('formats large numbers with locale separators', () => {
      expect(generatePracticeModeSummary(true, 100, 12450)).toBe(
        '100 rolls | 12,450 shards'
      );
    });

    it('handles very large shard counts', () => {
      expect(generatePracticeModeSummary(true, 500, 1234567)).toBe(
        '500 rolls | 1,234,567 shards'
      );
    });
  });
});
