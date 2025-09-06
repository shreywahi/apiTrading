import { useState } from 'react';
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
    const market = order.isFutures ? 'futures' : 'spot';
    
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
      console.log(`🎯 Cancelling ${market} order:`, { orderId, symbol });
      
      // Cancel the order
      const result = await binanceApi.cancelOrder(symbol, orderId, market);
      console.log('✅ Order cancelled successfully:', result);

      // Immediately remove from UI optimistically for instant feedback
      console.log('🎯 Applying optimistic UI update - removing cancelled order from display');
      setOptimisticallyRemovedOrders(prev => new Set([...prev, orderId]));
      
      // Clear all caches to ensure fresh data
      if (binanceApi.clearPriceCache) {
        binanceApi.clearPriceCache();
      }

      // Trigger immediate data refresh in parent component
      if (onOrderCancelled) {
        console.log('🔄 Triggering immediate data refresh...');
        await onOrderCancelled(orderId);
        console.log('✅ Immediate refresh successful');
      }

    } catch (error) {
      console.error('❌ Failed to cancel order:', error);
      
      // Remove optimistic update on failure
      setOptimisticallyRemovedOrders(prev => {
        const updated = new Set(prev);
        updated.delete(orderId);
        return updated;
      });
      
      // Provide specific feedback for common API issues
      if (error.message.includes('CORS')) {
        console.log('ℹ️ CORS error detected - this is a browser/network security limitation');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        console.log('ℹ️ 403 Forbidden detected - likely API rate limiting. Please wait before trying again');
      } else if (error.message.includes('400')) {
        console.log('ℹ️ 400 Bad Request - order may already be cancelled or invalid');
      }
      
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
  const filteredFuturesOpenOrders = futuresOpenOrders.filter(order => 
    !optimisticallyRemovedOrders.has(order.orderId || order.id)
  );

  return (
    <section className="expanded-section orders-section">
      <div className="section-header">
        <h2>Orders Management - USD-M Futures</h2>
        <p className="section-description">Complete trading history from Binance USD-M Futures</p>
        {showRateLimitMessage && (
          <div className="rate-limit-message">
            Rate limit protection active. Please wait 3 seconds between order cancellations to prevent API errors.
          </div>
        )}
      </div>
      <div className="section-content">
        <div className="futures-tabs">
          <div className="tab-header">
            <div className="futures-tab-buttons">
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'open-orders' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('open-orders')}
              >
                <Activity size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Open Orders ({filteredFuturesOpenOrders.length})
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
  const sortedOrders = sortData(futuresOpenOrders, 'time', 'desc');

  if (futuresOpenOrders.length === 0) {
    return (
      <div className="no-data">
        <p>No open futures orders found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="futures-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('time')}>
              Time <SortIndicator field="time" />
            </th>
            <th onClick={() => handleSort('symbol')}>
              Symbol <SortIndicator field="symbol" />
            </th>
            <th onClick={() => handleSort('type')}>
              Type <SortIndicator field="type" />
            </th>
            <th onClick={() => handleSort('side')}>
              Side <SortIndicator field="side" />
            </th>
            <th onClick={() => handleSort('origQty')}>
              Amount <SortIndicator field="origQty" />
            </th>
            <th onClick={() => handleSort('price')}>
              Price <SortIndicator field="price" />
            </th>
            <th onClick={() => handleSort('stopPrice')}>
              Stop Price <SortIndicator field="stopPrice" />
            </th>
            <th onClick={() => handleSort('status')}>
              Status <SortIndicator field="status" />
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order) => (
            <tr key={order.orderId}>
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
              <td className="number-cell">
                {order.stopPrice && parseFloat(order.stopPrice) > 0 ? 
                  `$${parseFloat(order.stopPrice).toLocaleString()}` : 
                  '-'
                }
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              <td>
                <button
                  className={`close-order-btn ${closingOrders[order.orderId] ? 'cancelling' : ''}`}
                  onClick={() => handleCloseOrder(order)}
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

const OrderHistoryTab = ({ futuresOrderHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  const sortedOrders = sortData(futuresOrderHistory, 'time', 'desc');

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
            <th onClick={() => handleSort('time')}>
              Time <SortIndicator field="time" />
            </th>
            <th onClick={() => handleSort('symbol')}>
              Symbol <SortIndicator field="symbol" />
            </th>
            <th onClick={() => handleSort('type')}>
              Type <SortIndicator field="type" />
            </th>
            <th onClick={() => handleSort('side')}>
              Side <SortIndicator field="side" />
            </th>
            <th onClick={() => handleSort('origQty')}>
              Amount <SortIndicator field="origQty" />
            </th>
            <th onClick={() => handleSort('price')}>
              Price <SortIndicator field="price" />
            </th>
            <th onClick={() => handleSort('status')}>
              Status <SortIndicator field="status" />
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
  const sortedTrades = sortData(tradeHistory, 'time', 'desc');

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
            <th onClick={() => handleSort('time')}>
              Time <SortIndicator field="time" />
            </th>
            <th onClick={() => handleSort('symbol')}>
              Symbol <SortIndicator field="symbol" />
            </th>
            <th onClick={() => handleSort('side')}>
              Side <SortIndicator field="side" />
            </th>
            <th onClick={() => handleSort('qty')}>
              Quantity <SortIndicator field="qty" />
            </th>
            <th onClick={() => handleSort('price')}>
              Price <SortIndicator field="price" />
            </th>
            <th onClick={() => handleSort('realizedPnl')}>
              Realized PnL <SortIndicator field="realizedPnl" />
            </th>
            <th onClick={() => handleSort('commission')}>
              Commission <SortIndicator field="commission" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTrades.map((trade, index) => (
            <tr key={trade.id || index}>
              <td>{formatDate(trade.time)}</td>
              <td className="symbol-cell">{trade.symbol}</td>
              <td>
                <span className={`side-badge ${trade.side?.toLowerCase()}`}>
                  {trade.side}
                </span>
              </td>
              <td className="number-cell">{parseFloat(trade.qty).toFixed(6)}</td>
              <td className="number-cell">${parseFloat(trade.price).toLocaleString()}</td>
              <td className={`number-cell ${parseFloat(trade.realizedPnl) >= 0 ? 'positive' : 'negative'}`}>
                ${parseFloat(trade.realizedPnl).toFixed(4)}
              </td>
              <td className="number-cell">${parseFloat(trade.commission).toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TransactionHistoryTab = ({ transactionHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  const sortedTransactions = sortData(transactionHistory, 'time', 'desc');

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
            <th onClick={() => handleSort('time')}>
              Time <SortIndicator field="time" />
            </th>
            <th onClick={() => handleSort('symbol')}>
              Symbol <SortIndicator field="symbol" />
            </th>
            <th onClick={() => handleSort('incomeType')}>
              Type <SortIndicator field="incomeType" />
            </th>
            <th onClick={() => handleSort('income')}>
              Income <SortIndicator field="income" />
            </th>
            <th onClick={() => handleSort('asset')}>
              Asset <SortIndicator field="asset" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((transaction, index) => (
            <tr key={transaction.tranId || index}>
              <td>{formatDate(transaction.time)}</td>
              <td className="symbol-cell">{transaction.symbol || '-'}</td>
              <td>
                <span className={`income-type ${transaction.incomeType?.toLowerCase()}`}>
                  {transaction.incomeType}
                </span>
              </td>
              <td className={`number-cell ${parseFloat(transaction.income) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(transaction.income).toFixed(6)}
              </td>
              <td className="symbol-cell">{transaction.asset}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FundingHistoryTab = ({ fundingFeeHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  const sortedFunding = sortData(fundingFeeHistory, 'time', 'desc');

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
            <th onClick={() => handleSort('time')}>
              Time <SortIndicator field="time" />
            </th>
            <th onClick={() => handleSort('symbol')}>
              Symbol <SortIndicator field="symbol" />
            </th>
            <th onClick={() => handleSort('income')}>
              Funding Fee <SortIndicator field="income" />
            </th>
            <th onClick={() => handleSort('asset')}>
              Asset <SortIndicator field="asset" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFunding.map((funding, index) => (
            <tr key={funding.tranId || index}>
              <td>{formatDate(funding.time)}</td>
              <td className="symbol-cell">{funding.symbol}</td>
              <td className={`number-cell ${parseFloat(funding.income) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(funding.income).toFixed(6)}
              </td>
              <td className="symbol-cell">{funding.asset}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersSection;
