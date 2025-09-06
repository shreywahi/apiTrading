import { RefreshCw, LogOut } from 'lucide-react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, onRetry, onLogout }) => {
  return (
    <div className="dashboard-error">
      <div className="error-content">
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={onRetry} className="retry-btn">
            <RefreshCw size={16} />
            Retry
          </button>
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={16} />
            Change API Keys
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
