# StarQ Backend

Express + MongoDB ETL pipeline for processing distributor billing spreadsheets.

## Folder Structure

```
backend/
├── server.js                  ← Entry point: loads .env, starts HTTP server
├── src/
│   ├── app.js                 ← Express app factory (middleware, routes, error handler)
│   ├── config/
│   │   ├── db.js              ← Shared MongoClient (singleton, graceful shutdown)
│   │   └── collections.js     ← Collection names & batch-size constant
│   ├── controllers/
│   │   └── uploadController.js  ← Orchestrates the ETL pipeline, builds HTTP response
│   ├── middleware/
│   │   └── upload.js          ← Multer config (accepts .csv / .xlsx / .xls, 50 MB limit)
│   ├── pipeline/
│   │   ├── load.js            ← Step 1: Buffer → normalised 9-col row array
│   │   ├── extract.js         ← Step 2: Rows → { records, recordsOfCash }
│   │   ├── clean.js           ← Step 3: Type-cast strings to numbers/dates
│   │   ├── reconcile.js       ← Step 4: Ensure customer consistency, sanitise nulls
│   │   └── dbUpload.js        ← Step 5: Batch-insert into MongoDB
│   ├── routes/
│   │   └── index.js           ← All route definitions (add new routes here)
│   └── utils/
│       └── helpers.js         ← Pure helpers: toNumeric, cleanMobile, parseDate, etc.
├── .env.example               ← Copy to .env and fill in your values
├── .gitignore
└── package.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set MONGO_URI, DB_NAME, etc.

# 3. Start (production)
npm start

# 4. Start (development — auto-restarts on save)
npm run dev
```

## API

| Method | Path      | Description                              |
|--------|-----------|------------------------------------------|
| GET    | /health   | Health check                             |
| POST   | /upload   | Upload a .csv / .xlsx file for ETL       |

### POST /upload

- **Content-Type:** `multipart/form-data`
- **Field name:** `file`
- **Accepted formats:** `.csv`, `.xlsx`, `.xls`
- **Max size:** 50 MB

**Response:**
```json
{
  "status": "success",
  "filename": "bills_june.xlsx",
  "file_size_kb": 142.5,
  "records": {
    "rows": 3200,
    "columns": ["Date", "Bill_No", "Customer", ...],
    "unique_customers": 48,
    "null_count": 12,
    "preview": [{ ... }, ...]
  },
  "dues": {
    "rows": 48,
    "columns": ["Customer", "Total Due", ...],
    "preview": [{ ... }, ...]
  }
}
```

## Adding New Features

1. **New route:** add an entry in `src/routes/index.js`
2. **New controller:** create `src/controllers/yourController.js`, export a handler
3. **New pipeline step:** create `src/pipeline/yourStep.js`, import it in `uploadController.js`
4. **New collection:** add the name to `src/config/collections.js`
