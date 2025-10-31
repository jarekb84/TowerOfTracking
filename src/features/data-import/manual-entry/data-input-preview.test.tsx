import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataInputPreview } from './data-input-preview';
import { ParsedGameRun } from '../../data-tracking/types/game-run.types';

const mockPreviewData: ParsedGameRun = {
  id: 'test-id',
  timestamp: new Date('2024-01-15T14:30:00.000Z'),
  runType: 'farm' as const,
  tier: 10,
  wave: 5881,
  realTime: 28566, // 7h 46m 6s in seconds
  coinsEarned: 1130000000000, // 1.13T
  cellsEarned: 45200, // 45.2K
  fields: {
    tier: {
      value: 10,
      rawValue: '10',
      displayValue: 'T10',
      originalKey: 'Tier',
      dataType: 'number'
    },
    wave: {
      value: 5881,
      rawValue: '5881',
      displayValue: '5,881',
      originalKey: 'Wave',
      dataType: 'number'
    },
    realTime: {
      value: 28566,
      rawValue: '7h 46m 6s',
      displayValue: '7h 46m 6s',
      originalKey: 'Real Time',
      dataType: 'duration'
    },
    coinsEarned: {
      value: 1130000000000,
      rawValue: '1.13T',
      displayValue: '1.13T',
      originalKey: 'Coins Earned',
      dataType: 'number'
    },
    cellsEarned: {
      value: 45200,
      rawValue: '45.2K',
      displayValue: '45.2K',
      originalKey: 'Cells Earned',
      dataType: 'number'
    }
  }
};

describe('DataInputPreview', () => {
  it('should display preview with key stats', () => {
    render(
      <DataInputPreview 
        previewData={mockPreviewData} 
        selectedRunType="farm"
      />
    );

    // Verify header elements
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText("Here's how your data will be interpreted")).toBeInTheDocument();

    // Verify key stats are displayed
    expect(screen.getByText('Key Stats')).toBeInTheDocument();
    expect(screen.getByText('Farm')).toBeInTheDocument();
    expect(screen.getByText('7h 56m 6s')).toBeInTheDocument(); // formatDuration result for 28566 seconds
    expect(screen.getByText('10')).toBeInTheDocument(); // formatTierLabel shows raw value
    expect(screen.getByText('5.9K')).toBeInTheDocument(); // formatNumber result for 5881
    expect(screen.getByText('1.1T')).toBeInTheDocument(); // formatNumber result for 1.13T
    expect(screen.getByText('45.2K')).toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalData: ParsedGameRun = {
      ...mockPreviewData,
      realTime: 0,
      wave: 0,
      coinsEarned: 0,
      cellsEarned: 0
    };

    render(
      <DataInputPreview 
        previewData={minimalData} 
        selectedRunType="tournament"
      />
    );

    expect(screen.getByText('Tournament')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText('7h 56m 6s')).not.toBeInTheDocument();
    expect(screen.queryByText('5.9K')).not.toBeInTheDocument();
  });

  it('should display per-hour calculations for earnings', () => {
    render(
      <DataInputPreview 
        previewData={mockPreviewData} 
        selectedRunType="farm"
      />
    );

    // Should show per-hour calculations in parentheses for both coins and cells
    const perHourElements = screen.getAllByText(/\/hr\)/);
    expect(perHourElements).toHaveLength(2); // One for coins, one for cells
    expect(screen.getByText('(142.4B/hr)')).toBeInTheDocument();
    expect(screen.getByText('(5.7K/hr)')).toBeInTheDocument();
  });
});