import { useState, useRef, Fragment } from 'react';
import { Activity, History, TrendingUp, ArrowUpDown, Coins, X } from 'lucide-react';
import OrderStatusBadge from '../common/OrderStatusBadge';
import './OrdersSection.css';

const OrdersSection = ({ 
  activeFuturesTab,
  setActiveFuturesTab,
  futuresOpenOrders,
  futuresOrderHistory,
  tradeHistory,
  transactionHistory,
  fundingFeeHistory,
  handleSort,
  sortData,
  SortIndicator,
  formatDate,
  binanceApi,
  onOrderCancelled
}) => {
  const [closingOrders, setClosingOrders] = useState({});
  const [showRateLimitMessage, setShowRateLimitMessage] = useState(false);
  const [optimisticallyRemovedOrders, setOptimisticallyRemovedOrders] = useState(new Set());

  const handleCloseOrder = async (order) => {
    const orderId = order.orderId || order.id;
    const symbol = order.symbol;
    // Always use 'futures' for cancel in futures-only mode
    const market = 'futures';
    
    if (!orderId || !symbol) {
      console.error('Missing order details for cancellation:', order);
      return;
    }

    // Rate limiting protection - prevent rapid successive cancellations
    const now = Date.now();
    const timeSinceLastCancel = now - (window.lastCancelTime || 0);
    
    if (timeSinceLastCancel < 3000) { // 3 second minimum between cancellations
      console.warn('⏱️ Rate limit protection: Please wait 3 seconds between order cancellations');
      setShowRateLimitMessage(true);
      setTimeout(() => setShowRateLimitMessage(false), 3000);
      return;
    }
    
    window.lastCancelTime = now;
    setClosingOrders(prev => ({ ...prev, [orderId]: true }));

    try {
      // Cancel the order (always futures)
      const result = await binanceApi.cancelOrder(symbol, orderId, market);

      // Immediately remove from UI optimistically for instant feedback
      setOptimisticallyRemovedOrders(prev => new Set([...prev, orderId]));
      
      // Clear all caches to ensure fresh data
      if (binanceApi.clearPriceCache) {
        binanceApi.clearPriceCache();
      }

      // Trigger immediate data refresh in parent component
      if (onOrderCancelled) {
        await onOrderCancelled(orderId);
      }

    } catch (error) {
      console.error('❌ Failed to cancel order:', error);
      
      // Remove optimistic update on failure
      setOptimisticallyRemovedOrders(prev => {
        const updated = new Set(prev);
        updated.delete(orderId);
        return updated;
      });
      
    } finally {
      // Remove from closing state after a delay
      setTimeout(() => {
        setClosingOrders(prev => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      }, 3000);
    }
  };

  // Filter out optimistically removed orders from the display
  const filteredFuturesOpenOrders = Array.isArray(futuresOpenOrders)
    ? futuresOpenOrders.filter(order => !optimisticallyRemovedOrders.has(order?.orderId || order?.id))
    : [];

  return (
    <section className="expanded-section orders-section">


      <div className="section-header">
        <h2>Orders Management</h2>
        <p className="section-description">Complete trading history from Binance USD-M Futures markets</p>
        {showRateLimitMessage && (
          <div className="rate-limit-message">
            Rate limit protection active. Please wait 3 seconds between order cancellations to prevent API errors.
          </div>
        )}
      </div>
      <div className="section-content">
        {/* Only render futures tabs in production/futures mode */}
        <div className="futures-tabs">
          <div className="tab-header">
            <div className="futures-tab-buttons">
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'open-orders' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('open-orders')}
              >
                <Activity size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Open Orders ({Number.isFinite(filteredFuturesOpenOrders.length) ? filteredFuturesOpenOrders.length : 0})
                </span>
              </button>
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'order-history' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('order-history')}
              >
                <History size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Order History ({futuresOrderHistory.length})
                </span>
              </button>
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'trades' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('trades')}
              >
                <TrendingUp size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Trade History ({tradeHistory.length})
                </span>
              </button>
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('transactions')}
              >
                <ArrowUpDown size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Transactions ({transactionHistory.length})
                </span>
              </button>
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'funding' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('funding')}
              >
                <Coins size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Funding ({fundingFeeHistory.length})
                </span>
              </button>
            </div>
          </div>
          <div className="futures-tab-content">
            {activeFuturesTab === 'open-orders' && (
              <Fragment>
                {(() => {
                  try {
                    return (
                      <OpenOrdersTab 
                        futuresOpenOrders={filteredFuturesOpenOrders}
                        handleSort={handleSort}
                        sortData={sortData}
                        SortIndicator={SortIndicator}
                        formatDate={formatDate}
                        binanceApi={binanceApi}
                        onOrderCancelled={onOrderCancelled}
                        handleCloseOrder={handleCloseOrder}
                        closingOrders={closingOrders}
                      />
                    );
                  } catch (error) {
                    console.error('Error rendering OpenOrdersTab:', error);
                    return (
                      <div className="error-message" style={{ 
                        background: '#fee2e2', 
                        border: '1px solid #fecaca', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        margin: '1rem 0' 
                      }}>
                        <h3 style={{ color: '#dc2626', marginTop: 0 }}>Error Loading Open Orders</h3>
                        <p>There was an error displaying the open orders. Please try refreshing the page.</p>
                        <details style={{ marginTop: '0.5rem' }}>
                          <summary>Error Details</summary>
                          <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            {error.toString()}
                          </pre>
                        </details>
                      </div>
                    );
                  }
                })()}
              </Fragment>
            )}
            {activeFuturesTab === 'order-history' && (
              <OrderHistoryTab 
                futuresOrderHistory={futuresOrderHistory}
                handleSort={handleSort}
                sortData={sortData}
                SortIndicator={SortIndicator}
                formatDate={formatDate}
              />
            )}
            {activeFuturesTab === 'trades' && (
              <TradeHistoryTab 
                tradeHistory={tradeHistory}
                handleSort={handleSort}
                sortData={sortData}
                SortIndicator={SortIndicator}
                formatDate={formatDate}
              />
            )}
            {activeFuturesTab === 'transactions' && (
              <TransactionHistoryTab 
                transactionHistory={transactionHistory}
                handleSort={handleSort}
                sortData={sortData}
                SortIndicator={SortIndicator}
                formatDate={formatDate}
              />
            )}
            {activeFuturesTab === 'funding' && (
              <FundingHistoryTab 
                fundingFeeHistory={fundingFeeHistory}
                handleSort={handleSort}
                sortData={sortData}
                SortIndicator={SortIndicator}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const OpenOrdersTab = ({ futuresOpenOrders, handleSort, sortData, SortIndicator, formatDate, binanceApi, onOrderCancelled, handleCloseOrder, closingOrders }) => {
  const [editOrderId, setEditOrderId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  // Prevent live refresh from interrupting editing
  const frozenOrdersRef = useRef(null);
  let displayOrders = futuresOpenOrders;
  // Strictly freeze open orders data when editing starts
  // Guarantee edit state and table data are frozen the moment editing starts, regardless of prop changes
  const prevEditOrderId = useRef(null);
  if (editOrderId) {
    if (!frozenOrdersRef.current || prevEditOrderId.current !== editOrderId) {
      frozenOrdersRef.current = Array.isArray(futuresOpenOrders) ? [...futuresOpenOrders] : [];
      prevEditOrderId.current = editOrderId;
    }
    displayOrders = frozenOrdersRef.current;
  } else {
    frozenOrdersRef.current = null;
    prevEditOrderId.current = null;
    displayOrders = futuresOpenOrders;
  }
  // Safety check for props
  // Always render the table, even if loading or empty
  let sortedOrders = [];
  let showError = false;
  try {
    if (Array.isArray(futuresOpenOrders)) {
      sortedOrders = sortData ? sortData(futuresOpenOrders, 'open-orders') : futuresOpenOrders;
    } else {
      showError = true;
    }
  } catch (error) {
    console.error('Error sorting orders:', error);
    showError = true;
  }

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort && handleSort('open-orders', 'time')}>
              Time <SortIndicator tableType="open-orders" column="time" />
            </th>
            <th onClick={() => handleSort && handleSort('open-orders', 'symbol')} className="symbol-header">
              Symbol <SortIndicator tableType="open-orders" column="symbol" />
            </th>
            <th onClick={() => handleSort && handleSort('open-orders', 'type')}>
              Type <SortIndicator tableType="open-orders" column="type" />
            </th>
            <th onClick={() => handleSort && handleSort('open-orders', 'side')}>
              Side <SortIndicator tableType="open-orders" column="side" />
            </th>
            <th onClick={() => handleSort && handleSort('open-orders', 'origQty')}>
              Amount <SortIndicator tableType="open-orders" column="origQty" />
            </th>
            <th onClick={() => handleSort && handleSort('open-orders', 'price')}>
              Price <SortIndicator tableType="open-orders" column="price" />
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {showError ? (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', color: '#dc2626' }}>
                Error loading open orders. Please check your connection or try again later.
              </td>
            </tr>
          ) : sortedOrders.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', color: '#888' }}>
                No open futures orders found
              </td>
            </tr>
          ) : (Array.isArray(displayOrders) ? (sortData ? sortData(displayOrders, 'open-orders') : displayOrders) : []).map((order, index) => {
            if (!order) return null;
            const orderId = order.orderId || order.id || index;
            const isEditing = editOrderId === orderId;
            return (
              <tr key={orderId}>
                <td>{formatDate(order.time)}</td>
                <td className="symbol-cell">{order.symbol || 'N/A'}</td>
                <td>
                  <span className={`order-type ${order.type?.toLowerCase() || ''}`}>
                    {order.type || 'N/A'}
                  </span>
                </td>
                <td>
                  <span className={`side-badge ${order.side?.toLowerCase() || ''}`}>
                    {order.side || 'N/A'}
                  </span>
                </td>
                <td className="number-cell">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      className="edit-order-input"
                    />
                  ) : (
                    order.origQty ? parseFloat(order.origQty).toFixed(6) : '0.000000'
                  )}
                </td>
                <td className="number-cell">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="edit-order-input"
                    />
                  ) : (
                    order.price && parseFloat(order.price) > 0 ? 
                      `$${parseFloat(order.price).toLocaleString()}` : 
                      'Market'
                  )}
                </td>
                <td>
                  <div className="edit-actions-group">
                    {isEditing ? (
                      <>
                        <button
                          className="save-order-btn styled-action-btn"
                          disabled={savingEdit}
                          onClick={async () => {
                            setSavingEdit(true);
                            try {
                              // Cancel original order
                              await handleCloseOrder(order);
                              // Place new order with updated values
                              if (binanceApi && typeof binanceApi.placeFuturesOrder === 'function') {
                                await binanceApi.placeFuturesOrder({
                                  symbol: order.symbol,
                                  side: order.side,
                                  type: order.type,
                                  quantity: parseFloat(editAmount),
                                  price: parseFloat(editPrice),
                                  timeInForce: order.timeInForce || 'GTC',
                                });
                              }
                              setEditOrderId(null);
                            } catch (e) {
                              alert('Failed to modify order: ' + (e?.message || e));
                            } finally {
                              setSavingEdit(false);
                            }
                          }}
                        >Save</button>
                        <button
                          className="cancel-edit-btn styled-action-btn"
                          disabled={savingEdit}
                          onClick={() => setEditOrderId(null)}
                        >Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="edit-order-btn styled-action-btn"
                          onClick={() => {
                            setEditOrderId(orderId);
                            setEditAmount(order.origQty ? parseFloat(order.origQty).toString() : '');
                            setEditPrice(order.price ? parseFloat(order.price).toString() : '');
                          }}
                          disabled={closingOrders[orderId]}
                          title="Edit this order"
                        >Edit</button>
                        <button
                          className={`close-order-btn styled-action-btn ${closingOrders[orderId] ? 'cancelling' : ''}`}
                          onClick={() => handleCloseOrder(order)}
                          disabled={closingOrders[orderId]}
                          title="Cancel this order"
                        >
                          <X size={14} />
                          {closingOrders[orderId] ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const OrderHistoryTab = ({ futuresOrderHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  // Safety checks
  if (!futuresOrderHistory || !Array.isArray(futuresOrderHistory)) {
    return (
      <div className="no-data">
        <p>Loading order history...</p>
      </div>
    );
  }

  let sortedOrders;
  try {
    sortedOrders = sortData ? sortData(futuresOrderHistory, 'order-history') : futuresOrderHistory;
  } catch (error) {
    console.error('Error sorting order history:', error);
    sortedOrders = futuresOrderHistory;
  }

  if (futuresOrderHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No order history found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort && handleSort('order-history', 'time')}>
              Time <SortIndicator tableType="order-history" column="time" />
            </th>
            <th onClick={() => handleSort && handleSort('order-history', 'symbol')} className="symbol-header">
              Symbol <SortIndicator tableType="order-history" column="symbol" />
            </th>
            <th onClick={() => handleSort && handleSort('order-history', 'type')}>
              Type <SortIndicator tableType="order-history" column="type" />
            </th>
            <th onClick={() => handleSort && handleSort('order-history', 'side')}>
              Side <SortIndicator tableType="order-history" column="side" />
            </th>
            <th onClick={() => handleSort && handleSort('order-history', 'origQty')}>
              Amount <SortIndicator tableType="order-history" column="origQty" />
            </th>
            <th onClick={() => handleSort && handleSort('order-history', 'price')}>
              Price <SortIndicator tableType="order-history" column="price" />
            </th>
            <th onClick={() => handleSort && handleSort('order-history', 'status')}>
              Status <SortIndicator tableType="order-history" column="status" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order, index) => (
            <tr key={order.orderId || index}>
              <td>{formatDate(order.time)}</td>
              <td className="symbol-cell">{order.symbol}</td>
              <td>
                <span className={`order-type ${order.type?.toLowerCase()}`}>
                  {order.type}
                </span>
              </td>
              <td>
                <span className={`side-badge ${order.side?.toLowerCase()}`}>
                  {order.side}
                </span>
              </td>
              <td className="number-cell">{parseFloat(order.origQty).toFixed(6)}</td>
              <td className="number-cell">
                {order.price && parseFloat(order.price) > 0 ? 
                  `$${parseFloat(order.price).toLocaleString()}` : 
                  'Market'
                }
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TradeHistoryTab = ({ tradeHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  // Safety checks
  if (!tradeHistory || !Array.isArray(tradeHistory)) {
    return (
      <div className="no-data">
        <p>Loading trade history...</p>
      </div>
    );
  }

  let sortedTrades;
  try {
    sortedTrades = sortData ? sortData(tradeHistory, 'trade-history') : tradeHistory;
  } catch (error) {
    console.error('Error sorting trade history:', error);
    sortedTrades = tradeHistory;
  }

  if (tradeHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No trade history found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort && handleSort('trade-history', 'time')}>
              Time <SortIndicator tableType="trade-history" column="time" />
            </th>
            <th onClick={() => handleSort && handleSort('trade-history', 'symbol')} className="symbol-header">
              Symbol <SortIndicator tableType="trade-history" column="symbol" />
            </th>
            <th onClick={() => handleSort && handleSort('trade-history', 'side')}>
              Side <SortIndicator tableType="trade-history" column="side" />
            </th>
            <th onClick={() => handleSort && handleSort('trade-history', 'qty')}>
              Quantity <SortIndicator tableType="trade-history" column="qty" />
            </th>
            <th onClick={() => handleSort && handleSort('trade-history', 'price')}>
              Price <SortIndicator tableType="trade-history" column="price" />
            </th>
            <th onClick={() => handleSort && handleSort('trade-history', 'realizedPnl')}>
              Realized PnL <SortIndicator tableType="trade-history" column="realizedPnl" />
            </th>
            <th onClick={() => handleSort && handleSort('trade-history', 'commission')}>
              Commission <SortIndicator tableType="trade-history" column="commission" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTrades && sortedTrades.length > 0 ? sortedTrades.map((trade, index) => {
            // Safety check for trade object
            if (!trade || typeof trade !== 'object') {
              return null;
            }

            return (
              <tr key={trade.id || `trade-${index}`}>
                <td>{formatDate ? formatDate(trade.time) : 'N/A'}</td>
                <td className="symbol-cell">{trade.symbol || 'N/A'}</td>
                <td>
                  <span className={`side-badge ${trade.side?.toLowerCase() || ''}`}>
                    {trade.side || 'N/A'}
                  </span>
                </td>
                <td className="number-cell">{parseFloat(trade.qty || 0).toFixed(6)}</td>
                <td className="number-cell">${parseFloat(trade.price || 0).toLocaleString()}</td>
                <td className={`number-cell ${parseFloat(trade.realizedPnl || 0) >= 0 ? 'positive' : 'negative'}`}>
                  ${parseFloat(trade.realizedPnl || 0).toFixed(4)}
                </td>
                <td className="number-cell">${parseFloat(trade.commission || 0).toFixed(6)}</td>
              </tr>
            );
          }).filter(Boolean) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>
                No trade history available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const TransactionHistoryTab = ({ transactionHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  // Safety checks
  if (!transactionHistory || !Array.isArray(transactionHistory)) {
    return (
      <div className="no-data">
        <p>Loading transaction history...</p>
      </div>
    );
  }

  let sortedTransactions;
  try {
    sortedTransactions = sortData ? sortData(transactionHistory, 'transaction-history') : transactionHistory;
  } catch (error) {
    console.error('Error sorting transaction history:', error);
    sortedTransactions = transactionHistory;
  }

  if (transactionHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No transaction history found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort && handleSort('transaction-history', 'time')}>
              Time <SortIndicator tableType="transaction-history" column="time" />
            </th>
            <th onClick={() => handleSort && handleSort('transaction-history', 'symbol')}>
              Symbol <SortIndicator tableType="transaction-history" column="symbol" />
            </th>
            <th onClick={() => handleSort && handleSort('transaction-history', 'incomeType')}>
              Type <SortIndicator tableType="transaction-history" column="incomeType" />
            </th>
            <th onClick={() => handleSort && handleSort('transaction-history', 'income')}>
              Income <SortIndicator tableType="transaction-history" column="income" />
            </th>
            <th onClick={() => handleSort && handleSort('transaction-history', 'asset')}>
              Asset <SortIndicator tableType="transaction-history" column="asset" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions && sortedTransactions.length > 0 ? sortedTransactions.map((transaction, index) => {
            // Safety check for transaction object
            if (!transaction || typeof transaction !== 'object') {
              return null;
            }

            return (
              <tr key={`transaction-${index}-${transaction.time || Date.now()}`}>
                <td>{formatDate ? formatDate(transaction.time) : 'N/A'}</td>
                <td className="symbol-cell">{transaction.symbol || '-'}</td>
                <td>
                  <span className={`income-type ${transaction.incomeType?.toLowerCase() || ''}`}>
                    {transaction.incomeType || 'N/A'}
                  </span>
                </td>
                <td className={`number-cell ${parseFloat(transaction.income || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {parseFloat(transaction.income || 0).toFixed(6)}
                </td>
                <td className="symbol-cell">{transaction.asset || 'N/A'}</td>
              </tr>
            );
          }).filter(Boolean) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>
                No transaction history available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const FundingHistoryTab = ({ fundingFeeHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  // Safety checks
  if (!fundingFeeHistory || !Array.isArray(fundingFeeHistory)) {
    return (
      <div className="no-data">
        <p>Loading funding history...</p>
      </div>
    );
  }

  let sortedFunding;
  try {
    sortedFunding = sortData ? sortData(fundingFeeHistory, 'funding-fee') : fundingFeeHistory;
  } catch (error) {
    console.error('Error sorting funding history:', error);
    sortedFunding = fundingFeeHistory;
  }

  if (fundingFeeHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No funding fee history found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort && handleSort('funding-fee', 'time')}>
              Time <SortIndicator tableType="funding-fee" column="time" />
            </th>
            <th onClick={() => handleSort && handleSort('funding-fee', 'symbol')}>
              Symbol <SortIndicator tableType="funding-fee" column="symbol" />
            </th>
            <th onClick={() => handleSort && handleSort('funding-fee', 'income')}>
              Funding Fee <SortIndicator tableType="funding-fee" column="income" />
            </th>
            <th onClick={() => handleSort && handleSort('funding-fee', 'asset')}>
              Asset <SortIndicator tableType="funding-fee" column="asset" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFunding && sortedFunding.length > 0 ? sortedFunding.map((funding, index) => {
            // Safety check for funding object
            if (!funding || typeof funding !== 'object') {
              return null;
            }

            // Create a unique key combining multiple properties
            const uniqueKey = `funding-${funding.tranId || index}-${funding.time || Date.now()}-${funding.symbol || 'unknown'}-${index}`;

            return (
              <tr key={uniqueKey}>
                <td>{formatDate ? formatDate(funding.time) : 'N/A'}</td>
                <td className="symbol-cell">{funding.symbol || 'N/A'}</td>
                <td className={`number-cell ${parseFloat(funding.income || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {parseFloat(funding.income || 0).toFixed(6)}
                </td>
                <td className="symbol-cell">{funding.asset || 'N/A'}</td>
              </tr>
            );
          }).filter(Boolean) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>
                No funding history available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Spot market components
const SpotOpenOrdersTab = ({ spotOpenOrders, handleSort, sortData, SortIndicator, formatDate, binanceApi, onOrderCancelled, handleCloseOrder, closingOrders }) => {
  // Safety check for props
  if (!spotOpenOrders || !Array.isArray(spotOpenOrders)) {
    return (
      <div className="no-data">
        <p>Loading spot open orders...</p>
      </div>
    );
  }

  if (spotOpenOrders.length === 0) {
    return (
      <div className="no-data">
        <p>No open spot orders found.</p>
      </div>
    );
  }

  const sortedOrders = sortData(spotOpenOrders, 'open-orders');

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('open-orders', 'time')} className="sortable">
              Time <SortIndicator tableType="open-orders" column="time" />
            </th>
            <th onClick={() => handleSort('open-orders', 'symbol')} className="sortable symbol-header">
              Symbol <SortIndicator tableType="open-orders" column="symbol" />
            </th>
            <th onClick={() => handleSort('open-orders', 'type')} className="sortable">
              Type <SortIndicator tableType="open-orders" column="type" />
            </th>
            <th onClick={() => handleSort('open-orders', 'side')} className="sortable">
              Side <SortIndicator tableType="open-orders" column="side" />
            </th>
            <th onClick={() => handleSort('open-orders', 'origQty')} className="sortable">
              Amount <SortIndicator tableType="open-orders" column="origQty" />
            </th>
            <th onClick={() => handleSort('open-orders', 'price')} className="sortable">
              Price <SortIndicator tableType="open-orders" column="price" />
            </th>
            <th onClick={() => handleSort('open-orders', 'status')} className="sortable">
              Status <SortIndicator tableType="open-orders" column="status" />
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order) => (
            <tr key={order.orderId || order.id}>
              <td>{formatDate(order.time)}</td>
              <td className="symbol-cell">{order.symbol}</td>
              <td>
                <span className={`order-type ${order.type?.toLowerCase()}`}>
                  {order.type}
                </span>
              </td>
              <td>
                <span className={`side-badge ${order.side?.toLowerCase()}`}>
                  {order.side}
                </span>
              </td>
              <td className="number-cell">
                {parseFloat(order.origQty).toFixed(6)}
              </td>
              <td className="number-cell">
                {order.price && parseFloat(order.price) > 0 ? 
                  `$${parseFloat(order.price).toLocaleString()}` : 
                  'Market'
                }
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              <td>
                <button
                  className={`close-order-btn ${closingOrders[order.orderId] ? 'cancelling' : ''}`}
                  onClick={() => handleCloseOrder({ ...order, isFutures: false })}
                  disabled={closingOrders[order.orderId]}
                  title="Cancel this order"
                >
                  <X size={14} />
                  {closingOrders[order.orderId] ? 'Cancelling...' : 'Cancel'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SpotOrderHistoryTab = ({ spotOrderHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  // Safety check for props
  if (!spotOrderHistory || !Array.isArray(spotOrderHistory)) {
    return (
      <div className="no-data">
        <p>Loading spot order history...</p>
      </div>
    );
  }

  if (spotOrderHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No spot order history found.</p>
      </div>
    );
  }

  const sortedOrders = sortData(spotOrderHistory, 'order-history');

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('order-history', 'time')} className="sortable">
              Time <SortIndicator tableType="order-history" column="time" />
            </th>
            <th onClick={() => handleSort('order-history', 'symbol')} className="sortable symbol-header">
              Symbol <SortIndicator tableType="order-history" column="symbol" />
            </th>
            <th onClick={() => handleSort('order-history', 'type')} className="sortable">
              Type <SortIndicator tableType="order-history" column="type" />
            </th>
            <th onClick={() => handleSort('order-history', 'side')} className="sortable">
              Side <SortIndicator tableType="order-history" column="side" />
            </th>
            <th onClick={() => handleSort('order-history', 'origQty')} className="sortable">
              Amount <SortIndicator tableType="order-history" column="origQty" />
            </th>
            <th onClick={() => handleSort('order-history', 'price')} className="sortable">
              Price <SortIndicator tableType="order-history" column="price" />
            </th>
            <th onClick={() => handleSort('order-history', 'status')} className="sortable">
              Status <SortIndicator tableType="order-history" column="status" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order) => (
            <tr key={order.orderId || order.id}>
              <td>{formatDate(order.time)}</td>
              <td className="symbol-cell">{order.symbol}</td>
              <td>
                <span className={`order-type ${order.type?.toLowerCase()}`}>
                  {order.type}
                </span>
              </td>
              <td>
                <span className={`side-badge ${order.side?.toLowerCase()}`}>
                  {order.side}
                </span>
              </td>
              <td className="number-cell">
                {parseFloat(order.origQty).toFixed(6)}
              </td>
              <td className="number-cell">
                {order.price && parseFloat(order.price) > 0 ? 
                  `$${parseFloat(order.price).toLocaleString()}` : 
                  'Market'
                }
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SpotTransferHistoryTab = ({ transactionHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  // Safety check for props
  if (!transactionHistory || !Array.isArray(transactionHistory)) {
    return (
      <div className="no-data">
        <p>Loading transfer history...</p>
      </div>
    );
  }

  if (transactionHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No transfer history found.</p>
      </div>
    );
  }

  const sortedTransactions = sortData(transactionHistory, 'transaction-history');

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('transaction-history', 'insertTime')} className="sortable">
              Time <SortIndicator tableType="transaction-history" column="insertTime" />
            </th>
            <th onClick={() => handleSort('transaction-history', 'asset')} className="sortable">
              Asset <SortIndicator tableType="transaction-history" column="asset" />
            </th>
            <th onClick={() => handleSort('transaction-history', 'type')} className="sortable">
              Type <SortIndicator tableType="transaction-history" column="type" />
            </th>
            <th onClick={() => handleSort('transaction-history', 'amount')} className="sortable">
              Amount <SortIndicator tableType="transaction-history" column="amount" />
            </th>
            <th onClick={() => handleSort('transaction-history', 'status')} className="sortable">
              Status <SortIndicator tableType="transaction-history" column="status" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((transaction, index) => (
            <tr key={transaction.id || index}>
              <td>{formatDate(transaction.insertTime)}</td>
              <td className="symbol-cell">{transaction.asset}</td>
              <td>
                <span className={`order-type ${transaction.type?.toLowerCase()}`}>
                  {transaction.type}
                </span>
              </td>
              <td className="number-cell">
                {parseFloat(transaction.amount).toFixed(6)}
              </td>
              <td>
                <OrderStatusBadge status={transaction.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SpotConvertHistoryTab = ({ convertHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  // Safety check for props
  if (!convertHistory || !Array.isArray(convertHistory)) {
    return (
      <div className="no-data">
        <p>Loading convert history...</p>
      </div>
    );
  }

  if (convertHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No convert history found.</p>
        <p>This will show your Binance Convert trading history when available.</p>
      </div>
    );
  }

  const sortedConvertHistory = sortData(convertHistory, 'convert-history');

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('convert-history', 'createTime')} className="sortable">
              Time <SortIndicator tableType="convert-history" column="createTime" />
            </th>
            <th onClick={() => handleSort('convert-history', 'fromAsset')} className="sortable">
              From Asset <SortIndicator tableType="convert-history" column="fromAsset" />
            </th>
            <th onClick={() => handleSort('convert-history', 'toAsset')} className="sortable">
              To Asset <SortIndicator tableType="convert-history" column="toAsset" />
            </th>
            <th onClick={() => handleSort('convert-history', 'fromAmount')} className="sortable">
              From Amount <SortIndicator tableType="convert-history" column="fromAmount" />
            </th>
            <th onClick={() => handleSort('convert-history', 'toAmount')} className="sortable">
              To Amount <SortIndicator tableType="convert-history" column="toAmount" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedConvertHistory.map((convert, index) => (
            <tr key={index}>
              <td>{formatDate(convert.createTime || Date.now())}</td>
              <td className="symbol-cell">{convert.fromAsset || 'N/A'}</td>
              <td className="symbol-cell">{convert.toAsset || 'N/A'}</td>
              <td className="number-cell">{parseFloat(convert.fromAmount || 0).toFixed(6)}</td>
              <td className="number-cell">{parseFloat(convert.toAmount || 0).toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersSection;
