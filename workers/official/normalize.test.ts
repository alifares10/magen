import { describe, expect, it } from "vitest";
import { normalizeOfficialUpdateItem } from "./normalize";

describe("normalizeOfficialUpdateItem", () => {
  it("normalizes a valid official guidance item", () => {
    const result = normalizeOfficialUpdateItem({
      sourceId: "18a85cfb-4ec0-429d-857e-8a950918f4eb",
      sourceSlug: "official-guidance-gov-il",
      rawItem: {
        id: "guidance-123",
        title: "School schedule update",
        body: "Schools in the north remain closed tomorrow.",
        update_type: "education",
        severity: "medium",
        region: "North",
        published_at: "2026-03-06T13:21:14.000Z",
        is_active: true,
      },
    });

    expect(result).not.toBeNull();
    expect(result?.external_id).toBe("guidance-123");
    expect(result?.title).toBe("School schedule update");
    expect(result?.severity).toBe("medium");
    expect(result?.country).toBe("IL");
    expect(result?.is_active).toBe(true);
  });

  it("creates a fallback external_id when missing", () => {
    const result = normalizeOfficialUpdateItem({
      sourceId: "18a85cfb-4ec0-429d-857e-8a950918f4eb",
      sourceSlug: "official-guidance-gov-il",
      rawItem: {
        title: "Public transport advisory",
        body: "Service changes in several regions.",
        type: "transport",
        published_at: "2026-03-06T13:22:59.000Z",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.external_id).toHaveLength(64);
    expect(result?.external_id).toMatch(/^[a-f0-9]{64}$/);
  });

  it("drops items without minimum signal", () => {
    const result = normalizeOfficialUpdateItem({
      sourceId: "18a85cfb-4ec0-429d-857e-8a950918f4eb",
      sourceSlug: "official-guidance-gov-il",
      rawItem: {
        region: "Center",
      },
    });

    expect(result).toBeNull();
  });

  it("maps unknown severity values to null", () => {
    const result = normalizeOfficialUpdateItem({
      sourceId: "18a85cfb-4ec0-429d-857e-8a950918f4eb",
      sourceSlug: "official-guidance-gov-il",
      rawItem: {
        title: "Traffic notice",
        body: "Expect delays.",
        severity: "not-a-severity",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.severity).toBeNull();
  });

  it("uses payload status to infer inactive updates", () => {
    const result = normalizeOfficialUpdateItem({
      sourceId: "18a85cfb-4ec0-429d-857e-8a950918f4eb",
      sourceSlug: "official-guidance-gov-il",
      rawItem: {
        title: "Old guidance",
        body: "This update is no longer in effect.",
        status: "resolved",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.is_active).toBe(false);
  });

  it("normalizes oref featured item with numeric id and time", () => {
    const result = normalizeOfficialUpdateItem({
      sourceId: "18a85cfb-4ec0-429d-857e-8a950918f4eb",
      sourceSlug: "official-guidance-oref",
      rawItem: {
        id: 16518,
        time: "2026-03-07T16:31:00Z",
        title: "חדירת כלי טיס עוין לשמי ישראל - האירוע הסתיים",
        text: "<p>ניתן לצאת מהמרחב המוגן.</p>",
        update_type: "featured_news",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.external_id).toBe("16518");
    expect(result?.published_at).toBe("2026-03-07T16:31:00.000Z");
    expect(result?.body).toBe("<p>ניתן לצאת מהמרחב המוגן.</p>");
    expect(result?.update_type).toBe("featured_news");
  });
});
