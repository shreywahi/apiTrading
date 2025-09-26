import { useState } from 'react';

import ApiKeyForm from './components/ApiKeyForm';
import ApiAccountLoginCard from './components/ApiAccountLoginCard';
import Dashboard from './components/Dashboard';
import BinanceAPI from './utils/binanceApi';
import './App.css';

const ACCOUNTS_KEY = 'binanceAccounts';
function getStoredAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  } catch {
    return [];
  }
}
function setStoredAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}



function App() {
  const [binanceApi, setBinanceApi] = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardKey, setDashboardKey] = useState(0);
  const [dashboardVisible, setDashboardVisible] = useState(true);

  const handleApiSubmit = async ({ nickname, apiKey, apiSecret }) => {
    setLoading(true);
    setError(null);

    try {
      const api = new BinanceAPI(apiKey, apiSecret, false, false);
      // Check for futures trading permission before proceeding
      const permissions = await api.checkApiPermissions();
      if (permissions.futures) {
        // Save to localStorage if not already present
        let accounts = getStoredAccounts();
        let accountObj = { nickname, apiKey, apiSecret };
        if (!accounts.some(acc => acc.apiKey === apiKey && acc.apiSecret === apiSecret)) {
          accounts = [...accounts, accountObj];
          setStoredAccounts(accounts);
        } else {
          // If already exists, get the stored nickname
          accountObj = accounts.find(acc => acc.apiKey === apiKey && acc.apiSecret === apiSecret);
        }
        setBinanceApi(api);
        setActiveAccount(accountObj);
      } else {
        setError('API Key does not have Futures trading permission enabled. Please check your API settings on Binance.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to validate API credentials: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setBinanceApi(null);
    setActiveAccount(null);
    setError(null);
  };

  const accounts = getStoredAccounts();

  // Handler for seamless account switch from Dashboard
  const handleSwitchAccount = async (acc) => {
    setLoading(true);
    setError(null);
    // Force Dashboard to unmount
    setDashboardVisible(false);
    setBinanceApi(null);
    setActiveAccount(null);
    // Wait for unmount
    await new Promise(resolve => setTimeout(resolve, 50));
    setDashboardKey(prev => prev + 1);
    let errorOccurred = false;
    try {
      let accounts = getStoredAccounts();
      let accountObj = accounts.find(a => a.apiKey === acc.apiKey && a.apiSecret === acc.apiSecret) || acc;
      const api = new BinanceAPI(accountObj.apiKey, accountObj.apiSecret, false, false);
      const permissions = await api.checkApiPermissions();
      if (permissions.futures) {
        setBinanceApi(api);
        setActiveAccount(accountObj);
      } else {
        setError('API Key does not have Futures trading permission enabled. Please check your API settings on Binance.');
        errorOccurred = true;
      }
    } catch (err) {
      setError('Failed to validate API credentials: ' + err.message);
      errorOccurred = true;
    } finally {
      setDashboardVisible(true);
      setLoading(false);
    }
  };


  if (binanceApi && dashboardVisible) {
    return <Dashboard
      key={dashboardKey}
      binanceApi={binanceApi}
      activeAccount={activeAccount}
      onLogout={handleLogout}
      onSwitchAccount={handleSwitchAccount}
    />;
  }

  // Handler for login from ApiAccountLoginCard inside ApiKeyForm
  const handleLoginAccount = async (acc) => {
    setLoading(true);
    setError(null);
    try {
      const api = new BinanceAPI(acc.apiKey, acc.apiSecret, false, false);
      const permissions = await api.checkApiPermissions();
      if (permissions.futures) {
        setBinanceApi(api);
        setActiveAccount(acc);
      } else {
        setError('API Key does not have Futures trading permission enabled. Please check your API settings on Binance.');
      }
    } catch (err) {
      setError('Failed to validate API credentials: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <ApiKeyForm
        onSubmit={handleApiSubmit}
        loading={loading}
        accounts={accounts}
        onLoginAccount={handleLoginAccount}
      />
      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
