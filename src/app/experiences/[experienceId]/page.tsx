import Link from "next/link";
import { Music } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ExperiencePage({ params }: { params: { experienceId: string } }) {
  const { experienceId } = params;
  return (
    <main className="min-h-screen bg-[#0b0b12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] blur-2xl opacity-25" />
      </div>

      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] grid place-items-center shadow-[0_0_40px_-10px_rgba(123,92,255,0.6)]">
            <Music className="size-5" />
          </div>
          <div className="font-semibold tracking-tight">Musician</div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href={`/experiences/${experienceId}/generate`} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10">Open Composer</Link>
            <a href="#pricing" className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10">Pricing</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Create catchy hooks for anything.</h1>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto">
          Musician generates ready‑to‑use music for your videos, ads, and social content—backed by Whop entitlements and simple licensing.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={`/experiences/${experienceId}/generate`} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg">Open Composer</Link>
          <a href="#pricing" className="px-5 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15">See pricing</a>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{
            title: "Instant hooks",
            desc: "Generate 10–120s hooks and loops tailored to your prompt.",
          },{
            title: "Plan‑aware credits",
            desc: "Credits map to your Whop plan and decrement atomically per take.",
          },{
            title: "Simple licensing",
            desc: "One‑click license files for safe use across social & ads.",
          }].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-semibold mb-1">{f.title}</div>
              <p className="text-sm text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium mb-1">1. Describe your song</div>
            <p>Type a vibe like “Warm lofi for study” or “Trailer percussion hit”.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium mb-1">2. Generate and preview</div>
            <p>Create one or multiple takes; preview instantly and keep favorites.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="font-medium mb-1">3. Download & license</div>
            <p>Grab loop/WAV with a license.txt so you can post with confidence.</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <Link href={`/experiences/${experienceId}/generate`} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#7b5cff] via-[#ff4d9d] to-[#35a1ff] shadow-lg">Start generating</Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold">Plans</h2>
          <p className="text-white/70 text-sm">Whop access maps to credits and features</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {name:"Starter", price:"$29/mo", features:["150 credits","30s max","Loops" ]},
            {name:"Pro", price:"$79/mo", features:["600 credits","Batch x4","Streaming preview"]},
            {name:"Studio", price:"$199/mo", features:["2000 credits","Batch x10","Advanced plan editor"]},
          ].map((p)=> (
            <div key={p.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="font-semibold">{p.name}</div>
              <div className="text-3xl mt-2">{p.price}</div>
              <ul className="mt-4 space-y-1 text-sm text-white/70 list-disc list-inside">
                {p.features.map((f)=> <li key={f}>{f}</li>)}
              </ul>
              <Link href={`/experiences/${experienceId}/generate`} className="mt-5 inline-block w-full text-center rounded-xl bg-white/10 border border-white/10 py-2 hover:bg-white/15">Choose {p.name}</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


