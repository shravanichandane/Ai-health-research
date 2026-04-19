import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireRole } from "../middleware/auth.js";
import { logger } from "../middleware/logger.js";

export const doctorRoutes = Router();

// GET /api/doctor/patients — List assigned patients
doctorRoutes.get("/patients", requireRole("doctor"), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("doctor_patient_assignments")
      .select("*, profiles!doctor_patient_assignments_patient_id_fkey(*)")
      .eq("doctor_id", req.user!.id)
      .eq("status", "active");

    if (error) throw error;
    res.json({ patients: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// GET /api/doctor/patients/:patientId/soap — Get/generate SOAP note
doctorRoutes.get("/patients/:patientId/soap", requireRole("doctor"), async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check assignment
    const { data: assignment } = await supabaseAdmin
      .from("doctor_patient_assignments")
      .select("id")
      .eq("doctor_id", req.user!.id)
      .eq("patient_id", patientId)
      .single();

    if (!assignment) {
      return res.status(403).json({ error: "Patient not assigned to you" });
    }

    // Get existing SOAP note
    let { data: soap } = await supabaseAdmin
      .from("soap_notes")
      .select("*")
      .eq("doctor_id", req.user!.id)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!soap) {
      // Generate new SOAP via AI service
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
      const response = await fetch(`${aiServiceUrl}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: req.user!.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const { data: newSoap } = await supabaseAdmin
          .from("soap_notes")
          .insert({
            doctor_id: req.user!.id,
            patient_id: patientId,
            ...result,
          })
          .select()
          .single();

        soap = newSoap;
      }
    }

    res.json({ soap });
  } catch (error) {
    logger.error({ error }, "SOAP fetch failed");
    res.status(500).json({ error: "Failed to fetch SOAP" });
  }
});

// POST /api/doctor/patients/:patientId/soap/validate
doctorRoutes.post("/patients/:patientId/soap/validate", requireRole("doctor"), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { soap_id, modifications } = req.body;

    const { data, error } = await supabaseAdmin
      .from("soap_notes")
      .update({
        validated_by_doctor: true,
        ...(modifications || {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", soap_id)
      .eq("doctor_id", req.user!.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ soap: data });
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});
