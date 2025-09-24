import React from "react";
import { Eye, EyeOff } from 'lucide-react';
import './PortfolioSection.css';

const PortfolioSection = ({ 
  accountData,
  totalValue,
  futuresValue,
  totalPnL,
  // Removed activeWalletTab and setActiveWalletTab
  hideSmallBalances,
  setHideSmallBalances,
  formatCurrency,
  handleClosePosition
}) => {
  const [closingSymbol, setClosingSymbol] = React.useState(null);
  return (
    <section className="expanded-section portfolio-section">
      <div className="section-header">
        <h2>Futures Wallet Portfolio</h2>
      </div>
      <div className="section-content">
        <div className="portfolio-summary">
          <div className="portfolio-stats">
            <div className="stat-item">
              <span className="label">Total Portfolio Value</span>
              <span className="value">{formatCurrency(totalValue)}</span>
              <small className="sub-value">Futures + Unrealized P&L</small>
            </div>
            <div className="stat-item">
              <span className="label">Futures Wallet</span>
              <span className="value">{formatCurrency(futuresValue)}</span>
            </div>
            <div className="stat-item">
              <span className="label">Unrealized P&L</span>
              <span className={`value ${totalPnL >= 0 ? 'positive' : 'negative'}`}> 
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
              </span>
            </div>
          </div>
          <div className="wallet-tabs">
            <div className="tab-header">
              <div className="wallet-buttons">
                <button 
                  className={`tab-btn active`}
                  disabled
                >
                  USD-M Futures Wallet
                </button>
              </div>
              <div className="tab-controls">
                <button
                  className={`toggle-btn ${hideSmallBalances ? 'active' : ''}`}
                  onClick={() => setHideSmallBalances(!hideSmallBalances)}
                >
                  {hideSmallBalances ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span style={{ marginLeft: '0.5rem' }}>
                    {hideSmallBalances ? 'Show Open Positions' : 'Hide Open Positions'}
                  </span>
                </button>
              </div>
            </div>
            <div className="tab-content">
              <FuturesWallet 
                futuresAccount={accountData?.futuresAccount}
                currentPrices={accountData?.currentPrices}
                hideSmallBalances={hideSmallBalances}
                closingSymbol={closingSymbol}
                setClosingSymbol={setClosingSymbol}
                handleClosePosition={handleClosePosition}
              />
              <FuturesSummary 
                futuresAccount={accountData?.futuresAccount}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FuturesWallet = ({ futuresAccount, currentPrices, hideSmallBalances, closingSymbol, setClosingSymbol, handleClosePosition }) => {
  return (
    <div className="wallet-content">
      <div className="wallet-header">
        <span>Asset</span>
        <span>Wallet Balance</span>
        <span>Unrealized PnL</span>
        <span>Margin Balance</span>
        <span>USD Value</span>
      </div>
      
      {futuresAccount?.assets
        ?.filter(asset => {
          const walletBalance = parseFloat(asset.walletBalance);
          return hideSmallBalances ? walletBalance > 0.00001 : walletBalance > 0;
        })
        ?.sort((a, b) => parseFloat(b.walletBalance) - parseFloat(a.walletBalance))
        ?.map((asset, index) => {
          const walletBalance = parseFloat(asset.walletBalance);
          const unrealizedProfit = parseFloat(asset.unrealizedProfit || 0);
          const marginBalance = parseFloat(asset.marginBalance || 0);
          
          let usdValue = walletBalance;
          if (asset.asset !== 'USDT' && asset.asset !== 'BUSD' && currentPrices) {
            const priceData = currentPrices.find(p => p.symbol === `${asset.asset}USDT`);
            if (priceData) {
              usdValue = walletBalance * parseFloat(priceData.price);
            }
          }

          return (
            <div key={asset.asset} className="wallet-item">
              <div className="asset-info">
                <span className="asset-symbol">{asset.asset}</span>
              </div>
              <span className="balance-amount">{walletBalance.toFixed(8)}</span>
              <span className={`balance-amount ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`}>
                {unrealizedProfit >= 0 ? '+' : ''}{unrealizedProfit.toFixed(2)}
              </span>
              <span className="balance-amount">{marginBalance.toFixed(8)}</span>
              <span className="usd-value">
                {usdValue > 0.01 ? `$${usdValue.toFixed(2)}` : '$0.00'}
              </span>
            </div>
          );
        })}
    
      {/* Futures Positions - Only show when hideSmallBalances is false (Show Open Positions is active) */}
      {!hideSmallBalances && futuresAccount?.positions
        ?.filter(pos => parseFloat(pos.positionAmt) !== 0)
        ?.map((position, index) => {
          const isClosing = closingSymbol === position.symbol;
          return (
            <div key={`pos-${position.symbol}`} className="wallet-item futures-position">
              <div className="asset-info" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <span className="asset-symbol" style={{fontWeight: 700, marginBottom: '0.3em'}}>{position.symbol}</span>
                <button
                  className="close-position-btn"
                  disabled={isClosing}
                  onClick={async () => {
                    if (typeof handleClosePosition === 'function') {
                      setClosingSymbol(position.symbol);
                      try {
                        await handleClosePosition(position);
                      } finally {
                        setClosingSymbol(null);
                      }
                    }
                  }}
                >
                  {isClosing ? 'Closing...' : 'Close Position'}
                </button>
              </div>
              <span className="balance-amount">{parseFloat(position.positionAmt).toFixed(4)}</span>
              <span className={`balance-amount ${parseFloat(position.unrealizedProfit) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(position.unrealizedProfit) >= 0 ? '+' : ''}{parseFloat(position.unrealizedProfit).toFixed(2)}
              </span>
              <span className="balance-amount">${parseFloat(position.notional).toFixed(2)}</span>
              <span className="usd-value">
                ${Math.abs(parseFloat(position.notional)).toFixed(2)}
              </span>
            </div>
          );
        })}
    </div>
  );
};

const FuturesSummary = ({ futuresAccount }) => {
  return (
    <div>
      {/* Futures Summary */}
      {futuresAccount && (
        <div className="futures-info">
          <h4>Futures Account Summary</h4>
          <div className="futures-stats">
            <div className="stat-item">
              <span>Total Wallet Balance:</span>
              <span>${parseFloat(futuresAccount.totalWalletBalance || 0).toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span>Total Unrealized PnL:</span>
              <span className={parseFloat(futuresAccount.totalUnrealizedPnl || 0) >= 0 ? 'positive' : 'negative'}>
                {parseFloat(futuresAccount.totalUnrealizedPnl || 0) >= 0 ? '+' : ''}
                ${parseFloat(futuresAccount.totalUnrealizedPnl || 0).toFixed(2)}
              </span>
            </div>
            <div className="stat-item">
              <span>Total Margin Balance:</span>
              <span>${parseFloat(futuresAccount.totalMarginBalance || 0).toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span>Available Balance:</span>
              <span>${parseFloat(futuresAccount.availableBalance || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSection;
