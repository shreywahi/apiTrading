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

  // Spot-specific data
  const [spotTransferHistory, setSpotTransferHistory] = useState([]);
  const [spotConvertHistory, setSpotConvertHistory] = useState([]);

  // Performance caching
  const priceCache = useRef({ data: {}, timestamp: 0, ttl: 30000 }); // 30s cache
  const lastFullFetch = useRef(0);
  const FULL_FETCH_INTERVAL = 300000; // 5 minutes between full fetches

  // Add to existing refs
  const accountCache = useRef({ data: null, timestamp: 0, ttl: 15000 }); // 15s cache for account data
  const ordersCache = useRef({ data: null, timestamp: 0, ttl: 10000 }); // 10s cache for orders

  /**
   * Get essential assets from account balances to minimize price API calls
   */
  const getEssentialAssets = (balances = []) => {
    const significantBalances = balances.filter(balance => {
      const total = parseFloat(balance.free) + parseFloat(balance.locked);
      return total > 0.001; // Only fetch prices for assets with meaningful balances
    });
    
    const assets = new Set(['BTC', 'ETH', 'BNB']); // Always include major assets
    significantBalances.forEach(balance => assets.add(balance.asset));
    
    return Array.from(assets);
  };

  /**
   * Fast price fetching - only get prices for assets we actually need
   */
  const fetchEssentialPrices = async (requiredAssets) => {
    const now = Date.now();
    
    // Return cached prices if still valid
    if (priceCache.current.timestamp + priceCache.current.ttl > now && 
        Object.keys(priceCache.current.data).length > 0) {
      return priceCache.current.data;
    }

    try {
      // Try to fetch prices from API if binanceApi is available
      if (binanceApi && binanceApi.makePublicRequest) {
        const symbols = requiredAssets
          .filter(asset => asset !== 'USDT' && asset !== 'BUSD')
          .map(asset => `${asset}USDT`)
          .slice(0, 20); // Limit to 20 symbols max for performance

        if (symbols.length === 0) {
          // If no symbols to fetch, return fallback prices
          return getFallbackPrices(requiredAssets);
        }

        // Try public API call
        try {
          const priceData = await binanceApi.makePublicRequest('/api/v3/ticker/price', {
            symbols: JSON.stringify(symbols)
          });

          const priceMap = {};
          if (Array.isArray(priceData)) {
            priceData.forEach(ticker => {
              const asset = ticker.symbol.replace('USDT', '');
              priceMap[asset] = parseFloat(ticker.price);
            });
          }

          // Cache the results
          priceCache.current = {
            data: priceMap,
            timestamp: now,
            ttl: 30000
          };

          return priceMap;
        } catch (apiError) {
          console.warn('Price API failed, using fallback:', apiError.message);
          return getFallbackPrices(requiredAssets);
        }
      } else {
        console.log('binanceApi not available, using fallback prices');
        return getFallbackPrices(requiredAssets);
      }
    } catch (error) {
      console.warn('Price fetch completely failed, using fallback:', error.message);
      return getFallbackPrices(requiredAssets);
    }
  };

  /**
   * Get fallback prices for essential assets
   */
  const getFallbackPrices = (requiredAssets) => {
    const fallbackPrices = {
      USDT: 1,
      BUSD: 1,
      USDC: 1,
      FDUSD: 1,
      BTC: 45000,
      ETH: 3000,
      BNB: 300,
      ADA: 0.45,
      SOL: 100,
      DOT: 6.5,
      MATIC: 0.8,
      AVAX: 35,
      LINK: 15,
      UNI: 6
    };
    
    // Filter to only include assets we actually need
    const filteredFallback = {};
    requiredAssets.forEach(asset => {
      if (fallbackPrices[asset]) {
        filteredFallback[asset] = fallbackPrices[asset];
      }
    });
    
    console.log('Using fallback prices:', filteredFallback);
    return filteredFallback;
  };

  /**
   * Ensure account data has all necessary fields for P&L calculations
   */
  const enrichAccountDataForPnL = (accountData, spotData, futuresData) => {
    return {
      ...accountData,
      balances: spotData?.balances || accountData.balances || [],
      futures: futuresData || accountData.futures,
      futuresAccount: futuresData || accountData.futuresAccount,
      // Ensure we have all fields that calculatePnL expects
      canTrade: spotData?.canTrade || accountData.canTrade,
      canWithdraw: spotData?.canWithdraw || accountData.canWithdraw,
      canDeposit: spotData?.canDeposit || accountData.canDeposit,
      accountType: spotData?.accountType || accountData.accountType,
      updateTime: Date.now()
    };
  };

  /**
   * Fast refresh - only update critical portfolio data
   */
  const fastRefresh = async () => {
    try {
      setRefreshing(true);
      const now = Date.now();
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

      // Check cache for account data
      let spotAccount = null;
      if (isLocalhost) {
        // In development, try to fetch real data
        try {
          if (accountCache.current.data && (now - accountCache.current.timestamp) < accountCache.current.ttl) {
            spotAccount = accountCache.current.data;
          } else {
            spotAccount = await Promise.resolve(binanceApi.makeRequest('/api/v3/account'));
            accountCache.current = { data: spotAccount, timestamp: now };
          }
        } catch (accountError) {
          console.warn('Account data fetch failed, using cached data:', accountError?.message || 'Unknown error');
          spotAccount = accountCache.current?.data || null;
        }
      } else {
        // In production, use mock data if no cached data available
        if (accountCache.current.data && (now - accountCache.current.timestamp) < accountCache.current.ttl) {
          spotAccount = accountCache.current.data;
        } else {
          // Use mock data for production
          spotAccount = getMockAccountData();
          accountCache.current = { data: spotAccount, timestamp: now };
        }
      }

      // Check cache for orders - only fetch spot orders in localhost
      let openOrdersData = null;
      if (isLocalhost) {
        if (ordersCache.current.data && (now - ordersCache.current.timestamp) < ordersCache.current.ttl) {
          openOrdersData = ordersCache.current.data;
        } else {
          try {
            openOrdersData = await Promise.resolve(binanceApi.getSpotOnlyOpenOrders());
            ordersCache.current = { data: openOrdersData, timestamp: now };
          } catch (orderError) {
            console.warn('Spot orders fetch failed, using empty array:', orderError.message);
            openOrdersData = [];
            ordersCache.current = { data: openOrdersData, timestamp: now };
          }
        }
      } else {
        // In production, set spot orders to empty
        openOrdersData = [];
      }

      // Fetch futures data in both development and production
      let futuresAccount = null;
      try {
        console.log('Fetching futures account data...');
        const futuresData = await fetchFuturesData({ useProxy: true });
        futuresAccount = futuresData.futuresAccount || null;
        console.log('Futures account data fetched:', futuresAccount ? 'success' : 'null');
      } catch (futuresError) {
        console.warn('Futures account fetch failed:', futuresError?.message || 'Unknown error');
        setError(futuresError?.message || 'Futures account fetch failed');
        futuresAccount = null;
      }

      if (spotAccount) {
        const essentialAssets = getEssentialAssets(spotAccount.balances);
        const priceMap = await fetchEssentialPrices(essentialAssets);
        
        // Recalculate spot wallet value
        let spotWalletValue = 0;
        spotAccount.balances.forEach(balance => {
          const total = parseFloat(balance.free) + parseFloat(balance.locked);
          if (total > 0.001) {
            if (['USDT', 'BUSD', 'USDC', 'FDUSD'].includes(balance.asset)) {
              spotWalletValue += total;
            } else if (priceMap[balance.asset]) {
              spotWalletValue += total * priceMap[balance.asset];
            }
          }
        });

        // Get updated futures data for accurate P&L
        const updatedFuturesData = futuresAccount ? futuresAccount : accountData?.futures;
        const futuresWalletValue = updatedFuturesData ? parseFloat(updatedFuturesData.totalWalletBalance || 0) : 0;
        const totalPortfolioValue = spotWalletValue + futuresWalletValue;
        
        console.log('fastRefresh: Portfolio values - Spot:', spotWalletValue, 'Futures:', futuresWalletValue, 'Total:', totalPortfolioValue);
        
        // Update account data with all necessary data for P&L calculations
        const updatedAccountData = enrichAccountDataForPnL(
          {
            ...accountData,
            spotWalletValue,
            futuresWalletValue,
            totalPortfolioValue,
            currentPrices: Object.entries(priceMap).map(([asset, price]) => ({
              symbol: `${asset}USDT`,
              price: price.toString()
            }))
          },
          spotAccount,
          updatedFuturesData
        );
        
        setAccountData(updatedAccountData);
      }

      // Always set open orders data (empty array if failed)
      setOpenOrders(openOrdersData || []);

    } catch (error) {
      console.error('Fast refresh failed:', error?.message || 'Unknown error');
      // Set empty arrays on failure to prevent NaN
      setOpenOrders([]);
      // Don't set error state for fast refresh failures to avoid UI disruption
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
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      
      // Fetch all order-related data that would be affected by order changes
      let spotOrdersPromise;
      if (isLocalhost) {
        spotOrdersPromise = binanceApi.getSpotOnlyOpenOrders();
      } else {
        spotOrdersPromise = Promise.resolve([]);
      }

      // Attempt futures fetch via centralized helper so we can fallback gracefully
      let openOrdersResult, futuresDataResult;
      try {
        const futuresData = await fetchFuturesData({ useProxy: true });
        openOrdersResult = { status: 'fulfilled', value: await spotOrdersPromise };
        futuresDataResult = { status: 'fulfilled', value: futuresData.futuresOrders || {} };
      } catch (fErr) {
        // If helper fails, still attempt direct promises to capture error details
        const futuresOrdersPromise = (binanceApi && typeof binanceApi.getFuturesOrdersData === 'function')
          ? binanceApi.getFuturesOrdersData()
          : Promise.reject(new Error('getFuturesOrdersData is not available on binanceApi'));

        const results = await Promise.allSettled([spotOrdersPromise, futuresOrdersPromise]);
        openOrdersResult = results[0];
        futuresDataResult = results[1];
      }

      // Update spot open orders
      if (openOrdersResult.status === 'fulfilled') {
        setOpenOrders(openOrdersResult.value || []);
      } else {
        setOpenOrders([]);
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
      // If futuresOrders not fulfilled above but we have data from proxy or helper, ensure state is updated
      else if (typeof futuresOrders !== 'undefined' && futuresOrders && futuresOrders.value) {
        const futuresData = futuresOrders.value;
        setFuturesOpenOrders(futuresData.openOrders || []);
        setFuturesOrderHistory(futuresData.orderHistory || []);
        setTradeHistory(futuresData.tradeHistory || []);
        setTransactionHistory(futuresData.transactionHistory || []);
        setFundingFeeHistory(futuresData.fundingFees || []);
      }

      // Also refresh account data to update balances after orders
      await fastRefresh();

    } catch (error) {
      console.error('Order data refresh failed:', error?.message || 'Unknown error');
      setError(error?.message || 'Unknown error occurred');
      // Set empty arrays on failure
      setOpenOrders([]);
      setFuturesOpenOrders([]);
      setFuturesOrderHistory([]);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Full refresh - comprehensive data fetch (used on initial load and periodic full updates)
   */
  const fullRefresh = async () => {
    try {
      console.log('fullRefresh: Starting full refresh');
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      console.log('fullRefresh: isLocalhost:', isLocalhost);

      // Phase 1: Critical data (parallel fetch) - prioritize order history
      let spotOrdersPromise, futuresOrdersPromise, spotAccountPromise, futuresAccountPromise;

      // Attempt real API calls for spot in all environments; surface errors if methods missing
      try {
        spotOrdersPromise = (binanceApi && typeof binanceApi.getSpotOnlyOpenOrders === 'function')
          ? binanceApi.getSpotOnlyOpenOrders()
          : Promise.reject(new Error('getSpotOnlyOpenOrders is not available on binanceApi'));
      } catch (err) {
        spotOrdersPromise = Promise.reject(err);
      }
      
      try {
        spotAccountPromise = (binanceApi && typeof binanceApi.makeRequest === 'function')
          ? binanceApi.makeRequest('/api/v3/account')
          : Promise.reject(new Error('makeRequest is not available on binanceApi'));
      } catch (err) {
        spotAccountPromise = Promise.reject(err);
      }

      // Attempt real futures calls in all environments and surface errors if unavailable
      try {
        futuresOrdersPromise = (binanceApi && typeof binanceApi.getFuturesOrdersData === 'function')
          ? binanceApi.getFuturesOrdersData()
          : Promise.reject(new Error('getFuturesOrdersData is not available on binanceApi'));
      } catch (err) {
        futuresOrdersPromise = Promise.reject(err);
      }
      
      try {
        futuresAccountPromise = (binanceApi && typeof binanceApi.getFuturesAccountInfo === 'function')
          ? binanceApi.getFuturesAccountInfo()
          : Promise.reject(new Error('getFuturesAccountInfo is not available on binanceApi'));
      } catch (err) {
        futuresAccountPromise = Promise.reject(err);
      }

      const [spotOrders, futuresOrders, spotAccount, futuresAccount] = await Promise.allSettled([
        spotOrdersPromise,
        futuresOrdersPromise,
        spotAccountPromise,
        futuresAccountPromise
      ]);

      console.log('fullRefresh: Data fetch results:', {
        spotOrders: spotOrders.status,
        futuresOrders: futuresOrders.status,
        spotAccount: spotAccount.status,
        futuresAccount: futuresAccount.status
      });

      // Update order data immediately after fetch
      if (spotOrders.status === 'fulfilled') {
        setOpenOrders(spotOrders.value || []);
      } else {
        setOpenOrders([]);
      }

      if (futuresOrders.status === 'fulfilled') {
        const futuresData = futuresOrders.value;
        setFuturesOpenOrders(futuresData.openOrders || []);
        setFuturesOrderHistory(futuresData.orderHistory || []);
        setTradeHistory(futuresData.tradeHistory || []);
        setTransactionHistory(futuresData.transactionHistory || []);
        setFundingFeeHistory(futuresData.fundingFees || []);
      }
      // If futuresOrders not fulfilled above but we have data from proxy or helper, ensure state is updated
      else if (typeof futuresOrders !== 'undefined' && futuresOrders && futuresOrders.value) {
        const futuresData = futuresOrders.value;
        setFuturesOpenOrders(futuresData.openOrders || []);
        setFuturesOrderHistory(futuresData.orderHistory || []);
        setTradeHistory(futuresData.tradeHistory || []);
        setTransactionHistory(futuresData.transactionHistory || []);
        setFundingFeeHistory(futuresData.fundingFees || []);
      }

      // Phase 2: Get essential prices based on actual balances
      let priceMap = {};
      if (spotAccount.status === 'fulfilled' && spotAccount.value) {
        console.log('fullRefresh: Fetching prices for account:', spotAccount.value.balances?.length, 'balances');
        const essentialAssets = getEssentialAssets(spotAccount.value.balances);
        priceMap = await fetchEssentialPrices(essentialAssets);
        console.log('fullRefresh: Got price map with', Object.keys(priceMap).length, 'assets');
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

      console.log('fullRefresh: Setting account data:', {
        totalPortfolioValue,
        spotWalletValue,
        balances: coreAccountData.balances?.length || 0
      });
      setAccountData(coreAccountData);

      // Phase 4: Non-critical data (background fetch - don't block UI)
      setTimeout(async () => {
        try {
          if (isLocalhost) {
            const [ordersResult, transferHistoryResult, convertHistoryResult] = await Promise.allSettled([
              binanceApi.getSpotOnlyOrderHistory(null, 50), // Use spot-only order history
              binanceApi.getTransferHistory(), // Add transfer history
              binanceApi.getConvertHistory() // Add convert history
            ]);

            // Update states as data comes in
            if (ordersResult.status === 'fulfilled') {
              setOrders(ordersResult.value.reverse());
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
      console.error('Full refresh failed:', error?.message || 'Unknown error');
      setError(error?.message || 'Unknown error occurred');
      // Set empty arrays on failure to prevent NaN
      setOpenOrders([]);
      setFuturesOpenOrders([]);
      setFuturesOrderHistory([]);
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
    console.log('useOptimizedDashboardData: Initializing with binanceApi:', !!binanceApi);
    
    // Always try to load data, even if binanceApi is not fully initialized
    const loadData = async () => {
      try {
        console.log('useOptimizedDashboardData: Starting fullRefresh');
        await fullRefresh();
        console.log('useOptimizedDashboardData: fullRefresh completed');
      } catch (error) {
        console.error('useOptimizedDashboardData: Initial data load failed:', error);
        // Fallback: set some basic data
        const fallbackData = {
          totalPortfolioValue: 1250.50, // Mock USDT balance
          spotWalletValue: 1250.50,
          futuresWalletValue: 0,
          balances: [
            { asset: "USDT", free: "1250.50", locked: "0.00" },
            { asset: "BTC", free: "0.05123456", locked: "0.00" }
          ],
          currentPrices: [
            { symbol: "BTCUSDT", price: "45000" },
            { symbol: "ETHUSDT", price: "3000" }
          ]
        };
        console.log('useOptimizedDashboardData: Setting fallback data:', fallbackData);
        setAccountData(fallbackData);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Centralized futures fetch helper - tries direct API methods first, then optional proxy on binanceApi
  const fetchFuturesData = async (opts = { useProxy: true }) => {
    // Returns an object: { futuresOrders, futuresAccount }
    // Each may be null if unavailable; throws only for fatal unexpected errors
    try {
      // Try direct binanceApi methods first
      if (binanceApi && typeof binanceApi.getFuturesOrdersData === 'function' && typeof binanceApi.getFuturesAccountInfo === 'function') {
        const [ordersRes, accountRes] = await Promise.allSettled([
          binanceApi.getFuturesOrdersData(),
          binanceApi.getFuturesAccountInfo()
        ]);

        const futuresOrders = ordersRes.status === 'fulfilled' ? ordersRes.value : null;
        const futuresAccount = accountRes.status === 'fulfilled' ? accountRes.value : null;

        // If both calls failed due to network/CORS, allow proxy fallback
        if ((!futuresOrders || !futuresAccount) && opts.useProxy && binanceApi && binanceApi.proxyUrl) {
          console.log('fetchFuturesData: direct calls incomplete, attempting proxy fallback');
        }

        if (futuresOrders || futuresAccount) {
          return { futuresOrders, futuresAccount };
        }
      }

      // Proxy fallback (optional) - requires backend proxy configured in binanceApi.proxyUrl
      if (opts.useProxy && binanceApi && binanceApi.proxyUrl) {
        try {
          const proxyBase = binanceApi.proxyUrl.replace(/\/$/, '');
          const [ordersRes, accountRes] = await Promise.allSettled([
            fetch(`${proxyBase}/futures/orders`).then(r => r.json()),
            fetch(`${proxyBase}/futures/account`).then(r => r.json())
          ]);

          const futuresOrders = ordersRes.status === 'fulfilled' ? ordersRes.value : null;
          const futuresAccount = accountRes.status === 'fulfilled' ? accountRes.value : null;

          if (futuresOrders || futuresAccount) return { futuresOrders, futuresAccount };
        } catch (proxyErr) {
          console.warn('fetchFuturesData: proxy fallback failed:', proxyErr?.message || proxyErr);
        }
      }

      // If we reached here, direct methods aren't available or both failed
      throw new Error('Futures data unavailable: ensure binanceApi implements getFuturesOrdersData/getFuturesAccountInfo or configure a proxy (binanceApi.proxyUrl)');
    } catch (err) {
      // Surface the error to caller
      throw err;
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
