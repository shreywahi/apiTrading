import { useState, useEffect, useRef } from 'react';

/**
 * Optimized Dashboard Data Hook - Senior Engineer Implementation
 * 
 * Performance Optimizations:
 * 1. Selective data fetching based on refresh type (full vs incremental)
 * 2. Smart caching with TTL for price data
 * 3. Parallel non-blocking requests
 * 4. Minimal required data fetching
 * 5. Background updates for non-critical data
 */
export const useOptimizedDashboardData = (binanceApi) => {
  // Core data states
  const [accountData, setAccountData] = useState(null);
  // Remove spot order states
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

  // ...existing code...

  // Performance caching
  const priceCache = useRef({ data: {}, timestamp: 0, ttl: 30000 }); // 30s cache
  const lastFullFetch = useRef(0);
  const FULL_FETCH_INTERVAL = 300000; // 5 minutes between full fetches

  /**
   * Get essential assets from account balances to minimize price API calls
   */
  // Remove spot asset logic

  /**
   * Fast price fetching - only get prices for assets we actually need
   */
  // Remove spot price logic

  /**
   * Ensure account data has all necessary fields for P&L calculations
   */
  // Remove spot enrichment logic

  /**
   * Fast refresh - only update critical portfolio data
   */
  const fastRefresh = async () => {
    try {
      setRefreshing(true);
      // Only fetch futures account data
      const futuresAccount = await binanceApi.getFuturesAccountInfo();
      const futuresWalletValue = futuresAccount ? parseFloat(futuresAccount.totalWalletBalance || 0) : 0;
      const totalPortfolioValue = futuresWalletValue;
      const updatedAccountData = {
        futures: futuresAccount,
        futuresAccount: futuresAccount,
        futuresWalletValue,
        totalPortfolioValue,
        currentPrices: [],
        updateTime: Date.now()
      };
      setAccountData(updatedAccountData);
    } catch (error) {
      console.error('Fast refresh failed:', error.message);
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Order-focused refresh - update order-related data after order changes
   */
  const refreshOrderData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch all order-related data that would be affected by order changes
      const [openOrdersResult, futuresDataResult] = await Promise.allSettled([
        binanceApi.getSpotOnlyOpenOrders(), // Use spot-only open orders
        binanceApi.getFuturesOrdersData()
      ]);

      // Update spot open orders
      if (openOrdersResult.status === 'fulfilled') {
        setOpenOrders(openOrdersResult.value);
      }

      // Update all futures order data
      if (futuresDataResult.status === 'fulfilled') {
        const futuresData = futuresDataResult.value;
        setFuturesOpenOrders(futuresData.openOrders || []);
        setFuturesOrderHistory(futuresData.orderHistory || []);
        setTradeHistory(futuresData.tradeHistory || []);
        setTransactionHistory(futuresData.transactionHistory || []);
        setFundingFeeHistory(futuresData.fundingFees || []);
      }

      // Also refresh account data to update balances after orders
      await fastRefresh();

    } catch (error) {
      console.error('Order data refresh failed:', error.message);
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Full refresh - comprehensive data fetch (used on initial load and periodic full updates)
   */
  const fullRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();

      // Phase 1: Critical data (parallel fetch)
      const [spotAccount, futuresAccount] = await Promise.allSettled([
        binanceApi.makeRequest('/api/v3/account'),
        binanceApi.getFuturesAccountInfo()
      ]);

      // Phase 2: Get essential prices based on actual balances
      let priceMap = {};
      if (spotAccount.status === 'fulfilled' && spotAccount.value) {
        const essentialAssets = getEssentialAssets(spotAccount.value.balances);
        priceMap = await fetchEssentialPrices(essentialAssets);
      }

      // Phase 3: Build core account data with proper portfolio calculations
      let spotWalletValue = 0;
      let futuresWalletValue = 0;

      // Calculate spot wallet value
      if (spotAccount.status === 'fulfilled' && spotAccount.value && spotAccount.value.balances) {
        spotAccount.value.balances.forEach(balance => {
          const total = parseFloat(balance.free) + parseFloat(balance.locked);
          if (total > 0.001) {
            if (['USDT', 'BUSD', 'USDC', 'FDUSD'].includes(balance.asset)) {
              spotWalletValue += total;
            } else if (priceMap[balance.asset]) {
              spotWalletValue += total * priceMap[balance.asset];
            }
          }
        });
      }

      // Calculate futures wallet value
      if (futuresAccount.status === 'fulfilled' && futuresAccount.value) {
        futuresWalletValue = parseFloat(futuresAccount.value.totalWalletBalance || 0);
      }

      const totalPortfolioValue = spotWalletValue + futuresWalletValue;

      const coreAccountData = enrichAccountDataForPnL(
        {
          totalPortfolioValue,
          spotWalletValue,
          futuresWalletValue,
          currentPrices: Object.entries(priceMap).map(([asset, price]) => ({
            symbol: `${asset}USDT`,
            price: price.toString()
          })),
          usingOptimizedFetch: true
        },
        spotAccount.status === 'fulfilled' ? spotAccount.value : null,
        futuresAccount.status === 'fulfilled' ? futuresAccount.value : null
      );

      setAccountData(coreAccountData);

      // Phase 4: Non-critical data (background fetch - don't block UI)
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      setTimeout(async () => {
        try {
          if (isLocalhost) {
            const [ordersResult, openOrdersResult, futuresDataResult, transferHistoryResult, convertHistoryResult] = await Promise.allSettled([
              binanceApi.getSpotOnlyOrderHistory(null, 50), // Use spot-only order history
              binanceApi.getSpotOnlyOpenOrders(), // Use spot-only open orders
              binanceApi.getFuturesOrdersData(),
              binanceApi.getTransferHistory(), // Add transfer history
              binanceApi.getConvertHistory() // Add convert history
            ]);

            // Update states as data comes in
            if (ordersResult.status === 'fulfilled') {
              setOrders(ordersResult.value.reverse());
            }

            if (openOrdersResult.status === 'fulfilled') {
              setOpenOrders(openOrdersResult.value);
            }

            if (futuresDataResult.status === 'fulfilled') {
              const futuresData = futuresDataResult.value;
              setFuturesOpenOrders(futuresData.openOrders || []);
              setFuturesOrderHistory(futuresData.orderHistory || []);
              setPositionHistory(futuresData.positions || []);
              setTradeHistory(futuresData.tradeHistory || []);
              setTransactionHistory(futuresData.transactionHistory || []);
              setFundingFeeHistory(futuresData.fundingFees || []);
            }

            // Process spot-specific data
            if (transferHistoryResult.status === 'fulfilled' && transferHistoryResult.value) {
              setSpotTransferHistory(transferHistoryResult.value);
            }
            if (convertHistoryResult.status === 'fulfilled' && convertHistoryResult.value) {
              setSpotConvertHistory(convertHistoryResult.value);
            }
          }
        } catch (bgError) {
          console.warn('Background data fetch error (non-critical):', bgError.message);
        }
      }, 100); // Small delay to ensure UI renders first

      lastFullFetch.current = Date.now();

    } catch (error) {
      setError(error.message);
      console.error('Full refresh failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Smart fetch - decides between fast refresh and full refresh
   */
  const fetchData = async (showRefreshIndicator = false) => {
    const now = Date.now();
    const timeSinceLastFull = now - lastFullFetch.current;
    
    // Use fast refresh if we've done a full fetch recently and this is a manual refresh
    if (showRefreshIndicator && timeSinceLastFull < FULL_FETCH_INTERVAL && accountData) {
      await fastRefresh();
    } else {
      await fullRefresh();
    }
  };

  /**
   * Initial load optimization
   */
  useEffect(() => {
    if (binanceApi && binanceApi.apiKey) {
      // Immediate fast load for better UX
      fullRefresh();
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
    spotTransferHistory,
    spotConvertHistory,
    
    // Loading states
    loading,
    error,
    refreshing,
    
    // Actions
    fetchData,
    fastRefresh,
    refreshOrderData,
    fullRefresh
  };
};
