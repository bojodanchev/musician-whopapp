import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, duration } = (await req.json()) as { prompt: string; duration: number };
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return new Response("Missing key", { status: 500 });
  const resp = await fetch("https://api.elevenlabs.io/v1/music/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
    body: JSON.stringify({ prompt, music_length_ms: Math.max(10000, Math.min(120000, (duration || 30) * 1000)) }),
  });
  return new Response(resp.body, { headers: { "Content-Type": resp.headers.get("Content-Type") || "audio/mpeg" } });
}


