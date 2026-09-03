import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI override */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary — catches unhandled JavaScript errors anywhere in the
 * child component tree and renders a friendly "Something went wrong" fallback
 * instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MainApp />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[SAGE ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-lg shadow-lg p-8 sm:p-12 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-600 text-white flex items-center justify-center rounded-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-red-600 text-white px-2.5 py-1 mb-4">
              <AlertTriangle className="w-3 h-3" />
              Application Error
            </span>

            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
              Something Went Wrong
            </h1>

            <p className="font-sans text-sm text-slate-900/80 max-w-lg mx-auto mb-6">
              An unexpected error occurred while rendering this page. Your
              grievance data is safe — this is a display issue only. Please try
              refreshing or return to the home page.
            </p>

            {/* Error Details (collapsed) */}
            {this.state.error && (
              <details className="mb-6 text-left bg-slate-100 border border-slate-200 rounded-lg p-4">
                <summary className="text-xs font-mono font-bold uppercase text-slate-900 cursor-pointer select-none">
                  Technical Details
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-mono text-red-700 bg-red-50 border border-red-200 p-2 rounded break-words">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-[11px] font-mono text-slate-700 bg-white border border-slate-200 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
