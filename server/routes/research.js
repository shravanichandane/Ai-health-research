/**
 * Research Route — Main orchestration endpoint
 * Handles the full pipeline: Query → Expand → Fetch → Merge → Rank → LLM → Response
 */
import { Router } from "express";
import { searchPublications as searchOpenAlex } from "../services/openalex.js";
import { searchPublications as searchPubMed } from "../services/pubmed.js";
import { searchTrials } from "../services/clinicalTrials.js";
import { mergePublications } from "../services/dedupMerge.js";
import { rerankPublications, rerankTrials } from "../services/reranker.js";
import { expandQuery, generateResearchResponse, generateFallbackResponse } from "../services/llm.js";
import {
  getOrCreateConversation,
  updateContext,
  isFollowUp,
  enrichFollowUpQuery,
  getRecentHistory,
} from "../services/contextManager.js";

const router = Router();

/**
 * POST /api/research
 * Main research endpoint — accepts structured or natural queries
 */
router.post("/", async (req, res) => {
  const startTime = Date.now();

  try {
    let {
      query,
      disease,
      location,
      patientName,
      conversationId,
    } = req.body;

    if (!query && !disease) {
      return res.status(400).json({ error: "Either 'query' or 'disease' is required" });
    }

    // ====================================
    // STEP 0: Context Management
    // ====================================
    let conversation = null;
    let history = [];

    try {
      conversation = await getOrCreateConversation(conversationId);
      history = getRecentHistory(conversation);

      // Detect follow-up and enrich query
      if (!disease && isFollowUp(query, conversation.context)) {
        const enriched = enrichFollowUpQuery(query, conversation.context);
        disease = enriched.disease;
        location = location || enriched.location;
        console.log(`📎 Follow-up detected — using context disease: ${disease}`);
      }
    } catch (err) {
      console.warn("Context management skipped (no DB):", err.message);
    }

    // Default disease from query if not provided separately
    if (!disease) disease = query;

    console.log(`\n🔬 Research Pipeline Started`);
    console.log(`   Disease: ${disease}`);
    console.log(`   Query: ${query}`);
    console.log(`   Location: ${location || "Any"}`);

    // ====================================
    // STEP 1: Query Expansion (LLM)
    // ====================================
    console.log(`\n📝 Step 1: Expanding query...`);
    let expandedQuery;
    try {
      expandedQuery = await expandQuery(query, disease, conversation?.context || {});
    } catch {
      expandedQuery = `${query} ${disease}`.trim();
    }
    console.log(`   Original: "${query}"`);
    console.log(`   Expanded: "${expandedQuery}"`);

    // ====================================
    // STEP 2: Parallel API Fetch (Depth First)
    // ====================================
    console.log(`\n🌐 Step 2: Fetching from 3 sources in parallel...`);

    const [openAlexResults, pubmedResults, trialResults] = await Promise.all([
      searchOpenAlex(expandedQuery, 100).catch((e) => {
        console.error("OpenAlex failed:", e.message);
        return [];
      }),
      searchPubMed(expandedQuery, 100).catch((e) => {
        console.error("PubMed failed:", e.message);
        return [];
      }),
      searchTrials(disease, query, 50).catch((e) => {
        console.error("ClinicalTrials failed:", e.message);
        return [];
      }),
    ]);

    console.log(`   OpenAlex: ${openAlexResults.length} results`);
    console.log(`   PubMed: ${pubmedResults.length} results`);
    console.log(`   ClinicalTrials: ${trialResults.length} results`);
    console.log(`   Total raw: ${openAlexResults.length + pubmedResults.length + trialResults.length}`);

    // ====================================
    // STEP 3: Dedup & Merge
    // ====================================
    console.log(`\n🔀 Step 3: Deduplicating & merging...`);
    const mergedPubs = mergePublications(openAlexResults, pubmedResults);
    console.log(`   After dedup: ${mergedPubs.length} unique publications`);

    // ====================================
    // STEP 4: Re-Ranking
    // ====================================
    console.log(`\n📊 Step 4: Re-ranking by relevance...`);
    const topPublications = rerankPublications(mergedPubs, expandedQuery, 8);
    const topTrials = rerankTrials(trialResults, query, disease, 5);
    console.log(`   Top publications: ${topPublications.length}`);
    console.log(`   Top trials: ${topTrials.length}`);

    // ====================================
    // STEP 5: LLM Reasoning
    // ====================================
    console.log(`\n🧠 Step 5: Generating research response with LLM...`);
    let llmResponse;
    try {
      llmResponse = await generateResearchResponse(
        query,
        disease,
        topPublications,
        topTrials,
        history
      );
    } catch (err) {
      console.error("LLM reasoning failed:", err.message);
      llmResponse = generateFallbackResponse(query, disease, topPublications, topTrials);
    }

    const processingTime = Date.now() - startTime;
    console.log(`\n✅ Pipeline completed in ${processingTime}ms`);

    // ====================================
    // STEP 6: Save to conversation & respond
    // ====================================
    let savedConvId = conversationId;
    try {
      if (conversation) {
        // Save user message
        conversation.messages.push({
          role: "user",
          content: query,
          disease,
          query,
          location,
          patientName,
        });

        // Save assistant response
        conversation.messages.push({
          role: "assistant",
          content: llmResponse,
          publications: topPublications.map((p) => ({
            title: p.title,
            authors: p.authors,
            year: p.year,
            source: p.source,
            url: p.url,
          })),
          trials: topTrials.map((t) => ({
            id: t.nctId,
            title: t.title,
            status: t.status,
            url: t.url,
          })),
          metadata: { processingTime, expandedQuery },
        });

        updateContext(conversation, { disease, query, location, patientName });
        await conversation.save();
        savedConvId = conversation._id.toString();
      }
    } catch (err) {
      console.warn("Conversation save skipped:", err.message);
    }

    // ====================================
    // RESPONSE
    // ====================================
    res.json({
      success: true,
      conversationId: savedConvId || null,
      response: llmResponse,
      publications: topPublications,
      trials: topTrials,
      metadata: {
        processingTimeMs: processingTime,
        expandedQuery,
        totalFetched: openAlexResults.length + pubmedResults.length + trialResults.length,
        afterDedup: mergedPubs.length,
        sourcesUsed: {
          openAlex: openAlexResults.length,
          pubMed: pubmedResults.length,
          clinicalTrials: trialResults.length,
        },
        topPublicationsCount: topPublications.length,
        topTrialsCount: topTrials.length,
        llmModel: "mistral-7b-instruct (open-source)",
      },
    });
  } catch (err) {
    console.error("Research pipeline error:", err);
    res.status(500).json({ error: "Research pipeline failed", message: err.message });
  }
});

/**
 * GET /api/research/conversations
 * List recent conversations
 */
router.get("/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("title context.disease createdAt updatedAt messages");

    res.json({
      conversations: conversations.map((c) => ({
        id: c._id,
        title: c.title,
        disease: c.context?.disease,
        messageCount: c.messages?.length || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch {
    res.json({ conversations: [] });
  }
});

/**
 * GET /api/research/conversations/:id
 * Get full conversation history
 */
router.get("/conversations/:id", async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ error: "Not found" });
    res.json({ conversation: conv });
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

// Import Conversation model at the top level
import { Conversation } from "../models/Conversation.js";

export default router;
