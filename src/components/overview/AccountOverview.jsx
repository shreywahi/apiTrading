import React from 'react';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';
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
  onToggleSection 
}) => {
  return (
    <section className="overview-section">
      <h2>Account Overview</h2>
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
            <h3>P&L</h3>
            <p className={`value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <small className="sub-value">
              {(() => {
                const { pnlPercentage } = calculatePnL();
                if (isNaN(pnlPercentage) || !isFinite(pnlPercentage)) {
                  return '0.00% return';
                }
                return `${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}% return`;
              })()}
            </small>
          </div>
        </div>
        
        <div className="overview-card clickable" onClick={() => onToggleSection('orders')}>
          <div className="card-icon">
            <Activity size={24} />
          </div>
          <div className="card-content">
            <h3>Orders Management</h3>
            <p className="value orders-count">{openOrdersCount} open • {totalOrdersCount} total orders</p>
            <small className="sub-value">Active & Recent Orders</small>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountOverview;
