/**
 * src/pipeline/clean.js
 * ──────────────────────
 * Step 3 of 5 — Clean
 *
 * Type-casts every string value in the nested customer document to its
 * proper JS type:
 *   • Customer-level: Mobile → cleaned string; numeric due/collection fields
 *   • Item-level: Copies, Returns, Net_Copies, Rate, Amount → numbers
 *
 * Reports null counts for observability.
 */

const { toNumeric, cleanMobile } = require('../utils/helpers');

/**
 * @param {object[]} customers - Raw customer documents from extract()
 * @returns {object[]}         - Cleaned customer documents
 */
function clean(customers) {
  console.log('[3/5] Cleaning data …');

  const cleaned = customers.map(c => ({
    ...c,
    Mobile:                  cleanMobile(c.Mobile),
    Total_Amount_to_be_Paid: toNumeric(c.Total_Amount_to_be_Paid),
    Collection:              toNumeric(c.Collection) ?? 0,
    Total_Due:               toNumeric(c.Total_Due)  ?? 0,
    Transactions: c.Transactions.map(txn => ({
      ...txn,
      Items: txn.Items.map(item => ({
        ...item,
        Copies:     toNumeric(item.Copies),
        Returns:    toNumeric(item.Returns)    ?? 0,
        Net_Copies: toNumeric(item.Net_Copies),
        Rate:       toNumeric(item.Rate)       ?? 0,
        Amount:     toNumeric(item.Amount)     ?? 0,
      })),
    })),
  }));

  // ── Observability ──────────────────────────────────────────────────────────
  let nullCount = 0;
  for (const c of cleaned) {
    for (const [, v] of Object.entries(c)) {
      if (v === null || v === undefined) nullCount++;
    }
    for (const txn of c.Transactions) {
      for (const item of txn.Items) {
        for (const [, v] of Object.entries(item)) {
          if (v === null || v === undefined) nullCount++;
        }
      }
    }
  }

  console.log(`      ${cleaned.length} customers | null count across all fields: ${nullCount}`);
  return cleaned;
}

module.exports = clean;
