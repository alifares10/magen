import { createHash } from "node:crypto";

const trackingQueryParams = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "utm_campaign",
  "utm_content",
  "utm_id",
  "utm_medium",
  "utm_name",
  "utm_source",
  "utm_term",
]);

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function removeTrackingParams(url: URL) {
  const params = new URLSearchParams(url.search);

  for (const key of [...params.keys()]) {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey.startsWith("utm_") || trackingQueryParams.has(normalizedKey)) {
      params.delete(key);
    }
  }

  const sorted = new URLSearchParams([...params.entries()].sort(([a], [b]) => a.localeCompare(b)));
  const search = sorted.toString();
  url.search = search ? `?${search}` : "";
}

export function canonicalizeUrl(rawUrl: string): string | null {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    removeTrackingParams(url);

    return url.toString();
  } catch {
    return null;
  }
}

export function createFingerprint(parts: Array<string | null | undefined>): string {
  const normalized = parts
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalizeText(value).toLowerCase())
    .join("|");

  return createHash("sha256").update(normalized).digest("hex");
}
