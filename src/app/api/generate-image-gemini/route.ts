const GEMINI_GENERATE_IMAGE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const upstreamResponse = await fetch(
      `${GEMINI_GENERATE_IMAGE_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
        cache: "no-store",
      }
    );

    const data = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      return Response.json(
        {
          error: "gemini request failed",
          status: upstreamResponse.status,
          details: data,
        },
        { status: upstreamResponse.status }
      );
    }

    return Response.json({ provider: "gemini", data }, { status: 200 });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
