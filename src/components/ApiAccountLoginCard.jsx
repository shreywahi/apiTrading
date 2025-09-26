
import { Key } from 'lucide-react';
import './ApiAccountLoginCard.css';

const ApiAccountLoginCard = ({ accounts, onLogin, onDelete }) => {
  return (
    <div className="api-account-login-card">
      <div className="form-header">
        <Key className="form-icon" size={32} />
        <h2>API Authentication (v1.10.4)</h2>
        <p>Use existing account credentials to login</p>
      </div>
      <div className="account-list">
        {accounts.map(acc => (
          <div className="account-list-item" key={acc.nickname}>
            <div className="account-info">
              <span className="nickname">{acc.nickname}</span>
              <span className="key">Key: {acc.apiKey.slice(0, 6)}...{acc.apiKey.slice(-4)}</span>
            </div>
            <div className="account-login-actions">
              <button className="login-btn" onClick={() => onLogin(acc)}>Login</button>
              {onDelete && (
                <button className="delete-btn" onClick={() => onDelete(acc.nickname)} type="button">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiAccountLoginCard;
