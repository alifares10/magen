import { getSourceHealthOverview } from "@/lib/db/feed";

const SOURCE_HEALTH_POLL_INTERVAL_MS = 60_000;

export async function GET() {
  try {
    const data = await getSourceHealthOverview();

    return Response.json({
      data,
      meta: {
        pollIntervalMs: SOURCE_HEALTH_POLL_INTERVAL_MS,
      },
    });
  } catch {
    return Response.json(
      {
        error: "Failed to load source health",
      },
      { status: 500 },
    );
  }
}
