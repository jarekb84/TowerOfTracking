/**
 * Module Calculator
 *
 * Main component for the Module Reroll Calculator.
 * Monte Carlo-based cost estimation for module sub-effect rolls.
 */

import { useModuleCalculator } from './use-module-calculator';
import { ModuleConfigPanel } from './configuration/module-config-panel';
import { SubEffectTable } from './sub-effect-table/sub-effect-table';
import { TargetSummaryPanel } from './target-summary/target-summary-panel';
import { ResultsPanel } from './results/results-panel';

export function ModuleCalculator() {
  const {
    config,
    table,
    simulation,
    calculatorConfig,
    runSimulation,
  } = useModuleCalculator('cannon');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader />

      {/* Module Configuration */}
      <ModuleConfigPanel
        moduleType={config.config.moduleType}
        moduleLevel={config.config.moduleLevel}
        moduleRarity={config.config.moduleRarity}
        slotCount={config.config.slotCount}
        onModuleTypeChange={config.setModuleType}
        onModuleLevelChange={config.setModuleLevel}
        onModuleRarityChange={config.setModuleRarity}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sub-Effect Table (2/3 width) */}
        <div className="lg:col-span-2">
          <SubEffectTable
            effects={table.effects}
            availableEffects={table.availableEffects}
            selections={table.selections}
            moduleRarity={config.config.moduleRarity}
            availableSlots={config.availableSlots}
            handleRarityClick={table.handleRarityClick}
            handleSlotToggle={table.handleSlotToggle}
            handleBanToggle={table.handleBanToggle}
            handleLockToggle={table.handleLockToggle}
            getSelection={table.getSelection}
            effectsPerSlot={table.effectsPerSlot}
            slotTargets={table.slotTargets}
            bannedEffects={table.bannedEffects}
            preLockedEffects={table.preLockedEffects}
            lockedCount={table.lockedCount}
            maxLocks={table.maxLocks}
            clearAllSelections={table.clearAllSelections}
          />
        </div>

        {/* Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Target Summary */}
          <TargetSummaryPanel
            targets={calculatorConfig.slotTargets}
            bannedEffects={calculatorConfig.bannedEffects}
            preLockedEffects={calculatorConfig.preLockedEffects}
            totalSlots={config.config.slotCount}
            moduleType={config.config.moduleType}
            moduleRarity={config.config.moduleRarity}
          />

          {/* Results Panel */}
          <ResultsPanel
            results={simulation.results}
            isRunning={simulation.isRunning}
            progress={simulation.progress}
            error={simulation.error}
            config={calculatorConfig}
            confidenceLevel={simulation.confidenceLevel}
            onConfidenceLevelChange={simulation.setConfidenceLevel}
            onRunSimulation={runSimulation}
            onCancel={simulation.cancelSimulation}
          />
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-slate-100">
        Module Reroll Calculator
      </h1>
      <p className="text-sm text-slate-400">
        Monte Carlo simulation for accurate shard cost estimation. Select your
        targets, set minimum rarities, and run the simulation to see expected costs.
      </p>
    </div>
  );
}
