/**
 * src/pipeline/reconcile.js
 * ──────────────────────────
 * Step 4 of 5 — Reconcile
 *
 * With the new nested schema, all line items and dues live inside the same
 * customer document, so the old cross-collection integrity check is no
 * longer required.
 *
 * This step now:
 *   1. Drops only rows that have NO customer name — these are genuine blank
 *      spacer rows produced by the spreadsheet layout, not real customers.
 *      NOTE: customers with zero transactions and zero dues ARE kept.
 *            They represent real contacts with no activity in this period.
 *   2. Replaces all undefined values with null so MongoDB never silently
 *      drops keys (sanitizeDocs applied recursively through the nested tree).
 *   3. Logs a full breakdown for observability.
 */

const { sanitizeDocs } = require('../utils/helpers');

/**
 * @param {object[]} customers - Cleaned customer documents
 * @returns {object[]}         - Reconciled, sanitized customer documents
 */
function reconcile(customers) {
  console.log('[4/5] Reconciling customers …');

  // ── Drop only truly blank rows (no customer name at all) ───────────────────
  const before = customers.length;
  const valid  = customers.filter(c => c.Customer && String(c.Customer).trim() !== '');
  const dropped = before - valid.length;
  if (dropped > 0) {
    console.log(`      Dropped ${dropped} unnamed/blank row(s)`);
  }

  // ── Sanitize (undefined → null) recursively through the nested tree ────────
  const sanitized = valid.map(c => ({
    ...c,
    Transactions: c.Transactions.map(txn => ({
      ...txn,
      Items: sanitizeDocs(txn.Items),
    })),
  }));
  const result = sanitizeDocs(sanitized);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const withTxns   = result.filter(c => c.Transactions.length > 0).length;
  const noTxns     = result.filter(c => c.Transactions.length === 0).length;
  const withDues   = result.filter(c => (c.Total_Due ?? 0) > 0).length;
  const totalTxns  = result.reduce((a, c) => a + c.Transactions.length, 0);
  const totalItems = result.reduce(
    (a, c) => a + c.Transactions.reduce((b, t) => b + t.Items.length, 0), 0
  );

  console.log(`      Customers total      : ${result.length}`);
  console.log(`        with transactions  : ${withTxns}`);
  console.log(`        no transactions    : ${noTxns}  (zero-activity contacts — kept)`);
  console.log(`        with outstanding dues: ${withDues}`);
  console.log(`      Transactions         : ${totalTxns}`);
  console.log(`      Line items           : ${totalItems}`);

  return result;
}

module.exports = reconcile;