import React from 'react';
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
    <header className="dashboard-header">
      <div className="header-content">
        {/* Left section: Logo, Title, and Pause indicator */}
        <div className="header-left">
          <img src="public/logo.jpg" alt="Logo" className="header-logo" />
          <h1>Trading Dashboard</h1>
          <span 
            className={`auto-refresh-indicator ${autoRefreshActive ? 'active' : 'paused'}`} 
            onClick={toggleAutoRefresh}
            title={autoRefreshActive ? 'Auto-refresh active - click to pause' : 'Auto-refresh paused - click to resume'}
          >
            <Activity size={10} />
            {autoRefreshActive ? 'Live' : 'Paused'}
          </span>
        </div>

        {/* Center section: Refresh, Theme, Currency */}
        <div className="header-center">
          <button 
            onClick={handleManualRefresh} 
            className={`refresh-btn ${autoRefreshTimer <= 3 && autoRefreshActive ? 'urgent' : ''}`}
            disabled={refreshing}
            title={autoRefreshActive ? `Auto-refresh in ${autoRefreshTimer}s` : 'Auto-refresh paused - manual refresh only'}
          >
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
            <span className="btn-text">{refreshing ? 'Refreshing...' : autoRefreshActive ? `Refresh (${autoRefreshTimer}s)` : 'Refresh'}</span>
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="theme-toggle-btn"
            title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <select 
            value={displayCurrency} 
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="currency-selector"
            title="Select display currency"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="INR">INR (₹)</option>
          </select>
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
  );
};

export default DashboardHeader;
