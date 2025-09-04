import { useState, useEffect } from 'react';

export const useDashboardData = (binanceApi) => {
  const [accountData, setAccountData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Futures trading data
  const [futuresOpenOrders, setFuturesOpenOrders] = useState([]);
  const [futuresOrderHistory, setFuturesOrderHistory] = useState([]);
  const [positionHistory, setPositionHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [fundingFeeHistory, setFundingFeeHistory] = useState([]);

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch enhanced account info first
      const enhancedAccountInfo = await binanceApi.getEnhancedAccountInfo();
      
      const combinedAccountData = {
        balances: enhancedAccountInfo.spot?.balances || [],
        ...enhancedAccountInfo.spot,
        totalPortfolioValue: enhancedAccountInfo.totalPortfolioValue || 0,
        spotWalletValue: enhancedAccountInfo.spotWalletValue || 0,
        futuresWalletValue: enhancedAccountInfo.futuresWalletValue || 0,
        futures: enhancedAccountInfo.futures,
        futuresAccount: enhancedAccountInfo.futures,
        walletSnapshot: enhancedAccountInfo.walletSnapshot,
        currentPrices: enhancedAccountInfo.currentPrices || [],
        usingDirectBinanceData: true
      };
      
      setAccountData(combinedAccountData);

      // Fetch orders and futures data
      try {
        const [ordersResult, openOrdersResult, futuresDataResult] = await Promise.allSettled([
          binanceApi.getAllOrders(null, 100),
          binanceApi.getOpenOrders(),
          binanceApi.getFuturesOrdersData()
        ]);

        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value.reverse());
        } else {
          setOrders([]);
        }

        if (openOrdersResult.status === 'fulfilled') {
          setOpenOrders(openOrdersResult.value);
        } else {
          setOpenOrders([]);
        }

        if (futuresDataResult.status === 'fulfilled') {
          const futuresData = futuresDataResult.value;
          setFuturesOpenOrders(futuresData.openOrders || []);
          setFuturesOrderHistory(futuresData.orderHistory || []);
          setPositionHistory(futuresData.positions || []);
          setTradeHistory(futuresData.tradeHistory || []);
          setTransactionHistory(futuresData.transactionHistory || []);
          setFundingFeeHistory(futuresData.fundingFees || []);
        } else {
          setFuturesOpenOrders([]);
          setFuturesOrderHistory([]);
          setPositionHistory([]);
          setTradeHistory([]);
          setTransactionHistory([]);
          setFundingFeeHistory([]);
        }
      } catch (err) {
        console.warn('Error fetching orders (non-critical):', err.message);
        setOrders([]);
        setOpenOrders([]);
        setFuturesOpenOrders([]);
        setFuturesOrderHistory([]);
        setPositionHistory([]);
        setTradeHistory([]);
        setTransactionHistory([]);
        setFundingFeeHistory([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return {
    // Data states
    accountData,
    orders,
    openOrders,
    futuresOpenOrders,
    futuresOrderHistory,
    positionHistory,
    tradeHistory,
    transactionHistory,
    fundingFeeHistory,
    
    // Loading states
    loading,
    error,
    refreshing,
    
    // Actions
    fetchData
  };
};
