/**
 * Calculator Sidebar
 *
 * Right panel containing collapsible cards for target summary,
 * simulation results, and manual practice mode.
 * Both Monte Carlo and Practice Mode are always visible as separate cards.
 */

import type { CalculatorConfig } from './types';
import type { useModuleConfig } from './configuration/use-module-config';
import type { useSimulationResults } from './results/use-simulation-results';
import type { useManualMode } from './manual-mode/use-manual-mode';
import type { UseCollapseStateResult } from './use-collapse-state';
import { TargetSummaryPanel } from './target-summary/target-summary-panel';
import { ResultsPanel } from './results/results-panel';
import { ManualModePanel, RollLog } from './manual-mode';

interface CalculatorSidebarProps {
  config: ReturnType<typeof useModuleConfig>;
  calculatorConfig: CalculatorConfig;
  simulation: ReturnType<typeof useSimulationResults>;
  manualMode: ReturnType<typeof useManualMode>;
  collapseState: UseCollapseStateResult;
  onRunSimulation: () => void;
}

export function CalculatorSidebar({
  config,
  calculatorConfig,
  simulation,
  manualMode,
  collapseState,
  onRunSimulation,
}: CalculatorSidebarProps) {
  const { isExpanded, toggle } = collapseState;

  return (
    <div className="space-y-3">
      {/* Target Summary */}
      <TargetSummaryPanel
        targets={calculatorConfig.slotTargets}
        bannedEffects={calculatorConfig.bannedEffects}
        preLockedEffects={calculatorConfig.preLockedEffects}
        totalSlots={config.config.slotCount}
        moduleType={config.config.moduleType}
        moduleRarity={config.config.moduleRarity}
        isExpanded={isExpanded.targetSummary}
        onToggle={toggle.targetSummary}
      />

      {/* Monte Carlo Simulation */}
      <ResultsPanel
        results={simulation.results}
        isRunning={simulation.isRunning}
        progress={simulation.progress}
        error={simulation.error}
        config={calculatorConfig}
        confidenceLevel={simulation.confidenceLevel}
        onConfidenceLevelChange={simulation.setConfidenceLevel}
        onRunSimulation={onRunSimulation}
        onCancel={simulation.cancelSimulation}
        isExpanded={isExpanded.simulation}
        onToggle={toggle.simulation}
      />

      {/* Manual Practice Mode */}
      <ManualModePanel
        moduleRarity={config.config.moduleRarity}
        moduleLevel={config.config.moduleLevel}
        slotCount={config.config.slotCount}
        bannedEffects={calculatorConfig.bannedEffects}
        manualMode={manualMode}
        isExpanded={isExpanded.practiceMode}
        onToggle={toggle.practiceMode}
      />

      {/* Roll Log (visible when practice mode is active) */}
      {manualMode.isActive && (
        <RollLog
          minimumLogRarity={manualMode.minimumLogRarity}
          logEntries={manualMode.logEntries}
          onMinimumRarityChange={manualMode.setMinimumLogRarity}
          onClearLog={manualMode.clearLog}
          isExpanded={isExpanded.rollLog}
          onToggle={toggle.rollLog}
        />
      )}
    </div>
  );
}
