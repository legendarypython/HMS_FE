// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // Your API endpoints
    createProxyMiddleware({
      target: 'http://localhost:6000', // Your target URL
      changeOrigin: true,
    })
  );
};
