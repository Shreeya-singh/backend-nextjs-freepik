"use client";

import { FormEvent, useState } from "react";

type ImageFormState = {
  prompt: string;
};

const Page = () => {
  const [formData, setFormData] = useState<ImageFormState>({ prompt: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const looksLikeBase64 = (value: string): boolean => {
    if (value.length < 80) return false;
    return /^[A-Za-z0-9+/=\r\n]+$/.test(value);
  };

  const findImageSrc = (value: unknown): string | null => {
    if (!value) return null;

    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (
        normalized.startsWith("http://") ||
        normalized.startsWith("https://")
      ) {
        return value;
      }
      if (normalized.startsWith("data:image/")) {
        return value;
      }
      if (looksLikeBase64(value)) {
        return `data:image/png;base64,${value.replace(/\s/g, "")}`;
      }
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = findImageSrc(item);
        if (nested) return nested;
      }
      return null;
    }

    if (typeof value === "object") {
      for (const nestedValue of Object.values(value as Record<string, unknown>)) {
        const nested = findImageSrc(nestedValue);
        if (nested) return nested;
      }
    }

    return null;
  };

  const generateImage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const prompt = formData.prompt.trim();
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        setImageUrl(null);
        setError("Image generation failed. Try another prompt.");
        return;
      }

      const parsedImageSrc = findImageSrc(data);
      if (!parsedImageSrc) {
        setImageUrl(null);
        setError("Image generated, but response had no usable image data.");
        return;
      }

      setImageUrl(parsedImageSrc);
    } catch {
      setImageUrl(null);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <section className="mx-auto w-full max-w-2xl space-y-6 border border-white p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Image Generator</h1>
          <p className="text-sm text-white/80">Enter prompt and generate image.</p>
        </div>

        <form onSubmit={generateImage} className="space-y-3">
          <label htmlFor="prompt" className="text-sm font-medium">
            Prompt
          </label>
          <div className="flex gap-2">
            <input
              id="prompt"
              type="text"
              name="prompt"
              placeholder="A futuristic city floating above clouds"
              value={formData.prompt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, prompt: e.target.value }))
              }
              className="w-full border border-white bg-black px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="border border-white bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>

        {error && (
          <p className="border border-white px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <h2 className="text-sm font-medium">Result</h2>
          <div className="overflow-hidden border border-white bg-black">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={formData.prompt || "Generated image"}
                className="h-auto w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center px-4 text-center text-sm text-white/70">
                Your generated image will appear here.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;