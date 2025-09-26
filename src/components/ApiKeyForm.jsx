import './CosmicBackground.css';
import CosmicBackground from './CosmicBackground';
import { useState } from 'react';
import ApiAccountLoginCard from './ApiAccountLoginCard';
import { Key, Eye, EyeOff } from 'lucide-react';
import './ApiKeyForm.css';

const ApiKeyForm = ({ onSubmit, loading, accounts = [], onLoginAccount }) => {
  // Remove account by nickname
  const handleDeleteAccount = (nickname) => {
    const updated = accounts.filter(acc => acc.nickname !== nickname);
    localStorage.setItem('binanceAccounts', JSON.stringify(updated));
    window.location.reload(); // quick way to refresh state everywhere
  };
  const [nickname, setNickname] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState(null);
  const [showApiForm, setShowApiForm] = useState(accounts.length === 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim() && apiKey.trim() && apiSecret.trim()) {
      const existing = accounts.find(acc => acc.apiKey === apiKey && acc.apiSecret === apiSecret);
      if (existing) {
        if (existing.nickname !== nickname) {
          setError('Credentials already exists with different nickname');
          return;
        }
      }
      // Check for duplicate nickname
      if (accounts.some(acc => acc.nickname === nickname)) {
        // If the nickname exists, but with different credentials, block it
        const acc = accounts.find(acc => acc.nickname === nickname);
        if (acc.apiKey !== apiKey || acc.apiSecret !== apiSecret) {
          setError('Nickname already exists with different credentials');
          return;
        }
      }
      onSubmit({ nickname: nickname.trim(), apiKey: apiKey.trim(), apiSecret: apiSecret.trim() });
    }
  };

  return (
    <>
      <CosmicBackground darkMode={true} />
      <div className="api-key-form-container">
        {accounts && accounts.length > 0 && !showApiForm ? (
          <div className="api-key-form-center-group vertical-center-group">
            <ApiAccountLoginCard accounts={accounts} onLogin={onLoginAccount} onDelete={handleDeleteAccount} />
            <div className="or-separator-vertical">OR</div>
            <div className="api-login-different-btn-group">
              <button className="login-different-btn" onClick={() => setShowApiForm(true)} type="button">
                Login with different account
              </button>
            </div>
          </div>
        ) : (
          <div className="api-key-form-center-group vertical-center-group">
            <div className="api-key-form">
            <div className="form-header">
              <Key className="form-icon" size={32} />
              <h2>API Authentication (v1.10.7)</h2>
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
              <div className="input-group">
                <label htmlFor="nickname">Nickname</label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Account Nickname"
                  required
                  disabled={loading}
                  maxLength={32}
                />
              </div>
              <div className="button-group">
                <button type="submit" className="submit-btn" disabled={loading || !nickname.trim() || !apiKey.trim() || !apiSecret.trim()}>
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
              {error && <div className="api-form-error-message">{error}</div>}
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
            {accounts && accounts.length > 0 && (
              <>
                <div className="or-separator-vertical">OR</div>
                <div className="api-login-different-btn-group">
                  <button className="login-different-btn" onClick={() => setShowApiForm(false)} type="button">
                    Login with existing account
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ApiKeyForm;
