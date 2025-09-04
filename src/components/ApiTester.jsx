import { useState } from 'react';
import { TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import BinanceAPI from '../utils/binanceApi';
import './ApiTester.css';

const ApiTester = ({ apiKey, apiSecret }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    const api = new BinanceAPI(apiKey, apiSecret, false, false);
    const testResults = [];

    // Test 1: Basic connectivity
    try {
      testResults.push({ test: 'Basic Connectivity', status: 'running', message: 'Testing connection...' });
      setResults([...testResults]);
      
      await api.makeRequest('/api/v3/account');
      testResults[testResults.length - 1] = { 
        test: 'Basic Connectivity', 
        status: 'success', 
        message: 'Successfully connected to Binance API' 
      };
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Basic Connectivity', 
        status: 'error', 
        message: `Failed: ${error.message}` 
      };
    }
    setResults([...testResults]);

    // Test 2: Account permissions
    try {
      testResults.push({ test: 'Account Permissions', status: 'running', message: 'Checking account access...' });
      setResults([...testResults]);
      
      const accountInfo = await api.makeRequest('/api/v3/account');
      testResults[testResults.length - 1] = { 
        test: 'Account Permissions', 
        status: 'success', 
        message: `Account type: ${accountInfo.accountType}, Can trade: ${accountInfo.canTrade}` 
      };
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Account Permissions', 
        status: 'error', 
        message: `Failed: ${error.message}` 
      };
    }
    setResults([...testResults]);

    // Test 3: Futures account access
    try {
      testResults.push({ test: 'Futures Access', status: 'running', message: 'Testing futures account...' });
      setResults([...testResults]);
      
      const futuresInfo = await api.getFuturesAccountInfo();
      testResults[testResults.length - 1] = { 
        test: 'Futures Access', 
        status: 'success', 
        message: futuresInfo ? 'Futures account accessible' : 'Futures account not enabled' 
      };
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Futures Access', 
        status: 'warning', 
        message: `Futures not available: ${error.message}` 
      };
    }
    setResults([...testResults]);

    // Test 4: Order history access
    try {
      testResults.push({ test: 'Order History Access', status: 'running', message: 'Testing order history...' });
      setResults([...testResults]);
      
      const orders = await api.getAllOrders(null, 10);
      const spotCount = orders.filter(o => !o.isFutures).length;
      const futuresCount = orders.filter(o => o.isFutures).length;
      
      testResults[testResults.length - 1] = { 
        test: 'Order History Access', 
        status: 'success', 
        message: `Retrieved ${orders.length} orders (${spotCount} spot, ${futuresCount} futures)` 
      };
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Order History Access', 
        status: 'error', 
        message: `Failed: ${error.message}` 
      };
    }
    setResults([...testResults]);

    // Test 5: Open orders access
    try {
      testResults.push({ test: 'Open Orders Access', status: 'running', message: 'Testing open orders...' });
      setResults([...testResults]);
      
      const openOrders = await api.getOpenOrders();
      const spotOpenCount = openOrders.filter(o => !o.isFutures).length;
      const futuresOpenCount = openOrders.filter(o => o.isFutures).length;
      
      testResults[testResults.length - 1] = { 
        test: 'Open Orders Access', 
        status: 'success', 
        message: openOrders.length > 0 ? 
          `Found ${openOrders.length} open orders (${spotOpenCount} spot, ${futuresOpenCount} futures)` :
          'No open orders found' 
      };
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Open Orders Access', 
        status: 'error', 
        message: `Failed: ${error.message}` 
      };
    }
    setResults([...testResults]);

    setTesting(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="status-icon success" size={20} />;
      case 'error': return <XCircle className="status-icon error" size={20} />;
      case 'warning': return <AlertCircle className="status-icon warning" size={20} />;
      case 'running': return <AlertCircle className="status-icon running" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="api-tester">
      <div className="tester-header">
        <TestTube size={24} />
        <h3>API Credentials Test</h3>
        <button onClick={runTests} disabled={testing} className="test-btn">
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="test-results">
          {results.map((result, index) => (
            <div key={index} className={`test-result ${result.status}`}>
              {getStatusIcon(result.status)}
              <div className="test-info">
                <strong>{result.test}</strong>
                <p>{result.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiTester;
