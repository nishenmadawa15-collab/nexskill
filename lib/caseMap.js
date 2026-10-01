// Shallow (top-level keys only) camelCase <-> snake_case conversion between
// Postgres rows and the JSON shape the frontend already expects. Deliberately
// shallow: values like `breakdown` or `preferences` are opaque jsonb blobs
// whose own keys (skillOverlap, yearOfStudy, domain, ...) must pass through
// untouched.

const toCamelKey = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toSnakeKey = (k) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export function rowToCamel(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) out[toCamelKey(k)] = v;
  return out;
}

export function rowsToCamel(rows) {
  return (rows || []).map(rowToCamel);
}

export function toSnakeRow(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[toSnakeKey(k)] = v;
  return out;
}
