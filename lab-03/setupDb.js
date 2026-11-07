// Creates bookstore.db and fills it using initDB.sql
// Run once with: npm run setup   (or: node setupDb.js)
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPath = path.join(__dirname, "bookstore.db");
const sqlPath = path.join(__dirname, "initDB.sql");

const setup = async () => {
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const script = fs.readFileSync(sqlPath, "utf8");
    await db.exec(script);
    const row = await db.get("SELECT COUNT(*) AS total FROM books");
    console.log(`Database ready at ${dbPath} with ${row.total} books`);
    await db.close();
  } catch (error) {
    console.error(`Database setup failed: ${error.message}`);
    process.exit(1);
  }
};

setup();
