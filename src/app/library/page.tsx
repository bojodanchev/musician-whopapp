export const dynamic = "force-dynamic";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { Download, Shield } from "lucide-react";
import { getStorage } from "@/lib/storage/s3";
import { whopSdk } from "@/lib/whop";

export default async function LibraryPage() {
  const prisma = getPrisma();
  let userId: string | null = null;
  try {
    const hdrs = await headers();
    const verified = await whopSdk.verifyUserToken(hdrs);
    if (verified.userId) {
      const dbUser = await prisma.user.findFirst({ where: { whopUserId: verified.userId } });
      if (dbUser) userId = dbUser.id;
    }
  } catch {}

  // Require authentication - redirect if no whopUserId
  if (!userId) {
    const jar = await cookies();
    const cookieUid = jar.get("musician_uid")?.value;
    if (cookieUid) {
      userId = cookieUid;
    }
  }

  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold mb-4">Authentication Required</h1>
          <p className="text-white/60 mb-6">You must be logged in to view your library.</p>
          <Link href="/" className="px-4 py-2 rounded-xl bg-white/10 border border-white/10">Back to Generator</Link>
        </div>
      </div>
    );
  }

  const assets = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
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
