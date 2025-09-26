import { useState, useEffect } from 'react';
import './AccountManagerModal.css';
import BinanceAPI from '../utils/binanceApi';

// Utility for localStorage
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

const AccountManagerModal = ({ isOpen, onClose, onSwitchAccount, onAdd, activeAccount, onDeleteActive }) => {
  const [accounts, setAccounts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [nickname, setNickname] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAccounts(getStoredAccounts());
  }, [isOpen]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !apiKey.trim() || !apiSecret.trim()) {
      setError('All fields are required.');
      return;
    }
    if (accounts.some(acc => acc.nickname === nickname.trim())) {
      setError('Nickname already exists.');
      return;
    }
    if (accounts.some(acc => acc.apiKey === apiKey.trim() && acc.apiSecret === apiSecret.trim())) {
      setError('This API Key and Secret are already saved.');
      return;
    }
    // Validate API key/secret before saving
    setError('');
    try {
      const api = new BinanceAPI(apiKey.trim(), apiSecret.trim(), false, false);
      const permissions = await api.checkApiPermissions();
      if (!permissions.futures) {
        setError('API Key does not have Futures trading permission enabled.');
        return;
      }
      const newAccount = { nickname: nickname.trim(), apiKey: apiKey.trim(), apiSecret: apiSecret.trim() };
      const updated = [...accounts, newAccount];
      setAccounts(updated);
      setStoredAccounts(updated);
      setNickname(''); setApiKey(''); setApiSecret(''); setShowAddForm(false); setError('');
      if (onAdd) onAdd(newAccount);
    } catch (err) {
      setError('Failed to validate API credentials: ' + (err?.message || err));
    }
  };

  const handleSwitch = (acc) => {
    // Always use the latest stored account object (with up-to-date nickname)
    const stored = accounts.find(a => a.apiKey === acc.apiKey && a.apiSecret === acc.apiSecret) || acc;
    if (onSwitchAccount) onSwitchAccount(stored);
    onClose();
  };

  const handleDelete = (nickname) => {
    const updated = accounts.filter(acc => acc.nickname !== nickname);
    setAccounts(updated);
    setStoredAccounts(updated);
    if (activeAccount?.nickname === nickname) {
      if (onDeleteActive) onDeleteActive();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="account-modal-backdrop">
      <div className="account-modal">
        <div className="account-modal-header">
          <h2>Manage APIs</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="account-modal-body">
          {accounts.length === 0 && <div className="no-accounts">No accounts saved.</div>}
          {accounts.map(acc => (
            <div key={acc.nickname} className={`account-card${activeAccount?.nickname === acc.nickname ? ' active' : ''}`}>
              <div className="account-info">
                <div className="nickname">{acc.nickname}</div>
                <div className="api-key">Key: <span>{acc.apiKey.slice(0, 6)}...{acc.apiKey.slice(-4)}</span></div>
              </div>
              <div className="account-actions">
                <button onClick={() => handleSwitch(acc)} disabled={activeAccount?.apiKey === acc.apiKey && activeAccount?.apiSecret === acc.apiSecret}>Switch</button>
                <button className="delete-btn" onClick={() => handleDelete(acc.nickname)}>Delete</button>
              </div>
            </div>
          ))}
          <button className="add-account-btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add New API Account'}
          </button>
          {showAddForm && (
            <form className="add-account-form" onSubmit={handleAdd}>
              <input type="text" placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={32} required />
              <input type="text" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} required />
              <input type="password" placeholder="API Secret" value={apiSecret} onChange={e => setApiSecret(e.target.value)} required />
              <button type="submit">Add</button>
              {error && <div className="form-error">{error}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountManagerModal;
