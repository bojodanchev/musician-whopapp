import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { verifyWhopFromRequest } from "@/lib/auth";
import { getStorage } from "@/lib/storage/s3";

export async function POST(req: NextRequest, ctx: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await ctx.params;

    // Verify ownership
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
    const asset = await prisma.asset.findFirst({ where: { id: assetId, userId }, include: { user: true } });
    if (!asset) return new Response("NOT_FOUND", { status: 404 });

    const licenseTxt = `Audio generated via ElevenLabs Music. Commercial use permitted under your active plan (${asset.user.plan}). Do not prompt artist names or copyrighted lyrics. Generated at ${new Date().toISOString()}.`;
    const storage = getStorage();
    await storage.putObject({ key: asset.licenseUrl, contentType: "text/plain", body: licenseTxt });
    const signed = await storage.getSignedUrl({ key: asset.licenseUrl, method: "GET", expiresInSeconds: 120 });

    // Stream the license file with proper attachment headers
    const resp = await fetch(signed.url);
    if (!resp.ok || !resp.body) return new Response("UPSTREAM_ERROR", { status: 502 });

    const filenameBase = (asset.title || "license").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 64);
    const filename = `${filenameBase}_license.txt`;

    return new Response(resp.body, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(msg, { status: 400 });
  }
}

