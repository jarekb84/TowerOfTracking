/**
 * Manual Mode Panel
 *
 * Main container for the manual practice mode.
 * Note: RollLog is rendered separately as its own collapsible card.
 */

import type { Rarity } from '@/shared/domain/module-data';
import type { UseManualModeResult } from './use-manual-mode';
import type { ShardMode } from './types';
import { generatePracticeModeSummary } from './manual-mode-summary';
import { BannedEffectsDisplay } from '../banned-effects-display';
import { ModuleHeader } from './module-header';
import { EffectSlotsTable } from './effect-slots';
import { ShardCounter } from './shard-counter';
import { Button, CollapsibleCard } from '@/components/ui';

interface ManualModePanelProps {
  moduleRarity: Rarity;
  moduleLevel: number;
  slotCount: number;
  bannedEffects: string[];
  manualMode: UseManualModeResult;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ManualModePanel({
  moduleRarity,
  moduleLevel,
  slotCount,
  bannedEffects,
  manualMode,
  isExpanded,
  onToggle,
}: ManualModePanelProps) {
  const maxLocks = Math.max(0, slotCount - 1);

  const summary = generatePracticeModeSummary(
    manualMode.isActive,
    manualMode.state?.rollCount ?? 0,
    manualMode.state?.totalSpent ?? 0
  );

  if (!manualMode.isActive) {
    return (
      <CollapsibleCard
        title="Manual Practice Mode"
        summary={summary}
        isExpanded={isExpanded}
        onToggle={onToggle}
      >
        <InactiveContent onActivate={manualMode.activate} />
      </CollapsibleCard>
    );
  }

  if (!manualMode.state) {
    return null;
  }

  const lockedCount = manualMode.state.slots.filter((s) => s.isLocked).length;

  return (
    <CollapsibleCard
      title="Manual Practice Mode"
      summary={summary}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        <ActiveHeader onReset={manualMode.reset} onExit={manualMode.deactivate} />

        {/* Module Info Section */}
        <div className="border-t border-slate-700/30 pt-3">
          <ModuleHeader
            moduleRarity={moduleRarity}
            moduleLevel={moduleLevel}
          />
        </div>

        {/* Completion State */}
        {manualMode.state.isComplete && (
          <CompletionBanner
            totalSpent={manualMode.state.totalSpent}
            rollCount={manualMode.state.rollCount}
          />
        )}

        {/* Effect Slots Section */}
        <div className="border-t border-slate-700/30 pt-3">
          <EffectSlotsTable
            slots={manualMode.state.slots}
            onLockSlot={manualMode.lockSlot}
            onUnlockSlot={manualMode.unlockSlot}
            maxLocks={maxLocks}
            lockedCount={lockedCount}
          />
        </div>

        {/* Banned Effects */}
        <BannedEffectsDisplay bannedEffectIds={bannedEffects} />

        {/* Actions Section */}
        <div className="border-t border-slate-700/30 pt-3">
          <ShardCounter
            shardMode={manualMode.state.shardMode}
            balance={manualMode.currentBalance}
            rollCost={manualMode.currentRollCost}
            rollCount={manualMode.state.rollCount}
            balanceStatus={manualMode.balanceStatus}
            canRoll={manualMode.canRoll}
            rollDisabledReason={manualMode.rollDisabledReason}
            canAutoRoll={manualMode.canAutoRollNow}
            autoRollDisabledReason={manualMode.autoRollDisabledReason}
            isAutoRolling={manualMode.state.isAutoRolling}
            onRoll={manualMode.roll}
            onStartAutoRoll={manualMode.startAutoRoll}
            onStopAutoRoll={manualMode.stopAutoRoll}
          />
        </div>
      </div>
    </CollapsibleCard>
  );
}

interface InactiveContentProps {
  onActivate: (shardMode: ShardMode, startingBalance?: number) => void;
}

interface ActiveHeaderProps {
  onReset: () => void;
  onExit: () => void;
}

function ActiveHeader({ onReset, onExit }: ActiveHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="ghost" size="compact" onClick={onReset} className="text-slate-400 hover:text-slate-200">
        <ResetIcon />
        Reset
      </Button>
      <Button variant="ghost" size="compact" onClick={onExit} className="text-slate-400 hover:text-red-400">
        <ExitIcon />
        Exit
      </Button>
    </div>
  );
}

function InactiveContent({ onActivate }: InactiveContentProps) {
  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-orange-500/10 border border-orange-500/20">
          <DiceIcon />
        </div>
        <p className="text-sm text-slate-400">
          Practice rolling manually to build intuition for module costs
        </p>
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => onActivate('accumulator', 0)}
          className="w-full gap-2"
        >
          <CountUpIcon />
          Start Practicing (Count Up)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onActivate('budget', 10000)}
          className="w-full gap-2"
        >
          <BudgetIcon />
          Start with Budget (10,000)
        </Button>
      </div>
    </div>
  );
}

function DiceIcon() {
  return (
    <svg className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CountUpIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

interface CompletionBannerProps {
  totalSpent: number;
  rollCount: number;
}

function CompletionBanner({ totalSpent, rollCount }: CompletionBannerProps) {
  return (
    <div className="p-4 bg-green-500/8 border border-green-500/25 rounded-lg">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30">
          <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <div>
          <span className="text-green-400 font-semibold">Session Complete!</span>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-400">
            <span>
              <span className="text-slate-200 font-medium tabular-nums">{totalSpent.toLocaleString()}</span> shards
            </span>
            <span className="text-slate-600">|</span>
            <span>
              <span className="text-slate-200 font-medium tabular-nums">{rollCount}</span> rolls
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

