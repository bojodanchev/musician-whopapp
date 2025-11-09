import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { verifyWhopFromRequest } from "@/lib/auth";
import { getStorage } from "@/lib/storage/s3";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    let userId: string | null = null;
    try {
      const v = await verifyWhopFromRequest(req);
      userId = v.userId;
    } catch {}
    if (!userId) {
      const store = await cookies();
      userId = store.get("musician_uid")?.value ?? null;
    }
    if (!userId) return new Response("UNAUTHENTICATED", { status: 401 });

    const prisma = getPrisma();
    const asset = await prisma.asset.findFirst({ where: { id, userId } });
    if (!asset) return new Response("NOT_FOUND", { status: 404 });

    const url = new URL(req.url);
    const requested = url.searchParams.get("type") ?? "wav";
    let type: "wav" | "loop" | "stems" = "wav";
    if (requested === "loop") type = "loop";
    if (requested === "stems") type = "stems";
    const key = type === "wav" ? asset.wavUrl : type === "loop" ? asset.loopUrl : asset.stemsZipUrl;
    if (!key) return new Response("NOT_FOUND", { status: 404 });

    const storage = getStorage();
    const signed = await storage.getSignedUrl({ key, method: "GET" });
    const resp = await fetch(signed.url);
    if (!resp.ok || !resp.body) return new Response("UPSTREAM_ERROR", { status: 502 });

    const filenameBase = (asset.title || "musician").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 64);
    const ext = type === "stems" ? "zip" : key.endsWith(".mp3") ? "mp3" : key.endsWith(".wav") ? "wav" : "audio";
    const filename = `${filenameBase}_${type}.${ext}`;

    return new Response(resp.body, {
      headers: {
        "Content-Type": type === "stems" ? "application/zip" : resp.headers.get("Content-Type") || "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 400 });
  }
}

