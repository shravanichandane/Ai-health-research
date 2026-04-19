import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { z } from "zod";
import { logger } from "../middleware/logger.js";

export const authRoutes = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(["patient", "doctor", "researcher"]),
  specialization: z.string().optional(),
  institution: z.string().optional(),
  license_number: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
authRoutes.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: body.email,
        full_name: body.full_name,
        role: body.role,
        specialization: body.specialization,
        institution: body.institution,
        license_number: body.license_number,
        consent_given: true,
      });

    if (profileError) {
      logger.error({ profileError }, "Profile creation failed");
    }

    // Sign in to get JWT
    const { data: signInData, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

    if (signInError) {
      return res.status(400).json({ error: signInError.message });
    }

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: body.email,
        role: body.role,
        full_name: body.full_name,
      },
      session: signInData.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    logger.error({ error }, "Registration failed");
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
authRoutes.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    res.json({
      user: profile,
      session: data.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
authRoutes.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  res.json({ user: profile });
});
