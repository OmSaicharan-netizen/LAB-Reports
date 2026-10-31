/**
 * seed.js — run once to populate bookstore.db with 10 sample books.
 * Usage: node seed.js
 */
const sqlite3 = require("sqlite3");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "bookstore.db"));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS book (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      title   TEXT    NOT NULL,
      author  TEXT    NOT NULL,
      price   INTEGER NOT NULL,
      pages   INTEGER NOT NULL
    )
  `);

  const stmt = db.prepare(
    "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)"
  );

  const books = [
    ["The Pragmatic Programmer",   "David Thomas",       4299, 352],
    ["Clean Code",                 "Robert C. Martin",   3999, 431],
    ["You Don't Know JS",          "Kyle Simpson",       2499, 278],
    ["JavaScript: The Good Parts", "Douglas Crockford",  1999, 176],
    ["Design Patterns",            "Gang of Four",       5499, 395],
    ["Introduction to Algorithms", "Cormen et al.",      6999, 1292],
    ["Database System Concepts",   "Silberschatz",       5999, 1376],
    ["Operating System Concepts",  "Silberschatz",       5499, 944],
    ["Computer Networks",          "Andrew Tanenbaum",   4799, 960],
    ["The Mythical Man-Month",     "Fred Brooks",        2999, 336],
  ];

  books.forEach((row) => stmt.run(row));
  stmt.finalize();

  db.all("SELECT * FROM book", (err, rows) => {
    if (err) {
      console.error("Error:", err.message);
    } else {
      console.log("✅  Seeded", rows.length, "rows into bookstore.db");
      rows.forEach((r) =>
        console.log(`   #${r.id}  ${r.title}  (₹${r.price})`)
      );
    }
    db.close();
  });
});
