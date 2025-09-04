import React, { useState, useEffect } from 'react';
import CosmicBackground from './CosmicBackground';
import DashboardHeader from './layout/DashboardHeader';
import AccountOverview from './overview/AccountOverview';
import PortfolioSection from './portfolio/PortfolioSection';
import PnLSection from './pnl/PnLSection';
import OrdersSection from './orders/OrdersSection';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorDisplay from './common/ErrorDisplay';

// Hooks
import { useDashboardData } from '../hooks/useDashboardData';
import { useSorting } from '../hooks/useSorting';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useCurrency } from '../hooks/useCurrency';

// Utils
import { calculatePnL, formatDate } from '../utils/dashboardUtils';

import './DashboardLayout.css';
import './CosmicBackground.css';

const Dashboard = ({ binanceApi, onLogout }) => {
  // UI State
  const [expandedSection, setExpandedSection] = useState('portfolio');
  const [hideSmallBalances, setHideSmallBalances] = useState(true);
  const [activeWalletTab, setActiveWalletTab] = useState('spot');
  const [activeFuturesTab, setActiveFuturesTab] = useState('open-orders');
  const [darkMode, setDarkMode] = useState(true);

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
    fetchData
  } = useDashboardData(binanceApi);

  const { sortConfig, handleSort, sortData, SortIndicator } = useSorting();
  
  const {
    autoRefreshTimer,
    autoRefreshActive,
    handleManualRefresh,
    toggleAutoRefresh,
    setAutoRefreshActive
  } = useAutoRefresh(fetchData, !loading); // Only start timer when not loading

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

  // Pause auto-refresh when user is actively refreshing
  useEffect(() => {
    if (refreshing) {
      setAutoRefreshActive(false);
    } else if (!loading) {
      // Only reactivate auto-refresh if data is loaded
      setTimeout(() => setAutoRefreshActive(true), 1000);
    }
  }, [refreshing, loading, setAutoRefreshActive]);

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
    </div>
  );
};

export default Dashboard;
