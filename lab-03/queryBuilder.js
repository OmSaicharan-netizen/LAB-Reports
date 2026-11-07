// Builds the SELECT for GET /books from the query string.
// Values from the user always go in as ? parameters.
// order_by and order are checked against a whitelist because
// column names and ASC/DESC cannot be passed as ? parameters.

const ALLOWED_ORDER_BY = ["id", "title", "author", "price"];
const ALLOWED_ORDER = ["ASC", "DESC"];

const isNumeric = (value) =>
  value !== "" && value !== null && !Number.isNaN(Number(value)) && Number.isFinite(Number(value));

const buildBooksQuery = (query = {}) => {
  const searchQ = query.search_q === undefined ? "" : String(query.search_q);
  const orderBy = query.order_by === undefined ? "id" : String(query.order_by);
  const order = query.order === undefined ? "ASC" : String(query.order).toUpperCase();
  const limit = query.limit === undefined ? 10 : query.limit;
  const offset = query.offset === undefined ? 0 : query.offset;
  const { min_price: minPrice, max_price: maxPrice } = query;

  if (!ALLOWED_ORDER_BY.includes(orderBy)) {
    return { error: `order_by must be one of: ${ALLOWED_ORDER_BY.join(", ")}` };
  }
  if (!ALLOWED_ORDER.includes(order)) {
    return { error: "order must be ASC or DESC" };
  }
  if (!isNumeric(limit) || !Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) {
    return { error: "limit must be a whole number between 1 and 100" };
  }
  if (!isNumeric(offset) || !Number.isInteger(Number(offset)) || Number(offset) < 0) {
    return { error: "offset must be a whole number, 0 or more" };
  }
  if (minPrice !== undefined && !isNumeric(minPrice)) {
    return { error: "min_price must be a number" };
  }
  if (maxPrice !== undefined && !isNumeric(maxPrice)) {
    return { error: "max_price must be a number" };
  }
  if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
    return { error: "min_price cannot be greater than max_price" };
  }

  const conditions = ["title LIKE ?"];
  const params = [`%${searchQ}%`];

  if (minPrice !== undefined && maxPrice !== undefined) {
    conditions.push("price BETWEEN ? AND ?");
    params.push(Number(minPrice), Number(maxPrice));
  } else if (minPrice !== undefined) {
    conditions.push("price >= ?");
    params.push(Number(minPrice));
  } else if (maxPrice !== undefined) {
    conditions.push("price <= ?");
    params.push(Number(maxPrice));
  }

  const where = conditions.join(" AND ");
  const sql = `SELECT id, title, author, price FROM books WHERE ${where} ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total FROM books WHERE ${where}`;

  return {
    sql,
    countSql,
    countParams: [...params],
    params: [...params, Number(limit), Number(offset)],
    limit: Number(limit),
    offset: Number(offset),
  };
};

// Returns an error message for a bad book body, or null if the body is fine.
const validateBook = (body) => {
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }
  const { title, author, price } = body;

  if (typeof title !== "string" || title.trim() === "") {
    return "title is required and must be a non-empty string";
  }
  if (typeof author !== "string" || author.trim() === "") {
    return "author is required and must be a non-empty string";
  }
  if (price === undefined || price === null || typeof price === "boolean" || !isNumeric(price)) {
    return "price is required and must be a number";
  }
  if (Number(price) < 0) {
    return "price cannot be negative";
  }
  return null;
};

module.exports = { buildBooksQuery, validateBook, ALLOWED_ORDER_BY };
