// Generic TF-IDF vectorizer + cosine similarity, used by lib/skills.js to
// compare skills that aren't identical strings and aren't in a manually
// curated SEMANTIC_GROUPS entry (see skillSetSimilarity in lib/skills.js).
//
// Standard formulation (Manning & Schutze, Foundations of Statistical
// Natural Language Processing, 1999):
//   tf(t, d)  = count of term t in document d
//   idf(t, D) = log(N / df(t))            N = |D|, df(t) = # docs containing t
//   tfidf(t, d, D) = tf(t, d) * idf(t, D)
//   cosine(A, B) = (A . B) / (||A|| * ||B||)

export function buildTfidfVectors(corpus) {
  // corpus: { [docId]: string[] } — each document as an array of tokens.
  const docIds = Object.keys(corpus);
  const N = docIds.length;

  const df = new Map(); // term -> number of documents containing it
  for (const tokens of Object.values(corpus)) {
    for (const term of new Set(tokens)) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const idf = new Map();
  for (const [term, count] of df) {
    idf.set(term, Math.log(N / count));
  }

  const vectors = {};
  for (const docId of docIds) {
    const tokens = corpus[docId];
    const tf = new Map();
    for (const term of tokens) tf.set(term, (tf.get(term) || 0) + 1);

    const vector = new Map();
    for (const [term, count] of tf) {
      vector.set(term, count * (idf.get(term) || 0));
    }
    vectors[docId] = vector;
  }

  return vectors;
}

export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const value of vecA.values()) normA += value * value;
  for (const value of vecB.values()) normB += value * value;
  const smaller = vecA.size <= vecB.size ? vecA : vecB;
  const larger = vecA.size <= vecB.size ? vecB : vecA;
  for (const [term, value] of smaller) {
    if (larger.has(term)) dot += value * larger.get(term);
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
