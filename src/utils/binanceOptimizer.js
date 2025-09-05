/**
 * Optimized Binance API Extensions - Senior Engineer Implementation
 * 
 * Performance optimizations for common operations:
 * 1. Selective symbol price fetching
 * 2. Cached frequently used data
 * 3. Parallel request batching
 * 4. Minimal data transfer
 */

export class BinancePerformanceOptimizer {
  constructor(binanceApi) {
    this.api = binanceApi;
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Get specific symbol prices in batch (much faster than all tickers)
   */
  async getSpecificPrices(symbols) {
    const cacheKey = symbols.sort().join(',');
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data;
    }

    // Avoid duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return await this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this._fetchSpecificPrices(symbols);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchSpecificPrices(symbols) {
    try {
      // Use ticker/price endpoint with specific symbols for speed
      const symbolsArray = symbols.filter(s => s && s.includes('USDT'));
      
      if (symbolsArray.length === 0) return {};

      const priceData = await this.api.makePublicRequest('/api/v3/ticker/price', {
        symbols: JSON.stringify(symbolsArray)
      });

      const priceMap = {};
      if (Array.isArray(priceData)) {
        priceData.forEach(ticker => {
          priceMap[ticker.symbol] = parseFloat(ticker.price);
        });
      }

      return priceMap;
    } catch (error) {
      return {};
    }
  }

  /**
   * Get only essential account info for fast updates
   */
  async getEssentialAccountInfo() {
    try {
      // Minimal account data - just balances and basic info
      const account = await this.api.makeRequest('/api/v3/account');
      
      // Filter out zero balances for better performance
      const significantBalances = account.balances.filter(balance => {
        const total = parseFloat(balance.free) + parseFloat(balance.locked);
        return total > 0.001;
      });

      return {
        balances: significantBalances,
        canTrade: account.canTrade,
        updateTime: account.updateTime,
        accountType: account.accountType
      };
    } catch (error) {
      throw new Error(`Essential account info failed: ${error.message}`);
    }
  }

  /**
   * Batch futures and spot data efficiently
   */
  async getBatchedAccountData() {
    try {
      const [spot, futures] = await Promise.allSettled([
        this.getEssentialAccountInfo(),
        this.api.getFuturesAccountInfo()
      ]);

      return {
        spot: spot.status === 'fulfilled' ? spot.value : null,
        futures: futures.status === 'fulfilled' ? futures.value : null,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Batched account data failed: ${error.message}`);
    }
  }

  /**
   * Clear cache when needed
   */
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache stats for monitoring
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

// Add optimized methods to existing BinanceAPI class
export const extendBinanceApiWithOptimizations = (binanceApi) => {
  const optimizer = new BinancePerformanceOptimizer(binanceApi);

  // Add optimized methods to the existing API instance
  binanceApi.getOptimizedPrices = optimizer.getSpecificPrices.bind(optimizer);
  binanceApi.getEssentialAccountInfo = optimizer.getEssentialAccountInfo.bind(optimizer);
  binanceApi.getBatchedAccountData = optimizer.getBatchedAccountData.bind(optimizer);
  binanceApi.clearPriceCache = optimizer.clearCache.bind(optimizer);
  binanceApi.getCacheStats = optimizer.getCacheStats.bind(optimizer);

  // Add fast refresh method
  binanceApi.fastRefresh = async function() {
    const startTime = Date.now();
    
    try {
      // Get only essential data
      const [account, openOrders] = await Promise.allSettled([
        this.getEssentialAccountInfo(),
        this.getOpenOrders()
      ]);

      // Get prices only for assets with balances
      const assets = account.status === 'fulfilled' && account.value ? 
        account.value.balances.map(b => `${b.asset}USDT`).filter(s => !s.startsWith('USDT')) :
        ['BTCUSDT', 'ETHUSDT'];

      const prices = await this.getOptimizedPrices(assets.slice(0, 10)); // Limit to 10 most important

      const result = {
        account: account.status === 'fulfilled' ? account.value : null,
        openOrders: openOrders.status === 'fulfilled' ? openOrders.value : [],
        prices,
        loadTime: Date.now() - startTime,
        optimized: true
      };

      return result;
    } catch (error) {
      throw new Error(`Fast refresh failed: ${error.message}`);
    }
  };

  return binanceApi;
};
