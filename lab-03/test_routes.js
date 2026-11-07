// Quick route checker. Start the server first (npm start), then run: npm run test:routes
const BASE = process.env.BASE_URL || "http://localhost:3000";

const json = { "Content-Type": "application/json" };
const cases = [
  { name: "GET all books", method: "GET", path: "/books", expect: 200 },
  { name: "Search title (search_q=java)", method: "GET", path: "/books?search_q=java", expect: 200 },
  { name: "Sort by price DESC", method: "GET", path: "/books?order_by=price&order=DESC", expect: 200 },
  { name: "Pagination (limit=3, offset=3)", method: "GET", path: "/books?limit=3&offset=3", expect: 200 },
  { name: "Price range 300-600", method: "GET", path: "/books?min_price=300&max_price=600", expect: 200 },
  { name: "Bad order_by", method: "GET", path: "/books?order_by=password", expect: 400 },
  { name: "Bad order", method: "GET", path: "/books?order=SIDEWAYS", expect: 400 },
  { name: "Bad limit", method: "GET", path: "/books?limit=abc", expect: 400 },
  { name: "Bad min_price", method: "GET", path: "/books?min_price=cheap", expect: 400 },
  { name: "GET one book", method: "GET", path: "/books/1", expect: 200 },
  { name: "GET missing book", method: "GET", path: "/books/9999", expect: 404 },
  { name: "GET invalid id", method: "GET", path: "/books/abc", expect: 400 },
  { name: "POST valid book", method: "POST", path: "/books", body: { title: "Test Book", author: "Tester", price: 199.5 }, expect: 201, save: "createdId" },
  { name: "POST missing title", method: "POST", path: "/books", body: { author: "Tester", price: 100 }, expect: 400 },
  { name: "POST missing author", method: "POST", path: "/books", body: { title: "X", price: 100 }, expect: 400 },
  { name: "POST non-numeric price", method: "POST", path: "/books", body: { title: "X", author: "Y", price: "abc" }, expect: 400 },
  { name: "PUT valid update", method: "PUT", path: "/books/:createdId", body: { title: "Test Book v2", author: "Tester", price: 249 }, expect: 200 },
  { name: "PUT missing book", method: "PUT", path: "/books/9999", body: { title: "X", author: "Y", price: 1 }, expect: 404 },
  { name: "PUT invalid body", method: "PUT", path: "/books/1", body: { title: "", author: "Y", price: 1 }, expect: 400 },
  { name: "DELETE created book", method: "DELETE", path: "/books/:createdId", expect: 200 },
  { name: "DELETE missing book", method: "DELETE", path: "/books/9999", expect: 404 },
  { name: "Unknown route", method: "GET", path: "/authors", expect: 404 },
];

const run = async () => {
  const saved = {};
  let passed = 0;
  for (const c of cases) {
    const url = BASE + c.path.replace(":createdId", saved.createdId);
    try {
      const res = await fetch(url, {
        method: c.method,
        headers: c.body ? json : undefined,
        body: c.body ? JSON.stringify(c.body) : undefined,
      });
      const data = await res.json();
      if (c.save === "createdId" && data.book) saved.createdId = data.book.id;
      const ok = res.status === c.expect;
      if (ok) passed++;
      console.log(`${ok ? "PASS" : "FAIL"}  ${c.method.padEnd(6)} ${c.path.padEnd(42)} expected ${c.expect}, got ${res.status}  (${c.name})`);
    } catch (error) {
      console.log(`FAIL  ${c.method} ${c.path}  ${error.message}. Is the server running?`);
    }
  }
  console.log(`\n${passed}/${cases.length} checks passed`);
  process.exit(passed === cases.length ? 0 : 1);
};

run();
