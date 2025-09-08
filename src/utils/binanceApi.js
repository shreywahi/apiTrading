import axios from 'axios';
import CryptoJS from 'crypto-js';

// Multiple API endpoints for fallback
const API_ENDPOINTS = {
  LOCAL_PROXY: '/api/binance',
  FUTURES_DIRECT: 'https://fapi.binance.com',
  TESTNET_DIRECT: 'https://testnet.binance.vision'
};

// Popular futures symbols used throughout the API calls
const POPULAR_FUTURES_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'BCHUSDT', 'AAVEUSDT', 'PAXGUSDT'
];

class BinanceAPI {
  constructor(apiKey, apiSecret, useTestnet = false, useMockData = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.useTestnet = useTestnet;
    this.useMockData = useMockData;
    this.workingEndpoint = null; // Cache the working endpoint
    this.timeOffset = 0; // Server time offset
  }

  // Sync server time to avoid timestamp issues
  async syncServerTime() {
    try {
      const serverTimeEndpoint = this.useTestnet ? 
        `${API_ENDPOINTS.TESTNET_DIRECT}/api/v3/time` : 
        `${API_ENDPOINTS.LOCAL_PROXY}/api/v3/time`;
      
      const response = await axios.get(serverTimeEndpoint, { timeout: 5000 });
      const serverTime = response.data.serverTime;
      const localTime = Date.now();
      this.timeOffset = serverTime - localTime;
      console.log('Server time synced. Offset:', this.timeOffset);
    } catch (error) {
      console.warn('Failed to sync server time, using local time:', error.message);
      this.timeOffset = 0;
    }
  }

  // Check API key permissions by testing different endpoints
  async checkApiPermissions() {
    const permissions = {
      spot: false,
      futures: false,
      margin: false
    };
    
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    try {
      if (isLocalhost) {
        // Test spot trading permissions
        await this.makeRequest('/api/v3/account');
        permissions.spot = true;
      }
    } catch (error) {
      console.warn('❌ Spot trading permissions: FAILED -', error.message);
    }

    try {
      // Test futures trading permissions
      await this.makeFuturesRequest('/fapi/v2/account', 'GET');
      permissions.futures = true;
    } catch (error) {
      console.warn('❌ Futures trading permissions: FAILED -', error.message);
      if (error.message.includes('403')) {
        console.warn('💡 To enable futures trading:');
        console.warn('   1. Go to Binance API Management');
        console.warn('   2. Edit your API key');
        console.warn('   3. Enable "Enable Futures" permission');
        console.warn('   4. Add IP address if using IP restrictions');
      }
    }

    return permissions;
  }

  // Get synchronized timestamp
  getTimestamp() {
    return Date.now() + this.timeOffset;
  }

  // Generate mock data for demo purposes
  getMockAccountData() {
    return {
      accountType: "SPOT",
      balances: [
        { asset: "USDT", free: "1250.50", locked: "0.00" },
        { asset: "BTC", free: "0.05123456", locked: "0.00" },
        { asset: "ETH", free: "2.75891234", locked: "0.50000000" },
        { asset: "BNB", free: "15.25", locked: "10.00" },
        { asset: "ADA", free: "500.00", locked: "0.00" },
        { asset: "DOT", free: "0.00", locked: "100.00" },
        { asset: "SOL", free: "8.50", locked: "20.00" },
        { asset: "MATIC", free: "150.75", locked: "0.00" }
      ],
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      updateTime: Date.now()
    };
  }

  getMockOrders() {
    const now = Date.now();
    return [
      {
        orderId: 123456789,
        symbol: "BTCUSDT",
        status: "FILLED",
        side: "BUY",
        type: "LIMIT",
        origQty: "0.001",
        executedQty: "0.001",
        price: "45000.00",
        time: now - 86400000, // 1 day ago
      },
      {
        orderId: 123456790,
        symbol: "ETHUSDT",
        status: "FILLED",
        side: "SELL",
        type: "MARKET",
        origQty: "0.5",
        executedQty: "0.5",
        price: "0.00000000",
        time: now - 3600000, // 1 hour ago
      },
      {
        orderId: 123456791,
        symbol: "ADAUSDT",
        status: "PARTIALLY_FILLED",
        side: "BUY",
        type: "LIMIT",
        origQty: "1000",
        executedQty: "500",
        price: "0.45",
        time: now - 1800000, // 30 minutes ago
      },
      {
        orderId: 123456793,
        symbol: "BNBUSDT",
        status: "FILLED",
        side: "BUY",
        type: "LIMIT",
        origQty: "5",
        executedQty: "5",
        price: "320.50",
        time: now - 7200000, // 2 hours ago
      },
      {
        orderId: 123456794,
        symbol: "DOTUSDT",
        status: "CANCELED",
        side: "SELL",
        type: "LIMIT",
        origQty: "100",
        executedQty: "0",
        price: "6.75",
        time: now - 10800000, // 3 hours ago
      }
    ];
  }

  getMockOpenOrders() {
    return [
      {
        orderId: 123456792,
        symbol: "BNBUSDT",
        status: "NEW",
        side: "BUY",
        type: "LIMIT",
        origQty: "10",
        executedQty: "0",
        price: "300.00",
        time: Date.now() - 600000, // 10 minutes ago
      },
      {
        orderId: 123456795,
        symbol: "SOLUSDT",
        status: "NEW",
        side: "SELL",
        type: "LIMIT",
        origQty: "20",
        executedQty: "0",
        price: "25.75",
        time: Date.now() - 1200000, // 20 minutes ago
      }
    ];
  }

  // Generate signature for authenticated requests
  generateSignature(queryString) {
    return CryptoJS.HmacSHA256(queryString, this.apiSecret).toString();
  }

  // Create authenticated request headers
  getHeaders() {
    const headers = {
      'X-MBX-APIKEY': this.apiKey,
      'Content-Type': 'application/json',
    };
    
    return headers;
  }

  // Helper method for public endpoints (no authentication needed)
  async makePublicRequest(endpoint, params = {}) {
    // Public endpoints don't need authentication
    const queryParams = new URLSearchParams(params);

    // Try different endpoints in order of preference - try direct API first for spot
    const endpointsToTry = this.useTestnet
      ? [API_ENDPOINTS.TESTNET_DIRECT]
      : [API_ENDPOINTS.LOCAL_PROXY];

    let lastError = null;

    // Try each endpoint
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isLocalhost) {
      for (const baseUrl of endpointsToTry) {
        try {
          const url = `${baseUrl}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
          
          const response = await axios.get(url, { 
            timeout: 15000 
          });
          
          return response.data;
        } catch (error) {
          console.warn(`❌ Public API failed with ${baseUrl}:`, error.message);
          lastError = error;
          continue;
        }
      }
    }

    // If all methods failed, throw the last error
    throw new Error(`Public API Error: ${lastError.message}`);
  }

  // Helper method for public futures endpoints (no authentication needed)
  async makePublicFuturesRequest(endpoint, params = {}) {
    // Public futures endpoints don't need authentication
    const queryParams = new URLSearchParams(params);
    
    // Try futures endpoints in order of preference
    const endpointsToTry = [API_ENDPOINTS.FUTURES_DIRECT];

    let lastError = null;

    // Try each endpoint
    for (const baseUrl of endpointsToTry) {
      try {
        const url = `${baseUrl}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        const response = await axios.get(url, { 
          timeout: 15000 
        });
        
        return response.data;
      } catch (error) {
        console.warn(`❌ Public Futures API failed with ${baseUrl}:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If all methods failed, throw the last error
    throw new Error(`Public Futures API Error: ${lastError.message}`);
  }

  // Helper method to try multiple endpoints until one works
  async makeRequest(endpoint, params = {}) {
    // Return mock data if in demo mode
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (endpoint === '/api/v3/account') return this.getMockAccountData();
      if (endpoint === '/api/v3/allOrders') return this.getMockOrders();
      if (endpoint === '/api/v3/openOrders') return this.getMockOpenOrders();
      
      return {};
    }

    // Validate API credentials
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key and secret are required');
    }

    if (this.apiKey.length < 20 || this.apiSecret.length < 20) {
      throw new Error('API key and secret appear to be invalid (too short)');
    }

    // Sync server time if we haven't done it yet
    if (this.timeOffset === undefined) {
      await this.syncServerTime();
    }

    const timestamp = this.getTimestamp();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp,
      recvWindow: 60000
    });

    const signature = this.generateSignature(queryParams.toString());
    queryParams.append('signature', signature);

    // Try different endpoints in order of preference - use direct API for spot with fallback
    const endpointsToTry = this.useTestnet ? [API_ENDPOINTS.TESTNET_DIRECT] : [API_ENDPOINTS.LOCAL_PROXY];

    // If we have a working endpoint from previous calls, try it first
    if (this.workingEndpoint && !endpointsToTry.includes(this.workingEndpoint)) {
      endpointsToTry.unshift(this.workingEndpoint);
    }

    let lastError = null;

    // Try each endpoint
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isLocalhost) {
      for (const baseUrl of endpointsToTry) {
        try {
          let response;
          const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;
          response = await axios.get(url, { 
            headers: this.getHeaders(),
            timeout: 15000 
          });
          // If successful, cache this endpoint
          this.workingEndpoint = baseUrl;
          return response.data;
        } catch (error) {
          lastError = error;
          continue;
        }
      }
    }

    // If all methods failed, throw the last error
    this.handleApiError(lastError);
  }

  // Helper method for futures API requests
  async makeFuturesRequest(endpoint, method = 'GET', params = {}) {
    // Return mock data if in demo mode
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    }

    // Validate API credentials
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key and secret are required for futures');
    }

    // Sync server time if we haven't done it yet
    if (this.timeOffset === undefined) {
      await this.syncServerTime();
    }

    const timestamp = this.getTimestamp();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp,
      recvWindow: 60000
    });

    const signature = this.generateSignature(queryParams.toString());
    queryParams.append('signature', signature);

    // Try futures endpoints with better fallback handling
    const endpointsToTry = [API_ENDPOINTS.FUTURES_DIRECT];
    let lastError = null;
    let proxyFailed = false;

    for (const baseUrl of endpointsToTry) {
      try {
        // For proxy endpoints, strip /fapi from the beginning of endpoint
        // For direct endpoints, keep the full endpoint
        let finalEndpoint = endpoint;
        
        const url = `${baseUrl}${finalEndpoint}`;
        
        let response;
        const axiosConfig = { 
          headers: this.getHeaders(),
          timeout: 15000 
        };

        if (method === 'POST') {
          response = await axios.post(url, queryParams.toString(), {
            ...axiosConfig,
            headers: {
              ...axiosConfig.headers,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
        } else if (method === 'DELETE') {
          response = await axios.delete(`${url}?${queryParams.toString()}`, axiosConfig);
        } else {
          // GET method (default)
          response = await axios.get(`${url}?${queryParams.toString()}`, axiosConfig);
        }
        return response.data;
      } catch (error) {
        console.warn(`❌ Futures failed with ${baseUrl}:`, error.message);
        
        lastError = error;
        continue;
      }
    }

    // If all attempts failed and proxy returned 403, provide specific guidance
    if (proxyFailed) {
      console.error('🚨 Local proxy failed with 403 - possible causes:');
      console.error('  1. API key missing futures trading permissions');
      console.error('  2. IP whitelist restrictions');
      console.error('  3. Proxy configuration issues');
    }

    throw this.handleApiError(lastError);
  }

  // Helper method for POST requests (orders, etc.)
  async makePostRequest(endpoint, params = {}, isFutures = false) {
    // Return mock data if in demo mode
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { orderId: Math.floor(Math.random() * 1000000), status: 'NEW' };
    }

    // Validate API credentials
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key and secret are required');
    }

    // Sync server time if needed
    if (this.timeOffset === undefined) {
      await this.syncServerTime();
    }

    const timestamp = this.getTimestamp();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp,
      recvWindow: 60000
    });

    const signature = this.generateSignature(queryParams.toString());
    queryParams.append('signature', signature);

    // Choose endpoints based on spot/futures - for spot use proxy first (CORS), for futures use direct
    const endpointsToTry = isFutures ? [API_ENDPOINTS.FUTURES_DIRECT] : [API_ENDPOINTS.LOCAL_PROXY];

    let lastError = null;

    for (const baseUrl of endpointsToTry) {
      try {
        // For direct endpoints, use the full endpoint path
        let finalEndpoint = endpoint;

        const url = `${baseUrl}${finalEndpoint}`;
        
        const response = await axios.post(url, queryParams.toString(), { 
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000 
        });
        
        return response.data;
      } catch (error) {
        console.warn(`❌ POST ${isFutures ? 'Futures' : 'Spot'} failed with ${baseUrl}:`, error.message);
        lastError = error;
        continue;
      }
    }

    throw this.handleApiError(lastError);
  }

  // Helper method for DELETE requests (cancel orders, etc.)
  async makeDeleteRequest(endpoint, params = {}, isFutures = false) {
    // Return mock data if in demo mode
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { orderId: params.orderId, status: 'CANCELED' };
    }

    // Validate API credentials
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key and secret are required');
    }

    // Sync server time if needed
    if (this.timeOffset === undefined) {
      await this.syncServerTime();
    }

    const timestamp = this.getTimestamp();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp,
      recvWindow: 60000
    });

    const signature = this.generateSignature(queryParams.toString());
    queryParams.append('signature', signature);

    // Choose endpoints based on spot/futures - for spot use proxy first (CORS), for futures use direct
    const endpointsToTry = isFutures ? [API_ENDPOINTS.FUTURES_DIRECT] : [API_ENDPOINTS.LOCAL_PROXY];

    let lastError = null;

    for (const baseUrl of endpointsToTry) {
      try {
        // For direct endpoints, use the full endpoint path
        let finalEndpoint = endpoint;

        const url = `${baseUrl}${finalEndpoint}?${queryParams.toString()}`;
        
        const response = await axios.delete(url, { 
          headers: this.getHeaders(),
          timeout: 15000 
        });
        
        return response.data;
      } catch (error) {
        console.warn(`❌ DELETE ${isFutures ? 'Futures' : 'Spot'} failed with ${baseUrl}:`, error.message);
        lastError = error;
        continue;
      }
    }

    throw this.handleApiError(lastError);
  }

  handleApiError(error) {
    console.error('API Error Details:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message
    });
    
    if (error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    } else if (error.response?.status === 400) {
      throw new Error('Invalid API request. Please check your API credentials and permissions.');
    } else if (error.response?.status === 403) {
      console.warn('⚠️ 403 Forbidden - This could indicate:');
      console.warn('  - API key missing required permissions for futures trading');
      console.warn('  - API key restrictions (IP whitelisting, etc.)');
      console.warn('  - Local proxy authentication issues');
      throw new Error('Access forbidden. Please ensure your API key has futures trading permissions and check IP restrictions.');
    } else if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please check your API credentials.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your internet connection');
    } else if (error.message.includes('Network Error')) {
      throw new Error('CORS_ERROR');
    }
    throw new Error(`API Error: ${error.message}`);
  }

  // Get comprehensive account information (spot + futures) using Binance's direct values
  async getEnhancedAccountInfo() {
    try {
      console.log('Getting enhanced account info with direct Binance values...');
      console.log('API Key (first 10 chars):', this.apiKey?.substring(0, 10));
      console.log('API Secret length:', this.apiSecret?.length);
      
      const [spotAccount, futuresAccount, walletStatus] = await Promise.allSettled([
        this.makeRequest('/api/v3/account'),
        this.getFuturesAccountInfo(),
        this.getAccountSnapshot() // Get direct portfolio values from Binance
      ]);
      
      const result = {
        spot: spotAccount.status === 'fulfilled' ? spotAccount.value : null,
        futures: futuresAccount.status === 'fulfilled' ? futuresAccount.value : null,
        walletSnapshot: walletStatus.status === 'fulfilled' ? walletStatus.value : null
      };
      
      console.log('Enhanced account info results:', {
        spotSuccess: spotAccount.status === 'fulfilled',
        futuresSuccess: futuresAccount.status === 'fulfilled',
        walletSnapshotSuccess: walletStatus.status === 'fulfilled',
        spotBalances: result.spot?.balances?.length || 0,
        spotAccountData: result.spot,
        futuresAccountData: result.futures,
        walletSnapshotData: result.walletSnapshot
      });
      
      // Log any errors from failed requests
      if (spotAccount.status === 'rejected') {
        console.error('Spot account request failed:', spotAccount.reason);
      }
      if (futuresAccount.status === 'rejected') {
        console.error('Futures account request failed:', futuresAccount.reason);
      }
      if (walletStatus.status === 'rejected') {
        console.error('Wallet status request failed:', walletStatus.reason);
      }
      
      // Get current prices for USD value calculations (use 24hr ticker for all symbols at once)
      console.log('Fetching all ticker prices for USD calculations...');
      
      let allPrices = [];
      try {
        // Use symbol price ticker endpoint for more accurate real-time prices
        const allTickers = await this.makePublicRequest('/api/v3/ticker/price');
        if (allTickers && Array.isArray(allTickers)) {
          allPrices = allTickers.filter(ticker => ticker.symbol.endsWith('USDT') || ticker.symbol.endsWith('BUSD'));
          console.log(`Fetched ${allPrices.length} price tickers (USDT/BUSD pairs)`);
        }
      } catch (error) {
        console.warn('Failed to fetch all price tickers, trying 24hr ticker:', error.message);
        
        // Fallback to 24hr ticker
        try {
          const allTickers = await this.makePublicRequest('/api/v3/ticker/24hr');
          if (allTickers && Array.isArray(allTickers)) {
            allPrices = allTickers.filter(ticker => ticker.symbol.endsWith('USDT') || ticker.symbol.endsWith('BUSD'));
            console.log(`Fetched ${allPrices.length} 24hr tickers (USDT/BUSD pairs)`);
          }
        } catch (fallbackError) {
          console.warn('24hr ticker also failed, using minimal price set:', fallbackError.message);
          allPrices = [];
        }
      }
      
      const priceMap = {};
      const currentPrices = [];
      
      allPrices.forEach(ticker => {
        const symbol = ticker.symbol;
        if (symbol.endsWith('USDT')) {
          const asset = symbol.replace('USDT', '');
          const price = parseFloat(ticker.lastPrice || ticker.price);
          if (price > 0) {
            priceMap[asset] = price;
            currentPrices.push({
              symbol: symbol,
              price: price.toString()
            });
          }
        }
      });
      
      console.log('Successfully fetched prices for', Object.keys(priceMap).length, 'assets');
      if (priceMap['XRP']) {
        console.log('XRP price available:', priceMap['XRP']);
      }
      if (priceMap['BTC']) {
        console.log('BTC price available:', priceMap['BTC']);
      }
      
      // Add current prices to account data for individual asset USD display
      result.currentPrices = currentPrices;
      
      // Get Binance's exact portfolio values using multiple API endpoints
      let totalPortfolioValue = 0;
      let spotWalletValue = 0;
      let futuresWalletValue = 0;
      
      // Get futures wallet value directly (this usually works reliably)
      if (result.futures && result.futures.totalWalletBalance) {
        futuresWalletValue = parseFloat(result.futures.totalWalletBalance);
        console.log('Futures wallet balance from API:', futuresWalletValue);
      }
      
      // Try to get exact spot wallet value using Binance's APIs
      try {
        console.log('Attempting to get exact spot wallet value from Binance...');
        
        // Method 1: Try account snapshot with exact USD value
        if (result.walletSnapshot && result.walletSnapshot.totalAssetOfBtc) {
          const btcPrice = await this.makePublicRequest('/api/v3/ticker/price', { symbol: 'BTCUSDT' });
          if (btcPrice && btcPrice.price) {
            const calculatedSpotValue = parseFloat(result.walletSnapshot.totalAssetOfBtc) * parseFloat(btcPrice.price);
            console.log('Spot value from snapshot:', calculatedSpotValue);
            spotWalletValue = calculatedSpotValue;
          }
        }
        
        // Method 2: Try capital config for exact values
        if (spotWalletValue === 0) {
          try {
            const capitalConfig = await this.makeRequest('/sapi/v1/capital/config/getall');
            if (capitalConfig && Array.isArray(capitalConfig)) {
              console.log('Using capital config for exact spot value calculation');
              
              let exactSpotValue = 0;
              for (const asset of capitalConfig) {
                const totalBalance = parseFloat(asset.free) + parseFloat(asset.locked);
                if (totalBalance > 0.00001) {
                  if (['USDT', 'BUSD', 'USDC', 'FDUSD'].includes(asset.coin)) {
                    exactSpotValue += totalBalance;
                    console.log(`${asset.coin}: $${totalBalance.toFixed(6)}`);
                  } else if (priceMap[asset.coin]) {
                    const assetValue = totalBalance * priceMap[asset.coin];
                    exactSpotValue += assetValue;
                    console.log(`${asset.coin}: ${totalBalance} * $${priceMap[asset.coin]} = $${assetValue.toFixed(6)}`);
                  }
                }
              }
              spotWalletValue = exactSpotValue;
              console.log('Exact spot wallet value from capital config:', spotWalletValue);
            }
          } catch (capitalError) {
            console.warn('Capital config failed:', capitalError.message);
          }
        }
        
        // Method 3: Try to get the exact total portfolio value using different API endpoints
        try {
          // Try wallet status endpoint which might give us the total
          const walletStatus = await this.makeRequest('/sapi/v1/account/status');
          console.log('Wallet status:', walletStatus);
          
          // Skip getUserAsset endpoint as it may not be available for all accounts
          
        } catch (statusError) {
          console.warn('Additional portfolio APIs failed:', statusError.message);
        }
        
      } catch (error) {
        console.warn('Failed to get exact values from Binance APIs:', error.message);
      }
      
      // Calculate total portfolio value from the components we have
      totalPortfolioValue = spotWalletValue + futuresWalletValue;
      
      console.log('Portfolio calculation summary:', {
        spotWallet: spotWalletValue,
        futuresWallet: futuresWalletValue,
        total: totalPortfolioValue,
        source: 'Direct Binance APIs'
      });
      
      // Final fallback: calculate basic value only if everything else fails
      if (totalPortfolioValue === 0) {
        console.warn('Using final fallback calculation - no direct Binance values available');
        totalPortfolioValue = this.calculateBasicPortfolioValue(result.spot, result.futures);
      }
      
      result.totalPortfolioValue = totalPortfolioValue;
      result.spotWalletValue = spotWalletValue;
      result.futuresWalletValue = futuresWalletValue;
      console.log('Final values:', { totalPortfolioValue, spotWalletValue, futuresWalletValue });
      
      return result;
    } catch (error) {
      console.warn('Failed to get enhanced account info:', error.message);
      // Fallback to basic spot account
      try {
        const spotAccount = await this.makeRequest('/api/v3/account');
        const basicValue = this.calculateBasicPortfolioValue(spotAccount, null);
        return {
          spot: spotAccount,
          futures: null,
          walletSnapshot: null,
          totalPortfolioValue: basicValue
        };
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  // Get account snapshot with direct portfolio values from Binance
  async getAccountSnapshot() {
    try {
      console.log('Fetching account snapshot for exact portfolio values...');
      
      // Method 1: Try the account snapshot endpoint for spot portfolio
      const snapshot = await this.makeRequest('/sapi/v1/accountSnapshot', { 
        type: 'SPOT',
        limit: 1 
      });
      
      if (snapshot && snapshot.snapshotVos && snapshot.snapshotVos.length > 0) {
        const latestSnapshot = snapshot.snapshotVos[0];
        console.log('Got account snapshot:', latestSnapshot);
        return latestSnapshot.data;
      }
      
      console.warn('No snapshot data available, trying alternative methods...');
      
      // Method 2: Try capital config endpoint as alternative
      try {
        const capitalConfig = await this.makeRequest('/sapi/v1/capital/config/getall');
        console.log('Got capital config with', capitalConfig?.length || 0, 'assets');
        
        // Just return the raw data, let the main function calculate
        return { 
          source: 'capital-config',
          assets: capitalConfig 
        };
        
      } catch (altError) {
        console.warn('Capital config endpoint also failed:', altError.message);
      }
      
      // Method 3: Try account API summary which might have total USD value
      try {
        const accountSummary = await this.makeRequest('/sapi/v1/accountSnapshot', { 
          type: 'SPOT',
          limit: 5 
        });
        console.log('Account summary attempt:', accountSummary);
        
        if (accountSummary && accountSummary.snapshotVos) {
          // Find the most recent snapshot with totalAssetOfUsd or similar
          const recentSnapshot = accountSummary.snapshotVos.find(snap => 
            snap.data && (snap.data.totalAssetOfUsd || snap.data.totalAssetOfBtc)
          );
          
          if (recentSnapshot) {
            console.log('Found snapshot with USD/BTC value:', recentSnapshot.data);
            return recentSnapshot.data;
          }
        }
        
      } catch (summaryError) {
        console.warn('Account summary failed:', summaryError.message);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get account snapshot:', error.message);
      return null;
    }
  }

  // Calculate total portfolio value using current prices
  calculatePortfolioValue(spotAccount, futuresAccount, prices) {
    let totalValue = 0;
    
    console.log('Calculating portfolio value with:', {
      spotBalances: spotAccount?.balances?.length || 0,
      futuresAssets: futuresAccount?.assets?.length || 0,
      pricesCount: prices?.length || 0
    });
    
    // Create price lookup map
    const priceMap = {};
    if (prices && Array.isArray(prices)) {
      prices.forEach(price => {
        if (price.symbol && price.price) {
          priceMap[price.symbol] = parseFloat(price.price);
        }
      });
    }
    
    console.log('Price map sample:', Object.keys(priceMap).slice(0, 5));
    
    // Calculate spot account value
    if (spotAccount && spotAccount.balances) {
      let spotValue = 0;
      spotAccount.balances.forEach(balance => {
        const amount = parseFloat(balance.free) + parseFloat(balance.locked);
        if (amount > 0.0001) { // Ignore dust amounts
          const asset = balance.asset;
          let assetValue = 0;
          
          if (asset === 'USDT' || asset === 'BUSD' || asset === 'USDC') {
            // Stablecoins = $1
            assetValue = amount;
          } else {
            // Try to find price in USDT pair
            const usdtSymbol = `${asset}USDT`;
            const btcSymbol = `${asset}BTC`;
            
            if (priceMap[usdtSymbol]) {
              assetValue = amount * priceMap[usdtSymbol];
            } else if (priceMap[btcSymbol] && priceMap['BTCUSDT']) {
              // Convert via BTC
              assetValue = amount * priceMap[btcSymbol] * priceMap['BTCUSDT'];
            }
          }
          
          if (assetValue > 0.01) { // Only log significant values
            console.log(`${asset}: ${amount} = $${assetValue.toFixed(2)}`);
          }
          spotValue += assetValue;
        }
      });
      totalValue += spotValue;
      console.log('Total spot value:', spotValue);
    }
    
    // Calculate futures account value
    if (futuresAccount && futuresAccount.assets) {
      let futuresValue = 0;
      futuresAccount.assets.forEach(asset => {
        const amount = parseFloat(asset.walletBalance);
        if (amount > 0.0001) {
          let assetValue = 0;
          
          if (asset.asset === 'USDT' || asset.asset === 'BUSD') {
            assetValue = amount;
          } else {
            const usdtSymbol = `${asset.asset}USDT`;
            if (priceMap[usdtSymbol]) {
              assetValue = amount * priceMap[usdtSymbol];
            }
          }
          
          if (assetValue > 0.01) {
            console.log(`Futures ${asset.asset}: ${amount} = $${assetValue.toFixed(2)}`);
          }
          futuresValue += assetValue;
        }
      });
      totalValue += futuresValue;
      console.log('Total futures value:', futuresValue);
    }
    
    console.log('Final total portfolio value:', totalValue);
    return totalValue;
  }

  // Calculate basic portfolio value using only stablecoins (fallback when no prices available)
  calculateBasicPortfolioValue(spotAccount, futuresAccount) {
    let totalValue = 0;
    
    console.log('Calculating basic portfolio value (stablecoins only)');
    
    // Calculate spot account value (stablecoins only)
    if (spotAccount && spotAccount.balances) {
      let spotValue = 0;
      spotAccount.balances.forEach(balance => {
        const amount = parseFloat(balance.free) + parseFloat(balance.locked);
        if (amount > 0.0001) {
          const asset = balance.asset;
          
          if (asset === 'USDT' || asset === 'BUSD' || asset === 'USDC' || 
              asset === 'TUSD' || asset === 'USDP' || asset === 'DAI') {
            // Stablecoins = $1
            spotValue += amount;
            console.log(`Spot ${asset}: ${amount} = $${amount.toFixed(2)}`);
          }
        }
      });
      totalValue += spotValue;
      console.log('Total spot stablecoin value:', spotValue);
    }
    
    // Calculate futures account value (stablecoins only)
    if (futuresAccount && futuresAccount.assets) {
      let futuresValue = 0;
      futuresAccount.assets.forEach(asset => {
        const amount = parseFloat(asset.walletBalance);
        if (amount > 0.0001) {
          if (asset.asset === 'USDT' || asset.asset === 'BUSD' || asset.asset === 'USDC' ||
              asset.asset === 'TUSD' || asset.asset === 'USDP' || asset.asset === 'DAI') {
            futuresValue += amount;
            console.log(`Futures ${asset.asset}: ${amount} = $${amount.toFixed(2)}`);
          }
        }
      });
      totalValue += futuresValue;
      console.log('Total futures stablecoin value:', futuresValue);
    }
    
    console.log('Final basic portfolio value:', totalValue);
    return totalValue;
  }

  // Get futures account information with P&L data
  async getFuturesAccountInfo() {
    try {
      const futuresAccount = await this.makeFuturesRequest('/fapi/v2/account', 'GET');
      
      // Calculate total unrealized PnL from positions
      if (futuresAccount && futuresAccount.positions) {
        let totalUnrealizedPnl = 0;
        futuresAccount.positions.forEach(position => {
          if (parseFloat(position.positionAmt) !== 0) {
            totalUnrealizedPnl += parseFloat(position.unrealizedProfit || 0);
          }
        });
        futuresAccount.totalUnrealizedPnl = totalUnrealizedPnl;
      }
      
      return futuresAccount;
    } catch (error) {
      console.warn('Futures account not available or not enabled:', error.message);
      
      // If it's a permission error, provide guidance but return null
      if (error.message.includes('403') || error.message.includes('Access forbidden')) {
        console.warn('💡 Futures trading appears to be disabled for this API key');
        console.warn('   P&L calculations will only include spot holdings');
        console.warn('   To enable futures: Go to Binance API Management > Edit API Key > Enable Futures');
      }
      
      return null;
    }
  }

  // Get futures income/PnL history
  async getFuturesIncome(symbol = null, incomeType = null, limit = 100) {
    try {
      const params = { limit };
      if (symbol) params.symbol = symbol;
      if (incomeType) params.incomeType = incomeType; // REALIZED_PNL, FUNDING_FEE, etc.
      
      const income = await this.makeFuturesRequest('/fapi/v1/income', 'GET', params);
      return income || [];
    } catch (error) {
      console.warn('Failed to get futures income:', error.message);
      return [];
    }
  }

  // Get current prices for all symbols
  async getCurrentPrices(symbols = []) {
    try {
      if (symbols.length === 0) {
        // Get all symbol prices - this is a public endpoint, no auth needed
        return await this.makePublicRequest('/api/v3/ticker/price');
      } else {
        // Get specific symbol prices
        const prices = await Promise.allSettled(
          symbols.map(symbol => this.makePublicRequest('/api/v3/ticker/price', { symbol }))
        );
        return prices
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
      }
    } catch (error) {
      console.warn('Failed to get current prices:', error.message);
      return [];
    }
  }

  // Get 24h ticker statistics
  async get24hTicker(symbol) {
    try {
      const params = symbol ? { symbol } : {};
      return await this.makePublicRequest('/api/v3/ticker/24hr', params);
    } catch (error) {
      console.warn('Failed to get 24h ticker:', error.message);
      return null;
    }
  }

  // Get futures orders for a symbol
  async getFuturesOrders(symbol = null, limit = 50) {
    try {
      if (!symbol) {
        // Strategy: Try to get comprehensive order history from multiple sources
        const allOrders = [];
        
        // 1. Get futures account first to find active positions
        const futuresAccount = await this.getFuturesAccountInfo();
        let symbolsToTry = [];
        
        if (futuresAccount && futuresAccount.positions) {
          // Get all symbols that have ever had positions (including zero positions)
          symbolsToTry = futuresAccount.positions
            .map(pos => pos.symbol)
            .filter((symbol, index, self) => self.indexOf(symbol) === index) // unique symbols
            .slice(0, 10); // limit to avoid too many API calls
        }
        
        // 2. Add comprehensive futures symbols list
        symbolsToTry = [...new Set([...symbolsToTry, ...POPULAR_FUTURES_SYMBOLS])].slice(0, 25);
        
        // 3. Fetch orders for each symbol
        for (const futuresSymbol of symbolsToTry) {
          try {
            const orders = await this.makeFuturesRequest('/fapi/v1/allOrders', 'GET', { 
              symbol: futuresSymbol, 
              limit: Math.min(100, Math.ceil(limit / symbolsToTry.length) + 10)
            });
            if (orders && orders.length > 0) {
              // Mark as futures orders
              const futuresOrders = orders.map(order => ({
                ...order,
                isFutures: true,
                market: 'Futures'
              }));
              allOrders.push(...futuresOrders);
            }
          } catch (error) {
            console.warn(`Failed to get orders for ${futuresSymbol}:`, error.message);
            continue;
          }
          
          // Stop if we have enough orders
          if (allOrders.length >= limit) break;
        }
        
        // 4. Sort by time (most recent first) and return limited results
        const sortedOrders = allOrders
          .sort((a, b) => (b.time || b.updateTime || 0) - (a.time || a.updateTime || 0))
          .slice(0, limit);
        return sortedOrders;
      }
      
      // Get orders for specific symbol
      const orders = await this.makeFuturesRequest('/fapi/v1/allOrders', 'GET', { symbol, limit });
      return orders.map(order => ({
        ...order,
        isFutures: true,
        market: 'Futures'
      }));
    } catch (error) {
      console.warn('Failed to get futures orders:', error.message);
      return [];
    }
  }

  // Get all orders (both spot and futures) - comprehensive history
  async getAllOrders(symbol = null, limit = 100) {
    try {
      const allOrders = [];
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago for better coverage
            
      // If symbol is provided, get orders for that specific symbol from both markets
      if (symbol) {
        const [spotOrders, futuresOrders] = await Promise.allSettled([
          this.getRecentSpotOrders(symbol, limit, thirtyDaysAgo),
          this.getRecentFuturesOrders(symbol, limit, thirtyDaysAgo)
        ]);
        
        if (spotOrders.status === 'fulfilled') {
          allOrders.push(...spotOrders.value.map(order => ({
            ...order,
            market: 'Spot'
          })));
        }
        
        if (futuresOrders.status === 'fulfilled') {
          allOrders.push(...futuresOrders.value);
        }
        
        // Filter by time and sort (most recent first)
        const recentOrders = allOrders.filter(order => 
          (order.time || order.updateTime || 0) >= thirtyDaysAgo
        );
        recentOrders.sort((a, b) => (b.time || b.updateTime || 0) - (a.time || a.updateTime || 0));
        return recentOrders.slice(0, limit);
      }
            
      // Strategy 1: Get symbols from account balances (spots assets you've traded)
      let discoveredSymbols = [];
      try {
        const account = await this.makeRequest('/api/v3/account');
        if (account && account.balances) {
          // Get all assets that have ever had balance (free + locked > 0 or had historical balance)
          const assetsWithBalance = account.balances
            .filter(balance => parseFloat(balance.free) > 0.001 || parseFloat(balance.locked) > 0.001)
            .map(balance => balance.asset)
            .filter(asset => asset !== 'USDT' && asset !== 'BUSD' && asset !== 'USDC'); // Exclude stablecoins
          
          // Create trading pairs for these assets
          const tradingPairs = [];
          for (const asset of assetsWithBalance) {
            tradingPairs.push(`${asset}USDT`);
            tradingPairs.push(`${asset}BTC`);
            tradingPairs.push(`${asset}ETH`);
          }
          discoveredSymbols = [...new Set(tradingPairs)]; // Remove duplicates
        }
      } catch (error) {
        console.warn('Failed to get account for symbol discovery:', error.message);
      }
      
      // Strategy 2: Add comprehensive list of popular symbols
      // Combine discovered and popular symbols, prioritizing discovered ones
      const symbolsToCheck = [...new Set([...discoveredSymbols.slice(0, 20), ...POPULAR_FUTURES_SYMBOLS])].slice(0, 40);
      
      // Strategy 3: Get recent futures orders from active positions and comprehensive symbols
      try {
        const futuresOrders = await this.getRecentFuturesOrders(null, Math.floor(limit * 0.5), thirtyDaysAgo);
        allOrders.push(...futuresOrders);
      } catch (error) {
        console.warn('Failed to get futures orders:', error.message);
      }
      
      // Strategy 4: Get recent spot orders from discovered and popular symbols
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      try {
        if (isLocalhost) {
          for (const symbol of symbolsToCheck) {
            if (allOrders.length >= limit * 2) break; // Get extra to allow for filtering
            
            try {
              const symbolOrders = await this.getRecentSpotOrders(symbol, 10, thirtyDaysAgo);
              const recentSpotOrders = symbolOrders
                .filter(order => (order.time || order.updateTime || 0) >= thirtyDaysAgo)
                .map(order => ({
                  ...order,
                  market: 'Spot'
                }));
              allOrders.push(...recentSpotOrders);
            } catch (error) {
              continue; // Skip symbols that error
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get spot orders from symbols:', error.message);
      }
      
      // Strategy 5: Get recent trades to fill any gaps
      if (allOrders.length < limit / 2) {
        try {
          const trades = await this.getRecentTrades(25, thirtyDaysAgo);
          if (trades && trades.length > 0) {
            const tradeOrders = trades
              .filter(trade => trade.time >= thirtyDaysAgo)
              .map(trade => ({
                orderId: trade.orderId,
                symbol: trade.symbol,
                side: trade.isBuyer ? 'BUY' : 'SELL',
                type: 'MARKET',
                origQty: trade.qty,
                executedQty: trade.qty,
                price: trade.price,
                status: 'FILLED',
                time: trade.time,
                market: 'Spot'
              }));
            allOrders.push(...tradeOrders);
          }
        } catch (error) {
          console.warn('Failed to get recent trades (non-critical):', error.message);
        }
      }
      
      // Filter by time, remove duplicates and sort by time (most recent first)
      const recentOrders = allOrders.filter(order => 
        (order.time || order.updateTime || 0) >= thirtyDaysAgo
      );
      
      const uniqueOrders = recentOrders.filter((order, index, self) => 
        index === self.findIndex(o => 
          o.orderId === order.orderId && 
          o.symbol === order.symbol && 
          o.market === order.market
        )
      );
      
      uniqueOrders.sort((a, b) => (b.time || b.updateTime || 0) - (a.time || a.updateTime || 0));
      return uniqueOrders.slice(0, limit);
      
    } catch (error) {
      console.error('Error getting all orders:', error.message);
      return [];
    }
  }

  // Get recent spot orders with time filtering
  async getRecentSpotOrders(symbol, limit = 50, startTime = null) {
    try {
      const params = { symbol, limit };
      if (startTime) {
        params.startTime = startTime;
      }
      
      const orders = await this.makeRequest('/api/v3/allOrders', params);
      return orders || [];
    } catch (error) {
      console.warn(`Failed to get recent spot orders for ${symbol}:`, error.message);
      return [];
    }
  }

  // Get recent futures orders with time filtering
  async getRecentFuturesOrders(symbol = null, limit = 50, startTime = null) {
    try {
      if (!symbol) {
        // Get futures account to find active positions
        const futuresAccount = await this.getFuturesAccountInfo();
        if (!futuresAccount) return [];
        
        const activePositions = futuresAccount.positions
          ?.filter(pos => parseFloat(pos.positionAmt) !== 0)
          ?.map(pos => pos.symbol)
          ?.slice(0, 5) || [];
        
        if (activePositions.length === 0) {
          // Try common futures symbols
          const allOrders = [];

          for (const futuresSymbol of POPULAR_FUTURES_SYMBOLS) {
          try {
              const params = { symbol: futuresSymbol, limit: Math.min(limit, 20) };
              if (startTime) params.startTime = startTime;
              
              const orders = await this.makeFuturesRequest('/fapi/v1/allOrders', 'GET', params);
              if (orders && orders.length > 0) {
                const futuresOrders = orders
                  .filter(order => !startTime || (order.time || order.updateTime || 0) >= startTime)
                  .map(order => ({
                    ...order,
                    isFutures: true,
                    market: 'Futures'
                  }));
                allOrders.push(...futuresOrders);
              }
            } catch (error) {
              continue;
            }
            
            if (allOrders.length >= limit) break;
          }
          
          return allOrders.slice(0, limit);
        }
        
        // Get orders for active positions
        const allOrders = [];
        for (const symbol of activePositions) {
          try {
            const params = { symbol, limit: Math.min(limit, 15) };
            if (startTime) params.startTime = startTime;
            
            const orders = await this.makeFuturesRequest('/fapi/v1/allOrders', 'GET', params);
            if (orders && orders.length > 0) {
              const futuresOrders = orders
                .filter(order => !startTime || (order.time || order.updateTime || 0) >= startTime)
                .map(order => ({
                  ...order,
                  isFutures: true,
                  market: 'Futures'
                }));
              allOrders.push(...futuresOrders);
            }
          } catch (error) {
            continue;
          }
          
          if (allOrders.length >= limit) break;
        }
        
        return allOrders.slice(0, limit);
      }
      
      // Get orders for specific symbol
      const params = { symbol, limit };
      if (startTime) params.startTime = startTime;
      
      const orders = await this.makeFuturesRequest('/fapi/v1/allOrders', 'GET', params);
      return orders
        .filter(order => !startTime || (order.time || order.updateTime || 0) >= startTime)
        .map(order => ({
          ...order,
          isFutures: true,
          market: 'Futures'
        }));
    } catch (error) {
      console.warn('Failed to get recent futures orders:', error.message);
      return [];
    }
  }

  // Get recent trades for a symbol with time filtering
  async getRecentTrades(limit = 10, startTime = null) {
    try {
      const allTrades = [];

      for (const symbol of POPULAR_FUTURES_SYMBOLS) {
        try {
          const params = { 
            symbol, 
            limit: Math.floor(limit / Math.min(POPULAR_FUTURES_SYMBOLS.length, 10)) + 3 // Distribute across fewer symbols
          };
          
          // Add startTime if provided
          if (startTime) {
            params.startTime = startTime;
          }
          
          const trades = await this.makeRequest('/api/v3/myTrades', params);
          if (trades && trades.length > 0) {
            const filteredTrades = trades
              .filter(trade => !startTime || trade.time >= startTime)
              .map(trade => ({ ...trade, symbol }));
            allTrades.push(...filteredTrades);
          }
        } catch (error) {
          continue;
        }
        
        // Stop early if we have enough trades
        if (allTrades.length >= limit * 2) break;
      }
      
      const sortedTrades = allTrades.sort((a, b) => b.time - a.time);
      return sortedTrades.slice(0, limit);
    } catch (error) {
      console.warn('Failed to get recent trades:', error.message);
      return [];
    }
  }

  // Get spot orders for a symbol
  async getSpotOrders(symbol = null, limit = 100) {
    // For Binance API, we need to specify a symbol
    // If no symbol provided, we'll get orders for active symbols from account
    if (!symbol) {
      try {
        // First, try to get orders for common symbols
        const orders = await this.getOrdersForCommonSymbols(limit);
        if (orders.length > 0) {
          return orders;
        }
        
        // If no orders found, try to get recent trades instead
        const trades = await this.getRecentTrades(limit);
        if (trades.length > 0) {
          return trades;
        }
        
        // If still no data, try getting account info to find active symbols
        const account = await this.makeRequest('/api/v3/account');
        const activeSymbols = account.balances
          .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
          .map(balance => balance.asset)
          .slice(0, 3); // Limit to first 3 symbols
        
        const allOrders = [];
        for (const asset of activeSymbols) {
          try {
            const commonPairs = [`${asset}USDT`, `${asset}BTC`, `${asset}ETH`];
            for (const pair of commonPairs) {
              try {
                const orders = await this.makeRequest('/api/v3/allOrders', { 
                  symbol: pair, 
                  limit: Math.min(limit, 10) 
                });
                if (orders && orders.length > 0) {
                  allOrders.push(...orders.slice(0, 5)); // Limit per symbol
                  break;
                }
              } catch (e) {
                continue;
              }
            }
          } catch (error) {
            continue;
          }
          
          if (allOrders.length >= limit) break;
        }
        
        return allOrders.slice(0, limit);
      } catch (error) {
        console.warn('Failed to get orders without symbol:', error.message);
        // Return empty array instead of throwing
        return [];
      }
    }
    
    // If symbol is provided, get orders for that specific symbol
    const params = { symbol, limit };
    return await this.makeRequest('/api/v3/allOrders', params);
  }

  // Helper method to get orders for common trading pairs
  async getOrdersForCommonSymbols(limit = 100) {
    const allOrders = [];

    for (const symbol of POPULAR_FUTURES_SYMBOLS) {
      try {
        const orders = await this.makeRequest('/api/v3/allOrders', { 
          symbol, 
          limit: Math.min(limit, 20) 
        });
        if (orders && orders.length > 0) {
          allOrders.push(...orders);
        }
      } catch (error) {
        // Skip symbols that don't have orders or aren't valid
        continue;
      }
      
      // Break early if we have enough orders
      if (allOrders.length >= limit) break;
    }
    
    return allOrders.slice(0, limit);
  }

  // Alternative method: Get recent trades instead of all orders
  async getRecentTrades(limit = 50) {
    try {
      // Try to get account trades for common symbols
      const allTrades = [];

      for (const symbol of POPULAR_FUTURES_SYMBOLS) {
        try {
          const trades = await this.makeRequest('/api/v3/myTrades', { 
            symbol, 
            limit: Math.min(limit, 15) 
          });
          if (trades && trades.length > 0) {
            // Convert trades to order-like format
            const orderLikeTrades = trades.map(trade => ({
              orderId: trade.orderId,
              symbol: trade.symbol,
              status: 'FILLED',
              side: trade.isBuyer ? 'BUY' : 'SELL',
              type: 'MARKET',
              origQty: trade.qty,
              executedQty: trade.qty,
              price: trade.price,
              time: trade.time
            }));
            allTrades.push(...orderLikeTrades);
          }
        } catch (error) {
          console.warn(`Failed to get trades for ${symbol}:`, error.message);
          // Continue with next symbol instead of breaking
          continue;
        }
        
        if (allTrades.length >= limit) break;
      }
      
      return allTrades.slice(0, limit);
    } catch (error) {
      console.warn('Failed to get recent trades:', error.message);
      return [];
    }
  }

  // Get 24hr ticker price change statistics
  async get24hrTicker(symbol = null) {
    if (this.useMockData) {
      return symbol ? 
        { symbol, priceChange: "1234.56", priceChangePercent: "2.75" } :
        [{ symbol: "BTCUSDT", priceChange: "1234.56", priceChangePercent: "2.75" }];
    }

    try {
      let endpoint = `/api/v3/ticker/24hr`;
      const params = {};
      if (symbol) {
        params.symbol = symbol;
      }
      
      // Use public request method for ticker data
      return await this.makePublicRequest(endpoint, params);
    } catch (error) {
      throw new Error(`Failed to get ticker data: ${error.response?.data?.msg || error.message}`);
    }
  }

  // Get current open orders (both spot and futures)
  async getOpenOrders(symbol = null) {
    try {
      const [spotOrders, futuresOrders] = await Promise.allSettled([
        this.getSpotOpenOrders(symbol),
        this.getFuturesOpenOrders(symbol)
      ]);
      
      const allOpenOrders = [];
      
      // Add spot open orders
      if (spotOrders.status === 'fulfilled') {
        allOpenOrders.push(...spotOrders.value.map(order => ({
          ...order,
          market: 'Spot'
        })));
      }
      
      // Add futures open orders
      if (futuresOrders.status === 'fulfilled') {
        allOpenOrders.push(...futuresOrders.value);
      }
      
      // Sort by time (most recent first)
      allOpenOrders.sort((a, b) => (b.time || b.updateTime || 0) - (a.time || a.updateTime || 0));
      
      return allOpenOrders;
    } catch (error) {
      console.warn('Failed to get open orders:', error.message);
      return [];
    }
  }

  // Get spot open orders
  async getSpotOpenOrders(symbol = null) {
    const params = {};
    if (symbol) {
      params.symbol = symbol;
    }
    return await this.makeRequest('/api/v3/openOrders', params);
  }

  // Get futures open orders
  async getFuturesOpenOrders(symbol = null) {
    try {
      const params = {};
      if (symbol) {
        params.symbol = symbol;
      }
      const orders = await this.makeFuturesRequest('/fapi/v1/openOrders', 'GET', params);
      return orders.map(order => ({
        ...order,
        isFutures: true,
        market: 'Futures'
      }));
    } catch (error) {
      console.warn('Failed to get futures open orders:', error.message);
      return [];
    }
  }

  // Get trading fees
  async getTradeFee() {
    return await this.makeRequest('/sapi/v1/asset/tradeFee');
  }

  // Get futures position history (current positions)
  async getFuturesPositions() {
    try {
      // Get position risk data (comprehensive position info) - this gives us ROE
      const positionRisk = await this.makeFuturesRequest('/fapi/v2/positionRisk', 'GET');
      
      // Get account info for unrealized PnL data - this gives us ROI
      const accountInfo = await this.makeFuturesRequest('/fapi/v2/account', 'GET');
      
      // Filter only positions with non-zero amounts
      const activePositions = positionRisk.filter(position => parseFloat(position.positionAmt) !== 0);
      
      // Enhance position data with account info for accurate values from Binance
      const enhancedPositions = activePositions.map(position => {
        // Find matching position in account info for unrealized PnL and ROI
        const accountPosition = accountInfo?.positions?.find(p => p.symbol === position.symbol);
        
        const positionAmt = parseFloat(position.positionAmt);
        const entryPrice = parseFloat(position.entryPrice);
        const markPrice = parseFloat(position.markPrice);
        
        // Use Binance's direct values - DO NOT calculate manually
        const unrealizedPnl = parseFloat(accountPosition?.unrealizedProfit || position.unRealizedProfit || 0);
        
        // ROE (Return on Equity) - Calculate from price difference percentage
        let roe = parseFloat(position.percentage || 0);
        
        // If ROE is not available from Binance, calculate it manually
        if (roe === 0 && entryPrice > 0 && markPrice > 0) {
          roe = ((markPrice - entryPrice) / entryPrice) * 100;
          // For short positions, flip the sign
          if (positionAmt < 0) roe = -roe;
        }
        
        // ROI (Return on Investment) - Calculate based on unrealized PnL and initial margin
        let roi = 0;
        if (accountPosition && accountPosition.initialMargin) {
          const initialMargin = parseFloat(accountPosition.initialMargin);
          if (initialMargin > 0) {
            roi = (unrealizedPnl / initialMargin) * 100;
          }
        } else if (unrealizedPnl !== 0 && entryPrice > 0) {
          // Fallback ROI calculation using notional value
          const notionalValue = Math.abs(positionAmt) * entryPrice;
          const leverage = parseFloat(position.leverage || 1);
          const margin = notionalValue / leverage;
          if (margin > 0) {
            roi = (unrealizedPnl / margin) * 100;
          }
        }        
        return {
          ...position,
          // Binance's direct values
          unrealizedProfit: unrealizedPnl.toString(),
          unRealizedProfit: unrealizedPnl.toString(),
          roe: roe.toString(), // Return on Equity 
          roi: roi.toString(), // Return on Investment calculated from margin
          percentage: roe.toString(), // Keep original field for compatibility
          // Ensure all required fields are present
          leverage: position.leverage || '1',
          marginType: position.marginType || 'cross',
          // Add account position data for reference
          initialMargin: accountPosition?.initialMargin || '0',
          maintMargin: accountPosition?.maintMargin || '0'
        };
      });
      return enhancedPositions;
    } catch (error) {
      console.warn('Failed to get futures positions:', error.message);
      return [];
    }
  }

  // Get futures trade history
  async getFuturesTradeHistory(symbol = null, limit = 100, startTime = null) {
    try {
      const params = { limit };
      if (symbol) params.symbol = symbol;
      if (startTime) params.startTime = startTime;
      
      const response = await this.makeFuturesRequest('/fapi/v1/userTrades', 'GET', params);
      return response.map(trade => ({
        ...trade,
        isFutures: true,
        market: 'Futures'
      }));
    } catch (error) {
      console.warn('Failed to get futures trade history:', error.message);
      return [];
    }
  }

  // Get futures transaction history (includes deposits, withdrawals, etc.)
  async getFuturesTransactionHistory(incomeType = null, limit = 100, startTime = null) {
    try {
      const params = { limit };
      if (incomeType) params.incomeType = incomeType;
      if (startTime) params.startTime = startTime;
      
      const response = await this.makeFuturesRequest('/fapi/v1/income', 'GET', params);
      return response.map(transaction => ({
        ...transaction,
        isFutures: true,
        market: 'Futures'
      }));
    } catch (error) {
      console.warn('Failed to get futures transaction history:', error.message);
      return [];
    }
  }

  // Get funding fee history
  async getFundingFeeHistory(symbol = null, limit = 100, startTime = null) {
    try {
      const params = { limit };
      if (symbol) params.symbol = symbol;
      if (startTime) params.startTime = startTime;
      
      const response = await this.makeFuturesRequest('/fapi/v1/income', 'GET', { 
        ...params, 
        incomeType: 'FUNDING_FEE' 
      });
      return response.map(fee => ({
        ...fee,
        isFutures: true,
        market: 'Futures'
      }));
    } catch (error) {
      console.warn('Failed to get funding fee history:', error.message);
      return [];
    }
  }

  // Get comprehensive futures data for Orders Management section
  async getFuturesOrdersData() {
    try {
      const [
        openOrders,
        orderHistory,
        positions,
        tradeHistory,
        transactionHistory,
        fundingFees
      ] = await Promise.allSettled([
        this.getFuturesOpenOrders(),
        this.getFuturesOrders(null, 500),
        this.getFuturesPositions(),
        this.getFuturesTradeHistory(null, 50),
        this.getFuturesTransactionHistory(null, 50),
        this.getFundingFeeHistory(null, 50)
      ]);

      return {
        openOrders: openOrders.status === 'fulfilled' ? openOrders.value : [],
        orderHistory: orderHistory.status === 'fulfilled' ? orderHistory.value : [],
        positions: positions.status === 'fulfilled' ? positions.value : [],
        tradeHistory: tradeHistory.status === 'fulfilled' ? tradeHistory.value : [],
        transactionHistory: transactionHistory.status === 'fulfilled' ? transactionHistory.value : [],
        fundingFees: fundingFees.status === 'fulfilled' ? fundingFees.value : [],
        success: true
      };
    } catch (error) {
      console.error('Failed to get futures orders data:', error);
      return {
        openOrders: [],
        orderHistory: [],
        positions: [],
        tradeHistory: [],
        transactionHistory: [],
        fundingFees: [],
        success: false,
        error: error.message
      };
    }
  }

  // Trading Methods
  
  // Get available symbols for trading
  async getSymbols(market = 'spot') {
    try {
      if (market === 'spot') {
        // Use public request for exchange info - no authentication needed
        const response = await this.makePublicRequest('/api/v3/exchangeInfo');
        return response.symbols
          .filter(symbol => symbol.status === 'TRADING' && symbol.symbol.endsWith('USDC'))
          .map(symbol => symbol.symbol)
          .slice(0, 50); // Limit to top 50 symbols
      } else {
        // Use public futures request for futures exchange info
        const response = await this.makePublicFuturesRequest('/fapi/v1/exchangeInfo');
        return response.symbols
          .filter(symbol => symbol.status === 'TRADING' && symbol.contractType === 'PERPETUAL')
          .map(symbol => symbol.symbol)
          .slice(0, 50);
      }
    } catch (error) {
      console.warn('Failed to get symbols:', error);
      if (market === 'spot') {
        return ['BTCUSDC', 'ETHUSDC', 'BNBUSDC', 'ADAUSDC', 'SOLUSDC'];
      } else {
        return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];
      }
    }
  }

  // Get current price for a symbol
  async getCurrentPrice(symbol, market = 'spot') {
    try {
      if (market === 'spot') {
        // Use public request for price ticker - no authentication needed
        const response = await this.makePublicRequest('/api/v3/ticker/price', { symbol });
        return { price: parseFloat(response.price) };
      } else {
        // Use public futures request for futures price
        const response = await this.makePublicFuturesRequest('/fapi/v1/ticker/price', { symbol });
        return { price: parseFloat(response.price) };
      }
    } catch (error) {
      console.warn('Failed to get current price:', error);
      return null;
    }
  }

  // Place spot order
  async placeSpotOrder(orderParams) {
    if (this.useMockData) {
      // Return mock order for demo
      return {
        symbol: orderParams.symbol,
        orderId: Math.floor(Math.random() * 1000000),
        clientOrderId: 'mock_order_' + Date.now(),
        transactTime: Date.now(),
        price: orderParams.price?.toString() || '0',
        origQty: orderParams.quantity.toString(),
        executedQty: orderParams.type === 'MARKET' ? orderParams.quantity.toString() : '0',
        cummulativeQuoteQty: orderParams.type === 'MARKET' ? 
          (orderParams.quantity * (orderParams.price || 50000)).toString() : '0',
        status: orderParams.type === 'MARKET' ? 'FILLED' : 'NEW',
        timeInForce: 'GTC',
        type: orderParams.type,
        side: orderParams.side
      };
    }

    try {
      const params = {
        symbol: orderParams.symbol,
        side: orderParams.side,
        type: orderParams.type,
        quantity: orderParams.quantity
      };

      // Add price for limit orders
      if (orderParams.type === 'LIMIT') {
        params.timeInForce = 'GTC';
        params.price = orderParams.price;
      }

      const response = await this.makePostRequest('/api/v3/order', params, false);
      return response;
    } catch (error) {
      console.error('Failed to place spot order:', error);
      throw new Error(`Order failed: ${error.message}`);
    }
  }

  // Place futures order
  async placeFuturesOrder(orderParams) {
    if (this.useMockData) {
      // Return mock order for demo
      return {
        symbol: orderParams.symbol,
        orderId: Math.floor(Math.random() * 1000000),
        clientOrderId: 'mock_futures_order_' + Date.now(),
        transactTime: Date.now(),
        price: orderParams.price?.toString() || '0',
        origQty: orderParams.quantity.toString(),
        executedQty: orderParams.type === 'MARKET' ? orderParams.quantity.toString() : '0',
        cumQuote: orderParams.type === 'MARKET' ? 
          (orderParams.quantity * (orderParams.price || 50000)).toString() : '0',
        status: orderParams.type === 'MARKET' ? 'FILLED' : 'NEW',
        timeInForce: 'GTC',
        type: orderParams.type,
        side: orderParams.side,
        positionSide: 'BOTH'
      };
    }

    try {
      // Set leverage first if provided
      if (orderParams.leverage) {
        await this.setLeverage(orderParams.symbol, orderParams.leverage);
      }

      const params = {
        symbol: orderParams.symbol,
        side: orderParams.side,
        type: orderParams.type,
        quantity: orderParams.quantity
      };

      // Add price for limit orders
      if (orderParams.type === 'LIMIT') {
        params.timeInForce = 'GTC';
        params.price = orderParams.price;
      }

      const response = await this.makePostRequest('/fapi/v1/order', params, true);
      return response;
    } catch (error) {
      console.error('Failed to place futures order:', error);
      throw new Error(`Futures order failed: ${error.message}`);
    }
  }

  // Set leverage for futures trading
  async setLeverage(symbol, leverage) {
    if (this.useMockData) {
      return { leverage: leverage, maxNotional: '100000', symbol: symbol };
    }

    try {
      const params = {
        symbol: symbol,
        leverage: leverage
      };

      const response = await this.makePostRequest('/fapi/v1/leverage', params, true);
      return response;
    } catch (error) {
      console.warn('Failed to set leverage:', error);
      // Don't throw error as order can still proceed
      return null;
    }
  }

  // Cancel order
  async cancelOrder(symbol, orderId, market = 'spot') {
    if (this.useMockData) {
      return {
        symbol: symbol,
        orderId: orderId,
        clientOrderId: 'mock_cancel_' + Date.now(),
        status: 'CANCELED'
      };
    }

    try {
      const params = {
        symbol: symbol,
        orderId: orderId
      };

      if (market === 'spot') {
        return await this.makeDeleteRequest('/api/v3/order', params, false);
      } else {
        return await this.makeFuturesRequest('/fapi/v1/order', 'DELETE', params);
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw new Error(`Cancel order failed: ${error.message}`);
    }
  }

  // Test spot trading connectivity
  async testSpotTradingAccess() {
    try {
      console.log('🧪 Testing spot trading access...');
      
      // Test 1: Check account access
      const account = await this.makeRequest('/api/v3/account');
      console.log('✅ Account access: OK');
      console.log('📊 Can trade:', account.canTrade);
      console.log('💰 Balances:', account.balances.filter(b => parseFloat(b.free) > 0).length, 'assets with balance');
      
      // Test 2: Check symbol availability 
      const symbols = await this.getSymbols('spot');
      console.log('✅ Symbol access: OK');
      console.log('📈 Available symbols:', symbols.length);
      
      return {
        success: true,
        accountAccess: true,
        canTrade: account.canTrade,
        symbolsAvailable: symbols.length,
        message: 'Spot trading access verified'
      };
    } catch (error) {
      console.error('❌ Spot trading test failed:', error.message);
      return {
        success: false,
        accountAccess: false,
        error: error.message,
        message: 'Spot trading access failed'
      };
    }
  }

  // Test futures trading connectivity
  async testFuturesTradingAccess() {
    try {
      console.log('🧪 Testing futures trading access...');
      
      // Test 1: Check futures account access
      const futuresAccount = await this.makeFuturesRequest('/fapi/v2/account', 'GET');
      console.log('✅ Futures account access: OK');
      console.log('📊 Can trade futures:', true);
      console.log('💰 Wallet balance:', parseFloat(futuresAccount.totalWalletBalance || 0).toFixed(4), 'USDT');
      
      // Test 2: Check futures symbol availability 
      const symbols = await this.getSymbols('futures');
      console.log('✅ Futures symbol access: OK');
      console.log('📈 Available futures symbols:', symbols.length);
      
      // Test 3: Check active positions
      const positions = futuresAccount.positions?.filter(p => parseFloat(p.positionAmt) !== 0) || [];
      console.log('📍 Active positions:', positions.length);
      
      return {
        success: true,
        accountAccess: true,
        canTrade: true,
        symbolsAvailable: symbols.length,
        walletBalance: parseFloat(futuresAccount.totalWalletBalance || 0),
        activePositions: positions.length,
        message: 'Futures trading access verified'
      };
    } catch (error) {
      console.error('❌ Futures trading test failed:', error.message);
      return {
        success: false,
        accountAccess: false,
        error: error.message,
        message: 'Futures trading access failed'
      };
    }
  }

  // SPOT MARKET METHODS - Properly implemented for spot market order management

  // 1. Get spot open orders (only open orders for spot market)
  async getSpotOnlyOpenOrders(symbol = null) {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    try {
      if (isLocalhost) {
        const params = {};
        if (symbol) params.symbol = symbol;
        
        const orders = await this.makeRequest('/api/v3/openOrders', params);
        
        // Additional filtering to ensure no futures contamination
        const spotOnlyOrders = orders.filter(order => {
          // Exclude any orders that might be futures-related
          const symbol = order.symbol || '';
          return !symbol.includes('PERP') && 
                !symbol.includes('_') &&  // Futures symbols sometimes use underscores
                !order.positionSide &&   // Futures-specific field
                !order.reduceOnly;       // Futures-specific field
        });
        
        return spotOnlyOrders.map(order => ({
          ...order,
          market: 'Spot'
        }));
      }
    } catch (error) {
      console.warn('Failed to get spot open orders:', error.message);
      return [];
    }
  }

  // 2. Get spot order history (only completed/cancelled spot orders)
  async getSpotOnlyOrderHistory(symbol = null, limit = 100) {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    try {
      if (isLocalhost) {
        // Get last 6 months of order history
        const endTime = Date.now();
        const startTime = endTime - (6 * 30 * 24 * 60 * 60 * 1000); // 6 months ago
        
        if (!symbol) {
          // Get orders for active symbols from account
          const account = await this.makeRequest('/api/v3/account');
          const activeAssets = account.balances
            .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
            .map(balance => balance.asset)
            .slice(0, 10); // Limit to avoid too many API calls

          // Always include common pairs for completeness
          const commonPairs = ['BTCUSDC', 'ETHUSDC', 'BNBUSDC', 'ADAUSDC', 'SOLUSDC', 'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];

          const allPairs = new Set();
          // Add pairs from active assets
          for (const asset of activeAssets) {
            if (asset === 'USDT' || asset === 'BUSD' || asset === 'USDC') continue; // Skip stablecoins
            allPairs.add(`${asset}USDT`);
            allPairs.add(`${asset}BTC`);
            allPairs.add(`${asset}ETH`);
          }
          // Add common pairs
          for (const pair of commonPairs) {
            allPairs.add(pair);
          }

          const allOrders = [];
          // Fetch orders for each pair
          for (const pair of Array.from(allPairs)) {
            try {
              const orders = await this.makeRequest('/api/v3/allOrders', {
                symbol: pair,
                limit: 100 // Get more orders to allow for time filtering
              });
              if (orders && orders.length > 0) {
                // Filter by time (last 6 months) on client side
                const recentOrders = orders.filter(order =>
                  (order.time || order.updateTime || 0) >= startTime
                );
                allOrders.push(...recentOrders.map(order => ({
                  ...order,
                  market: 'Spot'
                })));
              }
            } catch (error) {
              continue; // Skip pairs that don't exist or have no orders
            }
            if (allOrders.length >= limit) break;
          }

          // Sort by time (most recent first)
          allOrders.sort((a, b) => (b.time || b.updateTime || 0) - (a.time || a.updateTime || 0));

          // Additional filtering to ensure no futures contamination
          const spotOnlyOrders = allOrders.filter(order => {
            // Exclude any orders that might be futures-related
            const symbol = order.symbol || '';
            return !symbol.includes('PERP') &&
                  !symbol.includes('_') &&  // Futures symbols sometimes use underscores
                  !order.positionSide &&   // Futures-specific field
                  !order.reduceOnly;       // Futures-specific field
          });

          return spotOnlyOrders.slice(0, limit);
        } else {
          // Get orders for specific symbol
          const orders = await this.makeRequest('/api/v3/allOrders', { 
            symbol, 
            limit: 500  // Get more orders to allow for time filtering
          });
          
          // Filter by time (last 6 months) on client side
          const recentOrders = orders.filter(order => 
            (order.time || order.updateTime || 0) >= startTime
          );
          
          // Additional filtering to ensure no futures contamination
          const spotOnlyOrders = recentOrders.filter(order => {
            // Exclude any orders that might be futures-related
            const symbol = order.symbol || '';
            return !symbol.includes('PERP') && 
                  !symbol.includes('_') &&  // Futures symbols sometimes use underscores
                  !order.positionSide &&   // Futures-specific field
                  !order.reduceOnly;       // Futures-specific field
          });
          
          return spotOnlyOrders.map(order => ({
            ...order,
            market: 'Spot'
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to get spot order history:', error.message);
      return [];
    }
  }

  // 3. Get transfer history (internal transfers between wallets like in Binance app)
  async getTransferHistory(limit = 100) {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    try {
      if (isLocalhost) {
        // Get last 3 months of transfer history
        const endTime = Date.now();
        const startTime = endTime - (90 * 24 * 60 * 60 * 1000); // 3 months ago
        
        // This gets internal transfers between spot, futures, margin wallets
        const response = await this.makeRequest('/sapi/v1/asset/transfer', { 
          type: 'MAIN_UMFUTURE', // Main to futures
          limit: Math.min(limit, 100),
          startTime: startTime,
          endTime: endTime
        });
        
        const transfers = [];
        if (response && response.rows) {
          transfers.push(...response.rows.map(transfer => ({
            ...transfer,
            type: 'Internal Transfer',
            asset: transfer.asset,
            amount: transfer.amount,
            status: transfer.status,
            insertTime: transfer.timestamp
          })));
        }

        // Also get futures to main transfers
        try {
          const reverseTransfers = await this.makeRequest('/sapi/v1/asset/transfer', { 
            type: 'UMFUTURE_MAIN', // Futures to main
            limit: Math.min(limit, 100),
            startTime: startTime,
            endTime: endTime
          });
          
          if (reverseTransfers && reverseTransfers.rows) {
            transfers.push(...reverseTransfers.rows.map(transfer => ({
              ...transfer,
              type: 'Internal Transfer',
              asset: transfer.asset,
              amount: transfer.amount,
              status: transfer.status,
              insertTime: transfer.timestamp
            })));
          }
        } catch (error) {
          console.warn('Failed to get reverse transfers:', error.message);
        }

        // Sort by time (most recent first)
        transfers.sort((a, b) => (b.insertTime || 0) - (a.insertTime || 0));
        return transfers.slice(0, limit);
      }
    } catch (error) {
      console.warn('Failed to get transfer history:', error.message);
      return [];
    }
  }

  // 4. Get convert history (asset conversions in spot wallet like in Binance app)
  async getConvertHistory(limit = 100) {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    try {
      if (isLocalhost) {
        // Get last 3 months of convert history
        const endTime = Date.now();
        const startTime = endTime - (90 * 24 * 60 * 60 * 1000); // 3 months ago
        
        const params = { 
          limit: Math.min(limit, 100),
          startTime: startTime,
          endTime: endTime
        };
        
        const response = await this.makeRequest('/sapi/v1/convert/tradeFlow', params);
        
        if (response && response.list) {
          return response.list.map(convert => ({
            ...convert,
            fromAsset: convert.fromAsset,
            toAsset: convert.toAsset,
            fromAmount: convert.fromAmount,
            toAmount: convert.toAmount,
            createTime: convert.createTime,
            status: 'Success' // Convert trades are usually completed
          }));
        }
        
        return [];
      }
    } catch (error) {
      console.warn('Failed to get convert history:', error.message);
      return [];
    }
  }
}

export default BinanceAPI;
