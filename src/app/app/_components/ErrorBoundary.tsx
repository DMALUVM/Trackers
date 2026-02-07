"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: Send to Sentry when integrated
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="card p-6 text-center space-y-3">
          <p className="text-lg">😵</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Something went wrong
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            type="button"
            className="btn-secondary text-xs py-2 px-4"
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
