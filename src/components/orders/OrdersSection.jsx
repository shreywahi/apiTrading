import React from 'react';
import { Activity, History, TrendingUp, ArrowUpDown, Coins } from 'lucide-react';
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
  formatDate
}) => {
  return (
    <section className="expanded-section orders-section">
      <div className="section-header">
        <h2>Orders Management - USD-M Futures</h2>
        <p className="section-description">Complete trading history from Binance USD-M Futures</p>
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
                  Open Orders ({futuresOpenOrders.length})
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
                className={`futures-tab-btn ${activeFuturesTab === 'trade-history' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('trade-history')}
              >
                <TrendingUp size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Trade History ({tradeHistory.length})
                </span>
              </button>
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'transaction-history' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('transaction-history')}
              >
                <ArrowUpDown size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Transaction History ({transactionHistory.length})
                </span>
              </button>
              <button 
                className={`futures-tab-btn ${activeFuturesTab === 'funding-fee' ? 'active' : ''}`}
                onClick={() => setActiveFuturesTab('funding-fee')}
              >
                <Coins size={16} />
                <span style={{ marginLeft: '0.5rem' }}>
                  Funding Fee ({fundingFeeHistory.length})
                </span>
              </button>
            </div>
          </div>

          <div className="futures-tab-content">
            {activeFuturesTab === 'open-orders' && (
              <OpenOrdersTab 
                futuresOpenOrders={futuresOpenOrders}
                handleSort={handleSort}
                sortData={sortData}
                SortIndicator={SortIndicator}
                formatDate={formatDate}
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

            {activeFuturesTab === 'trade-history' && (
              <TradeHistoryTab 
                tradeHistory={tradeHistory}
                handleSort={handleSort}
                sortData={sortData}
                SortIndicator={SortIndicator}
                formatDate={formatDate}
              />
            )}

            {activeFuturesTab === 'transaction-history' && (
              <TransactionHistoryTab 
                transactionHistory={transactionHistory}
                handleSort={handleSort}
                sortData={sortData}
                SortIndicator={SortIndicator}
                formatDate={formatDate}
              />
            )}

            {activeFuturesTab === 'funding-fee' && (
              <FundingFeeTab 
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

const OpenOrdersTab = ({ futuresOpenOrders, handleSort, sortData, SortIndicator, formatDate }) => {
  return (
    <div className="futures-table-container">
      <h3>Active Open Orders ({futuresOpenOrders.length} orders)</h3>
      <p className="futures-description">
        Currently active orders in USD-M Futures (click column headers to sort)
      </p>
      {futuresOpenOrders.length > 0 ? (
        <table className="futures-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('open-orders', 'symbol')}>
                Symbol
                <SortIndicator tableType="open-orders" column="symbol" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'side')}>
                Side
                <SortIndicator tableType="open-orders" column="side" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'type')}>
                Type
                <SortIndicator tableType="open-orders" column="type" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'origQty')}>
                Quantity
                <SortIndicator tableType="open-orders" column="origQty" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'price')}>
                Price
                <SortIndicator tableType="open-orders" column="price" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'stopPrice')}>
                Stop Price
                <SortIndicator tableType="open-orders" column="stopPrice" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'status')}>
                Status
                <SortIndicator tableType="open-orders" column="status" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'timeInForce')}>
                Time in Force
                <SortIndicator tableType="open-orders" column="timeInForce" />
              </th>
              <th className="sortable" onClick={() => handleSort('open-orders', 'time')}>
                Time
                <SortIndicator tableType="open-orders" column="time" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortData(futuresOpenOrders, 'open-orders').map((order) => (
              <tr key={order.orderId}>
                <td className="symbol">{order.symbol}</td>
                <td className={`side side-${order.side.toLowerCase()}`}>{order.side}</td>
                <td>{order.type}</td>
                <td>{parseFloat(order.origQty).toFixed(4)}</td>
                <td>{order.price === '0' ? 'Market' : parseFloat(order.price).toFixed(4)}</td>
                <td>{order.stopPrice && order.stopPrice !== '0' ? parseFloat(order.stopPrice).toFixed(4) : '-'}</td>
                <td><OrderStatusBadge status={order.status} /></td>
                <td>{order.timeInForce}</td>
                <td>{formatDate(order.time || order.updateTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-orders">
          <p>No open futures orders found</p>
        </div>
      )}
    </div>
  );
};

const OrderHistoryTab = ({ futuresOrderHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  return (
    <div className="futures-table-container">
      <h3>Order History ({futuresOrderHistory.length} orders)</h3>
      <p className="futures-description">
        Complete order history from USD-M Futures (click column headers to sort)
      </p>
      {futuresOrderHistory.length > 0 ? (
        <table className="futures-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('order-history', 'symbol')}>
                Symbol
                <SortIndicator tableType="order-history" column="symbol" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'side')}>
                Side
                <SortIndicator tableType="order-history" column="side" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'type')}>
                Type
                <SortIndicator tableType="order-history" column="type" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'origQty')}>
                Quantity
                <SortIndicator tableType="order-history" column="origQty" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'price')}>
                Price
                <SortIndicator tableType="order-history" column="price" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'executedQty')}>
                Executed
                <SortIndicator tableType="order-history" column="executedQty" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'status')}>
                Status
                <SortIndicator tableType="order-history" column="status" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'reduceOnly')}>
                Reduce Only
                <SortIndicator tableType="order-history" column="reduceOnly" />
              </th>
              <th className="sortable" onClick={() => handleSort('order-history', 'time')}>
                Time
                <SortIndicator tableType="order-history" column="time" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortData(futuresOrderHistory, 'order-history').map((order) => (
              <tr key={order.orderId}>
                <td className="symbol">{order.symbol}</td>
                <td className={`side side-${order.side.toLowerCase()}`}>{order.side}</td>
                <td>{order.type}</td>
                <td>{parseFloat(order.origQty).toFixed(4)}</td>
                <td>{order.price === '0' ? 'Market' : parseFloat(order.price).toFixed(4)}</td>
                <td>{parseFloat(order.executedQty || 0).toFixed(4)}</td>
                <td><OrderStatusBadge status={order.status} /></td>
                <td>{order.reduceOnly ? 'Yes' : 'No'}</td>
                <td>{formatDate(order.time || order.updateTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-orders">
          <p>No futures order history found</p>
        </div>
      )}
    </div>
  );
};

const TradeHistoryTab = ({ tradeHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  return (
    <div className="futures-table-container">
      <h3>Trade History ({tradeHistory.length} trades)</h3>
      <p className="futures-description">
        Recent executed trades from USD-M Futures (click column headers to sort)
      </p>
      {tradeHistory.length > 0 ? (
        <table className="futures-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('trade-history', 'symbol')}>
                Symbol
                <SortIndicator tableType="trade-history" column="symbol" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'side')}>
                Side
                <SortIndicator tableType="trade-history" column="side" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'qty')}>
                Quantity
                <SortIndicator tableType="trade-history" column="qty" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'price')}>
                Price
                <SortIndicator tableType="trade-history" column="price" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'quoteQty')}>
                Quote Qty
                <SortIndicator tableType="trade-history" column="quoteQty" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'commission')}>
                Commission
                <SortIndicator tableType="trade-history" column="commission" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'commissionAsset')}>
                Commission Asset
                <SortIndicator tableType="trade-history" column="commissionAsset" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'realizedPnl')}>
                Realized PnL
                <SortIndicator tableType="trade-history" column="realizedPnl" />
              </th>
              <th className="sortable" onClick={() => handleSort('trade-history', 'time')}>
                Time
                <SortIndicator tableType="trade-history" column="time" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortData(tradeHistory, 'trade-history').map((trade) => (
              <tr key={trade.id}>
                <td className="symbol">{trade.symbol}</td>
                <td className={`side side-${trade.side.toLowerCase()}`}>{trade.side}</td>
                <td>{parseFloat(trade.qty).toFixed(4)}</td>
                <td>{parseFloat(trade.price).toFixed(4)}</td>
                <td>{parseFloat(trade.quoteQty).toFixed(4)}</td>
                <td>{parseFloat(trade.commission).toFixed(6)}</td>
                <td>{trade.commissionAsset}</td>
                <td className={parseFloat(trade.realizedPnl) >= 0 ? 'profit' : 'loss'}>
                  {parseFloat(trade.realizedPnl).toFixed(4)}
                </td>
                <td>{formatDate(trade.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-orders">
          <p>No trade history found</p>
        </div>
      )}
    </div>
  );
};

const TransactionHistoryTab = ({ transactionHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  return (
    <div className="futures-table-container">
      <h3>Transaction History ({transactionHistory.length} transactions)</h3>
      <p className="futures-description">
        Income history including realized PnL, funding fees, commission rebates (click column headers to sort)
      </p>
      {transactionHistory.length > 0 ? (
        <table className="futures-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('transaction-history', 'symbol')}>
                Symbol
                <SortIndicator tableType="transaction-history" column="symbol" />
              </th>
              <th className="sortable" onClick={() => handleSort('transaction-history', 'incomeType')}>
                Income Type
                <SortIndicator tableType="transaction-history" column="incomeType" />
              </th>
              <th className="sortable" onClick={() => handleSort('transaction-history', 'income')}>
                Income
                <SortIndicator tableType="transaction-history" column="income" />
              </th>
              <th className="sortable" onClick={() => handleSort('transaction-history', 'asset')}>
                Asset
                <SortIndicator tableType="transaction-history" column="asset" />
              </th>
              <th className="sortable" onClick={() => handleSort('transaction-history', 'info')}>
                Info
                <SortIndicator tableType="transaction-history" column="info" />
              </th>
              <th className="sortable" onClick={() => handleSort('transaction-history', 'time')}>
                Time
                <SortIndicator tableType="transaction-history" column="time" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortData(transactionHistory, 'transaction-history').map((transaction, index) => (
              <tr key={`${transaction.tranId || index}`}>
                <td className="symbol">{transaction.symbol || '-'}</td>
                <td>{transaction.incomeType}</td>
                <td className={parseFloat(transaction.income) >= 0 ? 'profit' : 'loss'}>
                  {parseFloat(transaction.income).toFixed(6)}
                </td>
                <td>{transaction.asset}</td>
                <td>{transaction.info || '-'}</td>
                <td>{formatDate(transaction.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-orders">
          <p>No transaction history found</p>
        </div>
      )}
    </div>
  );
};

const FundingFeeTab = ({ fundingFeeHistory, handleSort, sortData, SortIndicator, formatDate }) => {
  return (
    <div className="futures-table-container">
      <h3>Funding Fee History ({fundingFeeHistory.length} records)</h3>
      <p className="futures-description">
        Funding fees paid/received for holding positions (click column headers to sort)
      </p>
      {fundingFeeHistory.length > 0 ? (
        <table className="futures-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('funding-fee', 'symbol')}>
                Symbol
                <SortIndicator tableType="funding-fee" column="symbol" />
              </th>
              <th className="sortable" onClick={() => handleSort('funding-fee', 'income')}>
                Funding Fee
                <SortIndicator tableType="funding-fee" column="income" />
              </th>
              <th className="sortable" onClick={() => handleSort('funding-fee', 'asset')}>
                Asset
                <SortIndicator tableType="funding-fee" column="asset" />
              </th>
              <th className="sortable" onClick={() => handleSort('funding-fee', 'info')}>
                Info
                <SortIndicator tableType="funding-fee" column="info" />
              </th>
              <th className="sortable" onClick={() => handleSort('funding-fee', 'time')}>
                Time
                <SortIndicator tableType="funding-fee" column="time" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortData(fundingFeeHistory, 'funding-fee').map((fee, index) => (
              <tr key={`${fee.tranId || index}`}>
                <td className="symbol">{fee.symbol}</td>
                <td className={parseFloat(fee.income) >= 0 ? 'profit' : 'loss'}>
                  {parseFloat(fee.income).toFixed(6)}
                </td>
                <td>{fee.asset}</td>
                <td>{fee.info || '-'}</td>
                <td>{formatDate(fee.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-orders">
          <p>No funding fee history found</p>
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
