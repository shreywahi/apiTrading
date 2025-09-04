import { useState, useEffect } from 'react';

export const useAutoRefresh = (fetchData, shouldStart = true) => {
  const [autoRefreshTimer, setAutoRefreshTimer] = useState(15);
  const [autoRefreshActive, setAutoRefreshActive] = useState(true);

  const handleManualRefresh = () => {
    setAutoRefreshTimer(15);
    fetchData(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshActive(!autoRefreshActive);
    if (!autoRefreshActive) {
      setAutoRefreshTimer(15);
    }
  };

  // Auto-refresh timer effect - only start when shouldStart is true
  useEffect(() => {
    if (!autoRefreshActive || !shouldStart) return;

    const interval = setInterval(() => {
      setAutoRefreshTimer(prev => {
        if (prev <= 1) {
          fetchData(true);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshActive, fetchData, shouldStart]);

  // Reset timer when shouldStart becomes true (when data loading completes)
  useEffect(() => {
    if (shouldStart && autoRefreshActive) {
      setAutoRefreshTimer(15);
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
