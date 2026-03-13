import { parseBooleanParam, parseLimitParam } from "@/lib/api/params";
import { getOfficialUpdatesFeed } from "@/lib/db/feed";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimitParam(searchParams.get("limit"), {
      defaultValue: 20,
      max: 100,
    });
    const activeOnly = parseBooleanParam(searchParams.get("activeOnly"), true);

    const data = await getOfficialUpdatesFeed({ limit, activeOnly });

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
        error: "Failed to load official updates feed",
      },
      { status: 500 },
    );
  }
}
