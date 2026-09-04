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
        <div className="min-h-screen flex items-center justify-center bg-[#14171F] px-4">
          <div className="max-w-2xl w-full bg-[#1E2230] border border-[#2A2F3E] p-8 sm:p-12 text-center paper-grain">
            <div className="w-16 h-16 mx-auto mb-6 bg-[#A6352C] text-[#E8DFC8] flex items-center justify-center"><AlertTriangle className="w-8 h-8" /></div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#A6352C] text-[#E8DFC8] px-2.5 py-1 mb-4"><AlertTriangle className="w-3 h-3" /> Application Error</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8DFC8] mb-3">Something Went Wrong</h1>
            <p className="text-sm text-[#E8DFC8]/70 max-w-lg mx-auto mb-6">An unexpected error occurred while rendering this page. Your grievance data is safe — this is a display issue only.</p>
            {this.state.error && (
              <details className="mb-6 text-left bg-[#0B0C0F] border border-[#2A2F3E] p-4">
                <summary className="text-xs font-mono font-bold uppercase text-[#E8DFC8] cursor-pointer select-none">Technical Details</summary>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-mono text-[#A6352C] bg-[#14171F] border border-[#A6352C]/30 p-2 break-words"><strong>Error:</strong> {this.state.error.message}</div>
                  {this.state.errorInfo && <div className="text-[11px] font-mono text-[#E8DFC8]/70 bg-[#14171F] border border-[#2A2F3E] p-2 max-h-40 overflow-auto whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>}
                </div>
              </details>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button type="button" onClick={this.handleRetry} className="w-full sm:w-auto px-6 py-3 bg-[#B08D3E] text-[#14171F] text-xs font-mono font-bold uppercase tracking-wider border border-[#B08D3E] cursor-pointer flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /><span>Try Again</span></button>
              <button type="button" onClick={() => { window.location.hash = ''; window.location.reload(); }} className="w-full sm:w-auto px-6 py-3 bg-transparent text-[#E8DFC8] text-xs font-mono font-bold uppercase tracking-wider border border-[#2A2F3E] hover:border-[#5B6472] transition-colors cursor-pointer flex items-center justify-center gap-2"><span>Reload Application</span></button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
