/**
 * Integration test for responsive table behavior
 * Tests the mobile/desktop table switching functionality
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableBody } from './table-body';
import type { ParsedGameRun } from '../../types/game-run.types';

// Mock utility functions 
vi.mock('../../utils/data-parser', () => ({
  formatNumber: (value: number) => value?.toLocaleString() || '-',
  formatDuration: (value: number) => `${Math.floor(value / 3600)}h`,
  calculatePerHour: (amount: number, timeInSeconds: number) => 
    timeInSeconds > 0 ? Math.round((amount / timeInSeconds) * 3600) : 0,
}));

vi.mock('../../utils/field-utils', () => ({
  getFieldValue: (run: ParsedGameRun, field: string) => {
    const fieldMap: Record<string, unknown> = {
      notes: run.notes,
      killedBy: run.killedBy,
    };
    return fieldMap[field];
  },
}));

const createMockRun = (overrides: Partial<ParsedGameRun> = {}): ParsedGameRun => ({
  id: 'test-id',
  timestamp: new Date('2024-01-15T14:30:00Z'),
  tier: 5,
  wave: 1250,
  coinsEarned: 150000,
  cellsEarned: 2500,
  realTime: 7200,
  notes: 'Test notes',
  killedBy: 'Fire Orc',
  ...overrides,
} as ParsedGameRun);

// Create a simplified mock table that matches the expected interface
function createMockTable(data: ParsedGameRun[]) {
  const rows = data.map((item, index) => ({
    id: String(index),
    original: item,
    getIsExpanded: () => false,
    getToggleExpandedHandler: () => () => {},
    getVisibleCells: () => [],
  }));

  return {
    getRowModel: () => ({ rows }),
    getAllColumns: () => [{ id: 'tier' }, { id: 'wave' }],
  };
}

describe('Responsive Table Behavior', () => {
  const mockRemoveRun = vi.fn();

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  }
  
  it('should render both desktop and mobile structures', () => {
    const mockRuns = [createMockRun({ id: '1' })];
    const table = createMockTable(mockRuns);
    
    render(
      <TestWrapper>
        <TableBody table={table} removeRun={mockRemoveRun} />
      </TestWrapper>
    );
    
    // Desktop table structure should be present
    const tableBody = screen.getByRole('rowgroup');
    expect(tableBody).toBeInTheDocument();
    
    // Mobile card container should be present
    const mobileContainer = screen.getByTestId('mobile-cards-container');
    expect(mobileContainer).toBeInTheDocument();
  });

  it('should display card content for mobile view', () => {
    const mockRuns = [
      createMockRun({ 
        id: '1', 
        tier: 5, 
        wave: 1000, 
        coinsEarned: 50000,
        cellsEarned: 1200 
      })
    ];
    const table = createMockTable(mockRuns);
    
    render(
      <TestWrapper>
        <TableBody table={table} removeRun={mockRemoveRun} />
      </TestWrapper>
    );
    
    // Should find card content indicators
    expect(screen.getByText(/T5/)).toBeInTheDocument();
    expect(screen.getByText(/Coins/)).toBeInTheDocument();
    expect(screen.getByText(/Cells/)).toBeInTheDocument();
  });

  it('should handle empty state consistently', () => {
    const table = createMockTable([]);
    
    render(
      <TestWrapper>
        <TableBody table={table} removeRun={mockRemoveRun} />
      </TestWrapper>
    );
    
    // Should show appropriate empty states
    const emptyMessages = screen.getAllByText(/No runs found/);
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('should maintain data consistency across views', () => {
    const testRun = createMockRun({ 
      id: 'consistency-test',
      tier: 8,
      wave: 2500,
      coinsEarned: 150000,
      cellsEarned: 3500,
      killedBy: 'Fire Orc'
    });
    const table = createMockTable([testRun]);
    
    render(
      <TestWrapper>
        <TableBody table={table} removeRun={mockRemoveRun} />
      </TestWrapper>
    );
    
    // Key data should be present in mobile cards
    expect(screen.getByText(/T8/)).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
    expect(screen.getByText(/Fire Orc/)).toBeInTheDocument();
  });
});