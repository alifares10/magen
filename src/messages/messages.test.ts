import enMessages from "@/messages/en.json";
import heMessages from "@/messages/he.json";

function flattenMessageKeys(
  input: Record<string, unknown>,
  prefix = "",
): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenMessageKeys(value as Record<string, unknown>, nextKey));
      continue;
    }

    keys.push(nextKey);
  }

  return keys;
}

describe("message catalog parity", () => {
  it("keeps English and Hebrew message keys in sync", () => {
    const enKeys = new Set(flattenMessageKeys(enMessages));
    const heKeys = new Set(flattenMessageKeys(heMessages));

    const missingInHebrew = [...enKeys].filter((key) => !heKeys.has(key));
    const extraInHebrew = [...heKeys].filter((key) => !enKeys.has(key));

    expect(missingInHebrew).toEqual([]);
    expect(extraInHebrew).toEqual([]);
  });
});
