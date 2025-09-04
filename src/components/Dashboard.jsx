import React, { useState, useEffect } from 'react';
import CosmicBackground from './CosmicBackground';
import DashboardHeader from './layout/DashboardHeader';
import AccountOverview from './overview/AccountOverview';
import PortfolioSection from './portfolio/PortfolioSection';
import PnLSection from './pnl/PnLSection';
import OrdersSection from './orders/OrdersSection';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorDisplay from './common/ErrorDisplay';
import PerformanceIndicator from './common/PerformanceIndicator';

// Hooks
import { useDashboardData } from '../hooks/useDashboardData';
import { useOptimizedDashboardData } from '../hooks/useOptimizedDashboardData';
import { useSorting } from '../hooks/useSorting';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useCurrency } from '../hooks/useCurrency';

// Utils
import { calculatePnL, formatDate } from '../utils/dashboardUtils';
import { extendBinanceApiWithOptimizations } from '../utils/binanceOptimizer';

import './DashboardLayout.css';
import './CosmicBackground.css';

const Dashboard = ({ binanceApi, onLogout }) => {
  // UI State
  const [expandedSection, setExpandedSection] = useState('portfolio');
  const [hideSmallBalances, setHideSmallBalances] = useState(true);
  const [activeWalletTab, setActiveWalletTab] = useState('spot');
  const [activeFuturesTab, setActiveFuturesTab] = useState('open-orders');
  const [darkMode, setDarkMode] = useState(true);
  const [useOptimizedFetch, setUseOptimizedFetch] = useState(true);

  // Performance optimization - extend API with optimizations on first load
  useEffect(() => {
    if (binanceApi && !binanceApi.isOptimized) {
      extendBinanceApiWithOptimizations(binanceApi);
      binanceApi.isOptimized = true;
    }
  }, [binanceApi]);

  // Choose data fetching strategy based on optimization setting
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
    fastRefresh
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

  const toggleSection = (sectionName) => {
    setExpandedSection(sectionName);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error}
        onRetry={() => fetchData()}
        onLogout={onLogout}
      />
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
          />
        )}
      </div>
      
      {/* Performance monitoring indicator */}
      <PerformanceIndicator 
        loading={loading}
        refreshing={refreshing}
        accountData={accountData}
      />
    </div>
  );
};

export default Dashboard;
