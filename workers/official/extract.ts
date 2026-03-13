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

function extractOrefFeaturedNewsItems(record: Record<string, unknown>): unknown[] {
  const content = record.content;

  if (!Array.isArray(content)) {
    return [];
  }

  const items: unknown[] = [];

  for (const contentEntry of content) {
    const contentRecord = getRecord(contentEntry);

    if (!contentRecord) {
      continue;
    }

    const featuredRecord = getRecord(contentRecord.newsListFeatured);

    if (!featuredRecord) {
      continue;
    }

    const featuredTitle = compactText(featuredRecord.title);
    const allUpdatesUrl = compactText(featuredRecord.allUpdatesUrl);
    const newsItems = featuredRecord.newsItems;

    if (!Array.isArray(newsItems)) {
      continue;
    }

    for (const entry of newsItems) {
      const entryRecord = getRecord(entry);

      if (!entryRecord) {
        continue;
      }

      items.push({
        ...entryRecord,
        update_type: "featured_news",
        source_format: "oref_home_heb_v1",
        source_section_title: featuredTitle,
        source_section_url: allUpdatesUrl,
      });
    }
  }

  return items;
}

function isOrefHomePayload(record: Record<string, unknown>): boolean {
  return Array.isArray(record.content) && typeof record.subtitle === "string";
}

export function parseOfficialGuidanceBody(bodyText: string): unknown {
  const normalizedBody = bodyText.replace(/^\uFEFF/, "").trim();

  if (!normalizedBody) {
    return [];
  }

  try {
    return JSON.parse(normalizedBody);
  } catch {
    throw new Error("Official guidance feed must return JSON payload");
  }
}

export function extractRawGuidanceItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = getRecord(payload);

  if (!record) {
    return [];
  }

  if (isOrefHomePayload(record)) {
    return extractOrefFeaturedNewsItems(record);
  }

  for (const key of ["updates", "items", "data", "results", "events", "guidance"]) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  if (
    typeof record.title === "string" ||
    typeof record.body === "string" ||
    typeof record.message === "string" ||
    typeof record.update_type === "string" ||
    typeof record.type === "string"
  ) {
    return [record];
  }

  return [];
}
