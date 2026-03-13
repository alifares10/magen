import { z } from "zod";
import { createFingerprint } from "../../src/lib/ingestion/dedupe";
import { alertInsertSchema, type AlertInsert } from "../../src/lib/schemas/alert";

const rawAlertItemSchema = z.object({}).passthrough();

function compactText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted.length > 0 ? compacted : null;
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function pickFirstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = compactText(record[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function pickFirstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const rawValue = record[key];

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return rawValue;
    }

    if (typeof rawValue === "string") {
      const parsed = Number(rawValue.trim());

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function parsePublishedAt(record: Record<string, unknown>): string {
  const candidate = pickFirstString(record, [
    "published_at",
    "publishedAt",
    "published",
    "pubDate",
    "date",
    "timestamp",
    "created_at",
    "createdAt",
    "updated_at",
    "updatedAt",
  ]);

  if (!candidate) {
    return new Date().toISOString();
  }

  const date = new Date(candidate);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function normalizeSeverity(value: string | null): "low" | "medium" | "high" | "critical" {
  const normalized = value?.toLowerCase();

  if (!normalized) {
    return "high";
  }

  if (["critical", "severe", "extreme", "emergency", "red"].includes(normalized)) {
    return "critical";
  }

  if (["high", "warning", "alert"].includes(normalized)) {
    return "high";
  }

  if (["medium", "moderate"].includes(normalized)) {
    return "medium";
  }

  if (["low", "minor", "info", "advisory"].includes(normalized)) {
    return "low";
  }

  return "high";
}

function normalizeStatus(value: string | null): string {
  const normalized = value?.toLowerCase();

  if (!normalized) {
    return "active";
  }

  if (["cancelled", "canceled"].includes(normalized)) {
    return "cancelled";
  }

  if (["resolved", "expired", "ended", "closed"].includes(normalized)) {
    return "resolved";
  }

  return "active";
}

function toRoundedMinuteIso(isoDate: string): string {
  const date = new Date(isoDate);
  date.setUTCSeconds(0, 0);
  return date.toISOString();
}

function hasMinimumSignal(record: Record<string, unknown>): boolean {
  return Boolean(
    pickFirstString(record, [
      "title",
      "headline",
      "name",
      "message",
      "description",
      "body",
      "type",
      "alert_type",
      "alertType",
      "category",
      "eventType",
    ]),
  );
}

export function normalizeOfficialAlertItem(input: {
  sourceId: string;
  sourceSlug: string;
  rawItem: unknown;
}): AlertInsert | null {
  const parsedRawItem = rawAlertItemSchema.safeParse(input.rawItem);

  if (!parsedRawItem.success) {
    return null;
  }

  const rawItem = parsedRawItem.data;
  const itemRecord = getRecord(rawItem);

  if (!itemRecord || !hasMinimumSignal(itemRecord)) {
    return null;
  }

  const locationRecord = getRecord(itemRecord.location);

  const title =
    pickFirstString(itemRecord, ["title", "headline", "name", "alertTitle", "event"]) ?? "Official alert";
  const message = pickFirstString(itemRecord, ["message", "description", "desc", "body", "text", "content"]);
  const alertType =
    pickFirstString(itemRecord, ["alert_type", "alertType", "type", "category", "eventType", "cat"]) ?? "general";
  const severityRaw = pickFirstString(itemRecord, ["severity", "risk_level", "riskLevel", "priority"]);
  const statusRaw = pickFirstString(itemRecord, ["status", "state"]);
  const country = pickFirstString(itemRecord, ["country", "country_code", "countryCode"]) ?? "IL";

  const region =
    pickFirstString(itemRecord, ["region", "district"]) ??
    (locationRecord ? pickFirstString(locationRecord, ["region", "district"]) : null);
  const city =
    pickFirstString(itemRecord, ["city", "town", "locality"]) ??
    (locationRecord ? pickFirstString(locationRecord, ["city", "town", "locality"]) : null);
  const locationName =
    pickFirstString(itemRecord, ["location_name", "locationName", "area", "place"]) ??
    (locationRecord ? pickFirstString(locationRecord, ["name", "label"]) : null);

  const lat =
    pickFirstNumber(itemRecord, ["lat", "latitude"]) ??
    (locationRecord ? pickFirstNumber(locationRecord, ["lat", "latitude"]) : null);
  const lng =
    pickFirstNumber(itemRecord, ["lng", "lon", "longitude"]) ??
    (locationRecord ? pickFirstNumber(locationRecord, ["lng", "lon", "longitude"]) : null);

  const publishedAt = parsePublishedAt(itemRecord);

  const explicitExternalId = pickFirstString(itemRecord, [
    "external_id",
    "externalId",
    "id",
    "guid",
    "identifier",
    "alertId",
  ]);

  const roundedPublishedAt = toRoundedMinuteIso(publishedAt);
  const fallbackExternalId = createFingerprint([input.sourceSlug, title, city, alertType, roundedPublishedAt]).slice(
    0,
    64,
  );

  const normalized = alertInsertSchema.safeParse({
    source_id: input.sourceId,
    external_id: truncate(explicitExternalId ?? fallbackExternalId, 128),
    title: truncate(title, 300),
    message: message ? truncate(message, 4000) : null,
    alert_type: truncate(alertType, 80),
    severity: normalizeSeverity(severityRaw),
    status: normalizeStatus(statusRaw),
    country: truncate(country.toUpperCase(), 2),
    region: region ? truncate(region, 120) : null,
    city: city ? truncate(city, 120) : null,
    location_name: locationName ? truncate(locationName, 160) : null,
    lat: lat !== null && lng !== null ? lat : null,
    lng: lat !== null && lng !== null ? lng : null,
    published_at: publishedAt,
    raw_payload: rawItem,
  });

  if (!normalized.success) {
    return null;
  }

  return normalized.data;
}
