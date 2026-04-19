/**
 * Deduplication & Merge Service
 * Merges results from OpenAlex + PubMed into a unified, deduplicated list
 */

/**
 * Merge and deduplicate publications from multiple sources
 */
export function mergePublications(openAlexResults, pubmedResults) {
  const merged = new Map();

  // Index OpenAlex results first (usually richer metadata)
  for (const pub of openAlexResults) {
    const key = normalizeKey(pub.title);
    if (!merged.has(key)) {
      merged.set(key, { ...pub, sourceApis: ["OpenAlex"] });
    }
  }

  // Merge PubMed, dedup by title similarity
  for (const pub of pubmedResults) {
    const key = normalizeKey(pub.title);
    if (merged.has(key)) {
      // Enrich existing record
      const existing = merged.get(key);
      existing.sourceApis.push("PubMed");
      if (!existing.abstract && pub.abstract) existing.abstract = pub.abstract;
      if (!existing.pmid && pub.pmid) existing.pmid = pub.pmid;
      if (pub.url?.includes("pubmed")) existing.pubmedUrl = pub.url;
    } else {
      merged.set(key, { ...pub, sourceApis: ["PubMed"] });
    }
  }

  return Array.from(merged.values());
}

/**
 * Normalize a title for dedup comparison
 */
function normalizeKey(title) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80); // First 80 chars to handle minor title differences
}

export default { mergePublications };
