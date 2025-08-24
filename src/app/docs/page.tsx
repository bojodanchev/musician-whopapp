import Link from "next/link";
import { Shield, BookOpen } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2"><BookOpen size={18}/> Docs</h1>
        <Link href="/" className="text-sm text-white/70 hover:text-white">Back</Link>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 text-sm text-white/80">
        <p>Musician generates short-form hooks, loops, and optional stems using ElevenLabs Music.</p>
        <p className="flex items-center gap-2"><Shield size={16}/> Licensing: Commercial use is permitted under your active plan. Broadcast/TV/radio or large-scale campaigns may require enterprise licensing. Do not prompt artist names or copyrighted lyrics.</p>
        <p>Plans map to credits and features. 1 variation = 1 credit. Batch of N costs N credits.</p>
      </div>
    </div>
  );
}

