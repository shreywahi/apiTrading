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

  // Fast refresh - just refresh essential data quickly
  const fastRefresh = async () => {
    await fetchData(true);
  };

  // Order-focused refresh - update order-related data after order changes
  const refreshOrderData = async () => {
    try {
      setRefreshing(true);
      
      console.log('🔄 Refreshing order data after order changes...');
      
      // Fetch all order-related data that would be affected by order changes
      const [openOrdersResult, futuresDataResult] = await Promise.allSettled([
        binanceApi.getOpenOrders(),
        binanceApi.getFuturesOrdersData()
      ]);

      // Update spot open orders
      if (openOrdersResult.status === 'fulfilled') {
        setOpenOrders(openOrdersResult.value);
        console.log('✅ Updated spot open orders:', openOrdersResult.value.length);
      }

      // Update all futures order data
      if (futuresDataResult.status === 'fulfilled') {
        const futuresData = futuresDataResult.value;
        setFuturesOpenOrders(futuresData.openOrders || []);
        setFuturesOrderHistory(futuresData.orderHistory || []);
        setTradeHistory(futuresData.tradeHistory || []);
        setTransactionHistory(futuresData.transactionHistory || []);
        setFundingFeeHistory(futuresData.fundingFees || []);
        
        console.log('✅ Updated futures data:', {
          openOrders: futuresData.openOrders?.length || 0,
          orderHistory: futuresData.orderHistory?.length || 0,
          tradeHistory: futuresData.tradeHistory?.length || 0,
          transactionHistory: futuresData.transactionHistory?.length || 0,
          fundingFees: futuresData.fundingFees?.length || 0
        });
      }

      // Also refresh account data to update balances after orders
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

    } catch (error) {
      console.error('Order data refresh failed:', error.message);
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-fetch data when API is available
  useEffect(() => {
    if (binanceApi && binanceApi.apiKey) {
      fetchData();
    }
  }, [binanceApi]);

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
    fetchData,
    fastRefresh,
    refreshOrderData
  };
};
