/**
 * OpenAlex API Service
 * Fetches research publications from OpenAlex (free, no key required)
 * https://docs.openalex.org/
 */
import axios from "axios";

const BASE_URL = "https://api.openalex.org";
const MAILTO = "curalink@research.ai"; // Polite pool for better rate limits

/**
 * Search for publications on OpenAlex
 * @param {string} query - Search query
 * @param {number} perPage - Number of results (default 100 for depth)
 */
export async function searchPublications(query, perPage = 100) {
  try {
    const response = await axios.get(`${BASE_URL}/works`, {
      params: {
        search: query,
        per_page: Math.min(perPage, 200),
        sort: "relevance_score:desc",
        select:
          "id,doi,title,display_name,publication_year,cited_by_count,abstract_inverted_index,authorships,primary_location,type,open_access",
        mailto: MAILTO,
      },
      timeout: 15000,
    });

    const works = response.data?.results || [];
    return works.map(normalizeOpenAlexWork);
  } catch (err) {
    console.error("OpenAlex search failed:", err.message);
    return [];
  }
}

/**
 * Reconstruct abstract from inverted index format
 */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return null;
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.filter(Boolean).join(" ");
}

/**
 * Normalize OpenAlex work to unified schema
 */
function normalizeOpenAlexWork(work) {
  const authors = (work.authorships || [])
    .slice(0, 5)
    .map((a) => a.author?.display_name)
    .filter(Boolean);

  const journal =
    work.primary_location?.source?.display_name || "Unknown Journal";

  return {
    id: work.id,
    title: work.display_name || work.title || "Untitled",
    abstract: reconstructAbstract(work.abstract_inverted_index),
    authors,
    year: work.publication_year,
    source: "OpenAlex",
    journal,
    citedByCount: work.cited_by_count || 0,
    doi: work.doi,
    url: work.doi ? `https://doi.org/${work.doi.replace("https://doi.org/", "")}` : work.id,
    type: work.type,
    openAccess: work.open_access?.is_oa || false,
  };
}

export default { searchPublications };
