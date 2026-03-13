import { z } from "zod";

const severitySchema = z.enum(["low", "medium", "high", "critical"]);

export const alertInsertSchema = z
  .object({
    source_id: z.string().uuid(),
    external_id: z.string().min(1).max(128).nullable(),
    title: z.string().min(1),
    message: z.string().nullable(),
    alert_type: z.string().min(1),
    severity: severitySchema,
    status: z.string().min(1),
    country: z.string().length(2),
    region: z.string().nullable(),
    city: z.string().nullable(),
    location_name: z.string().nullable(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    published_at: z.string().datetime(),
    raw_payload: z.object({}).passthrough(),
  })
  .refine((value) => (value.lat === null && value.lng === null) || (value.lat !== null && value.lng !== null), {
    message: "lat and lng must both be present or both be null",
    path: ["lat"],
  });

export type AlertInsert = z.infer<typeof alertInsertSchema>;
