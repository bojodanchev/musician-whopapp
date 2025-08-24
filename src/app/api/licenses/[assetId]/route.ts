import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage/s3";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await ctx.params;
  const prisma = getPrisma();
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, include: { user: true } });
  if (!asset) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const storage = getStorage();

  const licenseTxt = `Audio generated via ElevenLabs Music. Commercial use permitted under your active plan (${asset.user.plan}). Do not prompt artist names or copyrighted lyrics. Generated at ${new Date().toISOString()}.`;
  await storage.putObject({ key: asset.licenseUrl, contentType: "text/plain", body: licenseTxt });
  const signed = await storage.getSignedUrl({ key: asset.licenseUrl, method: "GET", expiresInSeconds: 120 });
  return NextResponse.json({ licenseTxtUrl: signed.url });
}

