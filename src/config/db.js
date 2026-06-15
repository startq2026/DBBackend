/**
 * src/config/db.js
 * ────────────────
 * Manages a single shared MongoClient.
 *
 * Usage:
 *   const { getDb, closeDb } = require('../config/db');
 *   const db = await getDb();
 *   db.collection('records').insertMany(docs);
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || '';
const DB_NAME   = process.env.DB_NAME   || 'StarQ';

let client = null;

/**
 * Returns a connected Db instance, creating the client on first call.
 * @returns {Promise<import('mongodb').Db>}
 */
async function getDb() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('[DB] Connected to MongoDB');
  }
  return client.db(DB_NAME);
}

/**
 * Closes the shared client (call on graceful shutdown).
 */
async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    console.log('[DB] Connection closed');
  }
}

// Graceful shutdown hooks
process.on('SIGINT',  () => closeDb().then(() => process.exit(0)));
process.on('SIGTERM', () => closeDb().then(() => process.exit(0)));

module.exports = { getDb, closeDb };
