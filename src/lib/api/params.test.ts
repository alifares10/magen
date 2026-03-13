import { describe, expect, it } from "vitest";
import { parseBooleanParam, parseLimitParam } from "@/lib/api/params";

describe("parseLimitParam", () => {
  it("uses default value for missing or invalid params", () => {
    expect(parseLimitParam(null, { defaultValue: 20, max: 100 })).toBe(20);
    expect(parseLimitParam("abc", { defaultValue: 20, max: 100 })).toBe(20);
  });

  it("clamps values to min and max", () => {
    expect(parseLimitParam("0", { defaultValue: 20, max: 100 })).toBe(1);
    expect(parseLimitParam("300", { defaultValue: 20, max: 100 })).toBe(100);
    expect(parseLimitParam("5", { defaultValue: 20, max: 100, min: 3 })).toBe(5);
  });
});

describe("parseBooleanParam", () => {
  it("parses true and false variants", () => {
    expect(parseBooleanParam("true", false)).toBe(true);
    expect(parseBooleanParam("1", false)).toBe(true);
    expect(parseBooleanParam("false", true)).toBe(false);
    expect(parseBooleanParam("0", true)).toBe(false);
  });

  it("falls back to default for unknown values", () => {
    expect(parseBooleanParam(null, true)).toBe(true);
    expect(parseBooleanParam("maybe", false)).toBe(false);
  });
});
