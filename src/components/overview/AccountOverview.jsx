import { DollarSign, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import './AccountOverview.css';

const AccountOverview = ({ 
  totalValue, 
  futuresValue, 
  totalPnL, 
  openOrdersCount, 
  totalOrdersCount,
  formatCurrency, 
  calculatePnL,
  onToggleSection,
  accountData,
  displayCurrency 
}) => {
  // Check if futures data is available
  const hasFuturesData = accountData?.futures || accountData?.futuresAccount;
  
  // Get currency icon based on selected currency
  const getCurrencyIcon = (currency) => {
    switch (currency) {
      case 'EUR':
        return '€';
      case 'INR':
        return '₹';
      case 'USD':
      default:
        return <DollarSign size={24} />;
    }
  };

  const currencyIcon = getCurrencyIcon(displayCurrency);
  return (
    <section className="overview-section">
      <div className="overview-grid">
        <div className="overview-card clickable" onClick={() => onToggleSection('portfolio')}>
          <div className="card-icon">
            {typeof currencyIcon === 'string' ? (
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{currencyIcon}</span>
            ) : (
              currencyIcon
            )}
          </div>
          <div className="card-content">
            <h3>Portfolio</h3>
            <p className="value">{formatCurrency(totalValue)}</p>
            <small className="sub-value">
              Futures: {formatCurrency(futuresValue)}
            </small>
          </div>
        </div>
        <div className="overview-card clickable" onClick={() => onToggleSection('pnl')}>
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3>Profit & Loss</h3>
            <p className={`value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <small className="sub-value">
              {(() => {
                const { pnlPercentage } = calculatePnL();
                if (isNaN(pnlPercentage) || !isFinite(pnlPercentage)) {
                  return '0.00% return';
                }
                return (
                  <span className={pnlPercentage >= 0 ? 'positive' : 'negative'}>
                    {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}% return
                  </span>
                );
              })()}
            </small>
          </div>
        </div>
        <div className="overview-card clickable" onClick={() => onToggleSection('orders')}>
          <div className="card-icon">
            <Activity size={24} />
          </div>
          <div className="card-content">
            <h3>Order Management</h3>
            <p className="value">{openOrdersCount} open</p>
            <small className="sub-value">Active & Recent Orders</small>
          </div>
        </div>
        <div className="overview-card clickable" onClick={() => onToggleSection('trading')}>
          <div className="card-icon">
            <BarChart3 size={24} />
          </div>
          <div className="card-content">
            <h3>Trading Center</h3>
            <p className="value">USD-M Futures</p>
            <small className="sub-value">Live Futures Trading</small>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountOverview;
