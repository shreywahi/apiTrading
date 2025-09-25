import { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import './ApiKeyForm.css';

const ApiKeyForm = ({ onSubmit, loading }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim() && apiSecret.trim()) {
      onSubmit({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim() });
    }
  };

  return (
    <div className="api-key-form-container">
      <div className="api-key-form">
        <div className="form-header">
          <Key className="form-icon" size={32} />
          <h2>API Authentication (v1.8.6)</h2>
          <p>Enter API credentials to login</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="apiKey">Key</label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Key"
              required
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="apiSecret">Secret</label>
            <div className="secret-input-wrapper">
              <input
                id="apiSecret"
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your Secret"
                required
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowSecret(!showSecret)}
                disabled={loading}
              >
                {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="button-group">
            <button type="submit" className="submit-btn" disabled={loading || !apiKey.trim() || !apiSecret.trim()}>
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
        
        <div className="security-notice">
          <p><strong>Security Notice:</strong></p>
          <ul>
            <li>Credentials are only used locally and not stored</li>
            <li>Ensure your key has futures trading permissions only</li>
            <li>Never share your key and secret with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyForm;
