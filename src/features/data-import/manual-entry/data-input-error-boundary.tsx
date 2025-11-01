import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui';

interface DataInputErrorBoundaryProps {
  children: ReactNode;
}

interface DataInputErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

/**
 * Error boundary specifically for the DataInput dialog system
 * Provides graceful degradation if dialog state management fails
 */
export class DataInputErrorBoundary extends Component<
  DataInputErrorBoundaryProps,
  DataInputErrorBoundaryState
> {
  constructor(props: DataInputErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<DataInputErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('DataInput Error Boundary caught an error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <Alert className="mb-4">
              <AlertDescription>
                The data input dialog encountered an error and couldn&apos;t be displayed. 
                You can try refreshing the page or contact support if this persists.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Developer Info
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // Add key to force React to remount children after error recovery
    return (
      <div key={this.state.retryCount}>
        {this.props.children}
      </div>
    );
  }
}