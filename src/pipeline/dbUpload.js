/**
 * src/pipeline/dbUpload.js
 * ─────────────────────────
 * Step 5 of 5 — Upload
 *
 * Inserts customer documents (each containing nested transactions and
 * line items) into a MongoDB collection whose name comes from the
 * frontend form selection (passed in by the controller).
 *
 * Each document shape:
 *   {
 *     Customer, Address, Contact, Mobile, City,
 *     Total_Amount_to_be_Paid, Collection, Total_Due,
 *     Transactions: [
 *       { Date, DC_No, Bill_No, Items: [{ Title, Copies, Returns, Net_Copies, Rate, Amount }] }
 *     ]
 *   }
 */

const { getDb }        = require('../config/db');
const { BATCH_SIZE }   = require('../config/collections');

/**
 * Insert an array of documents into a collection in batches.
 * @param {import('mongodb').Collection} col
 * @param {object[]} docs
 * @param {number}   batchSize
 */
async function batchInsert(col, docs, batchSize) {
  for (let i = 0; i < docs.length; i += batchSize) {
    await col.insertMany(docs.slice(i, i + batchSize));
  }
}

/**
 * Upload customers to MongoDB using the collection name selected in the frontend.
 *
 * @param {object[]} customers      - Final customer documents from the pipeline
 * @param {string}   collectionName - MongoDB collection name (from req.body.pipeline)
 */
async function dbUpload(customers, collectionName) {
  if (!collectionName) {
    throw new Error('dbUpload: collectionName is required.');
  }

  console.log(`[5/5] Uploading to MongoDB collection "${collectionName}" …`);

  const db  = await getDb();
  const col = db.collection(collectionName);

  await batchInsert(col, customers, BATCH_SIZE);
  console.log(`      Inserted ${customers.length} documents → '${collectionName}'`);
  console.log('      Done ✓');
}

module.exports = dbUpload;
