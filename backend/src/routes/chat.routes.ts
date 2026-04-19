import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { logger } from "../middleware/logger.js";

export const chatRoutes = Router();

// POST /api/chat/sessions — Create new chat session
chatRoutes.post("/sessions", async (req, res) => {
  try {
    const { title, context_type } = req.body;

    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .insert({
        user_id: req.user!.id,
        title: title || "New Chat",
        context_type: context_type || "general",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ session: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

// GET /api/chat/sessions — List user's sessions
chatRoutes.get("/sessions", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_sessions")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json({ sessions: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// POST /api/chat/sessions/:id/message — Send message and get AI response
chatRoutes.post("/sessions/:id/message", async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { content } = req.body;

    // Store user message
    await supabaseAdmin.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content,
    });

    // Forward to AI service for RAG response
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    // Set up SSE for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const response = await fetch(`${aiServiceUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: content,
          session_id: sessionId,
          user_id: req.user!.id,
          user_role: req.user!.role,
        }),
      });

      if (response.ok) {
        const aiResult = await response.json();

        // Store AI response
        await supabaseAdmin.from("chat_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: aiResult.answer,
          citations: aiResult.citations,
          metadata: aiResult.metadata,
        });

        // Send complete response
        res.write(
          `data: ${JSON.stringify({
            type: "complete",
            content: aiResult.answer,
            citations: aiResult.citations,
            confidence: aiResult.confidence,
          })}\n\n`
        );
      } else {
        // Fallback response
        res.write(
          `data: ${JSON.stringify({
            type: "complete",
            content:
              "I apologize, but I'm unable to process your request at this time. Please try again later.",
            citations: [],
          })}\n\n`
        );
      }
    } catch (fetchError) {
      // AI service unavailable — send graceful fallback
      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          content:
            "The AI service is currently unavailable. Your question has been logged and will be answered when service is restored.",
          citations: [],
        })}\n\n`
      );
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    logger.error({ error }, "Chat message failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat failed" });
    }
  }
});

// GET /api/chat/sessions/:id/messages — Get chat history
chatRoutes.get("/sessions/:id/messages", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .eq("session_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ messages: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
