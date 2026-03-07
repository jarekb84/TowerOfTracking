import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { TierTrendsControls } from './tier-trends-controls'
import { RunType } from '@/shared/domain/run-types/types'
import { Duration, TrendsAggregation } from '../types'
import type { TierTrendsFilters } from '../types'

describe('TierTrendsControls', () => {
  const defaultFilters: TierTrendsFilters = {
    tier: 0,
    duration: Duration.PER_RUN,
    quantity: 4,
    aggregationType: TrendsAggregation.AVERAGE
  }

  const availableTiers = [1, 2, 3, 4, 5]
  const availableDurations = [Duration.PER_RUN, Duration.DAILY, Duration.WEEKLY, Duration.MONTHLY, Duration.YEARLY]
  const periodCountOptions = [2, 3, 4, 5, 6, 7]
  const periodCountLabel = 'Last Runs'

  it('renders all control groups', () => {
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    expect(screen.getByText(/Tier/i)).toBeInTheDocument()
    expect(screen.getByText(/Duration/i)).toBeInTheDocument()
    expect(screen.getByText(/Last Runs/i)).toBeInTheDocument()
  })

  it('shows aggregation selector with Actual and Per Hour options when duration is per-run', () => {
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    // Aggregation selector should be visible
    expect(screen.getByText(/Aggregation/i)).toBeInTheDocument()

    // Should show Actual and Per Hour options for per-run
    expect(screen.getByRole('button', { name: 'Actual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Per Hour' })).toBeInTheDocument()
  })

  it('shows aggregation selector with all options when duration is not per-run', () => {
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    const filtersWithDailyDuration: TierTrendsFilters = {
      ...defaultFilters,
      duration: Duration.DAILY
    }

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={filtersWithDailyDuration}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    expect(screen.getByText(/Aggregation/i)).toBeInTheDocument()

    // Should show all 5 aggregation options for time-based durations
    expect(screen.getByRole('button', { name: 'Sum' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Avg' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Min' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Max' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Per Hour' })).toBeInTheDocument()
  })

  it('defaults aggregation to sum when switching from per-run to daily', async () => {
    const user = userEvent.setup()
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    // Click the Daily button
    const dailyButton = screen.getByRole('button', { name: 'Daily' })
    await user.click(dailyButton)

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      duration: Duration.DAILY,
      aggregationType: TrendsAggregation.SUM
    })
  })

  it('defaults aggregation to sum when switching from per-run to weekly', async () => {
    const user = userEvent.setup()
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    const weeklyButton = screen.getByRole('button', { name: 'Weekly' })
    await user.click(weeklyButton)

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      duration: Duration.WEEKLY,
      aggregationType: TrendsAggregation.SUM
    })
  })

  it('defaults aggregation to sum when switching from per-run to monthly', async () => {
    const user = userEvent.setup()
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    const monthlyButton = screen.getByRole('button', { name: 'Monthly' })
    await user.click(monthlyButton)

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      duration: Duration.MONTHLY,
      aggregationType: TrendsAggregation.SUM
    })
  })

  it('preserves existing aggregation when switching between daily/weekly/monthly', async () => {
    const user = userEvent.setup()
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    const filtersWithDailyAndMax: TierTrendsFilters = {
      ...defaultFilters,
      duration: Duration.DAILY,
      aggregationType: TrendsAggregation.MAX
    }

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={filtersWithDailyAndMax}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    const weeklyButton = screen.getByRole('button', { name: 'Weekly' })
    await user.click(weeklyButton)

    // Should preserve 'max' aggregation type
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filtersWithDailyAndMax,
      duration: Duration.WEEKLY,
      aggregationType: TrendsAggregation.MAX
    })
  })

  it('preserves existing aggregation when switching back to per-run', async () => {
    const user = userEvent.setup()
    const onRunTypeChange = vi.fn()
    const onFiltersChange = vi.fn()

    const filtersWithDaily: TierTrendsFilters = {
      ...defaultFilters,
      duration: Duration.DAILY,
      aggregationType: TrendsAggregation.SUM
    }

    render(
      <TierTrendsControls
        runTypeFilter={RunType.FARM}
        onRunTypeChange={onRunTypeChange}
        filters={filtersWithDaily}
        onFiltersChange={onFiltersChange}
        availableTiers={availableTiers}
        availableDurations={availableDurations}
        periodCountOptions={periodCountOptions}
        periodCountLabel={periodCountLabel}
      />
    )

    const perRunButton = screen.getByRole('button', { name: 'Per Run' })
    await user.click(perRunButton)

    // Should preserve 'sum' even though it won't be used
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filtersWithDaily,
      duration: Duration.PER_RUN,
      aggregationType: TrendsAggregation.SUM
    })
  })
})
