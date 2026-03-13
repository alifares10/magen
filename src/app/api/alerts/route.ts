import { getAlertsFeed } from "@/lib/db/feed";
import { parseLimitParam } from "@/lib/api/params";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimitParam(searchParams.get("limit"), {
      defaultValue: 20,
      max: 100,
    });

    const data = await getAlertsFeed({ limit });

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
        error: "Failed to load alerts feed",
      },
      { status: 500 },
    );
  }
}
