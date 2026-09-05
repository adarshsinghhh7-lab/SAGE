import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

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
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
          <div className="max-w-2xl w-full bg-surface border border-line-strong p-8 sm:p-12 text-center paper-grain rounded-2xl shadow-lift">
            <div className="w-16 h-16 mx-auto mb-6 bg-clay text-surface flex items-center justify-center rounded-full"><AlertTriangle className="w-8 h-8" /></div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-clay-soft text-clay-deep px-2.5 py-1 mb-4 rounded-full border border-clay-deep/20"><AlertTriangle className="w-3 h-3" /> Application Error</span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-3">Something Went Wrong</h1>
            <p className="text-sm text-ink-soft max-w-lg mx-auto mb-6">An unexpected error occurred while rendering this page. Your grievance data is safe — this is a display issue only.</p>
            {this.state.error && (
              <details className="mb-6 text-left bg-ink border border-line-strong p-4 rounded-xl">
                <summary className="text-xs font-mono font-bold uppercase text-surface cursor-pointer select-none">Technical Details</summary>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-mono text-clay-deep bg-clay-soft border border-clay-deep/30 p-2 rounded break-words"><strong>Error:</strong> {this.state.error.message}</div>
                  {this.state.errorInfo && <div className="text-[11px] font-mono text-surface/70 bg-moss-deep border border-line-strong p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>}
                </div>
              </details>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button type="button" onClick={this.handleRetry} className="w-full sm:w-auto px-6 py-3 bg-bronze text-moss-deep hover:bg-bronze-deep text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-bronze cursor-pointer flex items-center justify-center gap-2 transition-all shadow-soft"><RefreshCw className="w-4 h-4" /><span>Try Again</span></button>
              <button type="button" onClick={() => { window.location.hash = ''; window.location.reload(); }} className="w-full sm:w-auto px-6 py-3 bg-transparent text-ink-soft hover:text-ink text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-line-strong hover:border-ink-soft transition-colors cursor-pointer flex items-center justify-center gap-2"><span>Reload Application</span></button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
