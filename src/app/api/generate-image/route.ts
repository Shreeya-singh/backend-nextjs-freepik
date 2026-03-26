const FREEPIK_GENERATE_IMAGE_URL =
  "https://api.freepik.com/v1/ai/text-to-image";

type GenerateImageRequestBody = {
  prompt?: string;
};

// ✅ 1. HANDLE PREFLIGHT (IMPORTANT)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // change in prod
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateImageRequestBody;
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    const apiKey = process.env.FREEPIK_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "FREEPIK_API_KEY is not configured" }),
        {
          status: 500,
          headers: corsHeaders(),
        }
      );
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
          headers: corsHeaders(),
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: corsHeaders(),
      }
    );
  }
}

// ✅ 2. REUSABLE CORS HEADERS
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // ⚠️ change in production
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}