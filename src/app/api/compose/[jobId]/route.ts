import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getMusicClient } from "@/lib/music/elevenlabs";
import { getStorage } from "@/lib/storage/s3";
import { normalizeLoudness, renderLoopVersion } from "@/lib/processing/audio";
import { zipBuffers } from "@/lib/processing/zip";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const prisma = getPrisma();
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const music = getMusicClient();
  const st = await music.getJob(jobId);

  if (st.status === "failed") {
    await prisma.job.update({ where: { id: jobId }, data: { status: "FAILED", error: st.error ?? "" } });
    return NextResponse.json({ error: st.error ?? "FAILED" }, { status: 500 });
  }

  if (st.status !== "completed") {
    return NextResponse.json({ status: st.status });
  }

  // Process and store assets
  const storage = getStorage();
  const assetsOut: Array<{ id: string; title: string; bpm: number; key: string | null; duration: number; wavUrl: string; loopUrl: string; stemsZipUrl?: string | null; licenseUrl: string }> = [];
  for (let i = 0; i < (st.assets?.length ?? 0); i++) {
    const a = st.assets![i];

    // Download actual audio from ElevenLabs
    const wavResp = await fetch(a.wavUrl);
    if (!wavResp.ok || !wavResp.body) {
      await prisma.job.update({ where: { id: jobId }, data: { status: "FAILED", error: `Failed to download asset ${i}: ${wavResp.status}` } });
      return NextResponse.json({ error: "ASSET_DOWNLOAD_FAILED" }, { status: 500 });
    }
    const wavBuffer = Buffer.from(await wavResp.arrayBuffer());

    const norm = await normalizeLoudness(wavBuffer);
    const looped = await renderLoopVersion(norm);

    const baseKey = `users/${job.userId}/jobs/${jobId}/take_${i + 1}`;
    await storage.putObject({ key: `${baseKey}.mp3`, contentType: "audio/mpeg", body: norm });
    await storage.putObject({ key: `${baseKey}_loop.mp3`, contentType: "audio/mpeg", body: looped });

    let stemsZipKey: string | undefined;
    if (a.stemsUrls?.length) {
      const stemBuffers = await Promise.all(
        a.stemsUrls.map(async (url, idx) => {
          const stemResp = await fetch(url);
          if (!stemResp.ok || !stemResp.body) throw new Error(`Failed to download stem ${idx}`);
          const data = Buffer.from(await stemResp.arrayBuffer());
          return { name: `stem_${idx + 1}.wav`, data };
        })
      );
      const zipBuf = await zipBuffers(stemBuffers);
      await storage.putObject({ key: `${baseKey}_stems.zip`, contentType: "application/zip", body: zipBuf });
      stemsZipKey = `${baseKey}_stems.zip`;
    }

    const asset = await prisma.asset.create({
      data: {
        userId: job.userId,
        jobId: job.id,
        title: `Track ${i + 1}`,
        bpm: (job.payloadJson as { bpm?: number }).bpm ?? 120,
        key: null,
        duration: (job.payloadJson as { duration?: number }).duration ?? 30,
        wavUrl: `${baseKey}.mp3`,
        loopUrl: `${baseKey}_loop.mp3`,
        stemsZipUrl: stemsZipKey,
        licenseUrl: `${baseKey}_license.txt`,
      },
    });
    assetsOut.push({ id: asset.id, title: asset.title, bpm: asset.bpm, key: asset.key, duration: asset.duration, wavUrl: asset.wavUrl, loopUrl: asset.loopUrl, stemsZipUrl: asset.stemsZipUrl, licenseUrl: asset.licenseUrl });
  }

  await prisma.job.update({ where: { id: jobId }, data: { status: "COMPLETED", completedAt: new Date() } });

  return NextResponse.json({ assets: assetsOut });
}

