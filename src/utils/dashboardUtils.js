export const calculatePnL = (accountData) => {
  if (!accountData) {
    return { totalValue: 0, totalPnL: 0, spotValue: 0, futuresValue: 0, pnlPercentage: 0 };
  }

  console.log('P&L Calculation Input:', {
    accountData: accountData,
    hasFutures: !!accountData.futures,
    futuresData: accountData.futures,
    spotValue: accountData.spotWalletValue,
    futuresValue: accountData.futuresWalletValue
  });

  const spotValue = accountData.spotWalletValue || 0;
  const futuresValue = accountData.futuresWalletValue || 0;

  let unrealizedPnL = 0;
  
  // Try multiple ways to get P&L data
  if (accountData.futures && accountData.futures.totalUnrealizedPnl !== undefined) {
    unrealizedPnL = parseFloat(accountData.futures.totalUnrealizedPnl);
    console.log('✅ Got P&L from accountData.futures.totalUnrealizedPnl:', unrealizedPnL);
  } else if (accountData.futuresAccount && accountData.futuresAccount.totalUnrealizedPnl !== undefined) {
    unrealizedPnL = parseFloat(accountData.futuresAccount.totalUnrealizedPnl);
    console.log('✅ Got P&L from accountData.futuresAccount.totalUnrealizedPnl:', unrealizedPnL);
  } else if (accountData.futures && accountData.futures.positions) {
    // Calculate P&L from positions if available
    accountData.futures.positions.forEach(position => {
      if (parseFloat(position.positionAmt || 0) !== 0) {
        unrealizedPnL += parseFloat(position.unrealizedProfit || 0);
      }
    });
    console.log('✅ Calculated P&L from positions:', unrealizedPnL);
  } else if (accountData.futuresAccount && accountData.futuresAccount.positions) {
    // Alternative position data location
    accountData.futuresAccount.positions.forEach(position => {
      if (parseFloat(position.positionAmt || 0) !== 0) {
        unrealizedPnL += parseFloat(position.unrealizedProfit || 0);
      }
    });
    console.log('✅ Calculated P&L from futuresAccount positions:', unrealizedPnL);
  } else {
    console.warn('⚠️ No futures P&L data available - futures trading may not be enabled or accessible');
  }
  
  const totalValue = spotValue + futuresValue + unrealizedPnL;
  const totalPnL = unrealizedPnL;
  
  const walletBalance = spotValue + futuresValue;
  const pnlPercentage = walletBalance > 0 ? (totalPnL / walletBalance) * 100 : 0;

  const result = { 
    totalValue, 
    totalPnL, 
    spotValue, 
    futuresValue,
    pnlPercentage
  };

  console.log('P&L Calculation Result:', result);
  return result;
};

export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

export const getOrderStatusClass = (status) => {
  const statusClasses = {
    'FILLED': 'status-filled',
    'PARTIALLY_FILLED': 'status-partial',
    'NEW': 'status-new',
    'CANCELED': 'status-canceled',
    'REJECTED': 'status-rejected',
    'EXPIRED': 'status-expired'
  };

  return statusClasses[status] || 'status-default';
};
