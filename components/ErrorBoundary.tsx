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
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0D", padding: "16px", color: "#FFFFFF", fontFamily: "'Sora', sans-serif" }}>
          <div style={{ backgroundColor: "#161616", padding: "24px", borderRadius: "16px", maxWidth: "600px", width: "100%", border: "1px solid rgba(239, 68, 68, 0.3)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "22px", fontWeight: "900", color: "#EF4444" }}>Pitchly Error Recovery</span>
            </div>
            <p style={{ color: "#F4F4F5", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)", wordBreak: "break-word" }}>
              {this.state.error ? this.state.error.toString() : "An unexpected render issue occurred."}
            </p>
            {this.state.errorInfo && (
              <details style={{ marginBottom: "16px" }}>
                <summary style={{ fontSize: "12px", color: "#A1A1AA", cursor: "pointer", marginBottom: "8px" }}>Component Stack</summary>
                <pre style={{ fontSize: "11px", color: "#A1A1AA", backgroundColor: "#202020", padding: "12px", borderRadius: "8px", overflow: "auto", maxHeight: "160px" }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('pitchly_last_user');
                  } catch (e) {}
                  window.location.reload();
                }}
                style={{ padding: "10px 18px", backgroundColor: "#A8FF00", color: "#0D0D0D", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer", fontSize: "13px" }}
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.hash = "#/onboarding";
                  window.location.reload();
                }}
                style={{ padding: "10px 18px", backgroundColor: "#262626", color: "#FFFFFF", border: "1px solid #383838", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
              >
                Reset to Onboarding
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
