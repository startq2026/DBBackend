/**
 * src/pipeline/load.js
 * ─────────────────────
 * Step 1 of 5 — Load
 *
 * Accepts an in-memory Buffer (CSV or Excel) and returns a normalised
 * 2-D array of strings where every row has exactly 9 columns.
 *
 * Supported formats:
 *   • .csv   — parsed with csv-parse
 *   • .xlsx  — parsed with the xlsx (SheetJS) library
 *   • .xls   — same as xlsx
 */

const { parse }  = require('csv-parse/sync');
const XLSX       = require('xlsx');

const NUM_COLS = 9;

/**
 * Normalise a raw 2-D array to exactly NUM_COLS columns per row.
 * Short rows are padded with null, long rows are trimmed.
 */
function normaliseRows(allRows) {
  return allRows.map(row => {
    const padded = [...row];
    while (padded.length < NUM_COLS) padded.push(null);
    return padded.slice(0, NUM_COLS);
  });
}

/**
 * Load a CSV buffer → normalised rows.
 */
function loadCsv(buffer) {
  const allRows = parse(buffer, {
    header:              false,
    skip_empty_lines:    false,
    relax_column_count:  true,
    cast:                false, // keep everything as strings
  });
  return normaliseRows(allRows);
}

/**
 * Load an Excel buffer (.xlsx / .xls) → normalised rows.
 * Uses the first sheet by default.
 */
function loadExcel(buffer) {
  const workbook  = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet     = workbook.Sheets[sheetName];

  // sheet_to_json with header:1 returns arrays of raw cell values
  const allRows = XLSX.utils.sheet_to_json(sheet, {
    header:    1,
    defval:    null,  // use null for empty cells
    raw:       false, // convert everything to strings
  });

  return normaliseRows(allRows);
}

/**
 * Main entry point for Step 1.
 *
 * @param {Buffer} buffer         - Raw file buffer from Multer
 * @param {string} originalname   - Original filename (used to detect format)
 * @returns {Array<Array<string|null>>} Normalised rows
 */
function load(buffer, originalname = '') {
  console.log('[1/5] Loading from in-memory buffer …');

  const ext  = originalname.split('.').pop().toLowerCase();
  let rows;

  if (ext === 'csv') {
    rows = loadCsv(buffer);
  } else if (ext === 'xlsx' || ext === 'xls') {
    rows = loadExcel(buffer);
  } else {
    // Fallback: try CSV first, then Excel
    try {
      rows = loadCsv(buffer);
    } catch {
      rows = loadExcel(buffer);
    }
  }

  console.log(`      Rows: ${rows.length}, Cols: ${NUM_COLS}`);
  return rows;
}

module.exports = load;
