/**
 * src/middleware/upload.js
 * ────────────────────────
 * Multer configuration for accepting CSV / Excel uploads.
 *
 * Allowed extensions: .csv  .xlsx  .xls
 * Storage: in-memory (buffer) — no temp files on disk.
 *
 * Exports the configured multer instance so routes can call
 *   upload.single('file')
 */

const multer = require('multer');

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',                                          // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',   // some OSes report .csv as text/plain
  'application/octet-stream', // fallback when MIME can't be determined
]);

const ALLOWED_EXTENSIONS = /\.(csv|xlsx|xls)$/i;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extOk  = ALLOWED_EXTENSIONS.test(file.originalname);
  const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);

  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only .csv, .xlsx, and .xls files are accepted.'), { status: 400 }),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});

module.exports = upload;
