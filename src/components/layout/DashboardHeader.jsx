import { Activity, LogOut, User, Sun, Moon, Plus } from 'lucide-react';
import './DashboardHeader.css';
import logo from '../logo.jpg';
import teamImg from '../team.jpg';


const DashboardHeader = ({
  darkMode,
  setDarkMode,
  autoRefreshActive,
  toggleAutoRefresh,
  displayCurrency,
  setDisplayCurrency,
  onLogout,
  onOpenAccountManager,
  nickname
}) => {

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

          {/* Right section: Manage API and Logout */}
          <div className="header-right">
            <button 
              onClick={onOpenAccountManager}
              className="add-api-btn"
              title="Manage APIs"
            >
              <User size={18} className="manage-api-icon" />
              <span className="btn-text">{nickname ? `${nickname} - Manage APIs` : 'Manage APIs'}</span>
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
          <button
            className="mobile-theme-btn"
            onClick={toggleAutoRefresh}
            title={autoRefreshActive ? 'Auto-refresh active - click to pause' : 'Auto-refresh paused - click to resume'}
            style={{ background: autoRefreshActive ? 'rgba(34,197,94,0.2)' : 'rgba(255,193,7,0.8)', color: 'white', fontWeight: 600 }}
          >
            <Activity size={16} />
            <span className="mobile-btn-text">{autoRefreshActive ? 'Live' : 'Paused'}</span>
          </button>
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
