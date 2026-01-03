/**
 * Spending Planner Component
 *
 * Main entry component for the spending planner feature.
 * Assembles income configuration, event queue, and timeline visualization.
 */

import { useSpendingPlannerState } from './use-spending-planner-state'
import { IncomePanel } from './income/income-panel'
import { EventQueuePanel } from './events/event-queue-panel'
import { TimelinePanel } from './timeline/timeline-panel'

export function SpendingPlanner() {
  const {
    state,
    timelineData,
    income,
    eventQueue,
    timeline,
    toggleIncomePanel,
    handleToggleCurrency,
    handleAddEvent,
    handleRemoveEvent,
    handleEditEvent,
    handleCloneEvent,
    handleDrop,
  } = useSpendingPlannerState()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Spending Planner</h1>
        <p className="text-sm text-slate-400 mt-1">
          Plan when you can afford tower upgrades, mastery unlocks, and labs.
        </p>
      </div>

      {/* Income Configuration */}
      <IncomePanel
        incomes={state.incomes}
        stoneBreakdown={state.stoneIncomeBreakdown}
        gemBreakdown={state.gemIncomeBreakdown}
        enabledCurrencies={state.enabledCurrencies}
        isCollapsed={state.incomePanelCollapsed}
        onToggleCollapse={toggleIncomePanel}
        onToggleCurrency={handleToggleCurrency}
        onBalanceChange={income.updateBalance}
        onWeeklyIncomeChange={income.updateWeeklyIncome}
        onGrowthRateChange={income.updateGrowthRate}
        onStoneBreakdownChange={income.updateStoneBreakdown}
        onGemBreakdownChange={income.updateGemBreakdown}
      />

      {/* Event Queue */}
      <EventQueuePanel
        events={state.events}
        enabledCurrencies={state.enabledCurrencies}
        draggedIndex={eventQueue.draggedIndex}
        draggedOverIndex={eventQueue.draggedOverIndex}
        onDragStart={eventQueue.handleDragStart}
        onDragEnter={eventQueue.handleDragEnter}
        onDragEnd={handleDrop}
        onAddEvent={handleAddEvent}
        onRemoveEvent={handleRemoveEvent}
        onEditEvent={handleEditEvent}
        onCloneEvent={handleCloneEvent}
      />

      {/* Timeline Visualization */}
      <TimelinePanel
        timelineData={timelineData}
        enabledCurrencies={state.enabledCurrencies}
        config={timeline.config}
        weekOptions={timeline.weekOptions}
        startDate={timeline.startDate}
        onWeeksChange={timeline.setWeeks}
      />
    </div>
  )
}
