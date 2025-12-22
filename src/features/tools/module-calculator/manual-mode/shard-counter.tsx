/**
 * Shard Counter
 *
 * Displays balance/cost and reroll button for manual mode.
 */

import type { ShardMode } from './types';
import { Button } from '@/components/ui';

interface ShardCounterProps {
  shardMode: ShardMode;
  balance: number;
  rollCost: number;
  rollCount: number;
  balanceStatus: 'normal' | 'warning' | 'critical';
  canRoll: boolean;
  rollDisabledReason: string | null;
  canAutoRoll: boolean;
  autoRollDisabledReason: string | null;
  isAutoRolling: boolean;
  onRoll: () => void;
  onStartAutoRoll: () => void;
  onStopAutoRoll: () => void;
}

export function ShardCounter({
  shardMode,
  balance,
  rollCost,
  rollCount,
  balanceStatus,
  canRoll,
  rollDisabledReason,
  canAutoRoll,
  autoRollDisabledReason,
  isAutoRolling,
  onRoll,
  onStartAutoRoll,
  onStopAutoRoll,
}: ShardCounterProps) {
  return (
    <div className="space-y-4">
      {/* Shard Display */}
      <div className="flex items-center justify-between">
        <ShardDisplay
          shardMode={shardMode}
          balance={balance}
          rollCost={rollCost}
          balanceStatus={balanceStatus}
        />
        <RollCounter count={rollCount} />
      </div>

      {/* Roll Buttons */}
      <div className="flex items-center gap-2">
        <RollButton
          canRoll={canRoll}
          rollDisabledReason={rollDisabledReason}
          isAutoRolling={isAutoRolling}
          onRoll={onRoll}
        />
        <AutoRollButton
          canAutoRoll={canAutoRoll}
          autoRollDisabledReason={autoRollDisabledReason}
          isAutoRolling={isAutoRolling}
          onStartAutoRoll={onStartAutoRoll}
          onStopAutoRoll={onStopAutoRoll}
        />
      </div>
    </div>
  );
}

interface ShardDisplayProps {
  shardMode: ShardMode;
  balance: number;
  rollCost: number;
  balanceStatus: 'normal' | 'warning' | 'critical';
}

function ShardDisplay({
  shardMode,
  balance,
  rollCost,
  balanceStatus,
}: ShardDisplayProps) {
  const balanceClassName = getBalanceClassName(balanceStatus);
  const label = shardMode === 'budget' ? 'Balance' : 'Spent';

  return (
    <div className="flex items-center gap-2.5">
      <ShardIcon />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-slate-500 font-medium">{label}:</span>
          <span className={`text-xl font-bold tabular-nums ${balanceClassName}`}>
            {balance.toLocaleString()}
          </span>
          {shardMode === 'budget' && (
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-slate-600">/</span>
              <span className="text-orange-400/80 tabular-nums font-medium">
                -{rollCost.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 text-xs">
          <span className="text-slate-500">Cost per roll:</span>
          <span className="text-orange-400 tabular-nums font-medium">
            {rollCost.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function getBalanceClassName(status: 'normal' | 'warning' | 'critical'): string {
  switch (status) {
    case 'critical':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    default:
      return 'text-slate-100';
  }
}

function ShardIcon() {
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-500/10 border border-orange-500/20">
      <svg
        className="w-4 h-4 text-orange-400"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

interface RollCounterProps {
  count: number;
}

function RollCounter({ count }: RollCounterProps) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/30 border border-slate-700/50">
      <span className="text-xs text-slate-500">Rolls:</span>
      <span className="text-sm text-slate-200 font-semibold tabular-nums">{count}</span>
    </div>
  );
}

interface RollButtonProps {
  canRoll: boolean;
  rollDisabledReason: string | null;
  isAutoRolling: boolean;
  onRoll: () => void;
}

function RollButton({
  canRoll,
  rollDisabledReason,
  isAutoRolling,
  onRoll,
}: RollButtonProps) {
  return (
    <Button
      variant="default"
      size="sm"
      onClick={onRoll}
      disabled={!canRoll || isAutoRolling}
      title={rollDisabledReason ?? undefined}
      className="flex-1 gap-2"
    >
      <RerollIcon />
      Reroll
    </Button>
  );
}

function RerollIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

interface AutoRollButtonProps {
  canAutoRoll: boolean;
  autoRollDisabledReason: string | null;
  isAutoRolling: boolean;
  onStartAutoRoll: () => void;
  onStopAutoRoll: () => void;
}

function AutoRollButton({
  canAutoRoll,
  autoRollDisabledReason,
  isAutoRolling,
  onStartAutoRoll,
  onStopAutoRoll,
}: AutoRollButtonProps) {
  if (isAutoRolling) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={onStopAutoRoll}
        className="gap-2"
      >
        <StopIcon />
        Stop
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onStartAutoRoll}
      disabled={!canAutoRoll}
      title={autoRollDisabledReason ?? undefined}
      className="gap-2"
    >
      <PlayIcon />
      Auto
    </Button>
  );
}

function PlayIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}
