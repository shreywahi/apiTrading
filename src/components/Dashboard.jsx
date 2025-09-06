import React, { useState, useEffect } from 'react';

// Custom hooks
import { useDashboardData } from '../hooks/useDashboardData';
import { useOptimizedDashboardData } from '../hooks/useOptimizedDashboardData';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useCurrency } from '../hooks/useCurrency';
import { useSorting } from '../hooks/useSorting';

// Components
import CosmicBackground from './CosmicBackground';
import DashboardHeader from './layout/DashboardHeader';
import AccountOverview from './overview/AccountOverview';
import PortfolioSection from './portfolio/PortfolioSection';
import PnLSection from './pnl/PnLSection';
import OrdersSection from './orders/OrdersSection';
import TradingSection from './trading/TradingSection';
import TradingErrorBoundary from './trading/TradingErrorBoundary';
import LoadingSpinner from './common/LoadingSpinner';

// Utils
import { calculatePnL, formatDate } from '../utils/dashboardUtils';
import { extendBinanceApiWithOptimizations } from '../utils/binanceOptimizer';

import './DashboardLayout.css';
import './CosmicBackground.css';

const Dashboard = ({ binanceApi, onLogout }) => {
  // UI State
  const [expandedSection, setExpandedSection] = useState('portfolio');
  const [hideSmallBalances, setHideSmallBalances] = useState(true);
  const [activeWalletTab, setActiveWalletTab] = useState('futures');
  const [activeFuturesTab, setActiveFuturesTab] = useState('open-orders');
  const [darkMode, setDarkMode] = useState(true);
  const [useOptimizedFetch, setUseOptimizedFetch] = useState(true);
  const [useUltraOptimization, setUseUltraOptimization] = useState(false);

  // Performance optimization - extend API with optimizations on first load
  useEffect(() => {
    if (binanceApi && !binanceApi.isOptimized) {
      extendBinanceApiWithOptimizations(binanceApi);
      binanceApi.isOptimized = true;
      
      // Check API permissions for better error handling
      binanceApi.checkApiPermissions?.()
        .then(permissions => {
          if (!permissions.futures) {
            console.warn('⚠️ Futures trading not enabled - some features may not work');
          }
        })
        .catch(error => {
          console.warn('Could not check API permissions:', error.message);
        });
    }
  }, [binanceApi]);

  // Choose data fetching strategy based on optimization level  
  const dataHook = useOptimizedFetch ? useOptimizedDashboardData : useDashboardData;
  
  // Custom hooks
  const {
    accountData,
    orders,
    openOrders,
    futuresOpenOrders,
    futuresOrderHistory,
    positionHistory,
    tradeHistory,
    transactionHistory,
    fundingFeeHistory,
    loading,
    error,
    refreshing,
    fetchData,
    fastRefresh,
    refreshOrderData
  } = dataHook(binanceApi);

  const { sortConfig, handleSort, sortData, SortIndicator } = useSorting();
  
  const {
    autoRefreshTimer,
    autoRefreshActive,
    handleManualRefresh,
    toggleAutoRefresh,
    setAutoRefreshActive
  } = useAutoRefresh(fetchData, !loading, fastRefresh); // Pass fastRefresh function

  const {
    displayCurrency,
    setDisplayCurrency,
    formatCurrency,
    fetchExchangeRates
  } = useCurrency();

  // Initial data fetch
  useEffect(() => {
    fetchData();
    fetchExchangeRates();
  }, []);

  // Only pause auto-refresh during initial loading, not during refreshes
  useEffect(() => {
    // Don't interfere with auto-refresh during normal refresh operations
    // Auto-refresh should only start paused on initial load
  }, []);

  // Error message renderer with helpful guidance
  const renderError = (error) => {
    if (error?.includes('Access forbidden') || error?.includes('403')) {
      return (
        <div className="error-message" style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          padding: '1rem', 
          borderRadius: '8px',
          margin: '1rem 0' 
        }}>
          <h3 style={{ color: '#dc2626', marginTop: 0 }}>🚨 API Permissions Issue</h3>
          <p><strong>403 Forbidden Error:</strong> Your API key may not have the required permissions.</p>
          
          <div style={{ marginTop: '1rem' }}>
            <h4>To fix this issue:</h4>
            <ol style={{ paddingLeft: '1.5rem' }}>
              <li>Go to <a href="https://www.binance.com/en/my/settings/api-management" target="_blank" rel="noopener noreferrer">Binance API Management</a></li>
              <li>Click "Edit" on your API key</li>
              <li>Enable the following permissions:
                <ul style={{ marginTop: '0.5rem' }}>
                  <li>✅ <strong>Enable Reading</strong> (required)</li>
                  <li>✅ <strong>Enable Futures</strong> (for futures data)</li>
                </ul>
              </li>
              <li>If using IP restrictions, add your current IP address</li>
              <li>Refresh this page after making changes</li>
            </ol>
          </div>
          
          <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#6b7280' }}>
            <strong>Note:</strong> Only "Enable Reading" and "Enable Futures" permissions are needed for this dashboard. 
            Never enable "Enable Trading" unless specifically required.
          </p>
        </div>
      );
    }
    
    return (
      <div className="error-message" style={{ 
        background: '#fee2e2', 
        border: '1px solid #fecaca', 
        padding: '1rem', 
        borderRadius: '8px',
        margin: '1rem 0' 
      }}>
        <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
      </div>
    );
  };

  const toggleSection = (sectionName) => {
    setExpandedSection(sectionName);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Trading Dashboard</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
        {renderError(error)}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => fetchData()} className="retry-btn" style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}>
            Retry
          </button>
          <button onClick={onLogout} className="logout-btn" style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Back to API Setup
          </button>
        </div>
      </div>
    );
  }

  const { totalValue, totalPnL, spotValue, futuresValue } = calculatePnL(accountData);

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <CosmicBackground darkMode={darkMode} />
      
      <DashboardHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        handleManualRefresh={handleManualRefresh}
        refreshing={refreshing}
        autoRefreshTimer={autoRefreshTimer}
        autoRefreshActive={autoRefreshActive}
        toggleAutoRefresh={toggleAutoRefresh}
        displayCurrency={displayCurrency}
        setDisplayCurrency={setDisplayCurrency}
        onLogout={onLogout}
      />

      <div className="dashboard-content">
        <AccountOverview 
          totalValue={totalValue}
          spotValue={spotValue}
          futuresValue={futuresValue}
          totalPnL={totalPnL}
          openOrdersCount={openOrders.length}
          totalOrdersCount={orders.length + futuresOrderHistory.length}
          formatCurrency={formatCurrency}
          calculatePnL={() => calculatePnL(accountData)}
          onToggleSection={toggleSection}
          accountData={accountData}
          displayCurrency={displayCurrency}
        />

        {expandedSection === 'portfolio' && (
          <PortfolioSection 
            accountData={accountData}
            totalValue={totalValue}
            spotValue={spotValue}
            futuresValue={futuresValue}
            totalPnL={totalPnL}
            activeWalletTab={activeWalletTab}
            setActiveWalletTab={setActiveWalletTab}
            hideSmallBalances={hideSmallBalances}
            setHideSmallBalances={setHideSmallBalances}
            formatCurrency={formatCurrency}
          />
        )}

        {expandedSection === 'pnl' && (
          <PnLSection 
            totalPnL={totalPnL}
            spotValue={spotValue}
            futuresValue={futuresValue}
            accountData={accountData}
            formatCurrency={formatCurrency}
            calculatePnL={() => calculatePnL(accountData)}
            positionHistory={positionHistory}
            handleSort={handleSort}
            sortData={sortData}
            SortIndicator={SortIndicator}
          />
        )}

        {expandedSection === 'orders' && (
          <OrdersSection 
            activeFuturesTab={activeFuturesTab}
            setActiveFuturesTab={setActiveFuturesTab}
            futuresOpenOrders={futuresOpenOrders}
            futuresOrderHistory={futuresOrderHistory}
            tradeHistory={tradeHistory}
            transactionHistory={transactionHistory}
            fundingFeeHistory={fundingFeeHistory}
            handleSort={handleSort}
            sortData={sortData}
            SortIndicator={SortIndicator}
            formatDate={formatDate}
            binanceApi={binanceApi}
            onOrderCancelled={async (orderId) => {
              // Clear cache for fresh data on next refresh
              if (binanceApi.clearPriceCache) {
                binanceApi.clearPriceCache();
              }
              
              // Use order-focused refresh for immediate and comprehensive update
              try {
                await refreshOrderData();
              } catch (refreshError) {
                // Fallback to full refresh if order refresh fails
                try {
                  await fetchData();
                } catch (fullRefreshError) {
                  console.error('❌ Both order refresh and full refresh failed:', fullRefreshError.message);
                }
              }
            }}
          />
        )}

        {expandedSection === 'trading' && (
          <TradingErrorBoundary>
            <TradingSection 
              accountData={accountData}
              formatCurrency={formatCurrency}
              binanceApi={binanceApi}
              onOrderPlaced={() => {
                // Clear cache to ensure fresh data and trigger order refresh
                if (binanceApi.clearPriceCache) {
                  binanceApi.clearPriceCache();
                }
                // Immediate order data refresh to update UI quickly
                refreshOrderData();
                // Secondary refresh after delay to ensure Binance has processed the order
                setTimeout(() => {
                  refreshOrderData();
                }, 2000); // 2 second delay for more reliable updates
              }}
            />
          </TradingErrorBoundary>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
