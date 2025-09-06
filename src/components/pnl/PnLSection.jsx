import React from 'react';
import './PnLSection.css';

const PnLSection = ({ 
  totalPnL, 
  spotValue, 
  futuresValue, 
  accountData,
  formatCurrency, 
  calculatePnL,
  positionHistory,
  handleSort,
  sortData,
  SortIndicator 
}) => {
  return (
    <section className="expanded-section pnl-section">
      <div className="section-header">
        <h2>Profit & Loss Overview</h2>
      </div>
      <div className="section-content">
        <div className="pnl-summary">
          {positionHistory && positionHistory.length > 0 && (
            <CurrentPositions 
              positionHistory={positionHistory}
              handleSort={handleSort}
              sortData={sortData}
              SortIndicator={SortIndicator}
            />
          )}

          <div className="pnl-breakdown">
            <h4>P&L Breakdown</h4>
            <div className="pnl-item">
              <span>Spot Trading:</span>
              <span className={spotValue >= 0 ? 'positive' : 'negative'}>
                ${spotValue.toFixed(2)}
              </span>
            </div>
            <div className="pnl-item">
              <span>Futures Trading:</span>
              <span className={futuresValue >= 0 ? 'positive' : 'negative'}>
                ${futuresValue.toFixed(2)}
              </span>
            </div>
            {accountData?.futures?.totalUnrealizedPnl && (
              <div className="pnl-item">
                <span>Unrealized PnL:</span>
                <span className={parseFloat(accountData.futures.totalUnrealizedPnl) >= 0 ? 'positive' : 'negative'}>
                  {parseFloat(accountData.futures.totalUnrealizedPnl) >= 0 ? '+' : ''}
                  ${parseFloat(accountData.futures.totalUnrealizedPnl).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const CurrentPositions = ({ positionHistory, handleSort, sortData, SortIndicator }) => {
  return (
    <div className="current-positions">
      <h4>Current Positions ({positionHistory.length} positions)</h4>
      <p className="futures-description">
        Current open positions in USD-M Futures (click column headers to sort)
      </p>
      <div className="positions-table-container">
        <table className="futures-table">
          <thead>
            <tr>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'symbol')}
              >
                Symbol
                <SortIndicator tableType="position-history" column="symbol" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'positionAmt')}
              >
                Side
                <SortIndicator tableType="position-history" column="positionAmt" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'positionAmt')}
              >
                Size
                <SortIndicator tableType="position-history" column="positionAmt" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'entryPrice')}
              >
                Entry Price
                <SortIndicator tableType="position-history" column="entryPrice" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'markPrice')}
              >
                Mark Price
                <SortIndicator tableType="position-history" column="markPrice" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'unrealizedProfit')}
              >
                Unrealized PnL
                <SortIndicator tableType="position-history" column="unrealizedProfit" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'roe')}
              >
                ROE%
                <SortIndicator tableType="position-history" column="roe" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'roi')}
              >
                ROI%
                <SortIndicator tableType="position-history" column="roi" />
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('position-history', 'leverage')}
              >
                Leverage
                <SortIndicator tableType="position-history" column="leverage" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortData(positionHistory, 'position-history').map((position, index) => {
              const unrealizedPnl = parseFloat(position.unrealizedProfit || position.unRealizedProfit || 0);
              const roe = parseFloat(position.roe || position.percentage || 0);
              const roi = parseFloat(position.roi || 0);
              const leverage = position.leverage || '1';
              
              return (
                <tr key={`${position.symbol}-${index}`}>
                  <td className="symbol">{position.symbol}</td>
                  <td className={`side side-${parseFloat(position.positionAmt) > 0 ? 'long' : 'short'}`}>
                    {parseFloat(position.positionAmt) > 0 ? 'LONG' : 'SHORT'}
                  </td>
                  <td>{Math.abs(parseFloat(position.positionAmt)).toFixed(4)}</td>
                  <td>{parseFloat(position.entryPrice).toFixed(4)}</td>
                  <td>{parseFloat(position.markPrice).toFixed(4)}</td>
                  <td className={unrealizedPnl >= 0 ? 'profit' : 'loss'}>
                    {isNaN(unrealizedPnl) ? '0.0000' : unrealizedPnl.toFixed(4)} USDT
                  </td>
                  <td className={roe >= 0 ? 'profit' : 'loss'}>
                    {isNaN(roe) ? '0.00' : roe.toFixed(2)}%
                  </td>
                  <td className={roi >= 0 ? 'profit' : 'loss'}>
                    {isNaN(roi) ? '0.00' : roi.toFixed(2)}%
                  </td>
                  <td>{leverage}x</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PnLSection;
