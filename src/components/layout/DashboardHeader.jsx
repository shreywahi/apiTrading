import { RefreshCw, LogOut, Activity, Sun, Moon, Plus } from 'lucide-react';
import './DashboardHeader.css';

const DashboardHeader = ({
  darkMode,
  setDarkMode,
  handleManualRefresh,
  refreshing,
  autoRefreshTimer,
  autoRefreshActive,
  toggleAutoRefresh,
  displayCurrency,
  setDisplayCurrency,
  onLogout
}) => {
  
  const handleOpenApiForm = () => {
    // Open the API key form in a new tab
    window.open(window.location.origin, '_blank');
  };

  return (
    <>
      <header className="dashboard-header">
        <div className="header-content">
          {/* Left section: Logo, Title, and Pause indicator */}
          <div className="header-left">
            <img src="/logo.jpg" alt="Logo" className="header-logo" />
            <span 
              className={`auto-refresh-indicator ${autoRefreshActive ? 'active' : 'paused'}`} 
              onClick={toggleAutoRefresh}
              title={autoRefreshActive ? 'Auto-refresh active - click to pause' : 'Auto-refresh paused - click to resume'}
            >
              <Activity size={10} />
              {autoRefreshActive ? 'Live' : 'Paused'}
            </span>
          </div>

          {/* Right section: Add API and Logout */}
          <div className="header-right">
            <button 
              onClick={handleOpenApiForm} 
              className="add-api-btn"
              title="Add another API key"
            >
              <Plus size={14} />
              <span className="btn-text">Add API</span>
            </button>
            <button onClick={onLogout} className="logout-btn">
              <LogOut size={14} />
              <span className="btn-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar - only visible on small screens */}
      <div className="mobile-bottom-bar mobile-only">
        <button 
          onClick={handleManualRefresh} 
          className={`mobile-refresh-btn ${autoRefreshTimer <= 3 && autoRefreshActive ? 'urgent' : ''}`}
          disabled={refreshing}
          title={autoRefreshActive ? `Auto-refresh in ${autoRefreshTimer}s` : 'Auto-refresh paused - manual refresh only'}
        >
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          <span className="mobile-btn-text">{refreshing ? 'Refreshing' : autoRefreshActive ? `${autoRefreshTimer}s` : 'Refresh'}</span>
        </button>

        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="mobile-theme-btn"
          title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span className="mobile-btn-text">Theme</span>
        </button>

        <select 
          value={displayCurrency} 
          onChange={(e) => setDisplayCurrency(e.target.value)}
          className="mobile-currency-selector"
          title="Select display currency"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="INR">INR</option>
        </select>
      </div>
    </>
  );
};

export default DashboardHeader;
