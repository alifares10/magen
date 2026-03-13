import { z } from "zod";
import { mapAlertMarkerSchema, type MapAlertMarker } from "@/lib/schemas/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sourceNameSchema = z.object({
  name: z.string().min(1),
});

const rawAlertRowSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().nullable(),
  alert_type: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.string().min(1),
  region: z.string().nullable(),
  city: z.string().nullable(),
  location_name: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  published_at: z.string().datetime({ offset: true }),
  sources: z.union([sourceNameSchema, z.array(sourceNameSchema)]).nullable(),
});

function getSourceName(sourceField: z.infer<typeof rawAlertRowSchema>["sources"]): string | null {
  if (!sourceField) {
    return null;
  }

  if (Array.isArray(sourceField)) {
    return sourceField[0]?.name ?? null;
  }

  return sourceField.name;
}

export function mapAlertRowsToMarkers(rows: unknown[]): MapAlertMarker[] {
  const markers: MapAlertMarker[] = [];

  for (const row of rows) {
    const parsedRow = rawAlertRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const sourceName = getSourceName(parsedRow.data.sources);

    if (!sourceName || parsedRow.data.lat === null || parsedRow.data.lng === null) {
      continue;
    }

    const parsedMarker = mapAlertMarkerSchema.safeParse({
      id: parsedRow.data.id,
      sourceId: parsedRow.data.source_id,
      sourceName,
      title: parsedRow.data.title,
      message: parsedRow.data.message,
      alertType: parsedRow.data.alert_type,
      severity: parsedRow.data.severity,
      status: parsedRow.data.status,
      region: parsedRow.data.region,
      city: parsedRow.data.city,
      locationName: parsedRow.data.location_name,
      longitude: parsedRow.data.lng,
      latitude: parsedRow.data.lat,
      publishedAt: parsedRow.data.published_at,
    });

    if (parsedMarker.success) {
      markers.push(parsedMarker.data);
    }
  }

  return markers;
}

export async function getMapAlertMarkers(limit = 150): Promise<MapAlertMarker[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(
      "id, source_id, title, message, alert_type, severity, status, region, city, location_name, lat, lng, published_at, sources(name)",
    )
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return mapAlertRowsToMarkers(data);
}
