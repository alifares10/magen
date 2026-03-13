import { describe, expect, it } from "vitest";
import { canonicalizeUrl, createFingerprint } from "@/lib/ingestion/dedupe";

describe("canonicalizeUrl", () => {
  it("removes known tracking params and hash", () => {
    const result = canonicalizeUrl(
      "https://Example.com/news/story/?utm_source=x&foo=1&utm_campaign=y#section",
    );

    expect(result).toBe("https://example.com/news/story?foo=1");
  });

  it("returns null for invalid urls", () => {
    expect(canonicalizeUrl("not-a-url")).toBeNull();
  });
});

describe("createFingerprint", () => {
  it("is stable for equivalent values", () => {
    const first = createFingerprint([" Source ", "Hello  World"]);
    const second = createFingerprint(["source", "hello world"]);

    expect(first).toBe(second);
  });
});
