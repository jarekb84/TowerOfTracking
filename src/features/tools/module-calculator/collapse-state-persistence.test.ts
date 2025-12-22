/**
 * Collapse State Persistence Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadCollapseState,
  saveCollapseState,
  getDefaultCollapseState,
  type CollapseState,
} from './collapse-state-persistence';

describe('collapse-state-persistence', () => {
  const STORAGE_KEY = 'tower-tracking-module-calc-collapse-state';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getDefaultCollapseState', () => {
    it('returns all sections expanded except rollLog', () => {
      const defaults = getDefaultCollapseState();

      expect(defaults).toEqual({
        targetSummary: true,
        simulation: true,
        practiceMode: true,
        rollLog: false,
      });
    });
  });

  describe('loadCollapseState', () => {
    it('returns defaults when no stored state exists', () => {
      const state = loadCollapseState();
      expect(state).toEqual(getDefaultCollapseState());
    });

    it('loads valid stored state', () => {
      const stored: CollapseState = {
        targetSummary: false,
        simulation: true,
        practiceMode: false,
        rollLog: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      const state = loadCollapseState();
      expect(state).toEqual(stored);
    });

    it('returns defaults for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid{');

      const state = loadCollapseState();
      expect(state).toEqual(getDefaultCollapseState());
    });

    it('returns defaults for partial state missing fields', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ targetSummary: true })
      );

      const state = loadCollapseState();
      expect(state).toEqual(getDefaultCollapseState());
    });

    it('returns defaults for state with wrong types', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          targetSummary: 'yes',
          simulation: true,
          practiceMode: true,
          rollLog: false,
        })
      );

      const state = loadCollapseState();
      expect(state).toEqual(getDefaultCollapseState());
    });
  });

  describe('saveCollapseState', () => {
    it('saves state to localStorage', () => {
      const state: CollapseState = {
        targetSummary: false,
        simulation: false,
        practiceMode: true,
        rollLog: true,
      };

      saveCollapseState(state);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual(state);
    });

    it('overwrites existing state', () => {
      saveCollapseState({
        targetSummary: true,
        simulation: true,
        practiceMode: true,
        rollLog: true,
      });

      saveCollapseState({
        targetSummary: false,
        simulation: false,
        practiceMode: false,
        rollLog: false,
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.targetSummary).toBe(false);
      expect(stored.simulation).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('correctly saves and loads state', () => {
      const originalState: CollapseState = {
        targetSummary: false,
        simulation: true,
        practiceMode: false,
        rollLog: true,
      };

      saveCollapseState(originalState);
      const loadedState = loadCollapseState();

      expect(loadedState).toEqual(originalState);
    });
  });
});
