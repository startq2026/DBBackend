/**
 * src/routes/index.js
 * ────────────────────
 * All route definitions for the StarQ backend.
 *
 * To add a new feature:
 *   1. Create a controller in src/controllers/
 *   2. Register its route here.
 */

const { Router } = require('express');
const upload     = require('../middleware/upload');
const { handleUpload } = require('../controllers/uploadController');

// ── Add your future controllers here ──────────────────────────────────────────
// const { handleSomething } = require('../controllers/someController');

const router = Router();

// ── Health check ───────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── ETL upload ─────────────────────────────────────────────────────────────────
// Multer runs first (parses multipart), then the controller takes over.
router.post(
  '/upload',
  upload.single('file'), // 'file' must match the form field name in the frontend
  handleUpload
);

// ── Add future routes below ────────────────────────────────────────────────────
// router.get('/records',  handleGetRecords);
// router.get('/dues',     handleGetDues);
// router.delete('/reset', handleReset);

module.exports = router;
