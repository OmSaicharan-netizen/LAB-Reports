// Lab 3: REST API with search, sorting, filters, validation and clear status codes
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { buildBooksQuery, validateBook } = require("./queryBuilder");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "bookstore.db");
let db = null;

// Helper: every error uses the same shape { message: "..." }
const sendError = (res, status, message) => res.status(status).json({ message });

// Only whole numbers are valid ids
const isValidId = (id) => /^\d+$/.test(id) && Number(id) > 0;

// ---------------- Routes (nouns + HTTP methods) ----------------

// GET / -> API information
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Bookstore API is running",
    endpoints: {
      books: "/books",
    },
  });
});

// GET /books  -> list with search_q, order_by, order, limit, offset, min_price, max_price
app.get("/books", async (req, res) => {
  const built = buildBooksQuery(req.query);
  if (built.error) {
    return sendError(res, 400, built.error);
  }
  try {
    const books = await db.all(built.sql, built.params);
    const { total } = await db.get(built.countSql, built.countParams);
    res.status(200).json({ total, count: books.length, limit: built.limit, offset: built.offset, books });
  } catch (error) {
    console.error(error.message);
    sendError(res, 500, "Internal server error");
  }
});

// GET /books/:id  -> one book
app.get("/books/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return sendError(res, 400, "id must be a positive whole number");
  }
  try {
    const book = await db.get("SELECT id, title, author, price FROM books WHERE id = ?", [id]);
    if (!book) {
      return sendError(res, 404, `Book with id ${id} not found`);
    }
    res.status(200).json(book);
  } catch (error) {
    console.error(error.message);
    sendError(res, 500, "Internal server error");
  }
});

// POST /books  -> create (201)
app.post("/books", async (req, res) => {
  const problem = validateBook(req.body);
  if (problem) {
    return sendError(res, 400, problem);
  }
  const { title, author, price } = req.body;
  try {
    const result = await db.run("INSERT INTO books (title, author, price) VALUES (?, ?, ?)", [
      title.trim(),
      author.trim(),
      Number(price),
    ]);
    res.status(201).json({
      message: "Book created successfully",
      book: { id: result.lastID, title: title.trim(), author: author.trim(), price: Number(price) },
    });
  } catch (error) {
    console.error(error.message);
    sendError(res, 500, "Internal server error");
  }
});

// PUT /books/:id  -> update (200, or 404 if id does not exist)
app.put("/books/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return sendError(res, 400, "id must be a positive whole number");
  }
  const problem = validateBook(req.body);
  if (problem) {
    return sendError(res, 400, problem);
  }
  const { title, author, price } = req.body;
  try {
    const result = await db.run("UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?", [
      title.trim(),
      author.trim(),
      Number(price),
      id,
    ]);
    if (result.changes === 0) {
      return sendError(res, 404, `Book with id ${id} not found`);
    }
    res.status(200).json({
      message: "Book updated successfully",
      book: { id: Number(id), title: title.trim(), author: author.trim(), price: Number(price) },
    });
  } catch (error) {
    console.error(error.message);
    sendError(res, 500, "Internal server error");
  }
});

// DELETE /books/:id  -> delete (200, or 404 if id does not exist)
app.delete("/books/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return sendError(res, 400, "id must be a positive whole number");
  }
  try {
    const result = await db.run("DELETE FROM books WHERE id = ?", [id]);
    if (result.changes === 0) {
      return sendError(res, 404, `Book with id ${id} not found`);
    }
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(error.message);
    sendError(res, 500, "Internal server error");
  }
});

// ---------------- Error handling ----------------

// Unknown route -> 404 (must stay after all routes)
app.use((req, res) => {
  sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found`);
});

// Bad JSON in the body (express.json throws) -> 400, anything else -> 500
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return sendError(res, 400, "Invalid JSON in request body");
  }
  console.error(err.message);
  sendError(res, 500, "Internal server error");
});

// ---------------- Start ----------------

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the other server or set a different PORT.`);
      } else {
        console.error(`Server error: ${error.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`Could not open the database: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
