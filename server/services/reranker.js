/**
 * Re-Ranking Service
 * Scores and ranks publications by relevance, recency, and credibility
 * Then returns only the top N results
 */

/**
 * Re-rank publications and return top results
 * @param {Array} publications - Merged publication list
 * @param {string} query - Original user query
 * @param {number} topN - Number of top results to return
 */
export function rerankPublications(publications, query, topN = 8) {
  const queryTerms = tokenize(query);
  const currentYear = new Date().getFullYear();

  const scored = publications.map((pub) => {
    let score = 0;

    // 1. Title relevance (0-40 points)
    const titleTerms = tokenize(pub.title || "");
    const titleOverlap = queryTerms.filter((t) => titleTerms.includes(t)).length;
    score += Math.min(40, (titleOverlap / Math.max(queryTerms.length, 1)) * 40);

    // 2. Abstract relevance (0-25 points)
    if (pub.abstract) {
      const abstractTerms = tokenize(pub.abstract);
      const abstractOverlap = queryTerms.filter((t) => abstractTerms.includes(t)).length;
      score += Math.min(25, (abstractOverlap / Math.max(queryTerms.length, 1)) * 25);
    }

    // 3. Recency bonus (0-20 points) — newer papers score higher
    if (pub.year) {
      const age = currentYear - pub.year;
      score += Math.max(0, 20 - age * 2); // 20 pts for current year, -2 per year
    }

    // 4. Citation count / credibility (0-10 points)
    if (pub.citedByCount) {
      score += Math.min(10, Math.log10(pub.citedByCount + 1) * 3);
    }

    // 5. Multi-source bonus (0-5 points) — appears in both OpenAlex + PubMed
    if (pub.sourceApis && pub.sourceApis.length > 1) {
      score += 5;
    }

    // 6. Has abstract bonus (3 points)
    if (pub.abstract && pub.abstract.length > 100) {
      score += 3;
    }

    // 7. Open access bonus (2 points)
    if (pub.openAccess) {
      score += 2;
    }

    return { ...pub, relevanceScore: Math.round(score * 100) / 100 };
  });

  // Sort by score descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scored.slice(0, topN);
}

/**
 * Re-rank clinical trials
 */
export function rerankTrials(trials, query, disease, topN = 5) {
  const queryTerms = tokenize(`${query} ${disease}`);

  const scored = trials.map((trial) => {
    let score = 0;

    // Title relevance
    const titleTerms = tokenize(trial.title || "");
    const titleOverlap = queryTerms.filter((t) => titleTerms.includes(t)).length;
    score += (titleOverlap / Math.max(queryTerms.length, 1)) * 40;

    // Status bonus — recruiting trials are more useful
    const statusBonus = {
      RECRUITING: 20,
      "ACTIVE_NOT_RECRUITING": 10,
      "NOT_YET_RECRUITING": 15,
      COMPLETED: 5,
      ENROLLING_BY_INVITATION: 12,
    };
    score += statusBonus[trial.status?.toUpperCase()] || 0;

    // Summary relevance
    if (trial.summary) {
      const summaryTerms = tokenize(trial.summary);
      const overl = queryTerms.filter((t) => summaryTerms.includes(t)).length;
      score += Math.min(15, (overl / Math.max(queryTerms.length, 1)) * 15);
    }

    // Has contact info bonus
    if (trial.contacts?.length > 0) score += 5;

    // Has location info bonus
    if (trial.locations?.length > 0) score += 5;

    return { ...trial, relevanceScore: Math.round(score * 100) / 100 };
  });

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, topN);
}

/**
 * Simple tokenizer — splits text into lowercase terms, removes stopwords
 */
function tokenize(text) {
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "has", "have", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those",
    "it", "its", "i", "we", "they", "my", "your", "our", "their",
  ]);

  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopwords.has(t));
}

export default { rerankPublications, rerankTrials };
