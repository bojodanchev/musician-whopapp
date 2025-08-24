export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Download, Shield } from "lucide-react";
import { getStorage } from "@/lib/storage/s3";

export default async function LibraryPage() {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  let rows = assets.map((a) => ({
    ...a,
    wavSigned: { url: a.wavUrl },
    loopSigned: { url: a.loopUrl },
    stemsSigned: a.stemsZipUrl ? { url: a.stemsZipUrl } : null,
  }));
  try {
    const storage = getStorage();
    rows = await Promise.all(
      assets.map(async (a) => ({
        ...a,
        wavSigned: await storage.getSignedUrl({ key: a.wavUrl, method: "GET", expiresInSeconds: 300 }),
        loopSigned: await storage.getSignedUrl({ key: a.loopUrl, method: "GET", expiresInSeconds: 300 }),
        stemsSigned: a.stemsZipUrl ? await storage.getSignedUrl({ key: a.stemsZipUrl, method: "GET", expiresInSeconds: 300 }) : null,
      }))
    );
  } catch {}
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Library</h1>
        <Link href="/" className="text-sm text-white/70 hover:text-white">Back to Generator</Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 divide-y divide-white/5">
        {rows.length === 0 && (
          <div className="p-6 text-sm text-white/60">No assets yet.</div>
        )}
        {rows.map((a) => (
          <div key={a.id} className="p-4 grid grid-cols-12 items-center gap-2 text-sm">
            <div className="col-span-4">
              <div className="font-medium">{a.title}</div>
              <div className="text-white/60">{a.duration}s • BPM {a.bpm}</div>
            </div>
            <div className="col-span-4">
              <audio src={a.loopSigned.url} controls className="w-full" />
            </div>
            <div className="col-span-4 flex justify-end gap-2">
              <a href={a.wavSigned.url} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1"><Download size={14}/>WAV</a>
              {a.stemsSigned && (
                <a href={a.stemsSigned.url} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">Stems</a>
              )}
              <form action={`/api/licenses/${a.id}`} method="post">
                <button className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1"><Shield size={14}/>License</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

