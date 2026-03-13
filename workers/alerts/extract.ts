import { createFingerprint } from "../../src/lib/ingestion/dedupe";

function compactText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted.length > 0 ? compacted : null;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => compactText(entry)).filter((entry): entry is string => Boolean(entry));
}

function createLocationExternalId(eventId: string, location: string): string {
  const locationFingerprint = createFingerprint([location]).slice(0, 16);
  return `${eventId}:${locationFingerprint}`;
}

function extractOrefLocationItems(record: Record<string, unknown>): unknown[] {
  const eventId = compactText(record.id);
  const title = compactText(record.title);
  const category = compactText(record.cat);
  const description = compactText(record.desc);
  const locations = getStringArray(record.data);

  if (!eventId || !title || locations.length === 0) {
    return [];
  }

  return locations.map((location) => ({
    external_id: createLocationExternalId(eventId, location),
    oref_event_id: eventId,
    title,
    desc: description,
    cat: category,
    city: location,
    location_name: location,
    source_format: "oref_alerts_v1",
    locations_count: locations.length,
  }));
}

function isOrefPayload(record: Record<string, unknown>): boolean {
  const eventId = compactText(record.id);
  const title = compactText(record.title);
  return Boolean(eventId && title && Array.isArray(record.data));
}

export function parseOfficialAlertsBody(bodyText: string): unknown {
  const normalizedBody = bodyText.replace(/^\uFEFF/, "").trim();

  if (!normalizedBody) {
    return [];
  }

  try {
    return JSON.parse(normalizedBody);
  } catch {
    throw new Error("Official alerts feed must return JSON payload");
  }
}

export function extractRawAlertItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = getRecord(payload);

  if (!record) {
    return [];
  }

  if (isOrefPayload(record)) {
    return extractOrefLocationItems(record);
  }

  for (const key of ["alerts", "items", "data", "results", "events"]) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  if (
    typeof record.title === "string" ||
    typeof record.message === "string" ||
    typeof record.alert_type === "string" ||
    typeof record.type === "string"
  ) {
    return [record];
  }

  return [];
}
