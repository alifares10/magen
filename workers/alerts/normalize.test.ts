import { describe, expect, it } from "vitest";
import { normalizeOfficialAlertItem } from "./normalize";

describe("normalizeOfficialAlertItem", () => {
  it("normalizes a valid official alert item", () => {
    const result = normalizeOfficialAlertItem({
      sourceId: "141af7fd-1166-4703-9f5f-7e4ec6fa36f4",
      sourceSlug: "home-front-command-alerts",
      rawItem: {
        id: "alert-123",
        title: "Incoming Rockets",
        message: "Take shelter immediately",
        alert_type: "rocket_fire",
        severity: "critical",
        status: "active",
        city: "Tel Aviv",
        region: "Center",
        location_name: "Tel Aviv District",
        lat: 32.0853,
        lng: 34.7818,
        published_at: "2026-03-06T12:01:20.000Z",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.external_id).toBe("alert-123");
    expect(result?.severity).toBe("critical");
    expect(result?.country).toBe("IL");
    expect(result?.city).toBe("Tel Aviv");
    expect(result?.lat).toBe(32.0853);
    expect(result?.lng).toBe(34.7818);
  });

  it("creates a fallback external_id when missing", () => {
    const result = normalizeOfficialAlertItem({
      sourceId: "141af7fd-1166-4703-9f5f-7e4ec6fa36f4",
      sourceSlug: "home-front-command-alerts",
      rawItem: {
        title: "Suspicious Aircraft",
        city: "Haifa",
        type: "air_incident",
        published_at: "2026-03-06T12:01:59.000Z",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.external_id).toHaveLength(64);
    expect(result?.external_id).toMatch(/^[a-f0-9]{64}$/);
  });

  it("drops items without minimum signal", () => {
    const result = normalizeOfficialAlertItem({
      sourceId: "141af7fd-1166-4703-9f5f-7e4ec6fa36f4",
      sourceSlug: "home-front-command-alerts",
      rawItem: {
        city: "Jerusalem",
        lat: 31.7683,
        lng: 35.2137,
      },
    });

    expect(result).toBeNull();
  });

  it("maps unknown severity values to high", () => {
    const result = normalizeOfficialAlertItem({
      sourceId: "141af7fd-1166-4703-9f5f-7e4ec6fa36f4",
      sourceSlug: "home-front-command-alerts",
      rawItem: {
        title: "System Notice",
        type: "notice",
        severity: "unknown-level",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.severity).toBe("high");
  });

  it("keeps lat/lng as a pair only", () => {
    const result = normalizeOfficialAlertItem({
      sourceId: "141af7fd-1166-4703-9f5f-7e4ec6fa36f4",
      sourceSlug: "home-front-command-alerts",
      rawItem: {
        title: "Power outage alert",
        type: "infrastructure",
        lat: 32.1,
      },
    });

    expect(result).not.toBeNull();
    expect(result?.lat).toBeNull();
    expect(result?.lng).toBeNull();
  });

  it("maps oref fields and keeps per-location external id", () => {
    const result = normalizeOfficialAlertItem({
      sourceId: "141af7fd-1166-4703-9f5f-7e4ec6fa36f4",
      sourceSlug: "home-front-command-alerts",
      rawItem: {
        external_id: "134173490020000000:3ee5fef8a3f4f5d0",
        id: "134173490020000000",
        cat: "10",
        title: "בדקות הקרובות צפויות להתקבל התרעות באזורך",
        desc: "היכנסו למרחב מוגן",
        city: "תל אביב",
        location_name: "תל אביב",
      },
    });

    expect(result).not.toBeNull();
    expect(result?.external_id).toBe("134173490020000000:3ee5fef8a3f4f5d0");
    expect(result?.alert_type).toBe("10");
    expect(result?.message).toBe("היכנסו למרחב מוגן");
    expect(result?.city).toBe("תל אביב");
    expect(result?.location_name).toBe("תל אביב");
  });
});
