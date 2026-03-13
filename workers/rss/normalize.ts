import { z } from "zod";
import { createFingerprint, canonicalizeUrl } from "../../src/lib/ingestion/dedupe";
import { newsItemInsertSchema, type NewsItemInsert } from "../../src/lib/schemas/news-item";

const rssRawItemSchema = z
  .object({
    title: z.string().optional(),
    link: z.string().optional(),
    guid: z.string().optional(),
    isoDate: z.string().optional(),
    pubDate: z.string().optional(),
    contentSnippet: z.string().optional(),
    content: z.string().optional(),
    summary: z.string().optional(),
    creator: z.string().optional(),
    author: z.string().optional(),
    categories: z.array(z.string()).optional(),
    enclosure: z
      .object({
        url: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

function compactText(value?: string): string | null {
  if (!value) {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted.length > 0 ? compacted : null;
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function parsePublishedAt(item: z.infer<typeof rssRawItemSchema>): string {
  const candidate = item.isoDate ?? item.pubDate;

  if (!candidate) {
    return new Date().toISOString();
  }

  const date = new Date(candidate);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function deriveTitle(item: z.infer<typeof rssRawItemSchema>, canonicalUrl: string): string {
  const title = compactText(item.title);

  if (title) {
    return truncate(title, 300);
  }

  try {
    const url = new URL(canonicalUrl);
    const pathTail = url.pathname.split("/").filter(Boolean).at(-1);

    if (pathTail) {
      return truncate(pathTail.replace(/[-_]+/g, " "), 300);
    }
  } catch {
    return "Untitled";
  }

  return "Untitled";
}

function getImageUrl(item: z.infer<typeof rssRawItemSchema>): string | null {
  const enclosureUrl = item.enclosure?.url;
  if (!enclosureUrl) {
    return null;
  }

  return canonicalizeUrl(enclosureUrl);
}

export function normalizeRssItem(input: {
  sourceId: string;
  sourceSlug: string;
  rawItem: unknown;
}): NewsItemInsert | null {
  const parsedRawItem = rssRawItemSchema.safeParse(input.rawItem);

  if (!parsedRawItem.success) {
    return null;
  }

  const rawItem = parsedRawItem.data;
  const canonicalUrl = canonicalizeUrl(rawItem.link ?? "");

  if (!canonicalUrl) {
    return null;
  }

  const summary = compactText(rawItem.contentSnippet ?? rawItem.summary ?? rawItem.content);
  const author = compactText(rawItem.creator ?? rawItem.author);
  const topic = rawItem.categories?.map(compactText).find((value): value is string => Boolean(value)) ?? null;

  const normalized = newsItemInsertSchema.safeParse({
    source_id: input.sourceId,
    external_id: createFingerprint([input.sourceSlug, rawItem.guid ?? canonicalUrl]).slice(0, 64),
    title: deriveTitle(rawItem, canonicalUrl),
    summary: summary ? truncate(summary, 1600) : null,
    url: canonicalUrl,
    author,
    topic,
    region: null,
    country: "IL",
    language: null,
    severity: null,
    published_at: parsePublishedAt(rawItem),
    image_url: getImageUrl(rawItem),
    is_breaking: false,
    raw_payload: rawItem,
  });

  if (!normalized.success) {
    return null;
  }

  return normalized.data;
}
