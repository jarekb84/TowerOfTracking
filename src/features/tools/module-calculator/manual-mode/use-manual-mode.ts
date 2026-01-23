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
import type { ManualModeState, ShardMode, ManualModeConfig, RollLogEntry } from './types';
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
  getLockedEffectIds,
  areTargetsEqual,
  syncRemainingTargetsWithConfig,
} from './manual-mode-logic';
import { processRollForLogging } from './roll-log';
import {
  loadRollLogSettings,
  saveRollLogSettings,
} from './roll-log/roll-log-settings-persistence';

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

  // Roll Log
  /** Whether roll logging is enabled */
  logEnabled: boolean;

  /** Minimum rarity threshold for logging */
  minimumLogRarity: Rarity;

  /** Current log entries */
  logEntries: RollLogEntry[];

  /** Whether to show target match indicators ("what may have been") */
  showTargetMatches: boolean;

  /** Toggle log enabled state */
  setLogEnabled: (enabled: boolean) => void;

  /** Set minimum rarity threshold for logging */
  setMinimumLogRarity: (rarity: Rarity) => void;

  /** Toggle showing target match indicators */
  setShowTargetMatches: (show: boolean) => void;

  /** Clear all log entries */
  clearLog: () => void;
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

  // Roll log settings (kept separate from state to avoid re-render on every roll)
  const [logEnabled, setLogEnabled] = useState(true);
  const [minimumLogRarity, setMinimumLogRarityInternal] = useState<Rarity>(config.moduleRarity);
  // Show target match indicators ("what may have been") - persisted in localStorage
  const [showTargetMatches, setShowTargetMatchesInternal] = useState(() => {
    return loadRollLogSettings().showTargetMatches;
  });
  // Track if user has manually customized the rarity filter
  const hasCustomizedLogRarity = useRef(false);
  // Use ref to access current log settings in auto-roll interval
  const logSettingsRef = useRef({ logEnabled, minimumLogRarity });
  logSettingsRef.current = { logEnabled, minimumLogRarity };

  // Sync minimumLogRarity with moduleRarity when it changes (unless user customized)
  useEffect(() => {
    if (!hasCustomizedLogRarity.current) {
      setMinimumLogRarityInternal(config.moduleRarity);
    }
  }, [config.moduleRarity]);

  // Wrapper to track user customization
  const setMinimumLogRarity = useCallback((rarity: Rarity) => {
    hasCustomizedLogRarity.current = true;
    setMinimumLogRarityInternal(rarity);
  }, []);

  // Wrapper that persists to localStorage
  const setShowTargetMatches = useCallback((show: boolean) => {
    setShowTargetMatchesInternal(show);
    saveRollLogSettings({ showTargetMatches: show });
  }, []);

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

  // Sync remainingTargets when slotTargets config changes mid-session
  // This handles the case where user changes target rarity or adds/removes targets
  // while manual mode is active
  useEffect(() => {
    if (!state) return;

    const lockedEffectIds = getLockedEffectIds(state);
    const preLockedEffectIds = config.preLockedEffects.map((e) => e.effectId);
    const syncedTargets = syncRemainingTargetsWithConfig(
      config.slotTargets,
      lockedEffectIds,
      preLockedEffectIds
    );

    // Only update if there's an actual difference (prevent infinite loops)
    if (!areTargetsEqual(state.remainingTargets, syncedTargets)) {
      setState((prev) => (prev ? { ...prev, remainingTargets: syncedTargets } : null));
    }
  }, [config.slotTargets, config.preLockedEffects, state]);

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

    // Process logging and update state with any new log entries
    const updatedLogEntries = processRollForLogging({
      slots: result.slots,
      filledSlotIndexes: result.filledSlotIndexes,
      rollNumber: newState.rollCount,
      totalSpent: newState.totalSpent,
      rollCost: result.shardCost,
      logEntries: newState.logEntries,
      minimumLogRarity,
      logEnabled,
    });
    const stateWithLog = { ...newState, logEntries: updatedLogEntries };

    // Check for completion
    if (checkCompletion(stateWithLog, config.slotTargets)) {
      setState(markComplete(stateWithLog));
      stopAutoRollInternal();
      return;
    }

    setState(stateWithLog);

    // If auto-rolling and we hit a CURRENT PRIORITY target, stop
    // (Only stop for targets we're actively rolling for, not future priority targets)
    if (state.isAutoRolling && result.hasCurrentPriorityHit) {
      stopAutoRollInternal();
    }
  }, [state, modeConfig, config.slotTargets, stopAutoRollInternal, logEnabled, minimumLogRarity]);

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

        // Process logging (use ref for current settings to avoid stale closures)
        const { logEnabled: currentLogEnabled, minimumLogRarity: currentMinRarity } = logSettingsRef.current;
        const updatedLogEntries = processRollForLogging({
          slots: result.slots,
          filledSlotIndexes: result.filledSlotIndexes,
          rollNumber: newState.rollCount,
          totalSpent: newState.totalSpent,
          rollCost: result.shardCost,
          logEntries: newState.logEntries,
          minimumLogRarity: currentMinRarity,
          logEnabled: currentLogEnabled,
        });
        const stateWithLog = { ...newState, logEntries: updatedLogEntries };

        // Stop on CURRENT PRIORITY target hit (let user decide to lock)
        // Only stop for targets in the current priority group, not future priorities
        if (result.hasCurrentPriorityHit) {
          if (autoRollIntervalRef.current) {
            clearInterval(autoRollIntervalRef.current);
            autoRollIntervalRef.current = null;
          }
          return setAutoRolling(stateWithLog, false);
        }

        return stateWithLog;
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
    // Reset log rarity customization so it syncs with module rarity again
    hasCustomizedLogRarity.current = false;
    setMinimumLogRarityInternal(config.moduleRarity);
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

  // Log entries from state
  const logEntries = useMemo(() => (state ? state.logEntries : []), [state]);

  // Clear log entries
  const clearLog = useCallback(() => {
    setState((prev) => (prev ? { ...prev, logEntries: [] } : null));
  }, []);

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
    // Roll log
    logEnabled,
    minimumLogRarity,
    logEntries,
    showTargetMatches,
    setLogEnabled,
    setMinimumLogRarity,
    setShowTargetMatches,
    clearLog,
  };
}
