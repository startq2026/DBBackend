/**
 * src/pipeline/extract.js
 * ────────────────────────
 * Step 2 of 5 — Extract
 *
 * Walks the raw row array produced by load.js and produces one document
 * per customer in the following shape:
 *
 *   {
 *     Customer, Address, Contact, Mobile, City,
 *     Total_Amount_to_be_Paid, Collection, Total_Due,
 *     Transactions: [
 *       {
 *         Date, DC_No, Bill_No,
 *         Items: [{ Title, Copies, Returns, Net_Copies, Rate, Amount }]
 *       }
 *     ]
 *   }
 *
 * A new customer section is identified by a "Customer:" label in col 0.
 * A new transaction is identified by a "DC-" value in col 1.
 * The matching Bill_No (B.No.xxx) appears on the subsequent line in col 1.
 * The dues summary is captured from the "Total Due" sentinel row.
 */

const { parseDate } = require('../utils/helpers');

/**
 * @param {Array<Array<string|null>>} rows
 * @returns {{ customers: object[] }}
 */
function extract(rows) {
  console.log('[2/5] Extracting records …');

  const customers = [];

  /** @type {object|null} customer document being built */
  let current = null;
  /** @type {object|null} transaction being built */
  let currentTxn = null;
  /** @type {Date|null} */
  let currentDate = null;

  // ── Flush helpers ───────────────────────────────────────────────────────────

  /** Push the current transaction (if it has items) onto current.Transactions. */
  function flushTxn() {
    if (currentTxn && currentTxn.Items.length > 0 && current) {
      current.Transactions.push(currentTxn);
    }
    currentTxn = null;
  }

  /** Flush the current transaction then push the customer onto customers[]. */
  function flushCustomer() {
    flushTxn();
    if (current) customers.push(current);
    current = null;
  }

  // ── Main loop ───────────────────────────────────────────────────────────────
  for (let idx = 0; idx < rows.length; idx++) {
    const row     = rows[idx];
    const prevRow = idx > 0 ? rows[idx - 1] : row;
    const cell0   = String(row[0] ?? '').trim();
    const cell1   = String(row[1] ?? '').trim();

    // ── Start of a new customer block ─────────────────────────────────────────
    if (cell0 === 'Customer:') {
      flushCustomer();
      currentDate = null;
      current = {
        Customer:                row[1],
        Address:                 null,
        Contact:                 null,
        Mobile:                  null,
        City:                    null,
        Total_Amount_to_be_Paid: null,
        Collection:              null,
        Total_Due:               null,
        Transactions:            [],
      };
      continue;
    }

    // Skip rows that appear before the first Customer: label
    if (!current) continue;

    // ── Customer metadata fields ───────────────────────────────────────────────
    if (cell0 === 'Address:') { current.Address = row[1]; continue; }
    if (cell0 === 'Contact:') { current.Contact = row[1]; continue; }
    if (cell0 === 'Mobile:')  { current.Mobile  = row[1]; continue; }
    if (cell0 === 'City:')    { current.City    = row[1]; continue; }

    // ── Date detection (DD.MM.YYYY in col 0) ──────────────────────────────────
    const parsedDate = parseDate(row[0]);
    if (parsedDate) currentDate = parsedDate;

    // ── Dues summary ("Total Due" appears anywhere in the row) ────────────────
    const hasTotalDue = row.some(v => String(v ?? '').trim() === 'Total Due');
    if (hasTotalDue) {
      // The row immediately above contains the running totals.
      current.Total_Amount_to_be_Paid = prevRow[7];
      current.Collection              = prevRow[8];
      current.Total_Due               = row[8];
      continue;
    }

    // ── DC number in col 1 → start a new transaction ──────────────────────────
    if (cell1.includes('DC-')) {
      flushTxn();
      currentTxn = {
        Date:    currentDate,
        DC_No:   cell1,
        Bill_No: null,
        Items:   [],
      };
    } else if (cell1.startsWith('B.No.')) {
      // Bill number (B.No.) always follows its DC on the next line.
      // Attach it to the open transaction rather than starting a new one.
      if (currentTxn) currentTxn.Bill_No = cell1;
    }

    // ── Line item: col 2 contains a non-empty title ───────────────────────────
    const title = row[2];
    if (title !== null && title !== undefined && String(title).trim() !== '') {
      const t = String(title).trim();

      // Rows to skip: header rows, carry-forward markers, cash/cheque entries
      const skipExact    = new Set(['Title', 'B.F']);
      const skipContains = ['Cash', 'Cheque'];
      const shouldSkip   =
        skipExact.has(t) ||
        skipContains.some(s => t.includes(s));

      if (!shouldSkip) {
        // If we see items with no open transaction (edge case), open one.
        if (!currentTxn) {
          currentTxn = { Date: currentDate, DC_No: null, Bill_No: null, Items: [] };
        }

        currentTxn.Items.push({
          Title:      title,
          Copies:     row[3],
          Returns:    row[4],
          Net_Copies: row[5],
          Rate:       row[6],
          Amount:     row[7],
        });
      }
    }
  }

  // Flush the last customer
  flushCustomer();

  // ── Observability ──────────────────────────────────────────────────────────
  const totalTxns  = customers.reduce((a, c) => a + c.Transactions.length, 0);
  const totalItems = customers.reduce(
    (a, c) => a + c.Transactions.reduce((b, t) => b + t.Items.length, 0), 0
  );
  console.log(`      ${customers.length} customers extracted`);
  console.log(`      ${totalTxns} transactions, ${totalItems} line items`);

  return { customers };
}

module.exports = extract;
