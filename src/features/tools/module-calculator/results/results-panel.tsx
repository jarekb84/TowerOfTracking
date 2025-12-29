/**
 * Results Panel
 *
 * Main container for simulation results including cost distribution.
 */

import type { SimulationResults, CalculatorConfig, ConfidenceLevel } from '../types';
import { CostDistributionChart } from './cost-distribution-chart';
import { formatRunCount, generateSimulationSummary } from './results-formatters';
import { CONFIDENCE_LEVELS } from './confidence-level-logic';
import { Button, CollapsibleCard } from '@/components/ui';

interface ResultsPanelProps {
  results: SimulationResults | null;
  isRunning: boolean;
  progress: number;
  error: string | null;
  config: CalculatorConfig;
  confidenceLevel: ConfidenceLevel;
  onConfidenceLevelChange: (level: ConfidenceLevel) => void;
  onRunSimulation: () => void;
  onCancel: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ResultsPanel({
  results,
  isRunning,
  progress,
  error,
  config,
  confidenceLevel,
  onConfidenceLevelChange,
  onRunSimulation,
  onCancel,
  isExpanded,
  onToggle,
}: ResultsPanelProps) {
  const hasTargets = config.slotTargets.length > 0;

  const summary = generateSimulationSummary(
    results ? results.shardCost : null,
    isRunning,
    progress,
    hasTargets
  );

  return (
    <CollapsibleCard
      title="Monte Carlo Simulation"
      summary={summary}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">

      {/* Confidence Selector and Run Button */}
      <div className="flex items-center gap-2">
        <ConfidenceLevelSelector
          value={confidenceLevel}
          onChange={onConfidenceLevelChange}
          disabled={isRunning}
        />
        <RunButton
          isRunning={isRunning}
          hasTargets={hasTargets}
          onRun={onRunSimulation}
          onCancel={onCancel}
        />
      </div>

      {/* Progress Bar */}
      {isRunning && <ProgressBar progress={progress} />}

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Results Content */}
      {results && !isRunning && (
        <>
          <CostDistributionChart
            statistics={results.shardCost}
            histogram={results.shardCostHistogram}
          />
          <div className="mt-4 text-sm text-slate-400 text-center">
            {formatRunCount(results.runCount)}
          </div>
        </>
      )}

      {/* Empty State */}
      {!results && !isRunning && !error && (
        <EmptyState hasTargets={hasTargets} />
      )}
      </div>
    </CollapsibleCard>
  );
}

interface RunButtonProps {
  isRunning: boolean;
  hasTargets: boolean;
  onRun: () => void;
  onCancel: () => void;
}

function RunButton({ isRunning, hasTargets, onRun, onCancel }: RunButtonProps) {
  if (isRunning) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={onCancel}
      >
        Cancel
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={onRun}
      disabled={!hasTargets}
    >
      Run Simulation
    </Button>
  );
}

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Running simulation...</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}


interface EmptyStateProps {
  hasTargets: boolean;
}

function EmptyState({ hasTargets }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-slate-400">
      {hasTargets ? (
        <>
          <p className="text-lg">Ready to simulate</p>
          <p className="text-sm mt-1">
            Click &ldquo;Run Simulation&rdquo; to calculate estimated costs
          </p>
        </>
      ) : (
        <>
          <p className="text-lg">No targets selected</p>
          <p className="text-sm mt-1">
            Select effects and assign priorities to run a simulation
          </p>
        </>
      )}
    </div>
  );
}

interface ConfidenceLevelSelectorProps {
  value: ConfidenceLevel;
  onChange: (level: ConfidenceLevel) => void;
  disabled?: boolean;
}

function ConfidenceLevelSelector({ value, onChange, disabled }: ConfidenceLevelSelectorProps) {
  return (
    <div
      className="inline-flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50"
      role="group"
      aria-label="Confidence level"
    >
      {CONFIDENCE_LEVELS.map((level, index) => {
        const isSelected = value === level.value;
        const isFirst = index === 0;
        const isLast = index === CONFIDENCE_LEVELS.length - 1;

        return (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            disabled={disabled}
            title={level.description}
            aria-pressed={isSelected}
            className={`
              relative px-3 py-1.5 text-xs font-medium transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:z-10
              ${isFirst ? 'rounded-l-md' : ''}
              ${isLast ? 'rounded-r-md' : ''}
              ${isSelected
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/40 border border-transparent'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {level.label}
          </button>
        );
      })}
    </div>
  );
}
