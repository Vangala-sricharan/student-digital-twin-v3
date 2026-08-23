import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  featureName?: string;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[ErrorBoundary caught error in ${this.props.featureName || 'Component'}]:`,
        error,
        errorInfo
      );
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
          <Card className="p-6 sm:p-8 border-rose-500/30 bg-rose-950/10 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Something went wrong with this feature.
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected error occurred while rendering{' '}
                {this.props.featureName ? `the ${this.props.featureName}` : 'this section'}. Your other
                data and navigation remain intact.
              </p>
              {process.env.NODE_ENV !== 'production' && this.state.error?.message && (
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-left font-mono text-[11px] text-rose-400 overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <Button
              id="error-boundary-retry-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
