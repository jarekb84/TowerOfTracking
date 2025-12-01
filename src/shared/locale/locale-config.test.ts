import { describe, it, expect } from 'vitest';
import { DATE_FORMAT_CONFIGS, MONTH_MAPPINGS } from './locale-config';

describe('locale-config', () => {
  describe('DATE_FORMAT_CONFIGS', () => {
    it('should have month-first config', () => {
      const config = DATE_FORMAT_CONFIGS['month-first'];
      expect(config.label).toBeDefined();
      expect(config.example).toMatch(/Nov/);
    });

    it('should have month-first-lowercase config', () => {
      const config = DATE_FORMAT_CONFIGS['month-first-lowercase'];
      expect(config.label).toBeDefined();
      expect(config.example).toMatch(/nov\./);
    });
  });

  describe('MONTH_MAPPINGS', () => {
    describe('month-first', () => {
      it('should map standard month abbreviations', () => {
        const mappings = MONTH_MAPPINGS['month-first'];
        expect(mappings['jan']).toBe(0);
        expect(mappings['feb']).toBe(1);
        expect(mappings['mar']).toBe(2);
        expect(mappings['apr']).toBe(3);
        expect(mappings['may']).toBe(4);
        expect(mappings['jun']).toBe(5);
        expect(mappings['jul']).toBe(6);
        expect(mappings['aug']).toBe(7);
        expect(mappings['sep']).toBe(8);
        expect(mappings['oct']).toBe(9);
        expect(mappings['nov']).toBe(10);
        expect(mappings['dec']).toBe(11);
      });
    });

    describe('month-first-lowercase', () => {
      it('should map standard lowercase abbreviations', () => {
        const mappings = MONTH_MAPPINGS['month-first-lowercase'];
        expect(mappings['jan']).toBe(0);
        expect(mappings['nov']).toBe(10);
        expect(mappings['dec']).toBe(11);
      });

      it('should map abbreviations with periods', () => {
        const mappings = MONTH_MAPPINGS['month-first-lowercase'];
        expect(mappings['jan.']).toBe(0);
        expect(mappings['nov.']).toBe(10);
        expect(mappings['dec.']).toBe(11);
      });

      it('should map French month abbreviations', () => {
        const mappings = MONTH_MAPPINGS['month-first-lowercase'];
        expect(mappings['janv.']).toBe(0);
        expect(mappings['févr.']).toBe(1);
        expect(mappings['mars']).toBe(2);
        expect(mappings['avr.']).toBe(3);
        expect(mappings['mai']).toBe(4);
        expect(mappings['juin']).toBe(5);
        expect(mappings['juil.']).toBe(6);
        expect(mappings['août']).toBe(7);
        expect(mappings['sept.']).toBe(8);
        expect(mappings['déc.']).toBe(11);
      });

      it('should map German month abbreviations', () => {
        const mappings = MONTH_MAPPINGS['month-first-lowercase'];
        expect(mappings['jän']).toBe(0);
        expect(mappings['jän.']).toBe(0);
        expect(mappings['mär']).toBe(2);
        expect(mappings['mär.']).toBe(2);
        expect(mappings['okt']).toBe(9);
        expect(mappings['okt.']).toBe(9);
        expect(mappings['dez']).toBe(11);
        expect(mappings['dez.']).toBe(11);
      });
    });
  });
});
