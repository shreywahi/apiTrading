import { useState } from 'react';

export const useSorting = () => {
  const [sortConfig, setSortConfig] = useState({
    'order-history': { key: null, direction: 'default' },
    'open-orders': { key: null, direction: 'default' },
    'position-history': { key: null, direction: 'default' },
    'trade-history': { key: null, direction: 'default' },
    'transaction-history': { key: null, direction: 'default' },
    'funding-fee': { key: null, direction: 'default' }
  });

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

  const sortData = (data, tableType) => {
    const config = sortConfig[tableType];
    
    const isOrdersTable = ['open-orders', 'order-history', 'trade-history', 'transaction-history', 'funding-fee'].includes(tableType);
    const isPositionTable = tableType === 'position-history';
    
    if (!config.key || config.direction === 'default') {
      if (isOrdersTable || isPositionTable) {
        return [...data].sort((a, b) => {
          const aTime = a.time || a.updateTime || 0;
          const bTime = b.time || b.updateTime || 0;
          return bTime - aTime;
        });
      }
      return data;
    }
    
    return [...data].sort((a, b) => {
      let aValue = a[config.key];
      let bValue = b[config.key];
      
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

  const SortIndicator = ({ tableType, column }) => {
    const config = sortConfig[tableType];
    if (config.key !== column) return null;
    
    if (config.direction === 'asc') return ' ↑';
    if (config.direction === 'desc') return ' ↓';
    return null;
  };

  return {
    sortConfig,
    handleSort,
    sortData,
    SortIndicator
  };
};
