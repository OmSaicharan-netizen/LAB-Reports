# Lab 2: SQLite Database and CRUD Routes

**Name:** Om Sai Charan Manchani

**Registration Number:** 252U1R9090

**Section:** CSE GENAI 2B-111

---

## 🔗 Live Link

> **Not deployed** — SQLite uses a local file-based database that cannot be served on stateless platforms (Render / Railway) without a persistent-disk add-on. Postman screenshots of every endpoint are provided in the [`screenshots/`](./screenshots/) folder instead.

---

## 📦 How to Run

### Prerequisites
- Node.js v18 or higher
- npm

### 1. Install dependencies
```bash
cd lab-02
npm install
```

### 2. Environment variables
This project has **no required environment variables**. The server runs on port `3000` by default.

> If you need a different port, set `PORT` before starting:
> ```
> PORT=3000
> ```
> _(no `.env` file is committed; never commit secrets)_

### 3. Seed the database (first run only)
```bash
# Option A – via the SQLite CLI
sqlite3 bookstore.db < init_db.sql

# Option B – via Node (no SQLite CLI needed)
node seed.js
```

### 4. Start the server
```bash
# Production
npm start

# Development (auto-restart on save)
npm run dev
```

Server starts at **http://localhost:3000/books/**

---

## 🛣️ Endpoints

| Method | Path | Description | Status codes |
|--------|------|-------------|-------------|
| `GET` | `/books/` | Return all books ordered by id | 200 |
| `GET` | `/books/:bookId/` | Return a single book by id | 200, 404 |
| `POST` | `/books/` | Add a new book (JSON body) | 201, 500 |
| `PUT` | `/books/:bookId/` | Replace all fields of a book | 200, 404 |
| `DELETE` | `/books/:bookId/` | Permanently remove a book | 200, 404 |

### Request / Response examples

#### POST `/books/`
Request body:
```json
{
  "title": "Refactoring",
  "author": "Martin Fowler",
  "price": 4599,
  "pages": 448
}
```
Response `201`:
```json
{ "message": "Book added successfully", "bookId": 11 }
```

#### PUT `/books/11/`
Request body:
```json
{
  "title": "Refactoring 2nd Ed",
  "author": "Martin Fowler",
  "price": 4799,
  "pages": 448
}
```
Response `200`:
```json
{ "message": "Book updated successfully" }
```

#### DELETE `/books/11/`
Response `200`:
```json
{ "message": "Book deleted successfully" }
```

---

## 📸 Screenshots

### GET /books/ — all books
![GET all books](screenshots/01_get_all_books.png)

### GET /books/3/ — single book
![GET single book](screenshots/02_get_single_book.png)

### POST /books/ — add book
![POST add book](screenshots/03_post_add_book.png)

### PUT /books/:bookId/ — update book
![PUT update book](screenshots/04_put_update_book.png)

### DELETE /books/:bookId/ — delete book
![DELETE book](screenshots/05_delete_book.png)

### 404 error — book not found
![404 not found](screenshots/06_404_not_found.png)

### SQLite CLI — database state after changes
![SQLite CLI verification](screenshots/07_sqlite_cli_verify.png)

---

## 🗂️ Project Structure

```
lab-02/
├── app.js          ← Express server + all routes
├── seed.js         ← One-time DB seeder (Node)
├── init_db.sql     ← SQL seed script (SQLite CLI)
├── bookstore.db    ← SQLite database file
├── package.json
├── .gitignore
├── screenshots/    ← Postman + CLI screenshots
└── README.md
```

---

## 📝 Notes — Problems Faced & How They Were Solved

Problems Faced and How You Solved Them
Nodemon Auto-Restart Loop on SQLite Writes:

Problem: Nodemon by default monitors all files in the directory. Whenever POST, PUT, or DELETE wrote data into books.db or its journal files, nodemon detected file modification and immediately restarted the server mid-request.
Solution: Created nodemon.json configured with "ignore": [".db", ".db*", "test_routes.js", "node_modules/**"] so database writes do not trigger unwanted server restarts.
Preventing SQL Injection in Query Construction:

Problem: Concatenating user inputs into SQL strings via template literals (${bookId}) creates severe SQL injection vulnerabilities.
Solution: Used parameter placeholder syntax (?) across every route (db.get(sql, [bookId]), db.run(sql, [title, author, price, pages])). This ensures user inputs are strictly handled as data literals by the database driver.
Database Connection Synchronization Before Server Start:

Problem: If incoming HTTP traffic arrives before the asynchronous SQLite file connection completes, route handlers fail with null reference errors on db.
Solution: Encapsulated server startup in an initializeDBAndServer() async function that awaits the SQLite connection before invoking app.listen().
---

## 💡 Viva Q&A (Quick Reference)

1. Why await the database call?

Database interactions (such as reading from or writing to books.db) involve asynchronous filesystem I/O operations and return a JavaScript Promise.
If we do not await the call, JavaScript continues synchronous execution immediately and sends an empty response or an unresolved Promise object before the data is retrieved.
Using await pauses execution of the async route handler until the database finishes its operation, ensuring that accurate results or errors are returned to the client.

2. What is SQL injection and how do placeholders prevent it?

SQL Injection: A vulnerability where an attacker injects malicious SQL statements into input fields (e.g., ' OR '1'='1). If strings are concatenated directly into the query, the SQLite engine parses the input as executable commands, potentially exposing, modifying, or deleting entire tables.
How Placeholders Prevent It: The ? placeholder indicates to the database driver that the value should be pre-compiled and treated strictly as literal data, never as executable SQL code. Special characters are automatically sanitized.

3. When is PUT used instead of POST?

POST is used to create a new resource. It is non-idempotent: submitting the same POST request multiple times creates multiple distinct database rows with new auto-incremented primary keys.
PUT is used to update or replace an existing resource at a specific identifier (/books/:bookId/). It is idempotent: executing the same PUT request multiple times with identical data results in the exact same state in the database without duplicate records.
