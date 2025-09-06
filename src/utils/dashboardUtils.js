export const calculatePnL = (accountData) => {
  if (!accountData) {
    return { totalValue: 0, totalPnL: 0, spotValue: 0, futuresValue: 0, pnlPercentage: 0 };
  }

  const spotValue = accountData.spotWalletValue || 0;
  const futuresValue = accountData.futuresWalletValue || 0; // Will be 0 for spot-only

  // For spot-only dashboard, P&L is primarily based on spot trading
  let unrealizedPnL = 0;
  
  // Only try to calculate futures P&L if futures data exists
  if (accountData.futures || accountData.futuresAccount) {
    // Try multiple ways to get P&L data
    if (accountData.futures && accountData.futures.totalUnrealizedPnl !== undefined) {
      unrealizedPnL = parseFloat(accountData.futures.totalUnrealizedPnl);
    } else if (accountData.futuresAccount && accountData.futuresAccount.totalUnrealizedPnl !== undefined) {
      unrealizedPnL = parseFloat(accountData.futuresAccount.totalUnrealizedPnl);
    } else if (accountData.futures && accountData.futures.positions) {
      // Calculate P&L from positions if available
      accountData.futures.positions.forEach(position => {
        if (parseFloat(position.positionAmt || 0) !== 0) {
          unrealizedPnL += parseFloat(position.unrealizedProfit || 0);
        }
      });
    } else if (accountData.futuresAccount && accountData.futuresAccount.positions) {
      // Alternative position data location
      accountData.futuresAccount.positions.forEach(position => {
        if (parseFloat(position.positionAmt || 0) !== 0) {
          unrealizedPnL += parseFloat(position.unrealizedProfit || 0);
        }
      });
    }
  }
  
  // For spot-only dashboard, totalValue is primarily the spot wallet value
  const totalValue = spotValue + futuresValue + unrealizedPnL;
  const totalPnL = unrealizedPnL; // P&L is from futures trading only
  
  const walletBalance = spotValue + futuresValue;
  const pnlPercentage = walletBalance > 0 ? (totalPnL / walletBalance) * 100 : 0;

  const result = { 
    totalValue, 
    totalPnL, 
    spotValue, 
    futuresValue,
    pnlPercentage
  };
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
