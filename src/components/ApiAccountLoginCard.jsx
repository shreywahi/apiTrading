import './ApiAccountLoginCard.css';

const ApiAccountLoginCard = ({ accounts, onLogin }) => {
  return (
    <div className="api-account-login-card">
      <h2>Use an existing account</h2>
      <div className="account-list">
        {accounts.map(acc => (
          <div className="account-list-item" key={acc.nickname}>
            <div className="account-info">
              <span className="nickname">{acc.nickname}</span>
              <span className="key">Key: {acc.apiKey.slice(0, 6)}...{acc.apiKey.slice(-4)}</span>
            </div>
            <button className="login-btn" onClick={() => onLogin(acc)}>Login</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiAccountLoginCard;
