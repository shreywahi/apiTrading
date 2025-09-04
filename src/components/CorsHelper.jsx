import { AlertTriangle, ExternalLink, Shield } from 'lucide-react';
import './CorsHelper.css';

const CorsHelper = ({ onClose, onDemoMode }) => {
  return (
    <div className="cors-helper-overlay">
      <div className="cors-helper-modal">
        <div className="cors-header">
          <AlertTriangle className="warning-icon" size={32} />
          <h2>CORS Proxy Required</h2>
        </div>
        
        <div className="cors-content">
          <p>
            <strong>Current Issue:</strong> The Binance API cannot be accessed directly from your browser due to CORS (Cross-Origin Resource Sharing) restrictions. This is a security feature of modern browsers.
          </p>
          
          <div className="cors-steps">
            <h3>🚀 Recommended Solution:</h3>
            <div className="demo-recommendation">
              <p><strong>Use Demo Mode</strong> - Click the green button below to explore the dashboard with sample data immediately!</p>
            </div>
          </div>
          
          <div className="cors-steps">
            <h3>For Real API Access:</h3>
            <ol>
              <li>
                Visit{' '}
                <a 
                  href="https://cors-anywhere.herokuapp.com/corsdemo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cors-link"
                >
                  CORS Anywhere Demo <ExternalLink size={16} />
                </a>
              </li>
              <li>Click "Request temporary access to the demo server"</li>
              <li>Return to this page and try connecting again</li>
            </ol>
          </div>
          
          <div className="alternative-solution">
            <h3>Quick Solution - Try Demo Mode:</h3>
            <p>
              Click "Try Demo Mode Instead" below to explore the dashboard with sample data. 
              No API keys required!
            </p>
            
            <h3>Other Solutions:</h3>
            <ul>
              <li>
                <strong>Use Binance Testnet:</strong> Switch to the testnet environment 
                (requires testnet API keys)
              </li>
              <li>
                <strong>Deploy with Backend:</strong> Create a server-side proxy for production use
              </li>
              <li>
                <strong>Browser Extension:</strong> Use a CORS-disabling browser extension 
                (not recommended for security reasons)
              </li>
            </ul>
          </div>
          
          <div className="security-notice">
            <Shield size={20} />
            <div>
              <strong>Security Note:</strong>
              <p>
                The CORS proxy is only needed for browser-based development. 
                In production, you would typically use a backend server to make API calls.
              </p>
            </div>
          </div>
        </div>
        
        <div className="cors-actions">
          <button onClick={onDemoMode} className="demo-btn">
            Try Demo Mode Instead
          </button>
          <button onClick={onClose} className="close-btn">
            I understand, let me try again
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorsHelper;
