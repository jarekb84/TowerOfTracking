import { describe, it, expect } from 'vitest';
import { getEstimatedRowHeight, getOverscan } from './virtualization-config';

describe('virtualization-config', () => {
  describe('getEstimatedRowHeight', () => {
    describe('desktop variant', () => {
      it('should return collapsed row height when not expanded', () => {
        expect(getEstimatedRowHeight('desktop', false)).toBe(52);
      });

      it('should return expanded row height when expanded', () => {
        expect(getEstimatedRowHeight('desktop', true)).toBe(400);
      });
    });

    describe('mobile variant', () => {
      it('should return collapsed card height when not expanded', () => {
        expect(getEstimatedRowHeight('mobile', false)).toBe(180);
      });

      it('should return expanded card height when expanded', () => {
        expect(getEstimatedRowHeight('mobile', true)).toBe(500);
      });
    });
  });

  describe('getOverscan', () => {
    it('should return desktop overscan value', () => {
      expect(getOverscan('desktop')).toBe(5);
    });

    it('should return mobile overscan value', () => {
      expect(getOverscan('mobile')).toBe(3);
    });
  });
});
