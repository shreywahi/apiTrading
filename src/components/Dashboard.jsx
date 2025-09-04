import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Activity, LogOut, RefreshCw, Eye, EyeOff, Moon, Sun, BarChart3, History, TrendingDown, Coins, ArrowUpDown } from 'lucide-react';
import CosmicBackground from './CosmicBackground';
import './Dashboard.css';
import './CosmicBackground.css';

const Dashboard = ({ binanceApi, onLogout }) => {
  const [accountData, setAccountData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState('portfolio'); // Default to portfolio section
  const [hideSmallBalances, setHideSmallBalances] = useState(true);
  const [activeWalletTab, setActiveWalletTab] = useState('spot');
  const [activeOrdersTab, setActiveOrdersTab] = useState('open');
  const [tickerData, setTickerData] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [autoRefreshTimer, setAutoRefreshTimer] = useState(15); // Countdown in seconds
  const [autoRefreshActive, setAutoRefreshActive] = useState(true);

  // New state for futures trading data
  const [futuresOpenOrders, setFuturesOpenOrders] = useState([]);
  const [futuresOrderHistory, setFuturesOrderHistory] = useState([]);
  const [positionHistory, setPositionHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [fundingFeeHistory, setFundingFeeHistory] = useState([]);
  const [activeFuturesTab, setActiveFuturesTab] = useState('open-orders');
  
  // Sorting states for each table
  const [sortConfig, setSortConfig] = useState({
    'order-history': { key: null, direction: 'default' },
    'open-orders': { key: null, direction: 'default' },
    'position-history': { key: null, direction: 'default' },
    'trade-history': { key: null, direction: 'default' },
    'transaction-history': { key: null, direction: 'default' },
    'funding-fee': { key: null, direction: 'default' }
  });

  // Sorting function
  const handleSort = (tableType, key) => {
    const currentConfig = sortConfig[tableType];
    let newDirection = 'asc';
    
    if (currentConfig.key === key) {
      if (currentConfig.direction === 'default') {
        newDirection = 'asc';
      } else if (currentConfig.direction === 'asc') {
        newDirection = 'desc';
      } else {
        newDirection = 'default';
      }
    }
    
    setSortConfig(prev => ({
      ...prev,
      [tableType]: { key, direction: newDirection }
    }));
  };

  // Generic sorting function for arrays
  const sortData = (data, tableType) => {
    const config = sortConfig[tableType];
    
    // For Orders Management tables and Position tables, default to descending order by time (latest first)
    const isOrdersTable = ['open-orders', 'order-history', 'trade-history', 'transaction-history', 'funding-fee'].includes(tableType);
    const isPositionTable = tableType === 'position-history';
    
    if (!config.key || config.direction === 'default') {
      if (isOrdersTable || isPositionTable) {
        // Default sort: newest first (descending by time)
        return [...data].sort((a, b) => {
          const aTime = a.time || a.updateTime || 0;
          const bTime = b.time || b.updateTime || 0;
          return bTime - aTime; // Descending order (newest first)
        });
      }
      return data; // No sorting for non-orders tables
    }
    
    return [...data].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];
      
      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number' || !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (config.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Sort indicator component
  const SortIndicator = ({ tableType, column }) => {
    const config = sortConfig[tableType];
    if (config.key !== column) return null;
    
    if (config.direction === 'asc') return ' ↑';
    if (config.direction === 'desc') return ' ↓';
    return null;
  };

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch enhanced account info first (includes spot + futures + direct Binance values)
      const enhancedAccountInfo = await binanceApi.getEnhancedAccountInfo();
      
      // Use the enhanced account data structure directly from Binance API
      const combinedAccountData = {
        // Keep spot account data for balance details
        balances: enhancedAccountInfo.spot?.balances || [],
        ...enhancedAccountInfo.spot,
        
        // Use Binance's direct portfolio value (no local calculation)
        totalPortfolioValue: enhancedAccountInfo.totalPortfolioValue || 0,
        
        // Add the separate wallet values from Binance API
        spotWalletValue: enhancedAccountInfo.spotWalletValue || 0,
        futuresWalletValue: enhancedAccountInfo.futuresWalletValue || 0,
        
        // Keep futures and wallet data
        futures: enhancedAccountInfo.futures,
        futuresAccount: enhancedAccountInfo.futures, // For backward compatibility
        walletSnapshot: enhancedAccountInfo.walletSnapshot,
        
        // Include current prices for individual asset USD calculations
        currentPrices: enhancedAccountInfo.currentPrices || [],
        
        // Mark as using direct Binance data
        usingDirectBinanceData: true
      };
      
      console.log('Combined account data structure:', {
        totalPortfolioValue: combinedAccountData.totalPortfolioValue,
        spotWalletValue: combinedAccountData.spotWalletValue,
        futuresWalletValue: combinedAccountData.futuresWalletValue,
        spotBalances: combinedAccountData.balances?.length || 0,
        hasFutures: !!combinedAccountData.futures,
        hasWalletSnapshot: !!combinedAccountData.walletSnapshot,
        currentPricesCount: combinedAccountData.currentPrices?.length || 0,
        currentPricesPreview: combinedAccountData.currentPrices?.slice(0, 3) || []
      });
      
      setAccountData(combinedAccountData);

      // Fetch orders and open orders (these are optional and should not fail the entire fetch)
      try {
        const [ordersResult, openOrdersResult, futuresDataResult] = await Promise.allSettled([
          binanceApi.getAllOrders(null, 100),
          binanceApi.getOpenOrders(),
          binanceApi.getFuturesOrdersData()
        ]);

        // Handle orders result
        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value.reverse()); // Show most recent first
        } else {
          console.warn('Failed to fetch orders:', ordersResult.reason);
          setOrders([]); // Set empty array instead of failing completely
        }

        // Handle open orders result
        if (openOrdersResult.status === 'fulfilled') {
          console.log('Open orders fetched successfully:', openOrdersResult.value);
          setOpenOrders(openOrdersResult.value);
        } else {
          console.warn('Failed to fetch open orders:', openOrdersResult.reason);
          setOpenOrders([]);
        }

        // Handle futures data result
        if (futuresDataResult.status === 'fulfilled') {
          const futuresData = futuresDataResult.value;
          console.log('Futures data fetched successfully:', futuresData);
          setFuturesOpenOrders(futuresData.openOrders || []);
          setFuturesOrderHistory(futuresData.orderHistory || []);
          setPositionHistory(futuresData.positions || []);
          setTradeHistory(futuresData.tradeHistory || []);
          setTransactionHistory(futuresData.transactionHistory || []);
          setFundingFeeHistory(futuresData.fundingFees || []);
        } else {
          console.warn('Failed to fetch futures data:', futuresDataResult.reason);
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

  const handleManualRefresh = () => {
    setAutoRefreshTimer(15); // Reset timer to 15 seconds
    fetchData(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshActive(!autoRefreshActive);
    if (!autoRefreshActive) {
      setAutoRefreshTimer(15); // Reset timer when reactivating
    }
  };

  const fetch24hTickerData = async () => {
    try {
      // Get 24h ticker for BTCUSDT as a proxy for overall market movement
      const ticker = await binanceApi.get24hTicker('BTCUSDT');
      setTickerData(ticker);
    } catch (error) {
      console.warn('Failed to fetch 24h ticker data:', error.message);
      setTickerData(null);
    }
  };

  useEffect(() => {
    fetchData();
    fetch24hTickerData();
  }, []);

  // Auto-refresh timer effect
  useEffect(() => {
    if (!autoRefreshActive) return;

    const interval = setInterval(() => {
      setAutoRefreshTimer(prev => {
        if (prev <= 1) {
          // Time to refresh
          fetchData(true);
          return 15; // Reset to 15 seconds
        }
        return prev - 1;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [autoRefreshActive]);

  // Pause auto-refresh when user is actively refreshing
  useEffect(() => {
    if (refreshing) {
      setAutoRefreshActive(false);
    } else {
      // Resume auto-refresh after manual refresh is complete
      setTimeout(() => setAutoRefreshActive(true), 1000);
    }
  }, [refreshing]);

  // Use portfolio values and P&L directly from Binance API (no local calculations)
  const calculatePnL = () => {
    if (!accountData) return { totalValue: 0, totalPnL: 0, spotValue: 0, futuresValue: 0, pnlPercentage: 0 };

    console.log('Dashboard accountData:', accountData);
    console.log('Specific values:', {
      totalPortfolioValue: accountData.totalPortfolioValue,
      spotWalletValue: accountData.spotWalletValue,
      futuresWalletValue: accountData.futuresWalletValue
    });

    // Use totalPortfolioValue directly from Binance API - no local calculation
    const totalValue = accountData.totalPortfolioValue || 0;
    
    // Use spot wallet value directly from Binance API
    const spotValue = accountData.spotWalletValue || 0;
    
    // Use futures wallet value directly from Binance API
    const futuresValue = accountData.futuresWalletValue || 0;
    
    // Get P&L directly from Binance API
    let totalPnL = 0;
    let pnlPercentage = 0;
    
    if (accountData.futures) {
      // Use Binance's direct unrealized P&L
      if (accountData.futures.totalUnrealizedPnl !== undefined) {
        totalPnL = parseFloat(accountData.futures.totalUnrealizedPnl);
        pnlPercentage = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;
      }
      
      // Add cross-wallet balance if available
      if (accountData.futures.totalCrossWalletBalance) {
        const crossBalance = parseFloat(accountData.futures.totalCrossWalletBalance);
        console.log('Cross wallet balance:', crossBalance);
      }
    }
    
    // If wallet snapshot is available, use it for more accurate total
    if (accountData.walletSnapshot && accountData.walletSnapshot.totalAssetOfBtc) {
      console.log('Using wallet snapshot data from Binance');
      // totalValue should already be calculated from this in the API
    }
    
    console.log('Using Binance direct values:', { 
      totalValue, 
      spotValue, 
      futuresValue, 
      totalPnL, 
      pnlPercentage,
      source: 'Binance API Direct'
    });
    
    return { 
      totalValue, 
      totalPnL, 
      spotValue, 
      futuresValue,
      pnlPercentage
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const toggleSection = (sectionName) => {
    // Always switch to the clicked section, never close all sections
    setExpandedSection(sectionName);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOrderStatusBadge = (status) => {
    const statusClasses = {
      'FILLED': 'status-filled',
      'PARTIALLY_FILLED': 'status-partial',
      'NEW': 'status-new',
      'CANCELED': 'status-canceled',
      'REJECTED': 'status-rejected',
      'EXPIRED': 'status-expired'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={() => fetchData()} className="retry-btn">
            <RefreshCw size={16} />
            Retry
          </button>
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={16} />
            Change API Keys
          </button>
        </div>
      </div>
    );
  }

  const { totalValue, totalPnL, spotValue, futuresValue, balances } = calculatePnL();

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <CosmicBackground darkMode={darkMode} />
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-content">
              <img src="public/logo.jpg" width={100} height={50} alt="Logo" className="header-logo" />
              <h1>Trading Dashboard</h1>
            </div>
            <span 
              className={`auto-refresh-indicator ${autoRefreshActive ? 'active' : 'paused'}`} 
              onClick={toggleAutoRefresh}
              title={autoRefreshActive ? 'Auto-refresh active - click to pause' : 'Auto-refresh paused - click to resume'}
            >
              <Activity size={12} />
              {autoRefreshActive ? 'Live' : 'Paused'}
            </span>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="theme-toggle-btn"
              title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={handleManualRefresh} 
              className={`refresh-btn ${autoRefreshTimer <= 3 && autoRefreshActive ? 'urgent' : ''}`}
              disabled={refreshing}
              title={autoRefreshActive ? `Auto-refresh in ${autoRefreshTimer}s` : 'Auto-refresh paused - manual refresh only'}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : autoRefreshActive ? `Refresh (${autoRefreshTimer}s)` : 'Refresh'}
            </button>
            <button onClick={onLogout} className="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Account Overview */}
        <section className="overview-section">
          <h2>Account Overview</h2>
          <div className="overview-grid">
            <div className="overview-card clickable" onClick={() => toggleSection('portfolio')}>
              <div className="card-icon">
                <DollarSign size={24} />
              </div>
              <div className="card-content">
                <h3>Portfolio</h3>
                <p className="value">{formatCurrency(totalValue)}</p>
                <small className="sub-value">
                  Spot: {formatCurrency(spotValue)} | Futures: {formatCurrency(futuresValue)}
                </small>
              </div>
            </div>
            
            <div className="overview-card clickable" onClick={() => toggleSection('pnl')}>
              <div className="card-icon">
                <TrendingUp size={24} />
              </div>
              <div className="card-content">
                <h3>P&L</h3>
                <p className={`value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </p>
                <small className="sub-value">
                  {(() => {
                    const { pnlPercentage } = calculatePnL();
                    if (isNaN(pnlPercentage) || !isFinite(pnlPercentage)) {
                      return '0.00% return';
                    }
                    return `${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}% return`;
                  })()}
                </small>
              </div>
            </div>
            
            <div className="overview-card clickable" onClick={() => toggleSection('orders')}>
              <div className="card-icon">
                <Activity size={24} />
              </div>
              <div className="card-content">
                <h3>Orders Management</h3>
                <p className="value">{openOrders.length} open • {(orders.length + futuresOrderHistory.length)} total orders</p>
                <small className="sub-value">Active & Recent Orders</small>
              </div>
            </div>
          </div>
        </section>

        {/* Expandable Sections */}
        {expandedSection === 'portfolio' && (
          <section className="expanded-section portfolio-section">
            <div className="section-header">
              <h2>Portfolio Overview</h2>
            </div>
            
            <div className="section-content">
              <div className="portfolio-summary">
                <div className="portfolio-stats">
                  <div className="stat-item">
                    <span className="label">Total Portfolio Value</span>
                    <span className="value">{formatCurrency(totalValue)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Spot Wallet</span>
                    <span className="value">{formatCurrency(spotValue)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Futures Wallet</span>
                    <span className="value">{formatCurrency(futuresValue)}</span>
                  </div>
                </div>

                <div className="wallet-tabs">
                  <div className="tab-header">
                    <div className="wallet-buttons">
                      <button 
                        className={`tab-btn ${activeWalletTab === 'spot' ? 'active' : ''}`}
                        onClick={() => setActiveWalletTab('spot')}
                      >
                        Spot Wallet
                      </button>
                      <button 
                        className={`tab-btn ${activeWalletTab === 'futures' ? 'active' : ''}`}
                        onClick={() => setActiveWalletTab('futures')}
                      >
                        Futures Wallet
                      </button>
                    </div>
                    <div className="tab-controls">
                      <button
                        className={`toggle-btn ${hideSmallBalances ? 'active' : ''}`}
                        onClick={() => setHideSmallBalances(!hideSmallBalances)}
                      >
                        {hideSmallBalances ? <Eye size={16} /> : <EyeOff size={16} />}
                        <span style={{ marginLeft: '0.5rem' }}>
                          {hideSmallBalances ? 'Show All Assets' : 'Hide Small Assets'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="tab-content">
                    {activeWalletTab === 'spot' && (
                      <div className="wallet-content">
                        <div className="wallet-header">
                          <span>Asset</span>
                          <span>Total</span>
                          <span>Available</span>
                          <span>In Order</span>
                          <span>USD Value</span>
                        </div>
                        
                        {accountData?.balances
                          ?.filter(balance => {
                            const total = parseFloat(balance.free) + parseFloat(balance.locked);
                            return hideSmallBalances ? total > 0.00001 : total > 0;
                          })
                          ?.sort((a, b) => {
                            const getUsdValue = (balance) => {
                              const total = parseFloat(balance.free) + parseFloat(balance.locked);
                              if (balance.asset === 'USDT' || balance.asset === 'BUSD' || balance.asset === 'USDC') {
                                return total;
                              }
                              if (accountData.currentPrices) {
                                const priceData = accountData.currentPrices.find(p => p.symbol === `${balance.asset}USDT`);
                                return priceData ? total * parseFloat(priceData.price) : 0;
                              }
                              return 0;
                            };
                            return getUsdValue(b) - getUsdValue(a);
                          })
                          ?.map((balance, index) => {
                            const total = parseFloat(balance.free) + parseFloat(balance.locked);
                            const free = parseFloat(balance.free);
                            const locked = parseFloat(balance.locked);
                            
                            let usdValue = 0;
                            if (balance.asset === 'USDT' || balance.asset === 'BUSD' || balance.asset === 'USDC') {
                              usdValue = total;
                            } else if (accountData.currentPrices) {
                              const priceData = accountData.currentPrices.find(p => p.symbol === `${balance.asset}USDT`);
                              if (priceData) {
                                usdValue = total * parseFloat(priceData.price);
                              }
                            }

                            return (
                              <div key={balance.asset} className="wallet-item">
                                <div className="asset-info">
                                  <span className="asset-symbol">{balance.asset}</span>
                                </div>
                                <span className="balance-amount">{total.toFixed(8)}</span>
                                <span className="balance-amount">{free.toFixed(8)}</span>
                                <span className="balance-amount">{locked.toFixed(8)}</span>
                                <span className="usd-value">
                                  {usdValue > 0.001 ? `$${usdValue.toFixed(3)}` : '$0.000'}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {activeWalletTab === 'futures' && (
                      <div className="wallet-content">
                        <div className="wallet-header">
                          <span>Asset</span>
                          <span>Wallet Balance</span>
                          <span>Unrealized PnL</span>
                          <span>Margin Balance</span>
                          <span>USD Value</span>
                        </div>
                        
                        {accountData?.futuresAccount?.assets
                          ?.filter(asset => {
                            const walletBalance = parseFloat(asset.walletBalance);
                            return hideSmallBalances ? walletBalance > 0.00001 : walletBalance > 0;
                          })
                          ?.sort((a, b) => parseFloat(b.walletBalance) - parseFloat(a.walletBalance))
                          ?.map((asset, index) => {
                            const walletBalance = parseFloat(asset.walletBalance);
                            const unrealizedProfit = parseFloat(asset.unrealizedProfit || 0);
                            const marginBalance = parseFloat(asset.marginBalance || 0);
                            
                            let usdValue = walletBalance;
                            if (asset.asset !== 'USDT' && asset.asset !== 'BUSD' && accountData.currentPrices) {
                              const priceData = accountData.currentPrices.find(p => p.symbol === `${asset.asset}USDT`);
                              if (priceData) {
                                usdValue = walletBalance * parseFloat(priceData.price);
                              }
                            }

                            return (
                              <div key={asset.asset} className="wallet-item">
                                <div className="asset-info">
                                  <span className="asset-symbol">{asset.asset}</span>
                                </div>
                                <span className="balance-amount">{walletBalance.toFixed(8)}</span>
                                <span className={`balance-amount ${unrealizedProfit >= 0 ? 'positive' : 'negative'}`}>
                                  {unrealizedProfit >= 0 ? '+' : ''}{unrealizedProfit.toFixed(2)}
                                </span>
                                <span className="balance-amount">{marginBalance.toFixed(8)}</span>
                                <span className="usd-value">
                                  {usdValue > 0.01 ? `$${usdValue.toFixed(2)}` : '$0.00'}
                                </span>
                              </div>
                            );
                          })}
                      
                        {/* Futures Positions */}
                        {accountData?.futuresAccount?.positions
                          ?.filter(pos => parseFloat(pos.positionAmt) !== 0)
                          ?.map((position, index) => (
                            <div key={`pos-${position.symbol}`} className="wallet-item futures-position">
                              <div className="asset-info">
                                <span className="asset-symbol">{position.symbol}</span>
                                <small style={{color: '#718096'}}>Position</small>
                              </div>
                              <span className="balance-amount">{parseFloat(position.positionAmt).toFixed(4)}</span>
                              <span className={`balance-amount ${parseFloat(position.unrealizedProfit) >= 0 ? 'positive' : 'negative'}`}>
                                {parseFloat(position.unrealizedProfit) >= 0 ? '+' : ''}{parseFloat(position.unrealizedProfit).toFixed(2)}
                              </span>
                              <span className="balance-amount">${parseFloat(position.notional).toFixed(2)}</span>
                              <span className="usd-value">
                                ${Math.abs(parseFloat(position.notional)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        
                        {/* Futures Summary */}
                        {accountData?.futuresAccount && (
                          <div className="futures-info">
                            <h4>Futures Account Summary</h4>
                            <div className="futures-stats">
                              <div className="stat-item">
                                <span>Total Wallet Balance:</span>
                                <span>${parseFloat(accountData.futuresAccount.totalWalletBalance || 0).toFixed(2)}</span>
                              </div>
                              <div className="stat-item">
                                <span>Total Unrealized PnL:</span>
                                <span className={parseFloat(accountData.futuresAccount.totalUnrealizedPnl || 0) >= 0 ? 'positive' : 'negative'}>
                                  {parseFloat(accountData.futuresAccount.totalUnrealizedPnl || 0) >= 0 ? '+' : ''}
                                  ${parseFloat(accountData.futuresAccount.totalUnrealizedPnl || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="stat-item">
                                <span>Total Margin Balance:</span>
                                <span>${parseFloat(accountData.futuresAccount.totalMarginBalance || 0).toFixed(2)}</span>
                              </div>
                              <div className="stat-item">
                                <span>Available Balance:</span>
                                <span>${parseFloat(accountData.futuresAccount.availableBalance || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {expandedSection === 'pnl' && (
          <section className="expanded-section pnl-section">
            <div className="section-header">
              <h2>Profit & Loss Overview</h2>
            </div>
            <div className="section-content">
              <div className="pnl-summary">
                <div className="pnl-card">
                  <h3>Total P&L</h3>
                  <p className={`pnl-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </p>
                  <p className="pnl-percentage">
                    {(() => {
                      const { pnlPercentage } = calculatePnL();
                      if (isNaN(pnlPercentage) || !isFinite(pnlPercentage)) {
                        return '0.00% return';
                      }
                      return `${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}% return`;
                    })()}
                  </p>
                </div>

                {positionHistory && positionHistory.length > 0 && (
                  <div className="current-positions">
                    <h4>Current Positions ({positionHistory.length} positions)</h4>
                    <p className="futures-description">
                      Current open positions in USD-M Futures (click column headers to sort)
                    </p>
                    <div className="positions-table-container">
                      <table className="futures-table">
                        <thead>
                          <tr>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'symbol')}
                            >
                              Symbol
                              <SortIndicator tableType="position-history" column="symbol" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'positionAmt')}
                            >
                              Side
                              <SortIndicator tableType="position-history" column="positionAmt" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'positionAmt')}
                            >
                              Size
                              <SortIndicator tableType="position-history" column="positionAmt" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'entryPrice')}
                            >
                              Entry Price
                              <SortIndicator tableType="position-history" column="entryPrice" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'markPrice')}
                            >
                              Mark Price
                              <SortIndicator tableType="position-history" column="markPrice" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'unrealizedProfit')}
                            >
                              Unrealized PnL
                              <SortIndicator tableType="position-history" column="unrealizedProfit" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'roe')}
                            >
                              ROE%
                              <SortIndicator tableType="position-history" column="roe" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'roi')}
                            >
                              ROI%
                              <SortIndicator tableType="position-history" column="roi" />
                            </th>
                            <th 
                              className="sortable" 
                              onClick={() => handleSort('position-history', 'leverage')}
                            >
                              Leverage
                              <SortIndicator tableType="position-history" column="leverage" />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortData(positionHistory, 'position-history').map((position, index) => {
                            const unrealizedPnl = parseFloat(position.unrealizedProfit || position.unRealizedProfit || 0);
                            const roe = parseFloat(position.roe || position.percentage || 0); // ROE from Binance
                            const roi = parseFloat(position.roi || 0); // ROI calculated from margin
                            const leverage = position.leverage || '1';
                            
                            return (
                              <tr key={`${position.symbol}-${index}`}>
                                <td className="symbol">{position.symbol}</td>
                                <td className={`side side-${parseFloat(position.positionAmt) > 0 ? 'long' : 'short'}`}>
                                  {parseFloat(position.positionAmt) > 0 ? 'LONG' : 'SHORT'}
                                </td>
                                <td>{Math.abs(parseFloat(position.positionAmt)).toFixed(4)}</td>
                                <td>{parseFloat(position.entryPrice).toFixed(4)}</td>
                                <td>{parseFloat(position.markPrice).toFixed(4)}</td>
                                <td className={unrealizedPnl >= 0 ? 'profit' : 'loss'}>
                                  {isNaN(unrealizedPnl) ? '0.0000' : unrealizedPnl.toFixed(4)} USDT
                                </td>
                                <td className={roe >= 0 ? 'profit' : 'loss'}>
                                  {isNaN(roe) ? '0.00' : roe.toFixed(2)}%
                                </td>
                                <td className={roi >= 0 ? 'profit' : 'loss'}>
                                  {isNaN(roi) ? '0.00' : roi.toFixed(2)}%
                                </td>
                                <td>{leverage}x</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <br />
                <br />

                <div className="pnl-breakdown">
                  <h4>P&L Breakdown</h4>
                  <div className="pnl-item">
                    <span>Spot Trading:</span>
                    <span className={spotValue >= 0 ? 'positive' : 'negative'}>
                      ${spotValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="pnl-item">
                    <span>Futures Trading:</span>
                    <span className={futuresValue >= 0 ? 'positive' : 'negative'}>
                      ${futuresValue.toFixed(2)}
                    </span>
                  </div>
                  {accountData?.futures?.totalUnrealizedPnl && (
                    <div className="pnl-item">
                      <span>Unrealized PnL:</span>
                      <span className={parseFloat(accountData.futures.totalUnrealizedPnl) >= 0 ? 'positive' : 'negative'}>
                        {parseFloat(accountData.futures.totalUnrealizedPnl) >= 0 ? '+' : ''}
                        ${parseFloat(accountData.futures.totalUnrealizedPnl).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {expandedSection === 'orders' && (
          <section className="expanded-section orders-section">
            <div className="section-header">
              <h2>Orders Management - USD-M Futures</h2>
              <p className="section-description">Complete trading history from Binance USD-M Futures</p>
            </div>
            <div className="section-content">
              {/* Futures Trading Tabs */}
              <div className="futures-tabs">
                <div className="tab-header">
                  <div className="futures-tab-buttons">
                    <button 
                      className={`futures-tab-btn ${activeFuturesTab === 'open-orders' ? 'active' : ''}`}
                      onClick={() => setActiveFuturesTab('open-orders')}
                    >
                      <Activity size={16} />
                      <span style={{ marginLeft: '0.5rem' }}>
                        Open Orders ({futuresOpenOrders.length})
                      </span>
                    </button>
                    <button 
                      className={`futures-tab-btn ${activeFuturesTab === 'order-history' ? 'active' : ''}`}
                      onClick={() => setActiveFuturesTab('order-history')}
                    >
                      <History size={16} />
                      <span style={{ marginLeft: '0.5rem' }}>
                        Order History ({futuresOrderHistory.length})
                      </span>
                    </button>
                    <button 
                      className={`futures-tab-btn ${activeFuturesTab === 'trade-history' ? 'active' : ''}`}
                      onClick={() => setActiveFuturesTab('trade-history')}
                    >
                      <TrendingUp size={16} />
                      <span style={{ marginLeft: '0.5rem' }}>
                        Trade History ({tradeHistory.length})
                      </span>
                    </button>
                    <button 
                      className={`futures-tab-btn ${activeFuturesTab === 'transaction-history' ? 'active' : ''}`}
                      onClick={() => setActiveFuturesTab('transaction-history')}
                    >
                      <ArrowUpDown size={16} />
                      <span style={{ marginLeft: '0.5rem' }}>
                        Transaction History ({transactionHistory.length})
                      </span>
                    </button>
                    <button 
                      className={`futures-tab-btn ${activeFuturesTab === 'funding-fee' ? 'active' : ''}`}
                      onClick={() => setActiveFuturesTab('funding-fee')}
                    >
                      <Coins size={16} />
                      <span style={{ marginLeft: '0.5rem' }}>
                        Funding Fee ({fundingFeeHistory.length})
                      </span>
                    </button>
                  </div>
                </div>

                <div className="futures-tab-content">
                  {activeFuturesTab === 'open-orders' && (
                    <div className="futures-table-container">
                      <h3>Active Open Orders ({futuresOpenOrders.length} orders)</h3>
                      <p className="futures-description">
                        Currently active orders in USD-M Futures (click column headers to sort)
                      </p>
                      {futuresOpenOrders.length > 0 ? (
                        <table className="futures-table">
                          <thead>
                            <tr>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'symbol')}
                              >
                                Symbol
                                <SortIndicator tableType="open-orders" column="symbol" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'side')}
                              >
                                Side
                                <SortIndicator tableType="open-orders" column="side" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'type')}
                              >
                                Type
                                <SortIndicator tableType="open-orders" column="type" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'origQty')}
                              >
                                Quantity
                                <SortIndicator tableType="open-orders" column="origQty" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'price')}
                              >
                                Price
                                <SortIndicator tableType="open-orders" column="price" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'stopPrice')}
                              >
                                Stop Price
                                <SortIndicator tableType="open-orders" column="stopPrice" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'status')}
                              >
                                Status
                                <SortIndicator tableType="open-orders" column="status" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'timeInForce')}
                              >
                                Time in Force
                                <SortIndicator tableType="open-orders" column="timeInForce" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('open-orders', 'time')}
                              >
                                Time
                                <SortIndicator tableType="open-orders" column="time" />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortData(futuresOpenOrders, 'open-orders').map((order) => (
                              <tr key={order.orderId}>
                                <td className="symbol">{order.symbol}</td>
                                <td className={`side side-${order.side.toLowerCase()}`}>{order.side}</td>
                                <td>{order.type}</td>
                                <td>{parseFloat(order.origQty).toFixed(4)}</td>
                                <td>{order.price === '0' ? 'Market' : parseFloat(order.price).toFixed(4)}</td>
                                <td>{order.stopPrice && order.stopPrice !== '0' ? parseFloat(order.stopPrice).toFixed(4) : '-'}</td>
                                <td>{getOrderStatusBadge(order.status)}</td>
                                <td>{order.timeInForce}</td>
                                <td>{formatDate(order.time || order.updateTime)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-orders">
                          <p>No open futures orders found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeFuturesTab === 'order-history' && (
                    <div className="futures-table-container">
                      <h3>Order History ({futuresOrderHistory.length} orders)</h3>
                      <p className="futures-description">
                        Complete order history from USD-M Futures (click column headers to sort)
                      </p>
                      {futuresOrderHistory.length > 0 ? (
                        <table className="futures-table">
                          <thead>
                            <tr>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'symbol')}
                              >
                                Symbol
                                <SortIndicator tableType="order-history" column="symbol" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'side')}
                              >
                                Side
                                <SortIndicator tableType="order-history" column="side" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'type')}
                              >
                                Type
                                <SortIndicator tableType="order-history" column="type" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'origQty')}
                              >
                                Quantity
                                <SortIndicator tableType="order-history" column="origQty" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'price')}
                              >
                                Price
                                <SortIndicator tableType="order-history" column="price" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'executedQty')}
                              >
                                Executed
                                <SortIndicator tableType="order-history" column="executedQty" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'status')}
                              >
                                Status
                                <SortIndicator tableType="order-history" column="status" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'reduceOnly')}
                              >
                                Reduce Only
                                <SortIndicator tableType="order-history" column="reduceOnly" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('order-history', 'time')}
                              >
                                Time
                                <SortIndicator tableType="order-history" column="time" />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortData(futuresOrderHistory, 'order-history').map((order) => (
                              <tr key={order.orderId}>
                                <td className="symbol">{order.symbol}</td>
                                <td className={`side side-${order.side.toLowerCase()}`}>{order.side}</td>
                                <td>{order.type}</td>
                                <td>{parseFloat(order.origQty).toFixed(4)}</td>
                                <td>{order.price === '0' ? 'Market' : parseFloat(order.price).toFixed(4)}</td>
                                <td>{parseFloat(order.executedQty || 0).toFixed(4)}</td>
                                <td>{getOrderStatusBadge(order.status)}</td>
                                <td>{order.reduceOnly ? 'Yes' : 'No'}</td>
                                <td>{formatDate(order.time || order.updateTime)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-orders">
                          <p>No futures order history found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeFuturesTab === 'trade-history' && (
                    <div className="futures-table-container">
                      <h3>Trade History ({tradeHistory.length} trades)</h3>
                      <p className="futures-description">
                        Recent executed trades from USD-M Futures (click column headers to sort)
                      </p>
                      {tradeHistory.length > 0 ? (
                        <table className="futures-table">
                          <thead>
                            <tr>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'symbol')}
                              >
                                Symbol
                                <SortIndicator tableType="trade-history" column="symbol" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'side')}
                              >
                                Side
                                <SortIndicator tableType="trade-history" column="side" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'qty')}
                              >
                                Quantity
                                <SortIndicator tableType="trade-history" column="qty" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'price')}
                              >
                                Price
                                <SortIndicator tableType="trade-history" column="price" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'quoteQty')}
                              >
                                Quote Qty
                                <SortIndicator tableType="trade-history" column="quoteQty" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'commission')}
                              >
                                Commission
                                <SortIndicator tableType="trade-history" column="commission" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'commissionAsset')}
                              >
                                Commission Asset
                                <SortIndicator tableType="trade-history" column="commissionAsset" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'realizedPnl')}
                              >
                                Realized PnL
                                <SortIndicator tableType="trade-history" column="realizedPnl" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('trade-history', 'time')}
                              >
                                Time
                                <SortIndicator tableType="trade-history" column="time" />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortData(tradeHistory, 'trade-history').map((trade) => (
                              <tr key={trade.id}>
                                <td className="symbol">{trade.symbol}</td>
                                <td className={`side side-${trade.side.toLowerCase()}`}>{trade.side}</td>
                                <td>{parseFloat(trade.qty).toFixed(4)}</td>
                                <td>{parseFloat(trade.price).toFixed(4)}</td>
                                <td>{parseFloat(trade.quoteQty).toFixed(4)}</td>
                                <td>{parseFloat(trade.commission).toFixed(6)}</td>
                                <td>{trade.commissionAsset}</td>
                                <td className={parseFloat(trade.realizedPnl) >= 0 ? 'profit' : 'loss'}>
                                  {parseFloat(trade.realizedPnl).toFixed(4)}
                                </td>
                                <td>{formatDate(trade.time)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-orders">
                          <p>No trade history found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeFuturesTab === 'transaction-history' && (
                    <div className="futures-table-container">
                      <h3>Transaction History ({transactionHistory.length} transactions)</h3>
                      <p className="futures-description">
                        Income history including realized PnL, funding fees, commission rebates (click column headers to sort)
                      </p>
                      {transactionHistory.length > 0 ? (
                        <table className="futures-table">
                          <thead>
                            <tr>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('transaction-history', 'symbol')}
                              >
                                Symbol
                                <SortIndicator tableType="transaction-history" column="symbol" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('transaction-history', 'incomeType')}
                              >
                                Income Type
                                <SortIndicator tableType="transaction-history" column="incomeType" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('transaction-history', 'income')}
                              >
                                Income
                                <SortIndicator tableType="transaction-history" column="income" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('transaction-history', 'asset')}
                              >
                                Asset
                                <SortIndicator tableType="transaction-history" column="asset" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('transaction-history', 'info')}
                              >
                                Info
                                <SortIndicator tableType="transaction-history" column="info" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('transaction-history', 'time')}
                              >
                                Time
                                <SortIndicator tableType="transaction-history" column="time" />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortData(transactionHistory, 'transaction-history').map((transaction, index) => (
                              <tr key={`${transaction.tranId || index}`}>
                                <td className="symbol">{transaction.symbol || '-'}</td>
                                <td>{transaction.incomeType}</td>
                                <td className={parseFloat(transaction.income) >= 0 ? 'profit' : 'loss'}>
                                  {parseFloat(transaction.income).toFixed(6)}
                                </td>
                                <td>{transaction.asset}</td>
                                <td>{transaction.info || '-'}</td>
                                <td>{formatDate(transaction.time)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-orders">
                          <p>No transaction history found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeFuturesTab === 'funding-fee' && (
                    <div className="futures-table-container">
                      <h3>Funding Fee History ({fundingFeeHistory.length} records)</h3>
                      <p className="futures-description">
                        Funding fees paid/received for holding positions (click column headers to sort)
                      </p>
                      {fundingFeeHistory.length > 0 ? (
                        <table className="futures-table">
                          <thead>
                            <tr>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('funding-fee', 'symbol')}
                              >
                                Symbol
                                <SortIndicator tableType="funding-fee" column="symbol" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('funding-fee', 'income')}
                              >
                                Funding Fee
                                <SortIndicator tableType="funding-fee" column="income" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('funding-fee', 'asset')}
                              >
                                Asset
                                <SortIndicator tableType="funding-fee" column="asset" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('funding-fee', 'info')}
                              >
                                Info
                                <SortIndicator tableType="funding-fee" column="info" />
                              </th>
                              <th 
                                className="sortable" 
                                onClick={() => handleSort('funding-fee', 'time')}
                              >
                                Time
                                <SortIndicator tableType="funding-fee" column="time" />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortData(fundingFeeHistory, 'funding-fee').map((fee, index) => (
                              <tr key={`${fee.tranId || index}`}>
                                <td className="symbol">{fee.symbol}</td>
                                <td className={parseFloat(fee.income) >= 0 ? 'profit' : 'loss'}>
                                  {parseFloat(fee.income).toFixed(6)}
                                </td>
                                <td>{fee.asset}</td>
                                <td>{fee.info || '-'}</td>
                                <td>{formatDate(fee.time)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-orders">
                          <p>No funding fee history found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
