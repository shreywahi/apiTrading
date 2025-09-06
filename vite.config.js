import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/apiTrading/' : '/',
  server: {
    proxy: {
      '/api/binance': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        secure: true,
        ws: false,
        rewrite: (path) => path.replace(/^\/api\/binance/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log for debugging
            console.log(`[PROXY] ${req.method} ${req.url}`);
            console.log('[PROXY] Headers:', Object.keys(req.headers).filter(k => k.toLowerCase().includes('mbx') || k === 'content-type'));
            
            // Handle preflight OPTIONS requests
            if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MBX-APIKEY',
                'Access-Control-Max-Age': '86400'
              });
              res.end();
              return;
            }
            
            // Forward Binance-specific headers
            if (req.headers['x-mbx-apikey']) {
              proxyReq.setHeader('X-MBX-APIKEY', req.headers['x-mbx-apikey']);
            }
            
            // Set proper headers
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers to all responses
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-MBX-APIKEY';
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('[PROXY ERROR]:', err.message);
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
            }
          });
        },
      },
      '/fapi/binance': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        secure: true,
        ws: false,
        rewrite: (path) => path.replace(/^\/fapi\/binance/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[FUTURES PROXY] ${req.method} ${req.url}`);
            
            if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MBX-APIKEY',
                'Access-Control-Max-Age': '86400'
              });
              res.end();
              return;
            }
            
            if (req.headers['x-mbx-apikey']) {
              proxyReq.setHeader('X-MBX-APIKEY', req.headers['x-mbx-apikey']);
            }
            
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-MBX-APIKEY';
          });
        },
      },
      '/api/testnet': {
        target: 'https://testnet.binance.vision',
        changeOrigin: true,
        secure: true,
        ws: false,
        rewrite: (path) => path.replace(/^\/api\/testnet/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MBX-APIKEY',
                'Access-Control-Max-Age': '86400'
              });
              res.end();
              return;
            }
            
            if (req.headers['x-mbx-apikey']) {
              proxyReq.setHeader('X-MBX-APIKEY', req.headers['x-mbx-apikey']);
            }
            
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-MBX-APIKEY';
          });
        },
      }
    }
  }
})
