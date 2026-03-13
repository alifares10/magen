import { z } from "zod";
import { createFingerprint } from "../../src/lib/ingestion/dedupe";
import { officialUpdateInsertSchema, type OfficialUpdateInsert } from "../../src/lib/schemas/official-update";

const rawOfficialUpdateItemSchema = z.object({}).passthrough();

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

function pickFirstIdentifier(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    const asText = compactText(value);

    if (asText) {
      return asText;
    }
  }

  return null;
}

function pickFirstBoolean(record: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "1", "yes", "active", "enabled"].includes(normalized)) {
        return true;
      }

      if (["false", "0", "no", "inactive", "disabled"].includes(normalized)) {
        return false;
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
    "time",
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

function toRoundedMinuteIso(isoDate: string): string {
  const date = new Date(isoDate);
  date.setUTCSeconds(0, 0);
  return date.toISOString();
}

function normalizeSeverity(value: string | null): "low" | "medium" | "high" | "critical" | null {
  const normalized = value?.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (["critical", "severe", "extreme", "emergency", "red"].includes(normalized)) {
    return "critical";
  }

  if (["high", "warning", "urgent"].includes(normalized)) {
    return "high";
  }

  if (["medium", "moderate"].includes(normalized)) {
    return "medium";
  }

  if (["low", "minor", "info", "advisory"].includes(normalized)) {
    return "low";
  }

  return null;
}

function normalizeIsActive(record: Record<string, unknown>): boolean {
  const explicit = pickFirstBoolean(record, ["is_active", "isActive", "active", "enabled"]);

  if (explicit !== null) {
    return explicit;
  }

  const status = pickFirstString(record, ["status", "state"]);
  const normalizedStatus = status?.toLowerCase();

  if (!normalizedStatus) {
    return true;
  }

  if (["cancelled", "canceled", "resolved", "expired", "ended", "archived", "inactive"].includes(normalizedStatus)) {
    return false;
  }

  return true;
}

function hasMinimumSignal(record: Record<string, unknown>): boolean {
  return Boolean(
    pickFirstString(record, [
      "title",
      "headline",
      "subject",
      "name",
      "body",
      "message",
      "content",
      "description",
      "type",
      "update_type",
      "updateType",
      "guidance_type",
      "guidanceType",
    ]),
  );
}

export function normalizeOfficialUpdateItem(input: {
  sourceId: string;
  sourceSlug: string;
  rawItem: unknown;
}): OfficialUpdateInsert | null {
  const parsedRawItem = rawOfficialUpdateItemSchema.safeParse(input.rawItem);

  if (!parsedRawItem.success) {
    return null;
  }

  const rawItem = parsedRawItem.data;
  const itemRecord = getRecord(rawItem);

  if (!itemRecord || !hasMinimumSignal(itemRecord)) {
    return null;
  }

  const title =
    pickFirstString(itemRecord, ["title", "headline", "subject", "name", "guidanceTitle"]) ?? "Official guidance";
  const body =
    pickFirstString(itemRecord, ["body", "message", "content", "description", "text", "instruction", "guidance"]) ??
    title;
  const updateType =
    pickFirstString(itemRecord, ["update_type", "updateType", "guidance_type", "guidanceType", "type", "category"]) ??
    "general";
  const severity = normalizeSeverity(
    pickFirstString(itemRecord, ["severity", "risk_level", "riskLevel", "priority"]),
  );
  const country = pickFirstString(itemRecord, ["country", "country_code", "countryCode"]) ?? "IL";
  const region = pickFirstString(itemRecord, ["region", "district", "area"]);
  const publishedAt = parsePublishedAt(itemRecord);
  const isActive = normalizeIsActive(itemRecord);

  const explicitExternalId = pickFirstIdentifier(itemRecord, [
    "external_id",
    "externalId",
    "id",
    "guid",
    "identifier",
    "updateId",
    "guidanceId",
  ]);

  const fallbackExternalId = createFingerprint([
    input.sourceSlug,
    title,
    updateType,
    region,
    toRoundedMinuteIso(publishedAt),
  ]).slice(0, 64);

  const normalized = officialUpdateInsertSchema.safeParse({
    source_id: input.sourceId,
    external_id: truncate(explicitExternalId ?? fallbackExternalId, 128),
    title: truncate(title, 300),
    body: truncate(body, 8000),
    update_type: truncate(updateType, 80),
    severity,
    country: truncate(country.toUpperCase(), 2),
    region: region ? truncate(region, 120) : null,
    published_at: publishedAt,
    is_active: isActive,
    raw_payload: rawItem,
  });

  if (!normalized.success) {
    return null;
  }

  return normalized.data;
}
