"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F2F0EB", display: "grid", placeItems: "center", fontFamily: "Inter, sans-serif" }}>
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>Something went wrong</div>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, marginBottom: 12 }}>Unexpected Error</h1>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>We encountered an unexpected error. Please refresh the page.</p>
              <button onClick={() => this.setState({ hasError: false, error: null })} style={{ padding: "10px 20px", background: "#E8A020", color: "#0A0A0A", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children as React.ReactElement;
  }
}
