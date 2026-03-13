import { getAlertsFeed } from "@/lib/db/feed";
import { parseBooleanParam, parseLimitParam } from "@/lib/api/params";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimitParam(searchParams.get("limit"), {
      defaultValue: 20,
      max: 100,
    });
    const activeOnly = parseBooleanParam(searchParams.get("activeOnly"), false);

    const data = await getAlertsFeed({ limit, activeOnly });

    return Response.json({
      data,
      meta: {
        count: data.length,
        limit,
        activeOnly,
      },
    });
  } catch {
    return Response.json(
      {
        error: "Failed to load alerts feed",
      },
      { status: 500 },
    );
  }
}
