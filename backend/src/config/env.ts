import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url().default("https://placeholder.supabase.co"),
  SUPABASE_SERVICE_KEY: z.string().default("placeholder-key"),
  SUPABASE_ANON_KEY: z.string().default("placeholder-key"),
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  PORT: z.string().default("3001"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
