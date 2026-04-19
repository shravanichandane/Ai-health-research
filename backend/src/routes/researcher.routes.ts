import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireRole } from "../middleware/auth.js";
import { logger } from "../middleware/logger.js";

export const researcherRoutes = Router();

// POST /api/researcher/cohort-search — De-identified cohort search
researcherRoutes.post("/cohort-search", requireRole("researcher"), async (req, res) => {
  try {
    const { filters } = req.body;
    // filters: [{ field: "biomarker_name", operator: ">", value: 130 }, ...]

    // Build dynamic query on de-identified biomarker aggregates
    let query = supabaseAdmin
      .from("biomarkers")
      .select("patient_id, name, value, unit, status", { count: "exact" });

    if (filters) {
      for (const filter of filters) {
        if (filter.field === "biomarker_name") {
          query = query.eq("name", filter.value);
        }
        if (filter.field === "biomarker_min") {
          query = query.gte("value", filter.value);
        }
        if (filter.field === "biomarker_max") {
          query = query.lte("value", filter.value);
        }
      }
    }

    const { data, count, error } = await query;
    if (error) throw error;

    // De-identify: return only aggregate counts, no patient IDs
    const uniquePatients = new Set(data?.map((d) => d.patient_id) || []);

    res.json({
      total_patients: uniquePatients.size,
      total_records: count || 0,
      aggregate: {
        by_status: {
          normal: data?.filter((d) => d.status === "normal").length || 0,
          high: data?.filter((d) => d.status === "high").length || 0,
          low: data?.filter((d) => d.status === "low").length || 0,
          critical: data?.filter((d) => d.status === "critical").length || 0,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Cohort search failed");
    res.status(500).json({ error: "Cohort search failed" });
  }
});

// POST /api/researcher/recruit — Send trial invitations
researcherRoutes.post("/recruit", requireRole("researcher"), async (req, res) => {
  try {
    const { trial_id, patient_ids } = req.body;

    const invitations = patient_ids.map((pid: string) => ({
      trial_id,
      patient_id: pid,
      researcher_id: req.user!.id,
      status: "pending",
      invited_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from("trial_matches")
      .upsert(invitations, { onConflict: "trial_id,patient_id" })
      .select();

    if (error) throw error;
    res.json({ invitations: data });
  } catch (error) {
    res.status(500).json({ error: "Recruitment failed" });
  }
});

// GET /api/researcher/trials — List researcher's active trials
researcherRoutes.get("/trials", requireRole("researcher"), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("clinical_trials")
      .select("*")
      .eq("status", "recruiting")
      .order("start_date", { ascending: false });

    if (error) throw error;
    res.json({ trials: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trials" });
  }
});
