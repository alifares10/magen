import { describe, expect, it } from "vitest";
import { normalizeRssItem } from "./normalize";

describe("normalizeRssItem", () => {
  it("normalizes a valid rss item", () => {
    const result = normalizeRssItem({
      sourceId: "9d3cda8e-a95a-48f7-8a31-9624fd2bc325",
      sourceSlug: "times-of-israel-main",
      rawItem: {
        title: "Headline",
        link: "https://www.example.com/story?utm_source=newsletter",
        guid: "story-123",
        isoDate: "2026-03-06T09:15:00.000Z",
        contentSnippet: "Summary here",
        creator: "Reporter",
        categories: ["Security"],
        enclosure: {
          url: "https://cdn.example.com/image.jpg",
        },
      },
    });

    expect(result).not.toBeNull();
    expect(result?.url).toBe("https://www.example.com/story");
    expect(result?.country).toBe("IL");
    expect(result?.topic).toBe("Security");
    expect(result?.is_breaking).toBe(false);
  });

  it("returns null when item has no valid url", () => {
    const result = normalizeRssItem({
      sourceId: "9d3cda8e-a95a-48f7-8a31-9624fd2bc325",
      sourceSlug: "times-of-israel-main",
      rawItem: {
        title: "Headline",
      },
    });

    expect(result).toBeNull();
  });
});
