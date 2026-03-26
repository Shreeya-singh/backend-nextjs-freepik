const FREEPIK_GENERATE_IMAGE_URL = "https://api.freepik.com/v1/ai/text-to-image";

type GenerateImageRequestBody = {
  prompt?: string;
};

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = new Set([
    "https://www.reddit.com",
    "https://reddit.com",
  ]);

  // for dev/testing, easiest:
  const allowOrigin = allowedOrigins.has(origin) ? origin : "https://www.reddit.com";
  // If you want simplest possible, replace with: const allowOrigin = "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const body = (await req.json()) as GenerateImageRequestBody;
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing required field: prompt" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const apiKey = process.env.FREEPIK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "FREEPIK_API_KEY is not configured" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const upstreamResponse = await fetch(FREEPIK_GENERATE_IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": apiKey,
      },
      body: JSON.stringify({ prompt }),
      cache: "no-store",
    });

    const data = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Freepik request failed",
          status: upstreamResponse.status,
          details: data,
        }),
        {
          status: upstreamResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}