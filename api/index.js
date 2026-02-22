/**
 * Vercel serverless entry. All requests are forwarded to the Nest app (dist/main.js).
 * Build must run first so dist/main.js exists and exports the handler.
 */
module.exports = require('../dist/main').default;
