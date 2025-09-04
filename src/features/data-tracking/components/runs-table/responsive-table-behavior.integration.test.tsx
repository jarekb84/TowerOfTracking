/**
 * Integration test for responsive table behavior
 * Tests the mobile/desktop table switching functionality
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualizedTableBody } from './virtualized-table-body';
import type { ParsedGameRun } from '../../types/game-run.types';
import type { Table } from '@tanstack/react-table';
import { useRef } from 'react';

// Mock utility functions 
vi.mock('../../utils/data-parser', () => ({
  formatNumber: (value: number) => value?.toLocaleString() || '-',
  formatDuration: (value: number) => `${Math.floor(value / 3600)}h`,
  calculatePerHour: (amount: number, timeInSeconds: number) => 
    timeInSeconds > 0 ? Math.round((amount / timeInSeconds) * 3600) : 0,
}));

vi.mock('../../utils/field-utils', () => ({
  getFieldValue: (run: ParsedGameRun, fieldName: string) => {
    const field = run.fields?.[fieldName];
    return field ? field.value : undefined;
  },
}));

// Mock @tanstack/react-virtual to always render all items in tests
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 200,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
      key: index,
      index,
      start: index * 200,
      size: 200,
    })),
  }),
}));

const createMockRun = (overrides: Partial<ParsedGameRun> = {}): ParsedGameRun => ({
  id: 'test-id',
  timestamp: new Date('2024-01-15T14:30:00Z'),
  tier: 5,
  wave: 1250,
  coinsEarned: 150000,
  cellsEarned: 2500,
  realTime: 7200,
  runType: 'farm',
  fields: {
    notes: {
      value: 'Test notes',
      rawValue: 'Test notes',
      displayValue: 'Test notes',
      originalKey: 'notes',
      dataType: 'string'
    },
    killedBy: {
      value: 'Fire Orc',
      rawValue: 'Fire Orc',
      displayValue: 'Fire Orc',
      originalKey: 'killedBy',
      dataType: 'string'
    },
    ...overrides.fields
  },
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

  function VirtualizedTestComponent({ 
    table, 
    variant, 
    removeRun 
  }: { 
    table: ReturnType<typeof createMockTable>; 
    variant: 'desktop' | 'mobile'; 
    removeRun: (id: string) => void; 
  }) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <div 
        ref={containerRef} 
        style={{ height: '400px', width: '100%', overflow: 'auto' }}
      >
        {variant === 'desktop' ? (
          <table>
            <VirtualizedTableBody 
              table={(table as unknown) as Table<ParsedGameRun>} 
              removeRun={removeRun} 
              variant={variant}
            />
          </table>
        ) : (
          <VirtualizedTableBody 
            table={(table as unknown) as Table<ParsedGameRun>} 
            removeRun={removeRun} 
            variant={variant}
          />
        )}
      </div>
    );
  }
  
  it('should render desktop view with variant="desktop"', () => {
    const mockRuns = [createMockRun({ id: '1' })];
    const table = createMockTable(mockRuns);
    
    render(
      <VirtualizedTestComponent 
        table={table} 
        removeRun={mockRemoveRun} 
        variant="desktop" 
      />
    );
    
    // Desktop table structure should be present
    const tableBody = screen.getByRole('rowgroup');
    expect(tableBody).toBeInTheDocument();
  });

  it('should render mobile view with variant="mobile"', () => {
    const mockRuns = [createMockRun({ id: '1' })];
    const table = createMockTable(mockRuns);
    
    render(
      <VirtualizedTestComponent 
        table={table} 
        removeRun={mockRemoveRun} 
        variant="mobile" 
      />
    );
    
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
      <VirtualizedTestComponent 
        table={table} 
        removeRun={mockRemoveRun} 
        variant="mobile" 
      />
    );
    
    // Should find card content indicators
    expect(screen.getByText(/T5/)).toBeInTheDocument();
    expect(screen.getByText(/Coins/)).toBeInTheDocument();
    expect(screen.getByText(/Cells/)).toBeInTheDocument();
  });

  it('should handle empty state consistently', () => {
    const table = createMockTable([]);
    
    render(
      <VirtualizedTestComponent 
        table={table} 
        removeRun={mockRemoveRun} 
        variant="desktop" 
      />
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
      fields: {
        killedBy: {
          value: 'Fire Orc',
          rawValue: 'Fire Orc',
          displayValue: 'Fire Orc',
          originalKey: 'killedBy',
          dataType: 'string'
        }
      }
    });
    const table = createMockTable([testRun]);
    
    render(
      <VirtualizedTestComponent 
        table={table} 
        removeRun={mockRemoveRun} 
        variant="mobile" 
      />
    );
    
    // Key data should be present in mobile cards
    expect(screen.getByText(/T8/)).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
    expect(screen.getByText(/Fire Orc/)).toBeInTheDocument();
  });
});