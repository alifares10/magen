import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { mapPlaceFeaturePropertiesSchema } from "@/lib/schemas/map-places";

const datasetSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(z.object({
    type: z.literal("Feature"),
    properties: mapPlaceFeaturePropertiesSchema,
    geometry: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([
        z.number().gte(-180).lte(180),
        z.number().gte(-90).lte(90),
      ]),
    }),
  })).min(1),
});

const rawDataset: unknown = JSON.parse(readFileSync(
  path.resolve(process.cwd(), "public/data/israel-places.geojson"),
  "utf8",
));

describe("place-picker dataset", () => {
  it("provides valid selectable points with unique IDs and Hebrew labels", () => {
    const { features } = datasetSchema.parse(rawDataset);
    const ids = features.map(({ properties }) => properties.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(features.filter(({ properties }) => !/[\u05d0-\u05ea]/u.test(properties.nameHe)))
      .toEqual([]);
  });

  it.each([
    ["geonames-281184", "ירושלים"],
    ["geonames-293397", "תל אביב"],
    ["geonames-294634", "ג׳לג׳וליה"],
    ["geonames-293837", "קריית היובל"],
    ["geonames-10227184", "יהוד-מונוסון"],
    ["geonames-294421", "לוד"],
  ])("uses the current Hebrew label for %s", (id, expectedName) => {
    const { features } = datasetSchema.parse(rawDataset);

    expect(features.find(({ properties }) => properties.id === id)?.properties.nameHe)
      .toBe(expectedName);
  });

  it("keeps Yagur distinct from the historical Yajur record", () => {
    const { features } = datasetSchema.parse(rawDataset);

    expect(features.find(({ properties }) => properties.id === "geonames-293248")?.properties.nameHe)
      .toBe("יגור");
    expect(features.some(({ properties }) => properties.id === "geonames-293243"))
      .toBe(false);
  });
});
