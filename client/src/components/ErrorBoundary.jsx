import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error ? String(this.state.error) : 'Unknown Error'}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
