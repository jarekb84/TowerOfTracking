/**
 * Module Calculator
 *
 * Main component for the Module Reroll Calculator.
 * Monte Carlo-based cost estimation for module sub-effect rolls.
 */

import { useModuleCalculator } from './use-module-calculator';
import { useCollapseState } from './use-collapse-state';
import { ModuleConfigPanel } from './configuration/module-config-panel';
import { SubEffectTable } from './sub-effect-table/sub-effect-table';
import { CalculatorSidebar } from './calculator-sidebar';

export function ModuleCalculator() {
  const calculator = useModuleCalculator('cannon');
  const collapseState = useCollapseState();

  return (
    <div className="space-y-6">
      <PageHeader />
      <ModuleConfigPanel
        moduleType={calculator.config.config.moduleType}
        moduleLevel={calculator.config.config.moduleLevel}
        moduleRarity={calculator.config.config.moduleRarity}
        slotCount={calculator.config.config.slotCount}
        onModuleTypeChange={calculator.config.setModuleType}
        onModuleLevelChange={calculator.config.setModuleLevel}
        onModuleRarityChange={calculator.config.setModuleRarity}
        onReset={calculator.reset}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SubEffectTable
            effects={calculator.table.effects}
            availableEffects={calculator.table.availableEffects}
            selections={calculator.table.selections}
            moduleRarity={calculator.config.config.moduleRarity}
            availableSlots={calculator.config.availableSlots}
            handleRarityClick={calculator.table.handleRarityClick}
            handleSlotToggle={calculator.table.handleSlotToggle}
            handleBanToggle={calculator.table.handleBanToggle}
            handleLockToggle={calculator.table.handleLockToggle}
            getSelection={calculator.table.getSelection}
            effectsPerSlot={calculator.table.effectsPerSlot}
            slotTargets={calculator.table.slotTargets}
            bannedEffects={calculator.table.bannedEffects}
            preLockedEffects={calculator.table.preLockedEffects}
            lockedCount={calculator.table.lockedCount}
            maxLocks={calculator.table.maxLocks}
            clearAllSelections={calculator.table.clearAllSelections}
          />
        </div>
        <CalculatorSidebar
          config={calculator.config}
          calculatorConfig={calculator.calculatorConfig}
          simulation={calculator.simulation}
          manualMode={calculator.manualMode}
          collapseState={collapseState}
          onRunSimulation={calculator.runSimulation}
        />
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
