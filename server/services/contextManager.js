/**
 * Context Manager
 * Manages multi-turn conversation context using MongoDB
 */
import { Conversation } from "../models/Conversation.js";

/**
 * Get or create a conversation
 */
export async function getOrCreateConversation(conversationId) {
  if (conversationId) {
    try {
      const conv = await Conversation.findById(conversationId);
      if (conv) return conv;
    } catch { /* invalid id, create new */ }
  }
  return new Conversation();
}

/**
 * Update conversation context from the latest message
 */
export function updateContext(conversation, { disease, query, location, patientName }) {
  if (!conversation.context) conversation.context = {};
  if (disease) conversation.context.disease = disease;
  if (query) conversation.context.lastQuery = query;
  if (location) conversation.context.location = location;
  if (patientName) conversation.context.patientName = patientName;

  // Track topics discussed
  if (!conversation.context.topics) conversation.context.topics = [];
  const newTopics = [disease, query].filter(Boolean);
  for (const t of newTopics) {
    if (!conversation.context.topics.includes(t)) {
      conversation.context.topics.push(t);
    }
  }

  // Auto-generate title from first message
  if (conversation.messages.length <= 1 && disease) {
    conversation.title = `Research: ${disease}${query ? ` — ${query}` : ""}`;
  }
}

/**
 * Detect if this is a follow-up query that needs context
 */
export function isFollowUp(query, context) {
  if (!context?.disease) return false;

  // Short queries without disease mention are likely follow-ups
  const words = query.trim().split(/\s+/);
  if (words.length < 6) return true;

  // Questions that start with "can", "what about", "how about" are follow-ups
  const followUpStarters = [
    "can i", "what about", "how about", "is it", "should i",
    "what if", "tell me more", "and what", "also", "additionally",
  ];
  const lower = query.toLowerCase();
  return followUpStarters.some((s) => lower.startsWith(s));
}

/**
 * Enrich a follow-up query with conversation context
 */
export function enrichFollowUpQuery(query, context) {
  if (!context?.disease) return { query, disease: "", location: "" };

  return {
    query: query,
    disease: context.disease,
    location: context.location || "",
    enrichedQuery: `${query} in context of ${context.disease}`,
  };
}

/**
 * Get recent conversation history for LLM context window
 */
export function getRecentHistory(conversation, maxMessages = 6) {
  return (conversation.messages || [])
    .slice(-maxMessages)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 500), // Truncate long messages
    }));
}

export default {
  getOrCreateConversation,
  updateContext,
  isFollowUp,
  enrichFollowUpQuery,
  getRecentHistory,
};
