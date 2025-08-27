import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { verifyWhopFromRequest } from "@/lib/auth";
import { getStorage } from "@/lib/storage/s3";

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      const v = await verifyWhopFromRequest(req);
      userId = v.userId;
    } catch {}
    if (!userId) {
      // fallback to cookie set on compose
      const uid = cookies().get("musician_uid")?.value;
      if (uid) userId = uid;
    }
    if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const prisma = getPrisma();
    const assets = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
    const storage = getStorage();
    const out = await Promise.all(assets.map(async (a) => {
      const wav = await storage.getSignedUrl({ key: a.wavUrl, method: "GET" });
      const loop = await storage.getSignedUrl({ key: a.loopUrl, method: "GET" });
      return { id: a.id, title: a.title, bpm: a.bpm, key: a.key, duration: a.duration, wavUrl: wav.url, loopUrl: loop.url, createdAt: a.createdAt };
    }));
    return NextResponse.json({ assets: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}


