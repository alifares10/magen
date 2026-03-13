import { describe, expect, it } from "vitest";
import { extractRawAlertItems, parseOfficialAlertsBody } from "./extract";

describe("parseOfficialAlertsBody", () => {
  it("returns an empty array for bom and whitespace only response", () => {
    expect(parseOfficialAlertsBody("\uFEFF\r\n")).toEqual([]);
  });

  it("parses a valid json payload", () => {
    expect(parseOfficialAlertsBody('{"id":"alert-1"}')).toEqual({ id: "alert-1" });
  });

  it("throws for invalid json payload", () => {
    expect(() => parseOfficialAlertsBody("<html>not-json</html>")).toThrow("Official alerts feed must return JSON payload");
  });
});

describe("extractRawAlertItems", () => {
  it("fans out one item per location for oref payload", () => {
    const items = extractRawAlertItems({
      id: "134173490020000000",
      cat: "10",
      title: "בדקות הקרובות צפויות להתקבל התרעות באזורך",
      desc: "היכנסו למרחב מוגן",
      data: ["תל אביב", "רעננה"],
    });

    expect(items).toHaveLength(2);

    const first = items[0] as Record<string, unknown>;
    const second = items[1] as Record<string, unknown>;

    expect(first.city).toBe("תל אביב");
    expect(first.location_name).toBe("תל אביב");
    expect(first.desc).toBe("היכנסו למרחב מוגן");
    expect(first.cat).toBe("10");
    expect(first.source_format).toBe("oref_alerts_v1");
    expect((first.external_id as string).startsWith("134173490020000000:")).toBe(true);
    expect(first.external_id).not.toBe(second.external_id);
  });

  it("extracts known array keys for generic payloads", () => {
    const items = extractRawAlertItems({
      alerts: [{ id: "a1" }, { id: "a2" }],
    });

    expect(items).toEqual([{ id: "a1" }, { id: "a2" }]);
  });

  it("falls back to single record when object has alert signal fields", () => {
    const payload = { title: "Incoming Rockets", status: "active" };
    expect(extractRawAlertItems(payload)).toEqual([payload]);
  });
});
