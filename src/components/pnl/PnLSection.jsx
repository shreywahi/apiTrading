import './PnLSection.css';

const PnLSection = ({
  futuresValue, 
  accountData,
  positionHistory,
  handleSort,
  sortData,
  SortIndicator,
  onClosePosition
}) => {
  return (
    <section className="expanded-section pnl-section">
      <div className="section-header">
        <h2>Profit & Loss</h2>
      </div>
      <div className="section-content">
        <div className="pnl-summary">
          {positionHistory && positionHistory.length > 0 && (
            <CurrentPositions 
              positionHistory={positionHistory}
              handleSort={handleSort}
              sortData={sortData}
              SortIndicator={SortIndicator}
              onClosePosition={onClosePosition}
            />
          )}
          <div className="pnl-breakdown">
            <h4>P&L and Balance Breakdown</h4>
            <div className="pnl-item">
              <span>USD-M Futures Balance:</span>
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

const CurrentPositions = ({ positionHistory, handleSort, sortData, SortIndicator, onClosePosition }) => {
  // Only show open positions (positionAmt !== 0)
  const openPositions = positionHistory.filter(position => Math.abs(parseFloat(position.positionAmt)) > 0);
  return (
    <div className="current-positions">
      <h4>Current Positions ({openPositions.length} positions)</h4>
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
                onClick={() => handleSort('position-history', 'liquidationPrice')}
              >
                Liq. Price
                <SortIndicator tableType="position-history" column="liquidationPrice" />
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
                onClick={() => handleSort('position-history', 'leverage')}
              >
                Leverage
                <SortIndicator tableType="position-history" column="leverage" />
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortData(openPositions, 'position-history')
              .map((position, index) => {
                const unrealizedPnl = parseFloat(position.unrealizedProfit || position.unRealizedProfit || 0);
                const leverage = position.leverage || '1';
                // Try multiple possible keys for liquidation price
                let liqPrice = null;
                if (position.liquidationPrice !== undefined && position.liquidationPrice !== null) {
                  liqPrice = parseFloat(position.liquidationPrice);
                } else if (position.liqPrice !== undefined && position.liqPrice !== null) {
                  liqPrice = parseFloat(position.liqPrice);
                }
                if (liqPrice === 0) liqPrice = null;
                return (
                  <tr key={`${position.symbol}-${index}`}>
                    <td className="symbol">{position.symbol}</td>
                    <td className={`side side-${parseFloat(position.positionAmt) > 0 ? 'long' : 'short'}`}>
                      {parseFloat(position.positionAmt) > 0 ? 'LONG' : 'SHORT'}
                    </td>
                    <td>{Math.abs(parseFloat(position.positionAmt)).toFixed(4)}</td>
                    <td>{parseFloat(position.entryPrice).toFixed(4)}</td>
                    <td className="centered">{liqPrice !== null && !isNaN(liqPrice) ? liqPrice.toFixed(2) : '-'}</td>
                    <td className={unrealizedPnl >= 0 ? 'profit' : 'loss'}>
                      {isNaN(unrealizedPnl) ? '0.0000' : unrealizedPnl.toFixed(4)} USDT
                    </td>
                    <td>{leverage}x</td>
                    <td>
                      <button
                        className="close-position-btn"
                        onClick={() => onClosePosition && onClosePosition(position)}
                        style={{ padding: '4px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Close Position
                      </button>
                    </td>
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
