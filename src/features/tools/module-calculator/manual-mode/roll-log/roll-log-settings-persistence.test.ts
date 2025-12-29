import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDefaultRollLogSettings,
  loadRollLogSettings,
  saveRollLogSettings,
} from './roll-log-settings-persistence';

describe('roll-log-settings-persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getDefaultRollLogSettings', () => {
    it('returns default settings with showTargetMatches true', () => {
      const defaults = getDefaultRollLogSettings();
      expect(defaults).toEqual({
        showTargetMatches: true,
      });
    });
  });

  describe('loadRollLogSettings', () => {
    it('returns default settings when nothing is stored', () => {
      const settings = loadRollLogSettings();
      expect(settings).toEqual(getDefaultRollLogSettings());
    });

    it('returns stored settings when valid', () => {
      const stored = { showTargetMatches: true };
      localStorage.setItem(
        'tower-tracking-module-calc-roll-log-settings',
        JSON.stringify(stored)
      );

      const settings = loadRollLogSettings();
      expect(settings).toEqual({ showTargetMatches: true });
    });

    it('returns defaults when stored data is invalid', () => {
      localStorage.setItem(
        'tower-tracking-module-calc-roll-log-settings',
        JSON.stringify({ invalid: 'data' })
      );

      const settings = loadRollLogSettings();
      expect(settings).toEqual(getDefaultRollLogSettings());
    });

    it('returns defaults when stored data is not JSON', () => {
      localStorage.setItem(
        'tower-tracking-module-calc-roll-log-settings',
        'not json'
      );

      const settings = loadRollLogSettings();
      expect(settings).toEqual(getDefaultRollLogSettings());
    });

    it('returns defaults when showTargetMatches is not a boolean', () => {
      localStorage.setItem(
        'tower-tracking-module-calc-roll-log-settings',
        JSON.stringify({ showTargetMatches: 'yes' })
      );

      const settings = loadRollLogSettings();
      expect(settings).toEqual(getDefaultRollLogSettings());
    });
  });

  describe('saveRollLogSettings', () => {
    it('saves settings to localStorage', () => {
      const settings = { showTargetMatches: true };
      saveRollLogSettings(settings);

      const stored = localStorage.getItem('tower-tracking-module-calc-roll-log-settings');
      expect(JSON.parse(stored!)).toEqual(settings);
    });

    it('handles localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => saveRollLogSettings({ showTargetMatches: true })).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
