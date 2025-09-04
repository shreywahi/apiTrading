import { useState, useEffect } from 'react';

export const useAutoRefresh = (fetchData, shouldStart = true, fastRefresh = null) => {
  const [autoRefreshTimer, setAutoRefreshTimer] = useState(5);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);

  const handleManualRefresh = () => {
    setAutoRefreshTimer(5);
    // Use fast refresh if available for manual refreshes, otherwise full refresh
    if (fastRefresh && typeof fastRefresh === 'function') {
      fastRefresh();
    } else {
      fetchData(true);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshActive(!autoRefreshActive);
    if (!autoRefreshActive) {
      setAutoRefreshTimer(5);
    }
  };

  // Auto-refresh timer effect - only start when shouldStart is true
  useEffect(() => {
    if (!autoRefreshActive || !shouldStart) return;

    const interval = setInterval(() => {
      setAutoRefreshTimer(prev => {
        if (prev <= 1) {
          // Use fast refresh for auto-refresh if available
          if (fastRefresh && typeof fastRefresh === 'function') {
            fastRefresh();
          } else {
            fetchData(true);
          }
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshActive, fetchData, shouldStart]);

  // Reset timer when shouldStart becomes true (when data loading completes)
  useEffect(() => {
    if (shouldStart && autoRefreshActive) {
      setAutoRefreshTimer(5);
    }
  }, [shouldStart, autoRefreshActive]);

  return {
    autoRefreshTimer,
    autoRefreshActive,
    handleManualRefresh,
    toggleAutoRefresh,
    setAutoRefreshActive
  };
};
