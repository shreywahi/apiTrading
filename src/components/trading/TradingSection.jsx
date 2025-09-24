import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';
import './TradingSection.css';

const TradingSection = ({ 
  accountData, 
  formatCurrency, 
  binanceApi,
  onOrderPlaced  // Add callback for order placement
}) => {
  const [selectedMarket, setSelectedMarket] = useState('futures');
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [symbol, setSymbol] = useState('BTCUSDT'); // Will be updated based on market
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [symbolList, setSymbolList] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [leverage, setLeverage] = useState('1');
  const [isInitialized, setIsInitialized] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);

  // Check if we should use mock mode (no valid API or CORS issues)
  const shouldUseMockMode = !binanceApi || 
    !binanceApi.apiKey || 
    binanceApi.useMockData;

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // Debug logging
  useEffect(() => {
    // Remove debug logging
  }, [selectedMarket, shouldUseMockMode, symbolList, symbol, currentPrice, isInitialized, componentLoading]);

  // Load available symbols on mount
  useEffect(() => {
    const initializeComponent = async () => {
      setComponentLoading(true);
      try {
        await loadSymbols();
      } catch (error) {
        console.warn('Error initializing trading component:', error);
      } finally {
        setComponentLoading(false);
      }
    };
    
    initializeComponent();
  }, [selectedMarket]);

  // Update symbol when market changes to use correct quote currency
  useEffect(() => {
    if (selectedMarket === 'spot' && symbol.endsWith('USDT')) {
      setSymbol('BTCUSDC'); // Default spot symbol
    } else if (selectedMarket === 'futures' && symbol.endsWith('USDC')) {
      setSymbol('BTCUSDT'); // Default futures symbol
    }
  }, [selectedMarket]);

  // Get current price when symbol changes
  useEffect(() => {
    if (symbol && isInitialized && !componentLoading) {
      getCurrentPrice();
    }
  }, [symbol, selectedMarket, isInitialized, componentLoading]);

  // Initialize component
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const loadSymbols = async () => {
    try {
      if (!shouldUseMockMode && binanceApi && typeof binanceApi.getSymbols === 'function') {
        const symbols = await binanceApi.getSymbols(selectedMarket);
        setSymbolList(symbols || []);
        if (symbols?.length > 0 && !symbol) {
          setSymbol(symbols[0]);
        }
      } else {
        // Fallback symbols when API is not available
        const fallbackSymbols = selectedMarket === 'spot' 
          ? ['BTCUSDC', 'ETHUSDC', 'BNBUSDC', 'XRPUSDC', 'BCHUSDC', 'AAVEUSDC', 'PAXGUSDC']
          : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'BCHUSDT', 'AAVEUSDT', 'PAXGUSDT'];
        setSymbolList(fallbackSymbols);
        if (!symbol) {
          setSymbol(fallbackSymbols[0]);
        }
      }
    } catch (error) {
      console.warn('Failed to load symbols, using fallback:', error);
      const fallbackSymbols = selectedMarket === 'spot' 
        ? ['BTCUSDC', 'ETHUSDC', 'BNBUSDC', 'XRPUSDC', 'BCHUSDC', 'AAVEUSDC', 'PAXGUSDC']
        : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'BCHUSDT', 'AAVEUSDT', 'PAXGUSDT'];
      setSymbolList(fallbackSymbols);
      if (!symbol) {
        setSymbol(fallbackSymbols[0]);
      }
    }
  };

  const getCurrentPrice = async () => {
    try {
      if (!shouldUseMockMode && binanceApi && typeof binanceApi.getCurrentPrice === 'function') {
        const priceData = await binanceApi.getCurrentPrice(symbol, selectedMarket);
        setCurrentPrice(priceData?.price || null);
        if (orderType === 'market' || !price) {
          setPrice(priceData?.price || '');
        }
      } else {
        // Mock price data for demo when API is not available
        const mockPrices = {
          // USDT pairs (futures)
          'BTCUSDT': 43500 + Math.random() * 2000,
          'ETHUSDT': 2400 + Math.random() * 200,
          'BNBUSDT': 310 + Math.random() * 30,
          'XRPUSDT': 23.55 + Math.random() * 0.5,
          'BCHUSDT': 145 + Math.random() * 25,
          'AAVEUSDT': 12 + Math.random() * 3,
          'PAXGUSDT': 8 + Math.random() * 2,
          // USDC pairs (spot)
          'BTCUSDC': 43500 + Math.random() * 2000,
          'ETHUSDC': 2400 + Math.random() * 200,
          'BNBUSDC': 310 + Math.random() * 30,
          'XRPUSDC': 23.55 + Math.random() * 0.5,
          'BCHUSDC': 145 + Math.random() * 25,
          'AAVEUSDC': 12 + Math.random() * 3,
          'PAXGUSDC': 8 + Math.random() * 2
        };
        const mockPrice = mockPrices[symbol] || (1000 + Math.random() * 500);
        setCurrentPrice(mockPrice);
        if (orderType === 'market' || !price) {
          setPrice(mockPrice.toFixed(4));
        }
      }
    } catch (error) {
      console.warn('Failed to get current price, using fallback:', error);
      // Fallback mock price when API fails
      const mockPrices = {
        // USDT pairs (futures)
        'BTCUSDT': 43500 + Math.random() * 2000,
        'ETHUSDT': 2400 + Math.random() * 200,
        'BNBUSDT': 310 + Math.random() * 30,
        'XRPUSDT': 23.55 + Math.random() * 0.5,
        'BCHUSDT': 145 + Math.random() * 25,
        'AAVEUSDT': 12 + Math.random() * 3,
        'PAXGUSDT': 8 + Math.random() * 2,
        // USDC pairs (spot)
        'BTCUSDC': 43500 + Math.random() * 2000,
        'ETHUSDC': 2400 + Math.random() * 200,
        'BNBUSDC': 310 + Math.random() * 30,
        'XRPUSDC': 23.55 + Math.random() * 0.5,
        'BCHUSDC': 145 + Math.random() * 25,
        'AAVEUSDC': 12 + Math.random() * 3,
        'PAXGUSDC': 8 + Math.random() * 2
      };
      const fallbackPrice = mockPrices[symbol] || (1000 + Math.random() * 1000);
      setCurrentPrice(fallbackPrice);
      if (orderType === 'market' || !price) {
        setPrice(fallbackPrice.toFixed(4));
      }
    }
  };

  const calculateTotal = () => {
    const priceNum = parseFloat(price || 0);
    const quantityNum = parseFloat(quantity || 0);
    return priceNum * quantityNum;
  };

  const getAvailableBalance = () => {
    if (!accountData) {
      // Return mock balance only in demo mode, otherwise return 0
      return shouldUseMockMode ? (selectedMarket === 'spot' ? 1000 : 10000) : 0;
    }
    
    try {
      if (selectedMarket === 'spot') {
        // For spot trading, always show USDC balance for buying power
        // and the base asset balance for selling
        const quoteAsset = 'USDC'; // Always use USDC for spot trading
        const baseAsset = symbol.replace('USDC', '').replace('USDT', '').replace('BTC', '').replace('ETH', '');
        
        const targetAsset = side === 'buy' ? quoteAsset : baseAsset;
        const balance = accountData.balances?.find(b => b.asset === targetAsset);
        return parseFloat(balance?.free || 0);
      } else {
        // For futures, always show USDT balance
        return parseFloat(accountData.futuresAccount?.totalWalletBalance || 0);
      }
    } catch (error) {
      console.warn('Error getting balance:', error);
      // Return mock balance only in demo mode
      return shouldUseMockMode ? (selectedMarket === 'spot' ? 1000 : 10000) : 0;
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!price || !quantity) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const orderParams = {
        symbol,
        side: side.toUpperCase(),
        type: orderType.toUpperCase(),
        quantity: parseFloat(quantity),
        ...(orderType === 'limit' && { price: parseFloat(price) }),
        ...(selectedMarket === 'futures' && { leverage: parseInt(leverage) })
      };

      let result;
      
      // Use real API calls when available
      if (!shouldUseMockMode && binanceApi && typeof binanceApi.placeSpotOrder === 'function') {
        if (selectedMarket === 'spot') {
          result = await binanceApi.placeSpotOrder(orderParams);
        } else {
          result = await binanceApi.placeFuturesOrder(orderParams);
        }
      } else {
        // Mock order result for demo when API is not available
        result = {
          orderId: Math.floor(Math.random() * 1000000) + Date.now(),
          symbol: orderParams.symbol,
          side: orderParams.side,
          type: orderParams.type,
          status: orderParams.type === 'MARKET' ? 'FILLED' : 'NEW',
          origQty: orderParams.quantity.toString(),
          price: orderParams.price?.toString() || currentPrice?.toString() || '0',
          executedQty: orderParams.type === 'MARKET' ? orderParams.quantity.toString() : '0',
          cummulativeQuoteQty: orderParams.type === 'MARKET' ? 
            (orderParams.quantity * (orderParams.price || currentPrice || 1000)).toFixed(4) : '0',
          transactTime: Date.now()
        };
        
        console.log('🎯 Demo Order Placed:', result);
      }

      setMessage({ 
        type: 'success', 
        text: `✅ ${shouldUseMockMode ? 'Demo ' : ''}Order placed successfully! Order ID: ${result.orderId}. Refreshing order data...` 
      });
      
      // Reset form completely
      setQuantity('');
      setPrice('');
      setLeverage('1');
      // Don't reset market, symbol, side, and orderType to preserve user preferences
      // This allows users to quickly place multiple similar orders
      
      // Refresh current price for the current symbol
      if (symbol) {
        getCurrentPrice();
      }
      
      // Trigger data refresh in parent component
      if (onOrderPlaced && typeof onOrderPlaced === 'function') {
        onOrderPlaced();
      }
      
      // Clear success message after 6 seconds (after refresh completes)
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 6000);
      
    } catch (error) {
      console.error('Order error:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ Failed to place order: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const setPercentage = (percentage) => {
    try {
      const available = getAvailableBalance();
      if (side === 'buy' && price && parseFloat(price) > 0) {
        const maxQuantity = (available * percentage) / parseFloat(price);
        setQuantity(maxQuantity.toFixed(6));
      } else if (side === 'sell') {
        const maxQuantity = available * percentage;
        setQuantity(maxQuantity.toFixed(6));
      }
    } catch (error) {
      console.warn('Error calculating percentage:', error);
      setQuantity('0.001'); // Set a default small quantity
    }
  };

  return (
    <section className="trading-section">
      {componentLoading ? (
        <div className="trading-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading Trading Center...</p>
        </div>
      ) : (
        <>
          <div className="trading-header">
            <div className="header-content-centered">
              <div className="header-icon animated-icon">
                <Zap size={24} />
              </div>
              <div className="header-text">
                <h2>Live Trading Center {shouldUseMockMode && <span className="demo-badge">DEMO</span>}</h2>
                <p>
                  {shouldUseMockMode 
                    ? 'Demo mode - No real trades will be executed' 
                    : 'Real orders will be executed'
                  }
                </p>
              </div>
            </div>
          </div>

      <div className="trading-content">
        {/* Demo Mode Notice */}
        {shouldUseMockMode && (
          <div className="demo-notice">
            <AlertCircle size={20} />
            <div>
              <strong>Demo Mode Active</strong>
              <p>This is a demonstration interface. No real trades will be executed. To enable live trading, ensure your API keys have trading permissions and are properly configured.</p>
            </div>
          </div>
        )}

          {/* Market Selection */}
          <div className="market-tabs">
            <button 
              className="tab-btn active"
              disabled
            >
              USD-M Futures
            </button>
          </div>
          <br />
          <div className="trading-form-container">
            {/* Symbol and Price Info */}
            <div className="symbol-info">
              <div className="symbol-selector">
                <label>Trading Pair</label>
                <select 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)}
                  className="symbol-select"
                  disabled={symbolList.length === 0}
                >
                  {symbolList.length > 0 ? (
                    symbolList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  ) : (
                    <option value="">Loading symbols...</option>
                  )}
                </select>
            </div>
            
            {currentPrice && (
              <div className="current-price">
                <span className="price-label">Current Price</span>
                <span className="price-value">{parseFloat(currentPrice).toFixed(4)} {selectedMarket === 'spot' ? 'USDC' : 'USDT'}</span>
              </div>
            )}
          </div>

          {/* Order Form */}
          <form onSubmit={handleSubmitOrder} className="order-form">
            {/* Order Type Tabs */}
            <div className="order-type-tabs">
              <button 
                type="button"
                className={`type-btn ${orderType === 'limit' ? 'active' : ''}`}
                onClick={() => setOrderType('limit')}
              >
                Limit
              </button>
              <button 
                type="button"
                className={`type-btn ${orderType === 'market' ? 'active' : ''}`}
                onClick={() => setOrderType('market')}
              >
                Market
              </button>
            </div>

            {/* Buy/Sell Tabs */}
            <div className="side-tabs">
              <button 
                type="button"
                className={`side-btn buy ${side === 'buy' ? 'active' : ''}`}
                onClick={() => setSide('buy')}
              >
                Buy
              </button>
              <button 
                type="button"
                className={`side-btn sell ${side === 'sell' ? 'active' : ''}`}
                onClick={() => setSide('sell')}
              >
                Sell
              </button>
            </div>

            {/* Leverage (Futures only) */}
            {selectedMarket === 'futures' && (
              <div className="form-group">
                <label>Leverage</label>
                <select 
                  value={leverage} 
                  onChange={(e) => setLeverage(e.target.value)}
                  className="leverage-select"
                >
                  {[1, 2, 3, 5, 10, 20, 50, 100].map(lev => (
                    <option key={lev} value={lev}>{lev}x</option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Input */}
            {orderType === 'limit' && (
              <div className="form-group">
                <label>Price ({selectedMarket === 'spot' ? 'USDC' : 'USDT'})</label>
                <div className="price-input-container">
                  <input
                    type="number"
                    step="0.0001"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.0000"
                    className="price-input"
                  />
                  {currentPrice && (
                    <button 
                      type="button" 
                      className="current-price-btn"
                      onClick={() => setPrice(currentPrice)}
                    >
                      Current
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                step="0.000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.000000"
                className="quantity-input"
                required
              />
              
              {/* Percentage Buttons */}
              <div className="percentage-buttons">
                {[0.25, 0.5, 0.75, 1].map(percentage => (
                  <button 
                    key={percentage}
                    type="button"
                    className="percentage-btn"
                    onClick={() => setPercentage(percentage)}
                  >
                    {Math.round(percentage * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-row">
                <span>Available:</span>
                <span>{getAvailableBalance().toFixed(6)} {
                  selectedMarket === 'spot' 
                    ? (side === 'buy' ? 'USDC' : symbol.replace('USDC', '').replace('USDT', ''))
                    : 'USDT'
                }</span>
              </div>
              {orderType === 'limit' && price && quantity && (
                <div className="summary-row">
                  <span>Total:</span>
                  <span>{calculateTotal().toFixed(4)} {selectedMarket === 'spot' ? 'USDC' : 'USDT'}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`submit-btn ${side}`}
              disabled={loading || !quantity || (orderType === 'limit' && !price)}
            >
              {loading ? (
                <div className="loading-spinner-small"></div>
              ) : (
                `${side.charAt(0).toUpperCase() + side.slice(1)} ${symbol.replace('USDT', '').replace('USDC', '')}`
              )}
            </button>

            {/* Message Display */}
            {message.text && (
              <div className={`order-message ${message.type}`}>
                {message.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{message.text}</span>
              </div>
            )}
          </form>
        </div>
      </div>
        </>
      )}
    </section>
  );
};

export default TradingSection;
