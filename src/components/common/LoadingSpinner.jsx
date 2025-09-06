import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading your data..." }) => {
  return (
    <div className="dashboard-loading">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
