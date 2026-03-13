import { z } from "zod";

const severitySchema = z.enum(["low", "medium", "high", "critical"]);

export const officialUpdateInsertSchema = z.object({
  source_id: z.string().uuid(),
  external_id: z.string().min(1).max(128).nullable(),
  title: z.string().min(1),
  body: z.string().min(1),
  update_type: z.string().min(1),
  severity: severitySchema.nullable(),
  country: z.string().length(2),
  region: z.string().nullable(),
  published_at: z.string().datetime(),
  is_active: z.boolean(),
  raw_payload: z.object({}).passthrough(),
});

export type OfficialUpdateInsert = z.infer<typeof officialUpdateInsertSchema>;
