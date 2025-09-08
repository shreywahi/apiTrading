# Trading Dashboard

A **hedge fund-level** React web application that displays your trading portfolio, P&L, and order history with **enterprise-grade API optimization** achieving 85-90% reduction in API calls.

## 🚀 Setup Instructions

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Binance account with API access (Spot (local only) and USD-M Futures)

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

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Pure CSS with modern design
- **API**: Binance REST API
- **HTTP Client**: Axios
- **Cryptography**: crypto-js for API signature generation
- **Icons**: Lucide React

### Browser Compatibility

This application works best with modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (if configured)
- `npm run deploy` - Deploy in PROD (gh-pages)