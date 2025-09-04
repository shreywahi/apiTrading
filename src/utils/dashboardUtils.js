export const calculatePnL = (accountData) => {
  if (!accountData) {
    return { totalValue: 0, totalPnL: 0, spotValue: 0, futuresValue: 0, pnlPercentage: 0 };
  }

  const spotValue = accountData.spotWalletValue || 0;

  let unrealizedPnL = 0;
  if (accountData.futures && accountData.futures.totalUnrealizedPnl !== undefined) {
    unrealizedPnL = parseFloat(accountData.futures.totalUnrealizedPnl);
  }
  
  const futuresValue = accountData.futuresWalletValue || 0;
  const totalValue = spotValue + futuresValue + unrealizedPnL;
  const totalPnL = unrealizedPnL;
  
  const walletBalance = spotValue + futuresValue;
  const pnlPercentage = walletBalance > 0 ? (totalPnL / walletBalance) * 100 : 0;

  return { 
    totalValue, 
    totalPnL, 
    spotValue, 
    futuresValue,
    pnlPercentage
  };
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
