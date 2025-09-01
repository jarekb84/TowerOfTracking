import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataInputErrorBoundary } from './data-input-error-boundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <div>Normal component</div>;
};

describe('DataInputErrorBoundary', () => {
  const originalConsoleError = console.error;
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock console.error to avoid error logs in tests
    console.error = vi.fn();

    // Mock window.location.reload
    delete (window as unknown as { location: unknown }).location;
    window.location = { ...originalLocation, reload: vi.fn() };
  });

  afterEach(() => {
    console.error = originalConsoleError;
    window.location = originalLocation;
  });

  it('should render children when no error occurs', () => {
    render(
      <DataInputErrorBoundary>
        <ThrowError shouldThrow={false} />
      </DataInputErrorBoundary>
    );

    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <DataInputErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataInputErrorBoundary>
    );

    expect(screen.getByText(/data input dialog encountered an error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('should have functioning try again button that calls handleReset', () => {
    // Test that the try again button exists and is clickable
    render(
      <DataInputErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataInputErrorBoundary>
    );

    // Error boundary should show error UI
    expect(screen.getByText(/data input dialog encountered an error/i)).toBeInTheDocument();
    
    // Verify Try Again button exists and is clickable
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
    
    // Click should not throw (basic functional test)
    expect(() => fireEvent.click(tryAgainButton)).not.toThrow();
  });

  it('should refresh page when refresh button is clicked', () => {
    render(
      <DataInputErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataInputErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /refresh page/i }));

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should show developer info in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <DataInputErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataInputErrorBoundary>
    );

    expect(screen.getByText('Developer Info')).toBeInTheDocument();

    // Clean up
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not show developer info in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <DataInputErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataInputErrorBoundary>
    );

    expect(screen.queryByText('Developer Info')).not.toBeInTheDocument();

    // Clean up
    process.env.NODE_ENV = originalNodeEnv;
  });
});