import React from 'react';

class TradingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Trading component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="trading-section">
          <div className="trading-error">
            <div className="error-content">
              <h3>⚠️ Trading Center Error</h3>
              <p>Something went wrong loading the trading interface.</p>
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="retry-button"
              >
                Retry
              </button>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default TradingErrorBoundary;
