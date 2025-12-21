/* eslint-disable max-lines-per-function, max-statements */
/**
 * Manual Mode Hook
 *
 * Orchestrates manual mode state, providing actions for UI interaction
 * and computed values for display.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Rarity } from '@/shared/domain/module-data';
import type { CalculatorConfig } from '../types';
import type { ManualModeState, ShardMode, ManualModeConfig } from './types';
import {
  initializeManualMode,
  executeRoll,
  lockSlot,
  unlockSlot,
  canRoll,
  canAutoRoll,
  getCurrentRollCost,
  getCurrentBalance,
  checkCompletion,
  markComplete,
  setAutoRolling,
  getBalanceStatus,
  buildMinRarityMap,
} from './manual-mode-logic';

const AUTO_ROLL_DELAY_MS = 100;

export interface UseManualModeResult {
  /** Current manual mode state (null if inactive) */
  state: ManualModeState | null;

  /** Whether manual mode is currently active */
  isActive: boolean;

  // Actions
  /** Activate manual mode with the specified shard mode and optional starting balance */
  activate: (shardMode: ShardMode, startingBalance?: number) => void;

  /** Execute a single roll */
  roll: () => void;

  /** Lock a specific slot */
  lockSlot: (slotNumber: number) => void;

  /** Unlock a specific slot */
  unlockSlot: (slotNumber: number) => void;

  /** Start auto-rolling until target hit or completion */
  startAutoRoll: () => void;

  /** Stop auto-rolling */
  stopAutoRoll: () => void;

  /** Reset the current session (keeps mode active) */
  reset: () => void;

  /** Deactivate manual mode completely */
  deactivate: () => void;

  // Computed values
  /** Whether manual rolling is currently allowed */
  canRoll: boolean;

  /** Reason rolling is disabled (null if allowed) */
  rollDisabledReason: string | null;

  /** Whether auto-rolling is currently allowed (requires unfulfilled targets) */
  canAutoRollNow: boolean;

  /** Reason auto-roll is disabled (null if allowed) */
  autoRollDisabledReason: string | null;

  /** Current cost per roll */
  currentRollCost: number;

  /** Current balance (remaining in budget mode, spent in accumulator mode) */
  currentBalance: number;

  /** Balance status for UI styling */
  balanceStatus: 'normal' | 'warning' | 'critical';
}

export function useManualMode(
  config: CalculatorConfig,
  onLockEffect: (effectId: string, rarity: Rarity) => void,
  onUnlockEffect: (effectId: string) => void
): UseManualModeResult {
  const [state, setState] = useState<ManualModeState | null>(null);
  const [lastShardMode, setLastShardMode] = useState<ShardMode>('accumulator');
  const [lastStartingBalance, setLastStartingBalance] = useState<number>(0);
  const autoRollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build mode config from calculator config
  const modeConfig = useMemo<ManualModeConfig>(
    () => ({
      targets: config.slotTargets,
      minRarityMap: buildMinRarityMap(config.slotTargets),
    }),
    [config.slotTargets]
  );

  // Reset state when key config values change
  useEffect(() => {
    if (state) {
      // Reset when module type, rarity, or slot count changes
      setState(null);
      stopAutoRollInternal();
    }
  }, [config.moduleType, config.moduleRarity, config.slotCount]);

  const stopAutoRollInternal = useCallback(() => {
    if (autoRollIntervalRef.current) {
      clearInterval(autoRollIntervalRef.current);
      autoRollIntervalRef.current = null;
    }
    if (state) {
      setState((prev) => (prev ? setAutoRolling(prev, false) : null));
    }
  }, [state]);

  // Cleanup auto-roll on unmount
  useEffect(() => {
    return () => {
      if (autoRollIntervalRef.current) {
        clearInterval(autoRollIntervalRef.current);
      }
    };
  }, []);

  const activate = useCallback(
    (shardMode: ShardMode, startingBalance: number = 0) => {
      setLastShardMode(shardMode);
      setLastStartingBalance(startingBalance);
      const newState = initializeManualMode(config, shardMode, startingBalance);
      setState(newState);
    },
    [config]
  );

  const roll = useCallback(() => {
    if (!state) return;

    const rollCheck = canRoll(state);
    if (!rollCheck.allowed) return;

    const { newState, result } = executeRoll(state, modeConfig);

    // Check for completion
    if (checkCompletion(newState, config.slotTargets)) {
      setState(markComplete(newState));
      stopAutoRollInternal();
      return;
    }

    setState(newState);

    // If auto-rolling and we hit a target, stop
    if (state.isAutoRolling && result.hasTargetHit) {
      stopAutoRollInternal();
    }
  }, [state, modeConfig, config.slotTargets, stopAutoRollInternal]);

  const handleLockSlot = useCallback(
    (slotNumber: number) => {
      if (!state) return;

      const slot = state.slots[slotNumber - 1];
      if (!slot?.effect || slot.isLocked) return;

      const newState = lockSlot(state, slotNumber);
      setState(newState);

      // Notify parent for bidirectional sync
      onLockEffect(slot.effect.id, slot.rarity!);

      // Check for completion after locking
      if (checkCompletion(newState, config.slotTargets)) {
        setState(markComplete(newState));
        stopAutoRollInternal();
      }
    },
    [state, onLockEffect, config.slotTargets, stopAutoRollInternal]
  );

  const handleUnlockSlot = useCallback(
    (slotNumber: number) => {
      if (!state) return;

      const slot = state.slots[slotNumber - 1];
      if (!slot?.isLocked || !slot.effect) return;

      const newState = unlockSlot(state, slotNumber, config);
      setState(newState);

      // Notify parent for bidirectional sync
      onUnlockEffect(slot.effect.id);
    },
    [state, config, onUnlockEffect]
  );

  const startAutoRoll = useCallback(() => {
    if (!state || state.isAutoRolling) return;

    // Check if auto-roll is allowed (has unfulfilled targets)
    const autoRollCheck = canAutoRoll(state, config.slotTargets);
    if (!autoRollCheck.allowed) return;

    setState((prev) => (prev ? setAutoRolling(prev, true) : null));

    autoRollIntervalRef.current = setInterval(() => {
      setState((currentState) => {
        if (!currentState || !currentState.isAutoRolling) {
          if (autoRollIntervalRef.current) {
            clearInterval(autoRollIntervalRef.current);
            autoRollIntervalRef.current = null;
          }
          return currentState;
        }

        // Check if auto-roll should continue (unfulfilled targets remain)
        const autoCheck = canAutoRoll(currentState, config.slotTargets);
        if (!autoCheck.allowed) {
          if (autoRollIntervalRef.current) {
            clearInterval(autoRollIntervalRef.current);
            autoRollIntervalRef.current = null;
          }
          // Mark complete if all targets acquired, otherwise just stop
          if (checkCompletion(currentState, config.slotTargets)) {
            return markComplete(setAutoRolling(currentState, false));
          }
          return setAutoRolling(currentState, false);
        }

        const { newState, result } = executeRoll(currentState, modeConfig);

        // Stop on target hit (let user decide to lock)
        if (result.hasTargetHit) {
          if (autoRollIntervalRef.current) {
            clearInterval(autoRollIntervalRef.current);
            autoRollIntervalRef.current = null;
          }
          return setAutoRolling(newState, false);
        }

        return newState;
      });
    }, AUTO_ROLL_DELAY_MS);
  }, [state, modeConfig, config.slotTargets]);

  const stopAutoRoll = useCallback(() => {
    stopAutoRollInternal();
  }, [stopAutoRollInternal]);

  const reset = useCallback(() => {
    stopAutoRollInternal();
    const newState = initializeManualMode(config, lastShardMode, lastStartingBalance);
    setState(newState);
  }, [config, lastShardMode, lastStartingBalance, stopAutoRollInternal]);

  const deactivate = useCallback(() => {
    stopAutoRollInternal();
    setState(null);
  }, [stopAutoRollInternal]);

  // Computed values
  const canRollResult = useMemo(() => (state ? canRoll(state) : { allowed: false, reason: null }), [state]);

  const canAutoRollResult = useMemo(
    () => (state ? canAutoRoll(state, config.slotTargets) : { allowed: false, reason: null }),
    [state, config.slotTargets]
  );

  const currentRollCost = useMemo(() => (state ? getCurrentRollCost(state) : 0), [state]);

  const currentBalance = useMemo(() => (state ? getCurrentBalance(state) : 0), [state]);

  const balanceStatus = useMemo(() => (state ? getBalanceStatus(state) : 'normal'), [state]);

  return {
    state,
    isActive: state !== null,
    activate,
    roll,
    lockSlot: handleLockSlot,
    unlockSlot: handleUnlockSlot,
    startAutoRoll,
    stopAutoRoll,
    reset,
    deactivate,
    canRoll: canRollResult.allowed,
    rollDisabledReason: canRollResult.reason,
    canAutoRollNow: canAutoRollResult.allowed,
    autoRollDisabledReason: canAutoRollResult.reason,
    currentRollCost,
    currentBalance,
    balanceStatus,
  };
}
