# Trading Dashboard

A comprehensive React web application that displays your Binance trading portfolio, P&L, and order history with support for both **Spot** and **Futures** trading when you enter your API credentials.

## ✨ Features

- **🔐 Secure API Integration**: Enter your Binance API key and secret to connect locally
- **💼 Complete Portfolio Overview**: View total portfolio value with real-time price calculations
- **📊 Dual Market Support**: Displays both Spot and Futures account data
- **📈 Enhanced P&L Tracking**: Real portfolio valuation with current market prices
- **📋 Comprehensive Order History**: Recent orders from both Spot and Futures markets
- **🔄 Real-time Data**: Automatic price fetching and refresh functionality
- **🎨 Professional UI**: Clean, responsive design that works on all devices
- **🛡️ Security First**: API credentials are only used locally and never stored
- **🚀 Localhost Support**: Full proxy configuration for local development
- **🔧 API Testing**: Built-in credential testing with detailed diagnostics

## 🔥 Recent Improvements

- ✅ **Fixed $0 Portfolio Value**: Now calculates real portfolio value using current market prices
- ✅ **Added Futures Support**: Displays futures account balances and recent futures orders
- ✅ **Enhanced Order History**: Shows both spot and futures orders with market indicators
- ✅ **Improved P&L Calculation**: Real portfolio valuation with breakdown by market type
- ✅ **Better Error Handling**: Graceful degradation when endpoints fail
- ✅ **Localhost API Access**: Fixed proxy configuration for real API usage in development

## 🚀 Setup Instructions

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Binance account with API access (Spot and/or Futures)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and go to `http://localhost:5173`

### Building for Production

To build the project for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📊 What You'll See

### Portfolio Overview
- **Total Portfolio Value**: Real-time calculation using current market prices
- **Spot Account Value**: Your spot trading account balance
- **Futures Account Value**: Your futures trading account balance (if enabled)
- **Total P&L**: Calculated returns with percentage breakdown

### Account Stats
- **Recent Orders**: Combined view of spot and futures orders with market indicators
- **Open Orders**: Currently active orders across all markets
- **Asset Balances**: Detailed breakdown of all your holdings

### Order History
- **Market Indicators**: Clear badges showing "Spot" or "Futures" for each order
- **Order Status**: Real-time status of all your trading orders
- **Time Sorting**: Most recent orders displayed first

## 🔑 Binance API Setup

1. Log in to your Binance account
2. Go to Account → API Management
3. Create a new API key with the following permissions:
   - ✅ **Enable Reading** (required for portfolio data)
   - ✅ **Enable Futures** (optional, for futures account data)
   - ❌ Enable Spot & Margin Trading (not required for viewing)
   - ❌ Enable Margin (not required)

4. **Important Security Notes**:
   - Only enable "Enable Reading" and optionally "Enable Futures" permissions
   - Never enable trading permissions for a viewing-only application
   - Restrict API access to your IP address if possible
   - Never share your API secret with anyone
   - Consider using a separate API key just for this application

## 🎯 How to Use

1. **Test Your Credentials**: 
   - Enter your Binance API key and secret
   - Click "Test Credentials" to verify they work
   - Review the diagnostic results

2. **Connect to Dashboard**: 
   - Click "Connect to Binance" after successful testing
   - View your comprehensive trading data

3. **Dashboard Features**:
   - **Portfolio Overview**: Real-time portfolio value with market breakdown
   - **Account Stats**: Detailed statistics across Spot and Futures accounts
   - **Asset Balances**: All your cryptocurrency holdings with current values
   - **Order History**: Recent trading activity with market indicators
   - **Open Orders**: Currently active orders across all markets

## 🔧 Technical Features

### API Integration
- **Spot API Support**: `/api/v3/account`, `/api/v3/allOrders`, `/api/v3/ticker/price`
- **Futures API Support**: `/fapi/v2/account`, `/fapi/v1/allOrders`
- **Real-time Pricing**: Automatic price fetching for accurate portfolio valuation
- **Server Time Sync**: Prevents timestamp-related errors
- **Multiple Endpoints**: Fallback system for reliable connectivity

### Security & Performance
- **Local Processing**: All data processing happens in your browser
- **Proxy Configuration**: Secure CORS handling for localhost development
- **Error Recovery**: Graceful handling of API failures
- **Rate Limiting**: Optimized request patterns to avoid API limits
   - Current open orders
3. **Refresh Data**: Click the refresh button to get the latest data
4. **Logout**: Click logout to disconnect and enter new API credentials

## Features Explained

### Portfolio Overview
- **Total Portfolio Value**: Shows the USD value of your USDT/BUSD holdings
- **Total Orders**: Count of all historical orders
- **Open Orders**: Number of currently active orders
- **Asset Count**: Number of different cryptocurrencies you hold

### Asset Balances
- Displays all assets with non-zero balances
- Shows both free (available) and locked (in orders) amounts
- Calculates total balance for each asset

### Order History
- Recent orders with details like symbol, side (buy/sell), quantity, price
- Color-coded order sides (green for buy, red for sell)
- Status badges with different colors for different order states
- Timestamps for when orders were placed

### Open Orders
- Currently active orders that haven't been filled or canceled
- Real-time status of pending trades
- Ability to see market vs. limit orders

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Pure CSS with modern design
- **API**: Binance REST API
- **HTTP Client**: Axios
- **Cryptography**: crypto-js for API signature generation
- **Icons**: Lucide React

## Security Considerations

- API credentials are never stored permanently
- All API requests are made directly from your browser to Binance
- The application only requests read-only permissions
- No trading functionality is implemented for security

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**:
   - Verify your API key is copied correctly
   - Ensure the API key is active in your Binance account

2. **"Invalid Signature" Error**:
   - Check that your API secret is entered correctly
   - Make sure your system time is synchronized

3. **"Network Error" or CORS Issues**:
   - **This is the most common issue in browser-based applications**
   - The app will automatically show a CORS helper with instructions
   - **Quick Solution**: Visit [CORS Anywhere Demo](https://cors-anywhere.herokuapp.com/corsdemo) and enable temporary access
   - **Alternative**: Use Binance Testnet (requires testnet API keys)
   - **Production**: Deploy with a backend server that proxies API calls

4. **"IP Restricted" Error**:
   - Check if you've restricted the API key to specific IP addresses
   - Add your current IP address to the whitelist in Binance

5. **Loading Issues**:
   - Check your internet connection
   - Verify that Binance API is accessible from your location

### Browser Compatibility

This application works best with modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### CORS (Cross-Origin Resource Sharing) Issues

When running this application in a browser, you may encounter CORS errors because browsers block direct API calls to external domains for security reasons.

#### Quick Fix for Development:
1. Visit [CORS Anywhere Demo](https://cors-anywhere.herokuapp.com/corsdemo)
2. Click "Request temporary access to the demo server"
3. Return to the application and try connecting again

#### Alternative Solutions:
- **Binance Testnet**: Use testnet API keys with `https://testnet.binance.vision`
- **Local Proxy**: Set up a local server to proxy API requests
- **Browser Extension**: Use CORS-disabling extensions (not recommended)
- **Production Deployment**: Deploy with a backend server

#### For Production Use:
Create a backend API that proxies requests to Binance, avoiding CORS issues entirely.

## Development

### Project Structure

```
src/
├── components/
│   ├── ApiKeyForm.jsx      # API credentials input form
│   ├── ApiKeyForm.css      # Styling for API form
│   ├── Dashboard.jsx       # Main dashboard component
│   └── Dashboard.css       # Dashboard styling
├── utils/
│   └── binanceApi.js       # Binance API integration
├── App.jsx                 # Main application component
├── App.css                 # Global app styles
├── index.css               # Global CSS reset and base styles
└── main.jsx                # Application entry point
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (if configured)

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This application is for educational and informational purposes only. Always verify trading data independently and never make trading decisions based solely on this tool. The developers are not responsible for any trading losses.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
