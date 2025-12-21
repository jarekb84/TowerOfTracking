import { describe, it, expect } from 'vitest';
import {
  formatCost,
  formatCostRange,
  formatPercentage,
  formatProbability,
  formatDiceCost,
  formatRollCount,
  formatExpectedRolls,
  getPercentileColor,
  formatPercentileLabel,
  formatRunCount,
  formatConfidenceMessage,
} from './results-formatters';

describe('results-formatters', () => {
  describe('formatCost', () => {
    it('formats numbers under 1K', () => {
      expect(formatCost(0)).toBe('0');
      expect(formatCost(100)).toBe('100');
      expect(formatCost(999)).toBe('999');
    });

    it('formats thousands with K suffix', () => {
      expect(formatCost(1000)).toBe('1.0K');
      expect(formatCost(1500)).toBe('1.5K');
      expect(formatCost(999999)).toBe('1000.0K');
    });

    it('formats millions with M suffix and 2 decimals', () => {
      expect(formatCost(1000000)).toBe('1.00M');
      expect(formatCost(2500000)).toBe('2.50M');
      expect(formatCost(1580000)).toBe('1.58M');
      expect(formatCost(1660000)).toBe('1.66M');
    });

    it('formats billions with B suffix and 2 decimals', () => {
      expect(formatCost(1000000000)).toBe('1.00B');
      expect(formatCost(3700000000)).toBe('3.70B');
    });
  });

  describe('formatCostRange', () => {
    it('formats range with appropriate suffixes', () => {
      expect(formatCostRange(1000, 5000)).toBe('1.0K - 5.0K');
      expect(formatCostRange(500000, 2000000)).toBe('500.0K - 2.00M');
    });
  });

  describe('formatPercentage', () => {
    it('formats with specified decimals', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(33.333, 2)).toBe('33.33%');
    });
  });

  describe('formatProbability', () => {
    it('formats very small probabilities with 2 decimals', () => {
      expect(formatProbability(0.0003)).toBe('0.03%');
    });

    it('formats small probabilities with 1 decimal', () => {
      expect(formatProbability(0.003)).toBe('0.3%');
      expect(formatProbability(0.001)).toBe('0.1%');
    });

    it('formats larger probabilities with no decimals', () => {
      expect(formatProbability(0.1)).toBe('10%');
      expect(formatProbability(0.462)).toBe('46%');
    });
  });

  describe('formatDiceCost', () => {
    it('formats dice cost with unit', () => {
      expect(formatDiceCost(10)).toBe('10 dice');
      expect(formatDiceCost(1600)).toBe('1.6K dice');
    });
  });

  describe('formatRollCount', () => {
    it('formats roll count', () => {
      expect(formatRollCount(100)).toBe('100 rolls');
      expect(formatRollCount(50000)).toBe('50.0K rolls');
    });
  });

  describe('formatExpectedRolls', () => {
    it('calculates expected rolls from probability', () => {
      expect(formatExpectedRolls(0.1)).toBe('~10 rolls');
      expect(formatExpectedRolls(0.01)).toBe('~100 rolls');
    });

    it('handles zero probability', () => {
      expect(formatExpectedRolls(0)).toBe('∞ rolls');
    });
  });

  describe('getPercentileColor', () => {
    it('returns green for low percentiles (lucky)', () => {
      expect(getPercentileColor(5)).toBe('#22c55e');
      expect(getPercentileColor(10)).toBe('#22c55e');
    });

    it('returns orange for median', () => {
      expect(getPercentileColor(50)).toBe('#f97316');
    });

    it('returns yellow for high percentiles', () => {
      expect(getPercentileColor(75)).toBe('#eab308');
    });

    it('returns red for very high percentiles (unlucky)', () => {
      expect(getPercentileColor(95)).toBe('#ef4444');
    });
  });

  describe('formatPercentileLabel', () => {
    it('formats special percentiles', () => {
      expect(formatPercentileLabel(10)).toBe('10th %ile (lucky)');
      expect(formatPercentileLabel(50)).toBe('Median');
      expect(formatPercentileLabel(95)).toBe('95th %ile (unlucky)');
    });

    it('formats regular percentiles', () => {
      expect(formatPercentileLabel(25)).toBe('25th %ile');
      expect(formatPercentileLabel(75)).toBe('75th %ile');
    });
  });

  describe('formatRunCount', () => {
    it('formats with appropriate suffix', () => {
      expect(formatRunCount(10000)).toBe('Based on 10.0K simulations');
      expect(formatRunCount(1000000)).toBe('Based on 1.00M simulations');
    });
  });

  describe('formatConfidenceMessage', () => {
    it('formats confidence message', () => {
      expect(formatConfidenceMessage(5000000)).toBe(
        '95% of runs cost less than 5.00M shards'
      );
    });
  });
});
