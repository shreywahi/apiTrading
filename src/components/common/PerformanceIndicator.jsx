const PerformanceIndicator = ({ loading, refreshing, accountData, className = '' }) => {
  if (!accountData) return null;

  const isOptimized = accountData.usingOptimizedFetch || accountData.optimized;
  const loadTime = accountData.loadTime;

  return (
    <div className={`performance-indicator ${className}`} style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: loading || refreshing ? '#ffc107' : isOptimized ? '#28a745' : '#6c757d'
      }} />
      
      <span>
        {loading ? 'Loading...' : 
         refreshing ? 'Refreshing...' : 
         isOptimized ? '⚡ Optimized' : '🐌 Standard'}
      </span>
      
      {loadTime && !loading && !refreshing && (
        <span style={{ color: '#aaa' }}>
          {loadTime}ms
        </span>
      )}
    </div>
  );
};

export default PerformanceIndicator;
