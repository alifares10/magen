import { describe, expect, it } from "vitest";
import { getMapOverlayFixtures } from "@/lib/map/overlay-fixtures";
import { mapOverlayFixturesSchema } from "@/lib/schemas/map-overlays";

describe("getMapOverlayFixtures", () => {
  it("returns fixture overlays validated by schema", () => {
    const fixtures = getMapOverlayFixtures();

    expect(fixtures.shelters.length).toBeGreaterThan(0);
    expect(fixtures.roadClosures.length).toBeGreaterThan(0);
    expect(fixtures.hospitals.length).toBeGreaterThan(0);

    expect(mapOverlayFixturesSchema.safeParse(fixtures).success).toBe(true);
  });
});
