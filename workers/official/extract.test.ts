import { describe, expect, it } from "vitest";
import { extractRawGuidanceItems, parseOfficialGuidanceBody } from "./extract";

describe("parseOfficialGuidanceBody", () => {
  it("returns an empty array for bom and whitespace only response", () => {
    expect(parseOfficialGuidanceBody("\uFEFF\r\n")).toEqual([]);
  });

  it("parses valid json payload", () => {
    expect(parseOfficialGuidanceBody('{"id":"guidance-1"}')).toEqual({ id: "guidance-1" });
  });

  it("throws for invalid json payload", () => {
    expect(() => parseOfficialGuidanceBody("not-json")).toThrow("Official guidance feed must return JSON payload");
  });
});

describe("extractRawGuidanceItems", () => {
  it("extracts oref featured news items", () => {
    const items = extractRawGuidanceItems({
      subtitle: " פורטל החירום הלאומי ",
      content: [
        {
          newsListFeatured: {
            title: "עדכונים ומבזקים",
            allUpdatesUrl: "https://www.oref.org.il/heb/updates-and-newsflash/update-page",
            newsItems: [
              {
                id: 16518,
                time: "2026-03-07T16:31:00Z",
                title: "חדירת כלי טיס עוין לשמי ישראל - האירוע הסתיים",
                text: "<p>ניתן לצאת מהמרחב המוגן.</p>",
              },
            ],
          },
        },
      ],
    });

    expect(items).toHaveLength(1);
    const first = items[0] as Record<string, unknown>;
    expect(first.id).toBe(16518);
    expect(first.time).toBe("2026-03-07T16:31:00Z");
    expect(first.update_type).toBe("featured_news");
    expect(first.source_format).toBe("oref_home_heb_v1");
    expect(first.source_section_title).toBe("עדכונים ומבזקים");
  });

  it("extracts known array keys for generic payloads", () => {
    const items = extractRawGuidanceItems({ updates: [{ id: "u1" }, { id: "u2" }] });
    expect(items).toEqual([{ id: "u1" }, { id: "u2" }]);
  });

  it("falls back to single record when object has guidance signal fields", () => {
    const payload = { title: "Policy update", message: "Remain near shelter" };
    expect(extractRawGuidanceItems(payload)).toEqual([payload]);
  });
});
