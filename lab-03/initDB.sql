DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price REAL NOT NULL
);

INSERT INTO books (title, author, price) VALUES
  ('The Pragmatic Programmer', 'Andrew Hunt', 450.00),
  ('Clean Code', 'Robert C. Martin', 520.50),
  ('JavaScript: The Good Parts', 'Douglas Crockford', 299.00),
  ('Eloquent JavaScript', 'Marijn Haverbeke', 399.00),
  ('You Don''t Know JS', 'Kyle Simpson', 350.00),
  ('Node.js Design Patterns', 'Mario Casciaro', 780.00),
  ('Learning SQL', 'Alan Beaulieu', 610.00),
  ('Introduction to Algorithms', 'Thomas H. Cormen', 1250.00),
  ('Designing Data-Intensive Applications', 'Martin Kleppmann', 1100.00),
  ('Refactoring', 'Martin Fowler', 899.00);
