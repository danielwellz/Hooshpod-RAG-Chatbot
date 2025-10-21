import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_MODEL: z.string().min(1, "OPENROUTER_MODEL is required"),
  KNOWLEDGE_FILE: z.string().min(1, "KNOWLEDGE_FILE is required"),
  EMBEDDING_PROVIDER: z.string().min(1, "EMBEDDING_PROVIDER is required"),
  COHERE_API_KEY: z.string().optional(),
  CHUNK_SIZE: z.coerce.number().int().positive().default(512),
  TOP_K: z.coerce.number().int().positive().default(5),
  CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = Object.entries(parsed.error.flatten().fieldErrors)
    .filter(([, errors]) => errors && errors.length > 0)
    .map(([key]) => key)
    .join(", ");

  throw new Error(`Invalid environment configuration. Missing or invalid: ${missing}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
