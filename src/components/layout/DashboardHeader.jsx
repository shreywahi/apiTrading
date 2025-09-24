import { RefreshCw, LogOut, Activity, Sun, Moon, Plus } from 'lucide-react';
import './DashboardHeader.css';
import logo from '../logo.jpg';
import teamImg from '../team.jpg';

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
    // Open the API key form in a new tab, respecting subdirectory (e.g. /apiTrading/)
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
    window.open(base, '_blank');
  };

  return (
    <>
      <header className="dashboard-header">
        <div className="header-content">
          {/* Left section: Logo and Title */}
          <div className="header-left">
            <img src={logo} alt="Logo" className="header-logo" />
          </div>

          {/* Center section: Team image */}
          <div className="header-center">
            <img src={teamImg} alt="Team" className="header-team-img" />
          </div>

          {/* Right section: Add API and Logout */}
          <div className="header-right">
            <button 
              onClick={handleOpenApiForm} 
              className="add-api-btn"
              title="Add another API key"
            >
              <Plus size={14} />
              <span className="btn-text">New API Dashboard</span>
            </button>
            <button onClick={onLogout} className="logout-btn">
              <LogOut size={14} />
              <span className="btn-text">Logout</span>
            </button>
          </div>
        </div>
      </header>
      
      <div className="mobile-bottom-bar mobile-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="mobile-theme-btn"
          title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span className="mobile-btn-text">Theme</span>
        </button>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span 
            className={`auto-refresh-indicator ${autoRefreshActive ? 'active' : 'paused'}`}
            onClick={toggleAutoRefresh}
            title={autoRefreshActive ? 'Auto-refresh active - click to pause' : 'Auto-refresh paused - click to resume'}
            style={{ marginBottom: 4 }}
          >
            <Activity size={10} />
            {autoRefreshActive ? 'Live' : 'Paused'}
          </span>
        </div>

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
