import { describe, expect, it } from "vitest";
import { sourceSchema } from "@/lib/schemas/source";

describe("sourceSchema", () => {
  it("accepts postgres timestamptz offsets", () => {
    const parsed = sourceSchema.safeParse({
      id: "f7f315d4-d594-4ba4-a52d-d9dd8878bf34",
      name: "Times of Israel",
      slug: "times-of-israel-main",
      source_type: "rss_news",
      base_url: "https://www.timesofisrael.com",
      feed_url: "https://www.timesofisrael.com/feed/",
      is_active: true,
      priority: 100,
      created_at: "2026-03-06T15:26:11.184089+00:00",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts map overlay source type", () => {
    const parsed = sourceSchema.safeParse({
      id: "e6fcf0d7-aaf7-49f5-a5fd-17065f304838",
      name: "Internal Manual Shelters Overlay",
      slug: "internal-manual-shelters-overlay",
      source_type: "map_overlay",
      base_url: null,
      feed_url: null,
      is_active: true,
      priority: 300,
      created_at: "2026-03-13T11:40:00.000+00:00",
    });

    expect(parsed.success).toBe(true);
  });
});
