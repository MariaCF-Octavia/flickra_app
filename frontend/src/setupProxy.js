const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Add verbose console logging to see all requests
  app.use((req, res, next) => {
    console.log(`[INCOMING REQUEST] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Define a single proxy for ALL backend requests
  // This avoids any issues with multiple proxy rules or path rewriting
  app.use(
    createProxyMiddleware(
      // This function filters which requests should be proxied
      function(pathname, req) {
        // Check if it's an API request or ElevenLabs request
        const isApiRequest = pathname.startsWith('/api/');
        const isElevenLabsRequest = pathname.includes('/elevenlabs/');
        
        // Log what we're seeing for debugging
        console.log(`[PROXY FILTER] Path: ${pathname}, isApiRequest: ${isApiRequest}, isElevenLabsRequest: ${isElevenLabsRequest}`);
        
        // Proxy API and ElevenLabs requests
        return isApiRequest || isElevenLabsRequest;
      },
      {
        target: 'http://localhost:8000',
        changeOrigin: true,
        logLevel: 'debug',
        // Log all proxy events
        onProxyReq: (proxyReq, req, res) => {
          console.log(`[PROXY REQUEST] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log(`[PROXY RESPONSE] ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
        },
        onError: (err, req, res) => {
          console.error(`[PROXY ERROR] for ${req.method} ${req.originalUrl}:`, err.message);
        }
      }
    )
  );

  // FFmpeg with secure headers
  app.use((req, res, next) => {
    if (req.url.includes('/ffmpeg/')) {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }
    next();
  });

  // FFmpeg secure path
  app.use(
    '/ffmpeg-secure',
    (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    },
    createProxyMiddleware({
      target: 'http://localhost:3000',
      pathRewrite: {
        '^/ffmpeg-secure': '/ffmpeg',
      },
      changeOrigin: true,
    })
  );
};
