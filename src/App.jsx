import { useState } from 'react';
import ApiKeyForm from './components/ApiKeyForm';
import Dashboard from './components/Dashboard';
import BinanceAPI from './utils/binanceApi';
import './App.css';


function App() {
  const [binanceApi, setBinanceApi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiSubmit = async ({ apiKey, apiSecret }) => {
    setLoading(true);
    setError(null);

    try {
      const api = new BinanceAPI(apiKey, apiSecret, false, false);
      // Check for futures trading permission before proceeding
      const permissions = await api.checkApiPermissions();
      if (permissions.futures) {
        setBinanceApi(api);
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
    setError(null);
  };

  if (binanceApi) {
    return <Dashboard binanceApi={binanceApi} onLogout={handleLogout} />;
  }

  return (
    <div className="app">
      <ApiKeyForm onSubmit={handleApiSubmit} loading={loading} />
      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
