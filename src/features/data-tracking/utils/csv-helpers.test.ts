import { describe, it, expect } from 'vitest';
import { detectDelimiter } from './csv-helpers';

describe('CSV Helpers', () => {
  describe('detectDelimiter', () => {
    it('should detect tab delimiter', () => {
      const line = 'Name\tAge\tCity';
      expect(detectDelimiter(line)).toBe('\t');
    });

    it('should detect comma delimiter', () => {
      const line = 'Name,Age,City';
      expect(detectDelimiter(line)).toBe(',');
    });

    it('should prefer tabs when both are present', () => {
      const line = 'Name\tAge,Occupation\tCity';
      expect(detectDelimiter(line)).toBe('\t');
    });

    it('should default to tab when counts are equal', () => {
      const line = 'Name\tAge,City';
      expect(detectDelimiter(line)).toBe('\t');
    });

    it('should default to tab when no delimiters present', () => {
      const line = 'NoDelimitersHere';
      expect(detectDelimiter(line)).toBe('\t');
    });

    it('should handle empty string', () => {
      expect(detectDelimiter('')).toBe('\t');
    });

    it('should handle line with only tabs', () => {
      const line = '\t\t\t';
      expect(detectDelimiter(line)).toBe('\t');
    });

    it('should handle line with only commas', () => {
      const line = ',,,';
      expect(detectDelimiter(line)).toBe(',');
    });

    it('should handle mixed content with more commas', () => {
      const line = 'Field1,Field2,Field3,Field4';
      expect(detectDelimiter(line)).toBe(',');
    });

    it('should handle real CSV header with tabs', () => {
      const line = 'Date\tTime\tTier\tWave\tCoins Earned';
      expect(detectDelimiter(line)).toBe('\t');
    });

    it('should handle real CSV header with commas', () => {
      const line = 'Date,Time,Tier,Wave,Coins Earned';
      expect(detectDelimiter(line)).toBe(',');
    });

    it('should detect semicolon delimiter', () => {
      const line = 'Name;Age;City';
      expect(detectDelimiter(line)).toBe(';');
    });

    it('should prefer semicolons over commas when more frequent', () => {
      const line = 'Name;Age,Occupation;City';
      expect(detectDelimiter(line)).toBe(';');
    });

    it('should handle real CSV header with semicolons', () => {
      const line = 'Date;Time;Tier;Wave;Coins Earned';
      expect(detectDelimiter(line)).toBe(';');
    });
  });
});
