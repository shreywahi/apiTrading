export const calculatePnL = (accountData) => {
  if (!accountData) {
    return { totalValue: 0, totalPnL: 0, futuresValue: 0, pnlPercentage: 0 };
  }

  const futuresValue = accountData.futuresWalletValue || 0;
  let unrealizedPnL = 0;

  // Calculate futures P&L if futures data exists
  if (accountData.futures || accountData.futuresAccount) {
    if (accountData.futures && accountData.futures.totalUnrealizedPnl !== undefined) {
      unrealizedPnL = parseFloat(accountData.futures.totalUnrealizedPnl);
    } else if (accountData.futuresAccount && accountData.futuresAccount.totalUnrealizedPnl !== undefined) {
      unrealizedPnL = parseFloat(accountData.futuresAccount.totalUnrealizedPnl);
    } else if (accountData.futures && accountData.futures.positions) {
      accountData.futures.positions.forEach(position => {
        if (parseFloat(position.positionAmt || 0) !== 0) {
          unrealizedPnL += parseFloat(position.unrealizedProfit || 0);
        }
      });
    } else if (accountData.futuresAccount && accountData.futuresAccount.positions) {
      accountData.futuresAccount.positions.forEach(position => {
        if (parseFloat(position.positionAmt || 0) !== 0) {
          unrealizedPnL += parseFloat(position.unrealizedProfit || 0);
        }
      });
    }
  }

  const totalValue = futuresValue + unrealizedPnL;
  const totalPnL = unrealizedPnL;
  const walletBalance = futuresValue;
  const pnlPercentage = walletBalance > 0 ? (totalPnL / walletBalance) * 100 : 0;

  const result = {
    totalValue,
    totalPnL,
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
