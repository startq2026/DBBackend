/**
 * src/app.js
 * ──────────
 * Creates and configures the Express app.
 * Kept separate from server.js so it can be imported in tests without binding a port.
 */

const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/', routes);

// ── Global error handler ───────────────────────────────────────────────────────
// Any route/middleware that calls next(err) lands here.
app.use((err, req, res, next) => {         // eslint-disable-line no-unused-vars
  console.error('[Unhandled error]', err);
  res.status(err.status || 500).json({ detail: err.message || 'Internal server error' });
});

module.exports = app;
