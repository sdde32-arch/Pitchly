import React, { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-app-base p-4">
          <div className="bg-surface-card p-4 rounded-[16px] shadow-xl max-w-2xl w-full border border-red-500/20">
            <h1 className="text-2xl font-bold text-red-500 mb-4 font-display">Something went wrong.</h1>
            <p className="text-text-primary mb-6 font-mono text-sm break-words bg-red-950/20 p-4 rounded-lg border border-red-500/30">
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <details className="mb-6">
                <summary className="text-sm text-text-secondary cursor-pointer mb-2 hover:text-text-primary">View Component Stack</summary>
                <pre className="text-xs text-text-secondary font-mono bg-surface-raised p-4 rounded-lg overflow-auto max-h-60 border border-border-subtle">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-lime text-accent-text rounded-lg font-bold hover:bg-[#95e600] transition"
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.href = '/home';
                }}
                className="px-4 py-2 bg-surface-raised text-text-primary rounded-lg font-medium hover:bg-border-subtle border border-border-subtle transition"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
