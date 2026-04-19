import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireRole } from "../middleware/auth.js";
import { logger } from "../middleware/logger.js";

export const patientRoutes = Router();

// GET /api/patient/documents
patientRoutes.get("/documents", requireRole("patient", "doctor"), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_documents")
      .select("*")
      .eq("patient_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ documents: data || [] });
  } catch (error) {
    logger.error({ error }, "Failed to fetch documents");
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// POST /api/patient/documents/upload
patientRoutes.post("/documents/upload", requireRole("patient"), async (req, res) => {
  try {
    const { file_name, document_type, file_data } = req.body;

    // Upload file to Supabase Storage
    const fileName = `${req.user!.id}/${Date.now()}_${file_name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("medical-documents")
      .upload(fileName, Buffer.from(file_data, "base64"), {
        contentType: "application/pdf",
      });

    if (uploadError) throw uploadError;

    // Create document record
    const { data: doc, error: docError } = await supabaseAdmin
      .from("medical_documents")
      .insert({
        patient_id: req.user!.id,
        document_type,
        file_name,
        file_url: uploadData.path,
        status: "pending",
      })
      .select()
      .single();

    if (docError) throw docError;

    res.status(201).json({ document: doc });
  } catch (error) {
    logger.error({ error }, "Upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/patient/documents/:id/analyze
patientRoutes.post("/documents/:id/analyze", requireRole("patient"), async (req, res) => {
  try {
    const { id } = req.params;

    // Update status to processing
    await supabaseAdmin
      .from("medical_documents")
      .update({ status: "processing" })
      .eq("id", id)
      .eq("patient_id", req.user!.id);

    // Forward to AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${aiServiceUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: id, patient_id: req.user!.id }),
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const result = await response.json();

    // Update document with AI results
    await supabaseAdmin
      .from("medical_documents")
      .update({
        status: "completed",
        raw_ocr_text: result.ocr_text,
        structured_data: result.structured_data,
        ai_summary: result.summary,
        ai_insights: result.insights,
        processing_metadata: result.metadata,
      })
      .eq("id", id);

    // Store extracted biomarkers
    if (result.structured_data?.biomarkers) {
      for (const bio of result.structured_data.biomarkers) {
        await supabaseAdmin.from("biomarkers").insert({
          patient_id: req.user!.id,
          document_id: id,
          name: bio.name,
          value: bio.value,
          unit: bio.unit,
          reference_min: bio.reference_min,
          reference_max: bio.reference_max,
          status: bio.status,
          recorded_date: result.structured_data.report_date,
        });
      }
    }

    res.json({ result });
  } catch (error) {
    logger.error({ error }, "Analysis failed");
    
    // Update status to failed
    await supabaseAdmin
      .from("medical_documents")
      .update({ status: "failed" })
      .eq("id", req.params.id);

    res.status(500).json({ error: "Analysis failed" });
  }
});

// GET /api/patient/biomarkers
patientRoutes.get("/biomarkers", requireRole("patient", "doctor"), async (req, res) => {
  try {
    const patientId = req.query.patient_id as string || req.user!.id;
    const { data, error } = await supabaseAdmin
      .from("biomarkers")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_date", { ascending: true });

    if (error) throw error;
    res.json({ biomarkers: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch biomarkers" });
  }
});

// GET /api/patient/insights
patientRoutes.get("/insights", requireRole("patient"), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("health_insights")
      .select("*")
      .eq("patient_id", req.user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ insights: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// GET /api/patient/trials/matches
patientRoutes.get("/trials/matches", requireRole("patient"), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("trial_matches")
      .select("*, clinical_trials(*)")
      .eq("patient_id", req.user!.id)
      .order("match_score", { ascending: false });

    if (error) throw error;
    res.json({ matches: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trial matches" });
  }
});
