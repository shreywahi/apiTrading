import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Activity, LogOut, RefreshCw, Eye, EyeOff, Moon, Sun } from 'lucide-react';
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
        const [ordersResult, openOrdersResult] = await Promise.allSettled([
          binanceApi.getAllOrders(null, 100),
          binanceApi.getOpenOrders()
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
      } catch (err) {
        console.warn('Error fetching orders (non-critical):', err.message);
        setOrders([]);
        setOpenOrders([]);
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
                <p className="value">{openOrders.length} open • {orders.filter(order => {
                  const orderTime = new Date(order.time);
                  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  const isRecent = orderTime >= oneWeekAgo;
                  const isCompleted = order.status === 'FILLED' || order.status === 'CANCELED' || order.status === 'REJECTED' || order.status === 'EXPIRED' || order.status === 'PARTIALLY_FILLED';
                  return isRecent && isCompleted;
                }).length} recent</p>
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
                
                {tickerData && (
                  <div className="market-info">
                    <h4>Market Context (BTCUSDT)</h4>
                    <div className="market-stats">
                      <div className="market-item">
                        <span>24h Price Change:</span>
                        <span className={parseFloat(tickerData.priceChangePercent) >= 0 ? 'positive' : 'negative'}>
                          {parseFloat(tickerData.priceChangePercent) >= 0 ? '+' : ''}{parseFloat(tickerData.priceChangePercent).toFixed(2)}%
                        </span>
                      </div>
                      <div className="market-item">
                        <span>24h Volume:</span>
                        <span>${parseFloat(tickerData.quoteVolume).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {expandedSection === 'orders' && (
          <section className="expanded-section orders-section">
            <div className="section-header">
              <h2>Orders Management</h2>
            </div>
            <div className="section-content">
              {/* Orders Tabs */}
              <div className="orders-tabs">
                <div className="tab-header">
                  <div className="wallet-buttons">
                    <button 
                      className={`tab-btn ${activeOrdersTab === 'open' ? 'active' : ''}`}
                      onClick={() => setActiveOrdersTab('open')}
                    >
                      Open Orders ({openOrders.length})
                    </button>
                    <button 
                      className={`tab-btn ${activeOrdersTab === 'recent' ? 'active' : ''}`}
                      onClick={() => setActiveOrdersTab('recent')}
                    >
                      Recent Orders ({orders.filter(order => {
                        const orderTime = new Date(order.time);
                        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        const isRecent = orderTime >= oneWeekAgo;
                        const isCompleted = order.status === 'FILLED' || order.status === 'CANCELED' || order.status === 'REJECTED' || order.status === 'EXPIRED' || order.status === 'PARTIALLY_FILLED';
                        return isRecent && isCompleted;
                      }).length})
                    </button>
                  </div>
                </div>

                <div className="tab-content">
                  {activeOrdersTab === 'open' ? (
                    <div className="orders-table-container">
                      <h3>Active Open Orders</h3>
                      <p className="orders-description">
                        This shows all currently active orders (NEW, PENDING) from both Spot and Futures wallets.
                        Futures orders are marked with ⚡ and leverage information where available.
                      </p>
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th>Market</th>
                            <th>Side</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openOrders.map((order) => (
                            <tr key={`${order.market}-${order.orderId}`} className={order.isFutures ? 'futures-order' : 'spot-order'}>
                              <td className="symbol">
                                {order.symbol}
                                {order.isFutures && <span className="futures-badge">⚡</span>}
                              </td>
                              <td>
                                <span className={`market-badge ${order.market?.toLowerCase() || 'spot'}`}>
                                  {order.market || 'Spot'}
                                  {order.isFutures && order.leverage && (
                                    <small className="leverage-info">{order.leverage}x</small>
                                  )}
                                </span>
                              </td>
                              <td className={`side side-${order.side.toLowerCase()}`}>{order.side}</td>
                              <td>{order.type}</td>
                              <td>{parseFloat(order.origQty).toFixed(8)}</td>
                              <td>{order.price === '0.00000000' ? 'Market' : parseFloat(order.price).toFixed(8)}</td>
                              <td>{getOrderStatusBadge(order.status)}</td>
                              <td>{formatDate(order.time || order.updateTime)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {openOrders.length === 0 && (
                        <div className="no-orders">
                          <p>No open orders found</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="orders-table-container">
                      <h3>Recent Orders (Last 7 Days)</h3>
                      <p className="orders-description">
                        This shows completed orders (filled, canceled, expired) from the last 7 days, excluding currently open orders.
                      </p>
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th>Market</th>
                            <th>Side</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Executed Qty</th>
                            <th>Status</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders
                            .filter(order => {
                              const orderTime = new Date(order.time);
                              const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                              const isRecent = orderTime >= oneWeekAgo;
                              // Only show completed orders (exclude open/pending orders)
                              const isCompleted = order.status === 'FILLED' || order.status === 'CANCELED' || order.status === 'REJECTED' || order.status === 'EXPIRED' || order.status === 'PARTIALLY_FILLED';
                              return isRecent && isCompleted;
                            })
                            .map((order) => (
                              <tr key={order.orderId}>
                                <td className="symbol">{order.symbol}</td>
                                <td>
                                  <span className={`market-badge ${order.market?.toLowerCase() || 'spot'}`}>
                                    {order.market || 'Spot'}
                                  </span>
                                </td>
                                <td className={`side side-${order.side.toLowerCase()}`}>{order.side}</td>
                                <td>{order.type}</td>
                                <td>{parseFloat(order.origQty).toFixed(8)}</td>
                                <td>{order.price === '0.00000000' ? 'Market' : parseFloat(order.price).toFixed(8)}</td>
                                <td>{parseFloat(order.executedQty).toFixed(8)}</td>
                                <td>{getOrderStatusBadge(order.status)}</td>
                                <td>{formatDate(order.time)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      
                      {orders.filter(order => {
                        const orderTime = new Date(order.time);
                        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        const isRecent = orderTime >= oneWeekAgo;
                        const isCompleted = order.status === 'FILLED' || order.status === 'CANCELED' || order.status === 'REJECTED' || order.status === 'EXPIRED' || order.status === 'PARTIALLY_FILLED';
                        return isRecent && isCompleted;
                      }).length === 0 && (
                        <div className="no-orders">
                          <p>No recent completed orders in the last 7 days</p>
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
