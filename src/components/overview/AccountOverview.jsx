import React from 'react';
import { DollarSign, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import './AccountOverview.css';

const AccountOverview = ({ 
  totalValue, 
  spotValue, 
  futuresValue, 
  totalPnL, 
  openOrdersCount, 
  totalOrdersCount,
  formatCurrency, 
  calculatePnL,
  onToggleSection,
  accountData 
}) => {
  // Check if futures data is available
  const hasFuturesData = accountData?.futures || accountData?.futuresAccount;
  
  // Debug logging for orders count
  console.log('📊 AccountOverview received:', {
    openOrdersCount,
    totalOrdersCount,
    totalPnL,
    hasFuturesData
  });
  
  return (
    <section className="overview-section">
      <div className="overview-grid">
        <div className="overview-card clickable" onClick={() => onToggleSection('portfolio')}>
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <h3>Portfolio</h3>
            <p className="value">{formatCurrency(totalValue)}</p>
            <small className="sub-value">
              Spot: {formatCurrency(spotValue)} | Futures: {formatCurrency(futuresValue)}
            </small>
          </div>
        </div>
        
        <div className="overview-card clickable" onClick={() => onToggleSection('pnl')}>
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3>P&L {!hasFuturesData && <span style={{ fontSize: '0.7rem', color: '#888' }}>(Spot Only)</span>}</h3>
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
              {!hasFuturesData && (
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#fbbf24', marginTop: '2px' }}>
                  💡 Enable Futures for complete P&L
                </span>
              )}
            </small>
          </div>
        </div>
        
        <div className="overview-card clickable" onClick={() => onToggleSection('orders')}>
          <div className="card-icon">
            <Activity size={24} />
          </div>
          <div className="card-content">
            <h3>Orders Management</h3>
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
            <p className="value">Spot & Futures</p>
            <small className="sub-value">Place buy/sell orders</small>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountOverview;
