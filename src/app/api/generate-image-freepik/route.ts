const FREEPIK_GENERATE_IMAGE_URL =
  "https://api.freepik.com/v1/ai/text-to-image";

type GenerateImageRequestBody = {
  prompt?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateImageRequestBody;
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return Response.json(
        { error: "Missing required field: prompt" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FREEPIK_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "FREEPIK_API_KEY is not configured" },
        { status: 500 }
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
      return Response.json(
        {
          error: "freepik request failed",
          status: upstreamResponse.status,
          details: data,
        },
        { status: upstreamResponse.status }
      );
    }

    return Response.json({ provider: "freepik", data }, { status: 200 });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
