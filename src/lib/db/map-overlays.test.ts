import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { MapOverlayFixtures } from "@/lib/schemas/map-overlays";
import {
  getMapOverlays,
  hasMapOverlayData,
  mapHospitalRowsToOverlays,
  mapRoadClosureRowsToOverlays,
  mapShelterRowsToOverlays,
} from "@/lib/db/map-overlays";

const mocks = vi.hoisted(() => {
  return {
    createSupabaseServerClient: vi.fn(),
    getMapOverlayFixtures: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock("@/lib/map/overlay-fixtures", () => ({
  getMapOverlayFixtures: mocks.getMapOverlayFixtures,
}));

type QueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

type OverlayQueryResults = {
  shelters: QueryResult;
  road_closures: QueryResult;
  hospitals: QueryResult;
};

function buildSupabaseClient(results: OverlayQueryResults) {
  return {
    from: vi.fn((tableName: string) => {
      const queryResult = results[tableName as keyof OverlayQueryResults];

      if (!queryResult) {
        throw new Error(`Unexpected table queried: ${tableName}`);
      }

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(queryResult),
      };

      return queryBuilder;
    }),
  };
}

const fixtureOverlays: MapOverlayFixtures = {
  shelters: [
    {
      id: "fixture-shelter-1",
      name: "Fixture Shelter",
      longitude: 34.7818,
      latitude: 32.0853,
      status: "open",
      region: "Center",
      city: "Tel Aviv",
      lastUpdatedAt: "2026-03-13T12:00:00.000+00:00",
    },
  ],
  roadClosures: [],
  hospitals: [],
};

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

describe("map overlay database mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNodeEnv("test");
    mocks.getMapOverlayFixtures.mockReturnValue(fixtureOverlays);
  });

  afterAll(() => {
    setNodeEnv(originalNodeEnv);
  });

  it("maps shelter rows and skips invalid records", () => {
    const overlays = mapShelterRowsToOverlays([
      {
        id: "2fd9d8c6-ab32-42b0-89d2-f476f3c402cf",
        external_id: "shelter-tel-aviv-1",
        name: "Tel Aviv Community Shelter A",
        status: "open",
        region: "Center",
        city: "Tel Aviv",
        lat: 32.0805,
        lng: 34.7804,
        last_updated_at: "2026-03-09T10:40:00.000+00:00",
      },
      {
        id: "7a15f9c2-17ec-479f-a5ee-2bc334c7de70",
        external_id: "shelter-invalid-status",
        name: "Invalid Shelter",
        status: "unknown",
        region: null,
        city: null,
        lat: 32.08,
        lng: 34.78,
        last_updated_at: "2026-03-09T10:40:00.000+00:00",
      },
    ]);

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      id: "shelter-tel-aviv-1",
      name: "Tel Aviv Community Shelter A",
      status: "open",
      city: "Tel Aviv",
    });
  });

  it("maps road closure rows and validates coordinates", () => {
    const overlays = mapRoadClosureRowsToOverlays([
      {
        id: "637f1f2f-e7f9-47a6-b5a9-ab271f6aeb94",
        external_id: "closure-ayalon-northbound",
        name: "Ayalon Northbound Closure",
        status: "active",
        reason: "Security operations",
        coordinates: [
          [34.7982, 32.0701],
          [34.8012, 32.0881],
        ],
        last_updated_at: "2026-03-09T10:42:00.000+00:00",
      },
      {
        id: "f87f70f6-47c2-4e3d-b739-c6a0a9727f52",
        external_id: "closure-invalid-coordinates",
        name: "Invalid coordinates",
        status: "active",
        reason: null,
        coordinates: [[34.7, 32.0]],
        last_updated_at: "2026-03-09T10:42:00.000+00:00",
      },
    ]);

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      id: "closure-ayalon-northbound",
      status: "active",
    });
    expect(overlays[0]?.coordinates).toHaveLength(2);
  });

  it("maps hospital rows and preserves emergency-room flag", () => {
    const overlays = mapHospitalRowsToOverlays([
      {
        id: "47d8c408-78bc-4874-84f5-f2bdd59540a8",
        external_id: "hospital-ichilov",
        name: "Ichilov Medical Center",
        status: "open",
        has_emergency_room: true,
        region: "Center",
        city: "Tel Aviv",
        lat: 32.0809,
        lng: 34.7811,
        last_updated_at: "2026-03-09T10:45:00.000+00:00",
      },
    ]);

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      id: "hospital-ichilov",
      hasEmergencyRoom: true,
    });
  });

  it("uses database overlays when at least one overlay set is non-empty", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue(
      buildSupabaseClient({
        shelters: {
          data: [
            {
              id: "5f1984f8-32be-4248-bc59-df1f9c9452fc",
              external_id: "shelter-tel-aviv-1",
              name: "Tel Aviv Community Shelter A",
              status: "open",
              region: "Center",
              city: "Tel Aviv",
              lat: 32.0805,
              lng: 34.7804,
              last_updated_at: "2026-03-09T10:40:00.000+00:00",
            },
          ],
          error: null,
        },
        road_closures: { data: [], error: null },
        hospitals: { data: [], error: null },
      }),
    );

    const overlays = await getMapOverlays();

    expect(hasMapOverlayData(overlays)).toBe(true);
    expect(overlays.shelters).toHaveLength(1);
    expect(mocks.getMapOverlayFixtures).not.toHaveBeenCalled();
  });

  it("falls back to fixtures when database overlays are empty", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue(
      buildSupabaseClient({
        shelters: { data: [], error: null },
        road_closures: { data: [], error: null },
        hospitals: { data: [], error: null },
      }),
    );

    const overlays = await getMapOverlays();

    expect(overlays).toEqual(fixtureOverlays);
    expect(mocks.getMapOverlayFixtures).toHaveBeenCalledTimes(1);
  });

  it("returns empty overlays in production when database fails", async () => {
    setNodeEnv("production");

    mocks.createSupabaseServerClient.mockResolvedValue(
      buildSupabaseClient({
        shelters: { data: null, error: { message: "boom" } },
        road_closures: { data: null, error: { message: "boom" } },
        hospitals: { data: null, error: { message: "boom" } },
      }),
    );

    const overlays = await getMapOverlays();

    expect(overlays).toEqual({
      shelters: [],
      roadClosures: [],
      hospitals: [],
    });
    expect(mocks.getMapOverlayFixtures).not.toHaveBeenCalled();
  });
});
