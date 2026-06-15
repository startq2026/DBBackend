/**
 * src/config/collections.js
 * ─────────────────────────
 * Central place for MongoDB collection names and pipeline constants.
 * Change names here and they update everywhere.
 */

module.exports = {
  COL_CUSTOMERS: 'customers',
  BATCH_SIZE:    parseInt(process.env.BATCH_SIZE, 10) || 1000,
};
