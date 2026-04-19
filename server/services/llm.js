/**
 * HuggingFace Inference LLM Service
 * Uses open-source models (Mistral-7B, Zephyr, etc.)
 * NO Gemini, NO OpenAI — fully compliant with hackathon rules
 */
import { HfInference } from "@huggingface/inference";

let hf = null;

function getClient() {
  if (!hf) {
    const token = process.env.HUGGINGFACE_API_KEY;
    if (!token) throw new Error("HUGGINGFACE_API_KEY not set");
    hf = new HfInference(token);
  }
  return hf;
}

// Primary model — open-source, free inference
const MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

/**
 * Generate a text completion using the open-source LLM
 */
export async function generateCompletion(systemPrompt, userPrompt, opts = {}) {
  const client = getClient();
  const { maxTokens = 2048, temperature = 0.3 } = opts;

  try {
    let fullResponse = "";

    const stream = client.chatCompletionStream({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) fullResponse += delta;
    }

    return fullResponse.trim();
  } catch (err) {
    console.error("LLM generation failed:", err.message);
    // Fallback: try a smaller model
    try {
      const resp = await client.chatCompletion({
        model: "HuggingFaceH4/zephyr-7b-beta",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      });
      return resp.choices?.[0]?.message?.content?.trim() || "";
    } catch (fallbackErr) {
      console.error("Fallback LLM also failed:", fallbackErr.message);
      throw new Error("LLM generation failed on all models");
    }
  }
}

/**
 * Expand a user query using the LLM
 * "deep brain stimulation" + disease → expanded medical query
 */
export async function expandQuery(query, disease, context = {}) {
  const systemPrompt = `You are a medical search query optimizer. Given a disease and research query, generate an optimized search query that will find the most relevant medical publications and clinical trials.

Rules:
- Combine the disease with the query intent
- Add relevant medical terminology and synonyms
- Keep it concise (under 15 words)
- Output ONLY the expanded query string, nothing else`;

  const userPrompt = `Disease: ${disease}
Query: ${query}
${context.lastQuery ? `Previous context: ${context.lastQuery}` : ""}

Generate the optimized search query:`;

  try {
    const expanded = await generateCompletion(systemPrompt, userPrompt, {
      maxTokens: 100,
      temperature: 0.2,
    });
    // Clean up — remove quotes, periods, etc.
    return expanded.replace(/^["']|["']$/g, "").replace(/\.$/, "").trim();
  } catch {
    // Fallback: simple concatenation
    return `${query} ${disease}`.trim();
  }
}

/**
 * Generate a structured medical research response using the LLM
 */
export async function generateResearchResponse(
  query,
  disease,
  publications,
  trials,
  conversationHistory = []
) {
  const pubSummary = publications
    .slice(0, 8)
    .map(
      (p, i) =>
        `[${i + 1}] "${p.title}" (${p.year}) — ${p.abstract?.slice(0, 200) || "No abstract"}...`
    )
    .join("\n");

  const trialSummary = trials
    .slice(0, 5)
    .map(
      (t, i) =>
        `[T${i + 1}] "${t.title}" — Status: ${t.status}, Location: ${t.locations?.join(", ") || "Multiple"}`
    )
    .join("\n");

  const historyStr = conversationHistory
    .slice(-4)
    .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
    .join("\n");

  const systemPrompt = `You are CuraLink, an expert AI medical research assistant. You provide structured, evidence-based, research-backed responses.

CRITICAL RULES:
1. ALWAYS cite sources using [1], [2], etc. referencing the publications provided
2. ALWAYS reference clinical trials using [T1], [T2], etc.
3. Be specific — use exact numbers, dates, findings from the sources
4. NEVER hallucinate — only use information from the provided sources
5. Structure your response with clear sections
6. If conversation history exists, build on previous context
7. Personalize responses based on the disease context`;

  const userPrompt = `${historyStr ? `CONVERSATION HISTORY:\n${historyStr}\n\n` : ""}CURRENT QUERY: ${query}
DISEASE CONTEXT: ${disease}

AVAILABLE PUBLICATIONS:
${pubSummary || "No publications found"}

AVAILABLE CLINICAL TRIALS:
${trialSummary || "No clinical trials found"}

Generate a comprehensive, structured research response with these exact sections:
## Condition Overview
(Brief overview of ${disease} relevant to the query)

## Key Research Findings
(Cite specific publications using [1], [2], etc.)

## Clinical Trials
(Reference trials using [T1], [T2], etc. Include status and eligibility)

## Recommendations
(Evidence-based recommendations citing sources)

## Sources Referenced
(List all referenced sources)`;

  return generateCompletion(systemPrompt, userPrompt, {
    maxTokens: 2048,
    temperature: 0.3,
  });
}

/**
 * Fallback used when HuggingFace API goes offline or if key is missing/invalid
 */
export function generateFallbackResponse(query, disease, publications = [], trials = []) {
  return `## Condition Overview
A localized analysis of **${disease}**. Due to missing AI inference endpoints, this represents an automated structural extraction for query: "${query}".

## Key Research Findings
${publications.length > 0 ? publications.slice(0, 3).map((p, i) => `[${i + 1}] **${p.title}** (${p.year}) - ${p.authors?.join(", ") || "Unknown"} -> Extracted from ${p.source}.`).join('\n') : "No direct academic literature identified."}

## Clinical Trials
${trials.length > 0 ? trials.slice(0, 3).map((t, i) => `[T${i + 1}] **${t.title}** - Status: ${t.status}. Located at ${t.locations?.[0]?.facility || "Various"}.`).join('\n') : "No active clinical trials detected for this parameter."}

## Recommendations
*Please note:* The Deep-Reasoning LLM (Hugging Face / Mistral) connection failed or the API key is missing from the environment. This is a static heuristic fallback.

## Sources Referenced
* ${publications.length} Academic Publications Screened
* ${trials.length} Clinical Trials Sourced
`;
}

export default {
  generateCompletion,
  expandQuery,
  generateResearchResponse,
  generateFallbackResponse
};
