import { z } from "zod";

export const sourceTypeSchema = z.enum([
  "official_alerts",
  "official_guidance",
  "rss_news",
  "manual_stream",
  "map_overlay",
]);

export const sourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  source_type: sourceTypeSchema,
  base_url: z.string().url().nullable(),
  feed_url: z.string().url().nullable(),
  is_active: z.boolean(),
  priority: z.number().int(),
  created_at: z.string().datetime({ offset: true }),
});

export type Source = z.infer<typeof sourceSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
