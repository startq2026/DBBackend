/**
 * server.js
 * ─────────
 * App entry point. Loads env, wires middleware, mounts routes, starts server.
 */

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`StarQ backend running on http://localhost:${PORT}`);
});
