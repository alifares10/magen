import {
  mapOverlayFixturesSchema,
  type MapOverlayFixtures,
} from "@/lib/schemas/map-overlays";

const emptyOverlayFixtures: MapOverlayFixtures = {
  shelters: [],
  roadClosures: [],
  hospitals: [],
};

const rawMapOverlayFixtures: unknown = {
  shelters: [
    {
      id: "shelter-tel-aviv-1",
      name: "Tel Aviv Community Shelter A",
      longitude: 34.7804,
      latitude: 32.0805,
      status: "open",
      region: "Center",
      city: "Tel Aviv",
      lastUpdatedAt: "2026-03-09T10:40:00.000+00:00",
    },
    {
      id: "shelter-haifa-1",
      name: "Haifa Public Shelter North",
      longitude: 34.9896,
      latitude: 32.8071,
      status: "limited",
      region: "North",
      city: "Haifa",
      lastUpdatedAt: "2026-03-09T10:35:00.000+00:00",
    },
    {
      id: "shelter-beer-sheva-1",
      name: "Beer Sheva School Shelter",
      longitude: 34.7915,
      latitude: 31.253,
      status: "open",
      region: "South",
      city: "Beer Sheva",
      lastUpdatedAt: "2026-03-09T10:30:00.000+00:00",
    },
  ],
  roadClosures: [
    {
      id: "closure-ayalon-northbound",
      name: "Ayalon Northbound Closure",
      status: "active",
      reason: "Security operations",
      coordinates: [
        [34.7982, 32.0701],
        [34.8012, 32.0881],
        [34.8043, 32.1062],
      ],
      lastUpdatedAt: "2026-03-09T10:42:00.000+00:00",
    },
    {
      id: "closure-route-40-south",
      name: "Route 40 South Segment",
      status: "partial",
      reason: "Emergency response access",
      coordinates: [
        [34.8124, 31.361],
        [34.8048, 31.3262],
        [34.7965, 31.2914],
      ],
      lastUpdatedAt: "2026-03-09T10:20:00.000+00:00",
    },
  ],
  hospitals: [
    {
      id: "hospital-ichilov",
      name: "Ichilov Medical Center",
      longitude: 34.7811,
      latitude: 32.0809,
      status: "open",
      hasEmergencyRoom: true,
      region: "Center",
      city: "Tel Aviv",
      lastUpdatedAt: "2026-03-09T10:45:00.000+00:00",
    },
    {
      id: "hospital-rambam",
      name: "Rambam Health Care Campus",
      longitude: 34.9899,
      latitude: 32.8329,
      status: "limited",
      hasEmergencyRoom: true,
      region: "North",
      city: "Haifa",
      lastUpdatedAt: "2026-03-09T10:37:00.000+00:00",
    },
    {
      id: "hospital-soroka",
      name: "Soroka Medical Center",
      longitude: 34.7993,
      latitude: 31.2609,
      status: "open",
      hasEmergencyRoom: true,
      region: "South",
      city: "Beer Sheva",
      lastUpdatedAt: "2026-03-09T10:33:00.000+00:00",
    },
  ],
};

export function getMapOverlayFixtures(): MapOverlayFixtures {
  const parsedFixtures = mapOverlayFixturesSchema.safeParse(rawMapOverlayFixtures);

  if (!parsedFixtures.success) {
    return emptyOverlayFixtures;
  }

  return parsedFixtures.data;
}
