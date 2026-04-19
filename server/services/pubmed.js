/**
 * PubMed E-utilities API Service
 * Fetches biomedical publications from NCBI PubMed
 * https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */
import axios from "axios";
import { parseStringPromise } from "xml2js";

const BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

/**
 * Search PubMed for articles matching query
 * Step 1: esearch → get PMIDs
 * Step 2: efetch → get full article details
 */
export async function searchPublications(query, maxResults = 100) {
  try {
    // Step 1: Search for PMIDs
    const searchResp = await axios.get(`${BASE_URL}/esearch.fcgi`, {
      params: {
        db: "pubmed",
        term: query,
        retmax: maxResults,
        sort: "relevance",
        retmode: "json",
      },
      timeout: 15000,
    });

    const pmids = searchResp.data?.esearchresult?.idlist || [];
    if (pmids.length === 0) return [];

    // Step 2: Fetch article details (in batches of 50)
    const articles = [];
    for (let i = 0; i < pmids.length; i += 50) {
      const batch = pmids.slice(i, i + 50);
      const fetchResp = await axios.get(`${BASE_URL}/efetch.fcgi`, {
        params: {
          db: "pubmed",
          id: batch.join(","),
          rettype: "xml",
          retmode: "xml",
        },
        timeout: 20000,
      });

      const parsed = await parseStringPromise(fetchResp.data, {
        explicitArray: false,
        ignoreAttrs: false,
      });

      const articleSet =
        parsed?.PubmedArticleSet?.PubmedArticle || [];
      const list = Array.isArray(articleSet) ? articleSet : [articleSet];

      for (const article of list) {
        try {
          articles.push(normalizePubMedArticle(article));
        } catch {
          // Skip malformed articles
        }
      }
    }

    return articles;
  } catch (err) {
    console.error("PubMed search failed:", err.message);
    return [];
  }
}

/**
 * Normalize PubMed article to unified schema
 */
function normalizePubMedArticle(raw) {
  const medCitation = raw?.MedlineCitation;
  const article = medCitation?.Article || {};
  const journal = article?.Journal || {};
  const pmid = medCitation?.PMID?._ || medCitation?.PMID || "";

  // Extract title
  const title =
    typeof article.ArticleTitle === "string"
      ? article.ArticleTitle
      : article.ArticleTitle?._ || "Untitled";

  // Extract abstract
  let abstract = "";
  const abstractText = article?.Abstract?.AbstractText;
  if (typeof abstractText === "string") {
    abstract = abstractText;
  } else if (Array.isArray(abstractText)) {
    abstract = abstractText
      .map((t) => (typeof t === "string" ? t : t._ || ""))
      .join(" ");
  } else if (abstractText?._) {
    abstract = abstractText._;
  }

  // Extract authors
  const authorList = article?.AuthorList?.Author;
  const authors = [];
  if (authorList) {
    const list = Array.isArray(authorList) ? authorList : [authorList];
    for (const a of list.slice(0, 5)) {
      const name = [a.ForeName, a.LastName].filter(Boolean).join(" ");
      if (name) authors.push(name);
    }
  }

  // Extract year
  const pubDate =
    journal?.JournalIssue?.PubDate ||
    article?.ArticleDate ||
    {};
  const year =
    pubDate.Year || (pubDate.MedlineDate || "").slice(0, 4) || "Unknown";

  // Extract journal name
  const journalName = journal?.Title || journal?.ISOAbbreviation || "Unknown";

  return {
    id: `pubmed:${pmid}`,
    title,
    abstract,
    authors,
    year: parseInt(year) || null,
    source: "PubMed",
    journal: journalName,
    citedByCount: null,
    doi: null,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    pmid,
    type: "journal-article",
    openAccess: false,
  };
}

export default { searchPublications };
