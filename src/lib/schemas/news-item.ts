import { z } from "zod";

const severitySchema = z.enum(["low", "medium", "high", "critical"]);

export const newsItemInsertSchema = z.object({
  source_id: z.string().uuid(),
  external_id: z.string().min(1).max(128).nullable(),
  title: z.string().min(1),
  summary: z.string().nullable(),
  url: z.string().url(),
  author: z.string().nullable(),
  topic: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().length(2),
  language: z.string().nullable(),
  severity: severitySchema.nullable(),
  published_at: z.string().datetime(),
  image_url: z.string().url().nullable(),
  is_breaking: z.boolean(),
  raw_payload: z.object({}).passthrough(),
});

export type NewsItemInsert = z.infer<typeof newsItemInsertSchema>;
