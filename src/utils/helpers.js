/**
 * src/utils/helpers.js
 * ────────────────────
 * Pure, stateless helper functions shared across pipeline steps.
 */

/**
 * Strip commas and parse to float.
 * Returns null if the value is not a valid number.
 * @param {*} val
 * @returns {number|null}
 */
function toNumeric(val) {
  if (val === null || val === undefined) return null;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Clean a mobile-number string:
 *   - strip commas
 *   - replace spaces with commas (multiple numbers written space-separated)
 * @param {*} val
 * @returns {string}
 */
function cleanMobile(val) {
  if (val === null || val === undefined) return String(val);
  return String(val).replace(/,/g, '').replace(/ /g, ',');
}

/**
 * Parse a date string in DD.MM.YYYY format into a JS Date.
 * Returns null for anything that doesn't match or is invalid.
 * @param {*} val
 * @returns {Date|null}
 */
function parseDate(val) {
  if (!val) return null;
  const match = String(val).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const dt = new Date(`${y}-${m}-${d}`);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Replace undefined values with null in every key of every object in an array.
 * Ensures MongoDB documents never contain undefined (which silently drops keys).
 * @param {object[]} arr
 * @returns {object[]}
 */
function sanitizeDocs(arr) {
  return arr.map(row =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, v === undefined ? null : v])
    )
  );
}

/**
 * Serialize a pipeline result array into a safe preview (first N rows).
 * Converts Date objects to YYYY-MM-DD strings, nulls to empty strings.
 * @param {object[]} arr
 * @param {number}   [n=5]
 * @returns {object[]}
 */
function makePreview(arr, n = 5) {
  return arr.slice(0, n).map(row =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k,
        v instanceof Date ? v.toISOString().split('T')[0] : (v ?? ''),
      ])
    )
  );
}

module.exports = { toNumeric, cleanMobile, parseDate, sanitizeDocs, makePreview };
