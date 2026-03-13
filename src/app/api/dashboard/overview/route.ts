import { parseLimitParam } from "@/lib/api/params";
import { getDashboardOverview } from "@/lib/db/feed";
import { dashboardOverviewRequestBodySchema } from "@/lib/schemas/api-responses";

function getOverviewLimits(searchParams: URLSearchParams) {
  const newsLimit = parseLimitParam(searchParams.get("newsLimit"), {
    defaultValue: 5,
    max: 20,
  });
  const streamLimit = parseLimitParam(searchParams.get("streamLimit"), {
    defaultValue: 3,
    max: 10,
  });

  return {
    newsLimit,
    streamLimit,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { newsLimit, streamLimit } = getOverviewLimits(searchParams);

    const data = await getDashboardOverview({ newsLimit, streamLimit });

    return Response.json({
      data,
      meta: {
        newsLimit,
        streamLimit,
      },
    });
  } catch {
    return Response.json(
      {
        error: "Failed to load dashboard overview",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { newsLimit, streamLimit } = getOverviewLimits(searchParams);

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return Response.json(
        {
          error: "Invalid dashboard overview request body",
        },
        { status: 400 },
      );
    }

    const parsedBody = dashboardOverviewRequestBodySchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return Response.json(
        {
          error: "Invalid dashboard overview request body",
        },
        { status: 400 },
      );
    }

    const data = await getDashboardOverview({
      newsLimit,
      streamLimit,
      watchedLocations: parsedBody.data.watchedLocations,
    });

    return Response.json({
      data,
      meta: {
        newsLimit,
        streamLimit,
        watchedLocationsCount: parsedBody.data.watchedLocations.length,
      },
    });
  } catch {
    return Response.json(
      {
        error: "Failed to load dashboard overview",
      },
      { status: 500 },
    );
  }
}
