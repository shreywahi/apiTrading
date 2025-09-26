import './ApiAccountLoginCard.css';

const ApiAccountLoginCard = ({ accounts, onLogin }) => {
  return (
    <div className="existing-account-card" style={{
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 24px 0 rgba(80, 80, 160, 0.10), 0 1.5px 4px 0 rgba(80, 80, 160, 0.08)',
      padding: '2.5rem 2rem 2rem 2rem',
      minWidth: 340,
      maxWidth: 400,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }}>
      <h2 style={{ color: '#232946', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>Use an existing account</h2>
      <div className="existing-account-list">
        {accounts.map((acc, idx) => (
          <div className="existing-account-item" key={acc.apiKey}>
            <div>
              <div className="nickname">{acc.nickname ? acc.nickname : `${idx + 1}${['st','nd','rd','th'][Math.min(idx,3)]}`}</div>
              <div className="key">Key: {acc.apiKey.slice(0, 6)}...{acc.apiKey.slice(-4)}</div>
            </div>
            <button className="login-btn" onClick={() => onLogin(acc)}>Login</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiAccountLoginCard;
