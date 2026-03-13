import { parseLimitParam } from "@/lib/api/params";
import { getActiveStreams } from "@/lib/db/feed";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimitParam(searchParams.get("limit"), {
      defaultValue: 3,
      max: 10,
    });

    const data = await getActiveStreams(limit);

    return Response.json({
      data,
      meta: {
        count: data.length,
        limit,
      },
    });
  } catch {
    return Response.json(
      {
        error: "Failed to load live streams",
      },
      { status: 500 },
    );
  }
}
