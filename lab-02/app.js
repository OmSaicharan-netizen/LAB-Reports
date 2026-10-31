const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json()); // parse JSON request bodies

const DB_PATH = path.join(__dirname, "bookstore.db");
let db; // module-level database handle shared across all routes

// ─────────────────────────────────────────────────────────────────────────────
// initializeDBAndServer
// Opens the SQLite database first; the HTTP server starts ONLY after the
// connection succeeds. If the DB cannot be opened the process exits with
// code 1 so a broken server is never exposed to clients.
// ─────────────────────────────────────────────────────────────────────────────
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Create the table on first run (idempotent — safe to call every startup)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        title   TEXT    NOT NULL,
        author  TEXT    NOT NULL,
        price   INTEGER NOT NULL,
        pages   INTEGER NOT NULL
      );
    `);

    console.log("✅  Database connected successfully");

    app.listen(3000, () => {
      console.log("🚀  Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.error("❌  DB initialisation failed:", error.message);
    process.exit(1);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /books/  — return every book ordered by id
// ─────────────────────────────────────────────────────────────────────────────
app.get("/books/", async (req, res) => {
  try {
    const getAllBooksQuery = `
      SELECT * FROM book
      ORDER BY id;
    `;
    const books = await db.all(getAllBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /books/:bookId/  — return a single book by primary key
// ─────────────────────────────────────────────────────────────────────────────
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    // ? placeholder — prevents SQL injection
    const getBookQuery = `
      SELECT * FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);
    if (book === undefined) {
      res.status(404).json({ error: "Book not found" });
    } else {
      res.status(200).json(book);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /books/  — add a new book; returns 201 + the new row's id
// ─────────────────────────────────────────────────────────────────────────────
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;
    // All four user-supplied values are bound via ? placeholders
    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title, author, price, pages]);
    res.status(201).json({
      message: "Book added successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /books/:bookId/  — replace all fields of an existing book
// PUT is used (not POST) because the client knows the exact resource URL and
// the operation is idempotent — calling it twice yields the same state.
// ─────────────────────────────────────────────────────────────────────────────
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;
    // Five ? placeholders — four field values + the WHERE id
    const updateBookQuery = `
      UPDATE book
      SET title  = ?,
          author = ?,
          price  = ?,
          pages  = ?
      WHERE id = ?;
    `;
    const result = await db.run(updateBookQuery, [
      title,
      author,
      price,
      pages,
      bookId,
    ]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Book not found" });
    } else {
      res.status(200).json({ message: "Book updated successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /books/:bookId/  — permanently remove a book
// ─────────────────────────────────────────────────────────────────────────────
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    // ? placeholder prevents injection via a crafted bookId
    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `;
    const result = await db.run(deleteBookQuery, [bookId]);
    if (result.changes === 0) {
      res.status(404).json({ error: "Book not found" });
    } else {
      res.status(200).json({ message: "Book deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bootstrap — open DB then start server
initializeDBAndServer();
