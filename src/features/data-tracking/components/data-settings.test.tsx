import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataSettings } from './data-settings';
import { useDataSettings } from '../hooks/use-data-settings';

// Mock the useDataSettings hook
vi.mock('../hooks/use-data-settings', () => ({
  useDataSettings: vi.fn(),
}));

const mockUseDataSettings = vi.mocked(useDataSettings);

describe('DataSettings', () => {
  const mockHandlers = {
    runsCount: 5,
    isClearing: false,
    error: null,
    showSuccess: false,
    canClear: true,
    handleClearAllData: vi.fn(),
    dismissError: vi.fn(),
    dismissSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDataSettings.mockReturnValue(mockHandlers);
  });

  it('should render with runs count and clear button', () => {
    render(<DataSettings />);
    
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Stored Game Runs')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear All Data' })).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('should show loading state when clearing', () => {
    mockUseDataSettings.mockReturnValue({
      ...mockHandlers,
      isClearing: true,
      canClear: false,
    });

    render(<DataSettings />);
    
    const clearButton = screen.getByRole('button', { name: 'Clearing Data...' });
    expect(clearButton).toBeDisabled();
  });

  it('should disable clear button when no runs exist', () => {
    mockUseDataSettings.mockReturnValue({
      ...mockHandlers,
      runsCount: 0,
      canClear: false,
    });

    render(<DataSettings />);
    
    expect(screen.getByText('Stored Game Runs')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    const clearButton = screen.getByRole('button', { name: 'Clear All Data' });
    expect(clearButton).toBeDisabled();
  });

  it('should show success message when data is cleared', () => {
    mockUseDataSettings.mockReturnValue({
      ...mockHandlers,
      showSuccess: true,
    });

    render(<DataSettings />);
    
    expect(screen.getByText('Successfully cleared all data from local storage.')).toBeInTheDocument();
  });

  it('should show error message when clear operation fails', () => {
    const errorMessage = 'Failed to clear storage';
    mockUseDataSettings.mockReturnValue({
      ...mockHandlers,
      error: errorMessage,
    });

    render(<DataSettings />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});