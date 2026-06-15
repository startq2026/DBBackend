/**
 * src/controllers/uploadController.js
 * ─────────────────────────────────────
 * Orchestrates the five ETL pipeline steps and builds the HTTP response.
 *
 * Called by: POST /upload
 *
 * Pipeline output shape (one document per customer):\
 *   {
 *     Customer, Address, Contact, Mobile, City,
 *     Total_Amount_to_be_Paid, Collection, Total_Due,
 *     Transactions: [
 *       { Date, DC_No, Bill_No, Items: [{ Title, Copies, Returns, Net_Copies, Rate, Amount }] }
 *     ]
 *   }
 */

const load      = require('../pipeline/load');
const extract   = require('../pipeline/extract');
const clean     = require('../pipeline/clean');
const reconcile = require('../pipeline/reconcile');
const dbUpload  = require('../pipeline/dbUpload');

/**
 * Build a lightweight preview of the customer array (first N customers).
 * Converts Date objects to YYYY-MM-DD strings; nulls to empty strings.
 * Items inside transactions are summarised as a count to keep the payload small.
 *
 * @param {object[]} customers
 * @param {number}   [n=5]
 * @returns {object[]}
 */
function makePreview(customers, n = 5) {
  return customers.slice(0, n).map(c => ({
    Customer:                c.Customer        ?? '',
    City:                    c.City            ?? '',
    Total_Amount_to_be_Paid: c.Total_Amount_to_be_Paid ?? '',
    Collection:              c.Collection      ?? '',
    Total_Due:               c.Total_Due       ?? '',
    transaction_count:       c.Transactions.length,
    item_count:              c.Transactions.reduce((a, t) => a + t.Items.length, 0),
    first_transaction: c.Transactions.length > 0
      ? {
          Date:    c.Transactions[0].Date instanceof Date
                     ? c.Transactions[0].Date.toISOString().split('T')[0]
                     : (c.Transactions[0].Date ?? ''),
          DC_No:   c.Transactions[0].DC_No   ?? '',
          Bill_No: c.Transactions[0].Bill_No ?? '',
          items:   c.Transactions[0].Items.slice(0, 3).map(item => ({
            Title:  item.Title,
            Copies: item.Copies,
            Amount: item.Amount,
          })),
        }
      : null,
  }));
}

/**
 * POST /upload
 *
 * Expects a multipart/form-data request with:
 *   - "file"     : the .csv, .xlsx, or .xls spreadsheet
 *   - "pipeline" : the name to use as the MongoDB collection (e.g. "customers")
 */
async function handleUpload(req, res, next) {
  try {
    console.log('='.repeat(50));
    console.log('  StarQ ETL Pipeline');
    console.log('='.repeat(50));

    // ── Resolve collection name from the frontend form field ───────────────
    const collectionName = (req.body.pipeline || '').trim();
    if (!collectionName) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: "pipeline" (collection name).',
      });
    }

    const fileSizeKb = (req.file.buffer.length / 1024).toFixed(2);
    console.log(`  File      : ${req.file.originalname}  (${fileSizeKb} KB)`);
    console.log(`  Collection: ${collectionName}`);

    // ── Run the pipeline ───────────────────────────────────────────────────
    const rows               = load(req.file.buffer, req.file.originalname);
    const { customers: raw } = extract(rows);
    const cleaned            = clean(raw);
    const final              = reconcile(cleaned);

    // Pass the selected collection name to dbUpload
    await dbUpload(final, collectionName);

    console.log('='.repeat(50));
    console.log('  Pipeline complete.');
    console.log('='.repeat(50));

    // ── Build response summary ─────────────────────────────────────────────
    const totalTxns  = final.reduce((a, c) => a + c.Transactions.length, 0);
    const totalItems = final.reduce(
      (a, c) => a + c.Transactions.reduce((b, t) => b + t.Items.length, 0), 0
    );
    const withDues   = final.filter(c => (c.Total_Due ?? 0) > 0).length;

    res.status(200).json({
      status:       'success',
      filename:     req.file.originalname,
      file_size_kb: parseFloat(fileSizeKb),
      collection:   collectionName,
      summary: {
        customers:           final.length,
        transactions:        totalTxns,
        line_items:          totalItems,
        customers_with_dues: withDues,
        columns: Object.keys(final[0] || {}).filter(k => k !== 'Transactions'),
      },
      preview: makePreview(final),
    });

  } catch (err) {
    next(err); // passes to global error handler in app.js
  }
}

module.exports = { handleUpload };
